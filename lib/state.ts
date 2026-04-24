import { Redis as UpstashRedis } from '@upstash/redis'
import { createClient } from 'redis'

import type {
  ActiveGame,
  GameOutcomeReason,
  HeadToHeadRecord,
  ModelTotals,
  RecentResult,
  StatsSnapshot,
} from './contracts'
import { MODELS, type ModelId } from './models'

const ACTIVE_KEY = 'ig:active'
const LOOP_OWNER_KEY = 'ig:loopOwner'
const START_LOCK_KEY = 'ig:startLock'
const TOTALS_KEY = 'ig:totals'
const INVALID_MOVES_KEY = 'ig:invalidMoves'
const RECENT_KEY = 'ig:recent'

const REDIS_URL_ENV_NAMES = [
  'REDIS_URL',
  'REDIS_PRIVATE_URL',
  'REDIS_TLS_URL',
  'REDIS_PUBLIC_URL',
  'KV_URL',
  'DEMO_REDIS_URL',
] as const

const UPSTASH_REST_ENV_NAMES = [
  ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
  ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
] as const

type SetOptions = {
  nx?: true
  ex?: number
}

type RedisTransaction = {
  hincrby: (key: string, field: string, amount: number) => RedisTransaction
  lpush: (key: string, value: string) => RedisTransaction
  ltrim: (key: string, start: number, stop: number) => RedisTransaction
  hset: (key: string, kv: Record<string, string>) => RedisTransaction
  exec: () => Promise<void>
}

type RedisBackend = {
  mode: 'local' | 'upstash'
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, options?: SetOptions) => Promise<'OK' | null>
  del: (key: string) => Promise<void>
  hgetall: (key: string) => Promise<Record<string, string> | null>
  lrange: (key: string, start: number, stop: number) => Promise<string[]>
  multi: () => RedisTransaction
}

let redisBackendPromise: Promise<RedisBackend> | null = null

const firstConfiguredValue = (envNames: readonly string[]) =>
  envNames
    .map((name) => process.env[name])
    .find((value): value is string => Boolean(value))

const resolveRedisUrl = () => firstConfiguredValue(REDIS_URL_ENV_NAMES) ?? null

const resolveUpstashConfig = () => {
  for (const [urlName, tokenName] of UPSTASH_REST_ENV_NAMES) {
    const url = process.env[urlName]
    const token = process.env[tokenName]

    if (url && token) {
      return { url, token }
    }
  }

  throw new Error(
    [
      'Missing Redis configuration.',
      `Set one Redis URL env var (${REDIS_URL_ENV_NAMES.join(', ')}) for a TCP Redis provider,`,
      `or set one Upstash REST env pair (${UPSTASH_REST_ENV_NAMES.map(([urlName, tokenName]) => `${urlName} + ${tokenName}`).join(' or ')}).`,
    ].join(' '),
  )
}

const createLocalBackend = async (url: string): Promise<RedisBackend> => {
  const client = createClient({ url })
  client.on('error', (error) => {
    console.error('Local Redis client error', error)
  })

  if (!client.isOpen) {
    await client.connect()
  }

  return {
    mode: 'local',
    get: (key) => client.get(key),
    set: async (key, value, options) => {
      if (!options) {
        return (await client.set(key, value)) as 'OK'
      }

      if (options.ex && options.nx) {
        return (await client.set(key, value, {
          EX: options.ex,
          NX: true,
        })) as 'OK' | null
      }

      if (options.ex) {
        return (await client.set(key, value, {
          EX: options.ex,
        })) as 'OK'
      }

      if (options.nx) {
        return (await client.set(key, value, {
          NX: true,
        })) as 'OK' | null
      }

      return (await client.set(key, value)) as 'OK'
    },
    del: async (key) => {
      await client.del(key)
    },
    hgetall: async (key) => {
      const hash = await client.hGetAll(key)
      return Object.keys(hash).length > 0 ? hash : null
    },
    lrange: (key, start, stop) => client.lRange(key, start, stop),
    multi: () => {
      const multi = client.multi()
      const transaction: RedisTransaction = {
        hincrby(key, field, amount) {
          multi.hIncrBy(key, field, amount)
          return transaction
        },
        lpush(key, value) {
          multi.lPush(key, value)
          return transaction
        },
        ltrim(key, start, stop) {
          multi.lTrim(key, start, stop)
          return transaction
        },
        hset(key, kv) {
          multi.hSet(key, kv)
          return transaction
        },
        async exec() {
          await multi.exec()
        },
      }

      return transaction
    },
  }
}

const createUpstashBackend = (): RedisBackend => {
  const client = new UpstashRedis(resolveUpstashConfig())

  return {
    mode: 'upstash',
    get: (key) => client.get<string>(key),
    set: async (key, value, options) => {
      if (!options) {
        await client.set(key, value)
        return 'OK'
      }

      if (options.ex && options.nx) {
        return (await client.set(key, value, {
          ex: options.ex,
          nx: true,
        })) as 'OK' | null
      }

      if (options.ex) {
        await client.set(key, value, { ex: options.ex })
        return 'OK'
      }

      if (options.nx) {
        return (await client.set(key, value, { nx: true })) as 'OK' | null
      }

      await client.set(key, value)
      return 'OK'
    },
    del: async (key) => {
      await client.del(key)
    },
    hgetall: async (key) =>
      await client.hgetall<Record<string, string>>(key),
    lrange: (key, start, stop) => client.lrange<string>(key, start, stop),
    multi: () => {
      const multi = client.multi()
      const transaction: RedisTransaction = {
        hincrby(key, field, amount) {
          multi.hincrby(key, field, amount)
          return transaction
        },
        lpush(key, value) {
          multi.lpush(key, value)
          return transaction
        },
        ltrim(key, start, stop) {
          multi.ltrim(key, start, stop)
          return transaction
        },
        hset(key, kv) {
          multi.hset(key, kv)
          return transaction
        },
        async exec() {
          await multi.exec()
        },
      }

      return transaction
    },
  }
}

const getRedis = async () => {
  if (!redisBackendPromise) {
    redisBackendPromise = (async () => {
      const redisUrl = resolveRedisUrl()

      if (redisUrl) {
        return await createLocalBackend(redisUrl)
      }

      return createUpstashBackend()
    })()
  }

  return await redisBackendPromise
}

const pairKey = (playerA: ModelId, playerB: ModelId) => {
  const [modelA, modelB] = [playerA, playerB].sort() as [ModelId, ModelId]
  return {
    modelA,
    modelB,
    key: `ig:h2h:${encodeURIComponent(modelA)}:${encodeURIComponent(modelB)}`,
  }
}

const totalField = (modelId: ModelId, field: keyof Omit<ModelTotals, 'invalidMoves'>) =>
  `${modelId}:${field}`

const parseCount = (value: unknown) => {
  const count = Number(value ?? 0)
  return Number.isFinite(count) ? count : 0
}

export const setActive = async (
  runId: string,
  players: [ModelId, ModelId],
  startedAt = new Date().toISOString(),
  loopId: string = crypto.randomUUID(),
) => {
  const redis = await getRedis()

  await redis.set(
    ACTIVE_KEY,
    JSON.stringify({ runId, loopId, players, startedAt }),
  )

  return {
    runId,
    loopId,
    players,
    startedAt,
  } satisfies ActiveGame
}

export const getActive = async () => {
  const redis = await getRedis()
  const active = await redis.get(ACTIVE_KEY)

  if (!active) {
    return null
  }

  return JSON.parse(active) as ActiveGame
}

export const getTotals = async () => {
  const redis = await getRedis()
  const [totalsHash, invalidMoveHash] = await Promise.all([
    redis.hgetall(TOTALS_KEY),
    redis.hgetall(INVALID_MOVES_KEY),
  ])

  return Object.fromEntries(
    MODELS.map((model) => [
      model.id,
      {
        wins: parseCount(totalsHash?.[totalField(model.id, 'wins')]),
        losses: parseCount(totalsHash?.[totalField(model.id, 'losses')]),
        draws: parseCount(totalsHash?.[totalField(model.id, 'draws')]),
        games: parseCount(totalsHash?.[totalField(model.id, 'games')]),
        invalidMoves: parseCount(invalidMoveHash?.[model.id]),
      },
    ]),
  ) as Record<ModelId, ModelTotals>
}

export const getHeadToHeadRecord = async (
  playerA: ModelId,
  playerB: ModelId,
) => {
  const { key, modelA, modelB } = pairKey(playerA, playerB)
  const redis = await getRedis()
  const hash = await redis.hgetall(key)

  if (!hash) {
    return {
      modelA,
      modelB,
      winsA: 0,
      winsB: 0,
      draws: 0,
      games: 0,
    } satisfies HeadToHeadRecord
  }

  return {
    modelA,
    modelB,
    winsA: parseCount(hash[`wins:${modelA}`]),
    winsB: parseCount(hash[`wins:${modelB}`]),
    draws: parseCount(hash.draws),
    games: parseCount(hash.games),
  } satisfies HeadToHeadRecord
}

export const getRecentResults = async (limit = 12) => {
  const redis = await getRedis()
  const values = await redis.lrange(RECENT_KEY, 0, limit - 1)
  return values.map((entry) => JSON.parse(entry) as RecentResult)
}

export const getStats = async () => {
  const pairs: Array<[ModelId, ModelId]> = []

  for (let index = 0; index < MODELS.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < MODELS.length; nextIndex += 1) {
      pairs.push([MODELS[index].id, MODELS[nextIndex].id])
    }
  }

  const [totals, recent, headToHead] = await Promise.all([
    getTotals(),
    getRecentResults(),
    Promise.all(pairs.map(([a, b]) => getHeadToHeadRecord(a, b))),
  ])

  return {
    totals,
    recent,
    headToHead,
  } satisfies StatsSnapshot
}

export const getLoopOwner = async () => {
  const redis = await getRedis()
  const owner = await redis.get(LOOP_OWNER_KEY)
  return owner ?? null
}

export const setLoopOwner = async (loopId: string) => {
  const redis = await getRedis()
  await redis.set(LOOP_OWNER_KEY, loopId)
  return loopId
}

export const acquireStartLock = async (lockId: string) => {
  const redis = await getRedis()
  const result = await redis.set(START_LOCK_KEY, lockId, {
    nx: true,
    ex: 15,
  })

  return result === 'OK'
}

export const releaseStartLock = async (lockId: string) => {
  const redis = await getRedis()
  const current = await redis.get(START_LOCK_KEY)

  if (current === lockId) {
    await redis.del(START_LOCK_KEY)
  }
}

export const waitForStartLock = async (
  lockId: string,
  attempts = 20,
  delayMs = 250,
) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await acquireStartLock(lockId)) {
      return true
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return false
}

type RecordResultInput = {
  runId: string
  playerA: ModelId
  playerB: ModelId
  winner: ModelId | 'draw'
  turns: number
  reason: GameOutcomeReason
}

export const recordResult = async ({
  runId,
  playerA,
  playerB,
  winner,
  turns,
  reason,
}: RecordResultInput) => {
  const redis = await getRedis()
  const transaction = redis.multi()
  const { key, modelA, modelB } = pairKey(playerA, playerB)

  for (const modelId of [playerA, playerB]) {
    transaction.hincrby(TOTALS_KEY, totalField(modelId, 'games'), 1)
  }

  transaction.hincrby(key, 'games', 1)

  if (winner === 'draw') {
    for (const modelId of [playerA, playerB]) {
      transaction.hincrby(TOTALS_KEY, totalField(modelId, 'draws'), 1)
    }

    transaction.hincrby(key, 'draws', 1)
  } else {
    const loser = winner === playerA ? playerB : playerA
    transaction.hincrby(TOTALS_KEY, totalField(winner, 'wins'), 1)
    transaction.hincrby(TOTALS_KEY, totalField(loser, 'losses'), 1)
    transaction.hincrby(key, `wins:${winner}`, 1)

    if (reason === 'invalid-move') {
      transaction.hincrby(INVALID_MOVES_KEY, loser, 1)
    }
  }

  const recent: RecentResult = {
    runId,
    players: [playerA, playerB],
    winner,
    turns,
    finishedAt: new Date().toISOString(),
    reason,
  }

  transaction.lpush(RECENT_KEY, JSON.stringify(recent))
  transaction.ltrim(RECENT_KEY, 0, 49)
  transaction.hset(key, {
    modelA,
    modelB,
  })

  await transaction.exec()

  return recent
}
