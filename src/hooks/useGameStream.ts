import { useEffect, useMemo, useReducer } from 'react'

import { createEmptyBoard, type Board, type Seat } from '../../lib/connect4'
import type {
  CurrentGameResponse,
  GameStreamEvent,
  HeadToHeadRecord,
  ModelTotals,
  StatsSnapshot,
} from '../../lib/contracts'
import { MODELS, getModel, type ModelId } from '../../lib/models'

type ReasoningLog = {
  key: string
  turn: number
  player: ModelId
  seat: Seat
  reasoningText: string
  textText: string
  rationale?: string
  column?: number | null
  invalidReason?: string
}

type State = {
  status: 'loading' | 'streaming' | 'ended' | 'error'
  runId: string | null
  players: [ModelId, ModelId] | null
  board: Board
  startedAt: string | null
  totals: Record<ModelId, ModelTotals>
  headToHead: HeadToHeadRecord | null
  stats: StatsSnapshot | null
  logs: ReasoningLog[]
  winner: ModelId | 'draw' | null
  error: string | null
  // Cells whose chip should animate (i.e. arrived live via a `move` event,
  // not from a board snapshot at init/reload). Keyed as `${row}:${column}`.
  animatedMoves: Set<string>
  // Column the current player has committed to but not yet placed. Used to
  // hover the pending chip above the chosen column before it drops.
  pendingColumn: number | null
}

type Action =
  | {
      type: 'bootstrap'
      payload: {
        current: CurrentGameResponse
        stats: StatsSnapshot
      }
    }
  | { type: 'init'; event: Extract<GameStreamEvent, { type: 'init' }> }
  | { type: 'thinking'; event: Extract<GameStreamEvent, { type: 'thinking' }> }
  | { type: 'decision'; event: Extract<GameStreamEvent, { type: 'decision' }> }
  | { type: 'move'; event: Extract<GameStreamEvent, { type: 'move' }> }
  | { type: 'gameOver'; event: Extract<GameStreamEvent, { type: 'gameOver' }> }
  | { type: 'error'; message: string }

const emptyTotals = Object.fromEntries(
  MODELS.map((model) => [
    model.id,
    {
      wins: 0,
      losses: 0,
      draws: 0,
      games: 0,
      invalidMoves: 0,
    },
  ]),
) as Record<ModelId, ModelTotals>

const initialState: State = {
  status: 'loading',
  runId: null,
  players: null,
  board: createEmptyBoard(),
  startedAt: null,
  totals: emptyTotals,
  headToHead: null,
  stats: null,
  logs: [],
  winner: null,
  error: null,
  animatedMoves: new Set<string>(),
  pendingColumn: null,
}

const upsertLog = (logs: ReasoningLog[], event: ReasoningLog) => {
  const existingIndex = logs.findIndex((entry) => entry.key === event.key)

  if (existingIndex === -1) {
    return [...logs, event]
  }

  return logs.map((entry, index) =>
    index === existingIndex
      ? {
          ...entry,
          ...event,
          reasoningText: event.reasoningText || entry.reasoningText,
          textText: event.textText || entry.textText,
        }
      : entry,
  )
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'bootstrap':
      return {
        ...state,
        status: 'streaming',
        runId: action.payload.current.active.runId,
        players: action.payload.current.active.players,
        board: createEmptyBoard(),
        startedAt: action.payload.current.active.startedAt,
        totals: action.payload.current.totals,
        headToHead: action.payload.current.headToHead,
        stats: action.payload.stats,
        logs: [],
        winner: null,
        error: null,
        animatedMoves: new Set<string>(),
        pendingColumn: null,
      }

    case 'init':
      return {
        ...state,
        status: 'streaming',
        runId: action.event.runId,
        players: action.event.players,
        board: action.event.board,
        startedAt: action.event.startedAt,
        logs: [],
        winner: null,
        error: null,
        // Pieces present in the snapshot are pre-existing — never replay them.
        animatedMoves: new Set<string>(),
        pendingColumn: null,
      }

    case 'thinking': {
      const key = `${action.event.turn}:${action.event.player}`
      const existing = state.logs.find((entry) => entry.key === key)

      return {
        ...state,
        logs: upsertLog(state.logs, {
          key,
          turn: action.event.turn,
          player: action.event.player,
          seat: action.event.seat,
          reasoningText:
            action.event.chunkType === 'reasoning-delta'
              ? `${existing?.reasoningText ?? ''}${action.event.text}`
              : existing?.reasoningText ?? '',
          textText:
            action.event.chunkType === 'text-delta'
              ? `${existing?.textText ?? ''}${action.event.text}`
              : existing?.textText ?? '',
          rationale: existing?.rationale,
          column: existing?.column,
          invalidReason: existing?.invalidReason,
        }),
      }
    }

    case 'decision': {
      const key = `${action.event.turn}:${action.event.player}`
      const existing = state.logs.find((entry) => entry.key === key)

      return {
        ...state,
        // Hover the pending chip above the chosen column until the move lands.
        pendingColumn:
          action.event.column !== null && action.event.invalidReason === undefined
            ? action.event.column
            : state.pendingColumn,
        logs: upsertLog(state.logs, {
          key,
          turn: action.event.turn,
          player: action.event.player,
          seat: action.event.seat,
          reasoningText: existing?.reasoningText ?? '',
          textText: existing?.textText ?? '',
          rationale: action.event.rationale,
          column: action.event.column,
          invalidReason: action.event.invalidReason,
        }),
      }
    }

    case 'move': {
      const moveKey = `${action.event.row}:${action.event.column}`
      const animatedMoves = new Set(state.animatedMoves)
      animatedMoves.add(moveKey)

      return {
        ...state,
        board: action.event.board,
        animatedMoves,
        pendingColumn: null,
      }
    }

    case 'gameOver':
      return {
        ...state,
        status: 'ended',
        board: action.event.board,
        winner: action.event.winner,
        pendingColumn: null,
      }

    case 'error':
      return {
        ...state,
        status: 'error',
        error: action.message,
      }

    default:
      return state
  }
}

const parseJson = async <T>(response: Response) => {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || response.statusText)
  }

  return (await response.json()) as T
}

const countMoves = (board: Board) =>
  board.reduce(
    (total, row) => total + row.filter((cell) => cell !== null).length,
    0,
  )

export const useGameStream = () => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    let cancelled = false
    let reconnectTimer: number | undefined
    const controller = new AbortController()
    const wait = (delayMs: number) =>
      new Promise((resolve) => window.setTimeout(resolve, delayMs))

    const streamRun = async (runId: string) => {
      let sawGameOver = false
      let startIndex = 0
      let reconnectAttempts = 0

      while (!cancelled && !sawGameOver) {
        try {
          const query =
            startIndex > 0 ? `?startIndex=${startIndex}` : ''
          const response = await fetch(`/api/game/${runId}/stream${query}`, {
            signal: controller.signal,
          })

          if (!response.ok || !response.body) {
            throw new Error(`Failed to open stream for run ${runId}`)
          }

          reconnectAttempts = 0
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (!cancelled) {
            const { done, value } = await reader.read()

            if (done) {
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.trim()) {
                continue
              }

              startIndex += 1
              const event = JSON.parse(line) as GameStreamEvent

              switch (event.type) {
                case 'init':
                  dispatch({ type: 'init', event })
                  break
                case 'thinking':
                  dispatch({ type: 'thinking', event })
                  break
                case 'decision':
                  dispatch({ type: 'decision', event })
                  break
                case 'move':
                  dispatch({ type: 'move', event })
                  break
                case 'gameOver':
                  sawGameOver = true
                  dispatch({ type: 'gameOver', event })
                  break
                case 'error':
                  dispatch({ type: 'error', message: event.message })
                  break
              }
            }
          }

          if (sawGameOver || cancelled) {
            break
          }

          reconnectAttempts += 1
          if (reconnectAttempts > 4) {
            throw new Error('The live stream disconnected repeatedly.')
          }

          await wait(reconnectAttempts * 500)
        } catch (error) {
          if (cancelled || sawGameOver) {
            break
          }

          reconnectAttempts += 1
          if (reconnectAttempts > 4) {
            throw error
          }

          await wait(reconnectAttempts * 500)
        }
      }

      if (!cancelled && sawGameOver) {
        reconnectTimer = window.setTimeout(() => {
          void bootstrap()
        }, 1200)
      }
    }

    const bootstrap = async () => {
      let startLoopError: unknown = null

      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          await parseJson<unknown>(
            await fetch('/api/start-loop', {
              method: 'POST',
              signal: controller.signal,
            }),
          )
          startLoopError = null
          break
        } catch (error) {
          startLoopError = error
          await wait((attempt + 1) * 250)
        }
      }

      if (startLoopError) {
        throw startLoopError
      }

      const [current, stats] = await Promise.all([
        parseJson<CurrentGameResponse>(
          await fetch('/api/current-game', { signal: controller.signal }),
        ),
        parseJson<StatsSnapshot>(
          await fetch('/api/stats', { signal: controller.signal }),
        ),
      ])

      if (cancelled) {
        return
      }

      dispatch({
        type: 'bootstrap',
        payload: { current, stats },
      })

      await streamRun(current.active.runId)
    }

    void bootstrap().catch((error) => {
      if (!cancelled) {
        dispatch({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to initialize the live game stream.',
        })
      }
    })

    return () => {
      cancelled = true
      controller.abort()

      if (reconnectTimer !== undefined) {
        window.clearTimeout(reconnectTimer)
      }
    }
  }, [])

  const currentSeat: Seat | null = useMemo(() => {
    if (!state.players || state.status !== 'streaming') {
      return null
    }

    return countMoves(state.board) % 2 === 0 ? 'A' : 'B'
  }, [state.board, state.players, state.status])

  const currentPlayer =
    currentSeat && state.players
      ? state.players[currentSeat === 'A' ? 0 : 1]
      : null

  return {
    ...state,
    models: state.players
      ? [getModel(state.players[0]), getModel(state.players[1])]
      : null,
    currentPlayer,
    currentSeat,
  }
}
