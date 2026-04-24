import { gateway } from '@ai-sdk/gateway'
import { NoObjectGeneratedError, Output, streamText } from 'ai'
import { getWorkflowMetadata, getWritable } from 'workflow'
import { start } from 'workflow/api'
import { z } from 'zod'

import {
  applyMove,
  boardFull,
  checkWinner,
  createEmptyBoard,
  legalColumns,
  type Board,
  type Seat,
} from '../lib/connect4'
import type { GameOutcomeReason, GameStreamEvent } from '../lib/contracts'
import type { ModelId } from '../lib/models'
import { pickRandomPair } from '../lib/random'
import {
  recordResult,
  releaseStartLock,
  setActive,
  waitForStartLock,
} from '../lib/state'

const decisionSchema = z
  .object({
    rationale: z
      .string()
      .min(1)
      .max(600)
      .describe('A concise tactical reason for the selected Connect 4 move.'),
    column: z
      .number()
      .int()
      .min(0)
      .max(6)
      .describe('The zero-based legal Connect 4 column to play.'),
  })
  .describe('A Connect 4 move decision.')

const seatForTurn = (turn: number): Seat => (turn % 2 === 0 ? 'A' : 'B')

const modelForSeat = (
  seat: Seat,
  playerA: ModelId,
  playerB: ModelId,
): ModelId => (seat === 'A' ? playerA : playerB)

const boardToPrompt = (board: Board) =>
  board
    .map((row, rowIndex) => {
      const cells = row
        .map((cell) => {
          if (cell === 'A') {
            return 'R'
          }

          if (cell === 'B') {
            return 'Y'
          }

          return '.'
        })
        .join(' ')

      return `row ${rowIndex}: ${cells}`
    })
    .join('\n')

const toLine = (event: GameStreamEvent) => `${JSON.stringify(event)}\n`

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parseJsonObject = (text: string) => {
  const trimmed = text.trim()

  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    const jsonStart = trimmed.indexOf('{')
    const jsonEnd = trimmed.lastIndexOf('}')

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      return null
    }

    try {
      return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as unknown
    } catch {
      return null
    }
  }
}

const textFromMalformedValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string').join(' ')
  }

  return null
}

const repairMalformedDecision = (text: string | undefined, validColumns: number[]) => {
  if (!text) {
    return null
  }

  const parsed = parseJsonObject(text)

  if (!isRecord(parsed)) {
    return null
  }

  const [entry] = Object.entries(parsed).filter(([key]) => {
    const column = Number(key)
    return Number.isInteger(column) && validColumns.includes(column)
  })

  if (!entry) {
    return null
  }

  const [columnKey, malformedRationale] = entry
  const rationale = textFromMalformedValue(malformedRationale)

  if (!rationale) {
    return null
  }

  const repaired = decisionSchema.safeParse({
    column: Number(columnKey),
    rationale,
  })

  return repaired.success ? repaired.data : null
}

async function appendEvent(event: GameStreamEvent) {
  'use step'

  const writer = getWritable<string>().getWriter()

  try {
    await writer.write(toLine(event))
  } finally {
    writer.releaseLock()
  }
}

async function decideMove(
  player: ModelId,
  seat: Seat,
  board: Board,
  turn: number,
) {
  'use step'

  const validColumns = legalColumns(board)
  const writer = getWritable<string>().getWriter()

  try {
    const result = streamText({
      model: gateway(player),
      prompt: [
        `You are playing Connect 4 as ${seat === 'A' ? 'Red (R)' : 'Yellow (Y)'}.`,
        'Choose the best move from the legal columns only.',
        'Keep the rationale concise and focus on the tactical reason for the move.',
        'Return exactly this object shape: {"column": number, "rationale": string}. Do not use the column number as a JSON key.',
        `Legal columns: ${validColumns.join(', ')}`,
        'Board rows are listed top to bottom. "." means empty.',
        boardToPrompt(board),
      ].join('\n\n'),
      output: Output.object({
        schema: decisionSchema,
        name: 'connect4_move_decision',
        description:
          'A single Connect 4 move decision with a zero-based column and concise rationale.',
      }),
    })

    for await (const part of result.fullStream) {
      if (part.type === 'reasoning-delta' && part.text.length > 0) {
        await writer.write(
          toLine({
            type: 'thinking',
            turn,
            player,
            seat,
            chunkType: 'reasoning-delta',
            text: part.text,
          }),
        )
      }

      // Text deltas are the raw structured-output JSON. Show only the parsed
      // decision so malformed JSON never appears as player reasoning.
    }

    const output = await result.output
    const invalidReason = validColumns.includes(output.column)
      ? undefined
      : `Model selected illegal column ${output.column}. Legal columns were ${validColumns.join(', ')}.`

    await writer.write(
      toLine({
        type: 'decision',
        turn,
        player,
        seat,
        rationale: output.rationale,
        column: invalidReason ? null : output.column,
        legalColumns: validColumns,
        invalidReason,
      }),
    )

    return {
      column: invalidReason ? null : output.column,
      rationale: output.rationale,
      invalidReason,
    }
  } catch (error) {
    const repaired = NoObjectGeneratedError.isInstance(error)
      ? repairMalformedDecision(error.text, validColumns)
      : null

    if (repaired) {
      await writer.write(
        toLine({
          type: 'decision',
          turn,
          player,
          seat,
          rationale: repaired.rationale,
          column: repaired.column,
          legalColumns: validColumns,
        }),
      )

      return {
        column: repaired.column,
        rationale: repaired.rationale,
        invalidReason: undefined,
      }
    }

    const message =
      error instanceof Error ? error.message : 'The model decision step failed.'

    await writer.write(
      toLine({
        type: 'decision',
        turn,
        player,
        seat,
        rationale: 'The move failed before a structured decision was produced.',
        column: null,
        legalColumns: validColumns,
        invalidReason: message,
      }),
    )

    return {
      column: null,
      rationale: 'The move failed before a structured decision was produced.',
      invalidReason: message,
    }
  } finally {
    writer.releaseLock()
  }
}

async function finalizeGame(
  runId: string,
  playerA: ModelId,
  playerB: ModelId,
  loopId: string,
  startedAt: string,
  board: Board,
  winner: ModelId | 'draw',
  winnerSeat: Seat | null,
  turns: number,
  reason: GameOutcomeReason,
) {
  'use step'

  const endedAt = new Date().toISOString()
  const nextStartedAt = new Date().toISOString()
  const lockId = crypto.randomUUID()
  const writer = getWritable<string>().getWriter()

  try {
    await writer.write(
      toLine({
        type: 'gameOver',
        board,
        winner,
        winnerSeat,
        turns,
        endedAt,
        reason,
      }),
    )

    await recordResult({
      runId,
      playerA,
      playerB,
      winner,
      turns,
      reason,
    })

    if (!(await waitForStartLock(lockId))) {
      throw new Error('Game loop transition already in progress.')
    }

    try {
      const [nextPlayerA, nextPlayerB] = pickRandomPair()
      const nextRun = await start(playOneGame, [
        nextPlayerA,
        nextPlayerB,
        nextStartedAt,
        loopId,
      ])

      await setActive(
        nextRun.runId,
        [nextPlayerA, nextPlayerB],
        nextStartedAt,
        loopId,
      )
    } finally {
      await releaseStartLock(lockId)
    }
  } finally {
    writer.releaseLock()
  }

  return {
    startedAt,
    endedAt,
  }
}

export async function playOneGame(
  playerA: ModelId,
  playerB: ModelId,
  startedAt: string,
  loopId: string,
) {
  'use workflow'

  const { workflowRunId: runId } = getWorkflowMetadata()
  let board = createEmptyBoard()

  await appendEvent({
    type: 'init',
    runId,
    players: [playerA, playerB],
    board,
    startedAt,
  })

  for (let turn = 0; ; turn += 1) {
    const seat = seatForTurn(turn)
    const player = modelForSeat(seat, playerA, playerB)
    const choice = await decideMove(player, seat, board, turn)

    if (choice.column === null) {
      const winnerSeat = seat === 'A' ? 'B' : 'A'
      const winner = modelForSeat(winnerSeat, playerA, playerB)

      await finalizeGame(
        runId,
        playerA,
        playerB,
        loopId,
        startedAt,
        board,
        winner,
        winnerSeat,
        turn + 1,
        'invalid-move',
      )

      return
    }

    const move = applyMove(board, choice.column, seat)
    board = move.board

    await appendEvent({
      type: 'move',
      turn,
      player,
      seat,
      column: choice.column,
      row: move.row,
      board,
    })

    const winnerSeat = checkWinner(board)

    if (winnerSeat) {
      await finalizeGame(
        runId,
        playerA,
        playerB,
        loopId,
        startedAt,
        board,
        modelForSeat(winnerSeat, playerA, playerB),
        winnerSeat,
        turn + 1,
        'connect4',
      )

      return
    }

    if (boardFull(board)) {
      await finalizeGame(
        runId,
        playerA,
        playerB,
        loopId,
        startedAt,
        board,
        'draw',
        null,
        turn + 1,
        'draw',
      )

      return
    }
  }
}
