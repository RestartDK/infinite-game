import { MODELS } from './models'

const randomIndex = (size: number) => {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] % size
}

export const pickRandomPair = () => {
  const firstIndex = randomIndex(MODELS.length)
  const secondPool = MODELS.filter((_, index) => index !== firstIndex)
  const secondIndex = randomIndex(secondPool.length)

  return [MODELS[firstIndex].id, secondPool[secondIndex].id] as const
}
