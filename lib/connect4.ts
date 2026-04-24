export const BOARD_COLUMNS = 7
export const BOARD_ROWS = 6

export type Seat = 'A' | 'B'
export type Cell = Seat | null
export type Board = Cell[][]

const assertColumn = (column: number) => {
  if (!Number.isInteger(column) || column < 0 || column >= BOARD_COLUMNS) {
    throw new RangeError(`Column must be between 0 and ${BOARD_COLUMNS - 1}`)
  }
}

export const createEmptyBoard = () =>
  Array.from({ length: BOARD_ROWS }, () =>
    Array<Cell>(BOARD_COLUMNS).fill(null),
  )

export const cloneBoard = (board: Board) => board.map((row) => [...row])

export const legalColumns = (board: Board) =>
  Array.from({ length: BOARD_COLUMNS }, (_, column) => column).filter(
    (column) => board[0][column] === null,
  )

export const boardFull = (board: Board) => legalColumns(board).length === 0

export const findDropRow = (board: Board, column: number) => {
  assertColumn(column)

  for (let row = BOARD_ROWS - 1; row >= 0; row -= 1) {
    if (board[row][column] === null) {
      return row
    }
  }

  return null
}

export const applyMove = (board: Board, column: number, seat: Seat) => {
  const row = findDropRow(board, column)

  if (row === null) {
    throw new Error(`Column ${column} is full`)
  }

  const nextBoard = cloneBoard(board)
  nextBoard[row][column] = seat

  return { board: nextBoard, row }
}

const directions = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const

const inBounds = (row: number, column: number) =>
  row >= 0 && row < BOARD_ROWS && column >= 0 && column < BOARD_COLUMNS

export const checkWinner = (board: Board) => {
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let column = 0; column < BOARD_COLUMNS; column += 1) {
      const seat = board[row][column]

      if (seat === null) {
        continue
      }

      for (const [rowDelta, columnDelta] of directions) {
        let connected = 1

        while (connected < 4) {
          const nextRow = row + rowDelta * connected
          const nextColumn = column + columnDelta * connected

          if (!inBounds(nextRow, nextColumn)) {
            break
          }

          if (board[nextRow][nextColumn] !== seat) {
            break
          }

          connected += 1
        }

        if (connected === 4) {
          return seat
        }
      }
    }
  }

  return null
}

export const seatToChipColor = (seat: Seat) =>
  seat === 'A' ? '#ef4444' : '#facc15'
