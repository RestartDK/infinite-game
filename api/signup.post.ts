import { defineEventHandler } from 'nitro/h3'
import { start } from 'workflow/api'

import { handleUserSignup } from '../workflows/user-signup'

export default defineEventHandler(async ({ req }) => {
  const { email } = await req.json() as { email: string }

  await start(handleUserSignup, [email])

  return {
    message: 'User signup workflow started',
  }
})
