import {
  createError,
  defineEventHandler,
  getQuery,
  getRouterParam,
} from 'nitro/h3'
import { getRun } from 'workflow/api'

export default defineEventHandler(async (event) => {
  const runId = getRouterParam(event, 'runId')

  if (!runId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing runId route parameter.',
    })
  }

  const query = getQuery(event)
  const startIndexValue =
    typeof query.startIndex === 'string'
      ? Number.parseInt(query.startIndex, 10)
      : undefined
  const startIndex = Number.isFinite(startIndexValue) ? startIndexValue : undefined

  const run = getRun(runId)

  if (!(await run.exists)) {
    throw createError({
      statusCode: 404,
      statusMessage: `Workflow run ${runId} was not found.`,
    })
  }

  const readable =
    startIndex === undefined
      ? run.getReadable<string>()
      : run.getReadable<string>({ startIndex })
  const tailIndex = await readable.getTailIndex()

  return new Response(readable.pipeThrough(new TextEncoderStream()), {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/x-ndjson; charset=utf-8',
      'x-workflow-stream-tail-index': String(tailIndex),
    },
  })
})
