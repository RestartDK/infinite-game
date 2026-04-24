import { createError, defineEventHandler } from 'nitro/h3'

import type { CurrentGameResponse } from '../lib/contracts'
import { getActive, getHeadToHeadRecord, getTotals } from '../lib/state'

export default defineEventHandler(async () => {
  const active = await getActive()

  if (!active) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No active game loop has been started yet.',
    })
  }

  const [totals, headToHead] = await Promise.all([
    getTotals(),
    getHeadToHeadRecord(active.players[0], active.players[1]),
  ])

  return {
    active,
    totals,
    headToHead,
  } satisfies CurrentGameResponse
})
