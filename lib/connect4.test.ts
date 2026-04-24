import { describe, expect, test } from 'bun:test'

import {
  applyMove,
  boardFull,
  checkWinner,
  createEmptyBoard,
  legalColumns,
} from './connect4'

describe('connect4', () => {
  test('drops chips to the bottom of the column', () => {
    const empty = createEmptyBoard()
    const firstMove = applyMove(empty, 3, 'A')
    const secondMove = applyMove(firstMove.board, 3, 'B')

    expect(firstMove.row).toBe(5)
    expect(secondMove.row).toBe(4)
    expect(secondMove.board[5][3]).toBe('A')
    expect(secondMove.board[4][3]).toBe('B')
  })

  test('detects a horizontal win', () => {
    let board = createEmptyBoard()

    for (const column of [0, 1, 2, 3]) {
      board = applyMove(board, column, 'A').board
    }

    expect(checkWinner(board)).toBe('A')
  })

  test('detects a vertical win', () => {
    let board = createEmptyBoard()

    for (let index = 0; index < 4; index += 1) {
      board = applyMove(board, 1, 'B').board
    }

    expect(checkWinner(board)).toBe('B')
  })

  test('detects a descending diagonal win', () => {
    let board = createEmptyBoard()

    board = applyMove(board, 0, 'A').board
    board = applyMove(board, 1, 'B').board
    board = applyMove(board, 1, 'A').board
    board = applyMove(board, 2, 'B').board
    board = applyMove(board, 2, 'B').board
    board = applyMove(board, 2, 'A').board
    board = applyMove(board, 3, 'B').board
    board = applyMove(board, 3, 'B').board
    board = applyMove(board, 3, 'B').board
    board = applyMove(board, 3, 'A').board

    expect(checkWinner(board)).toBe('A')
  })

  test('detects an ascending diagonal win', () => {
    let board = createEmptyBoard()

    board = applyMove(board, 3, 'A').board
    board = applyMove(board, 2, 'B').board
    board = applyMove(board, 2, 'A').board
    board = applyMove(board, 1, 'B').board
    board = applyMove(board, 1, 'B').board
    board = applyMove(board, 1, 'A').board
    board = applyMove(board, 0, 'B').board
    board = applyMove(board, 0, 'B').board
    board = applyMove(board, 0, 'B').board
    board = applyMove(board, 0, 'A').board

    expect(checkWinner(board)).toBe('A')
  })

  test('tracks legal columns as the board fills up', () => {
    let board = createEmptyBoard()

    for (let index = 0; index < 6; index += 1) {
      board = applyMove(board, 0, index % 2 === 0 ? 'A' : 'B').board
    }

    expect(legalColumns(board)).toEqual([1, 2, 3, 4, 5, 6])
    expect(boardFull(board)).toBe(false)
  })

  test('detects a full board without a winner', () => {
    const board = [
      ['A', 'A', 'B', 'B', 'A', 'A', 'B'],
      ['B', 'B', 'A', 'A', 'B', 'B', 'A'],
      ['A', 'A', 'B', 'B', 'A', 'A', 'B'],
      ['B', 'B', 'A', 'A', 'B', 'B', 'A'],
      ['A', 'A', 'B', 'B', 'A', 'A', 'B'],
      ['B', 'B', 'A', 'A', 'B', 'B', 'A'],
    ] as const

    expect(boardFull(board.map((row) => [...row]))).toBe(true)
    expect(checkWinner(board.map((row) => [...row]))).toBe(null)
  })
})
