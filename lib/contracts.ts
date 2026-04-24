import type { Board, Seat } from './connect4'
import type { ModelId } from './models'

export type GameOutcomeReason = 'connect4' | 'draw' | 'invalid-move'
export type StreamChunkKind = 'reasoning-delta' | 'text-delta'

export type ActiveGame = {
  runId: string
  loopId: string
  players: [ModelId, ModelId]
  startedAt: string
}

export type ModelTotals = {
  wins: number
  losses: number
  draws: number
  games: number
  invalidMoves: number
}

export type HeadToHeadRecord = {
  modelA: ModelId
  modelB: ModelId
  winsA: number
  winsB: number
  draws: number
  games: number
}

export type RecentResult = {
  runId: string
  players: [ModelId, ModelId]
  winner: ModelId | 'draw'
  turns: number
  finishedAt: string
  reason: GameOutcomeReason
}

export type StatsSnapshot = {
  totals: Record<ModelId, ModelTotals>
  headToHead: HeadToHeadRecord[]
  recent: RecentResult[]
}

export type StartLoopResponse = {
  active: ActiveGame
}

export type CurrentGameResponse = {
  active: ActiveGame
  totals: Record<ModelId, ModelTotals>
  headToHead: HeadToHeadRecord | null
}

export type GameStreamEvent =
  | {
      type: 'init'
      runId: string
      players: [ModelId, ModelId]
      board: Board
      startedAt: string
    }
  | {
      type: 'thinking'
      turn: number
      player: ModelId
      seat: Seat
      chunkType: StreamChunkKind
      text: string
    }
  | {
      type: 'decision'
      turn: number
      player: ModelId
      seat: Seat
      rationale: string
      column: number | null
      legalColumns: number[]
      invalidReason?: string
    }
  | {
      type: 'move'
      turn: number
      player: ModelId
      seat: Seat
      column: number
      row: number
      board: Board
    }
  | {
      type: 'gameOver'
      board: Board
      winner: ModelId | 'draw'
      winnerSeat: Seat | null
      turns: number
      endedAt: string
      reason: GameOutcomeReason
    }
  | {
      type: 'error'
      message: string
    }
