import type { RecentResult } from './contracts'
import { MODELS, type ModelId } from './models'

type ModelPair = readonly [ModelId, ModelId]

const randomIndex = (size: number) => {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] % size
}

const pairKey = ([first, second]: ModelPair) => [first, second].sort().join('\0')

const allPairs = () => {
  const pairs: ModelPair[] = []

  for (let firstIndex = 0; firstIndex < MODELS.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < MODELS.length;
      secondIndex += 1
    ) {
      pairs.push([MODELS[firstIndex].id, MODELS[secondIndex].id])
    }
  }

  return pairs
}

export const pickRandomPair = (recentResults: RecentResult[] = []) => {
  const pairs = allPairs()
  const recentCounts = new Map(pairs.map((pair) => [pairKey(pair), 0]))

  for (const result of recentResults) {
    const key = pairKey(result.players)
    recentCounts.set(key, (recentCounts.get(key) ?? 0) + 1)
  }

  const fewestRecentGames = Math.min(...recentCounts.values())
  const candidates = pairs.filter(
    (pair) => recentCounts.get(pairKey(pair)) === fewestRecentGames,
  )
  const [first, second] = candidates[randomIndex(candidates.length)]

  return randomIndex(2) === 0 ? [first, second] : [second, first]
}
