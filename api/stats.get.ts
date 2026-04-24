import { defineEventHandler } from 'nitro/h3'

import { getStats } from '../lib/state'

export default defineEventHandler(async () => getStats())
