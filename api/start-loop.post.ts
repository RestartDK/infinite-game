import { createError, defineEventHandler } from 'nitro/h3'
import { getRun, start } from 'workflow/api'

import type { StartLoopResponse } from '../lib/contracts'
import { pickRandomPair } from '../lib/random'
import {
  getActive,
  getLoopOwner,
  releaseStartLock,
  setActive,
  setLoopOwner,
  waitForStartLock,
} from '../lib/state'
import { playOneGame } from '../workflows/game'

export default defineEventHandler(async () => {
  const lockId = crypto.randomUUID()

  if (!(await waitForStartLock(lockId))) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Game loop transition already in progress.',
    })
  }

  try {
    const existing = await getActive()

    if (existing) {
      const run = getRun(existing.runId)

      if (await run.exists) {
        const status = await run.status

        if (status === 'running') {
          return {
            active: existing,
          } satisfies StartLoopResponse
        }
      }
    }

    const [playerA, playerB] = pickRandomPair()
    const startedAt = new Date().toISOString()
    const loopId = (existing?.loopId ?? (await getLoopOwner())) ?? crypto.randomUUID()

    if (!existing?.loopId) {
      await setLoopOwner(loopId)
    }

    const run = await start(playOneGame, [playerA, playerB, startedAt, loopId])
    const active = await setActive(run.runId, [playerA, playerB], startedAt, loopId)

    return {
      active,
    } satisfies StartLoopResponse
  } finally {
    await releaseStartLock(lockId)
  }
})
