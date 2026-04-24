import {
  Clone,
  ContactShadows,
  OrbitControls,
  useGLTF,
} from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Group, MathUtils } from 'three'

import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  type Board,
  type Seat,
} from '../../lib/connect4'

type Board3DProps = {
  board: Board
  currentSeat: Seat | null
  animatedMoves: Set<string>
  pendingColumn: number | null
}

const STAND_URL = '/connect_four_stand.glb'
const COIN_URLS: Record<Seat, string> = {
  A: '/coin_red.glb',
  B: '/coin_yellow.glb',
}

// Tuned to the actual GLB stand bounds (≈8.8 × 7.45 × 2.2).
const COLUMN_SPACING = 1.14
const ROW_SPACING = 1.0
const SCENE_SCALE = 0.82
// Coin sits centered through the stand depth so it appears in the slot.
const CHIP_DEPTH = 0
// Drop physics — chips spawn just above the rack and fall under gravity.
const CHIP_SPAWN_Y = 4.5
const GRAVITY = -26
const BOUNCE_RESTITUTION = 0.32
const SETTLE_VELOCITY = 0.45
// Cap dt so a hitched frame can't tunnel the chip through the floor.
const MAX_PHYSICS_DT = 1 / 30
// Hover height for the pending coin (matches the chip spawn so the pending
// chip visually "becomes" the dropped chip).
const PENDING_HOVER_Y = CHIP_SPAWN_Y
const CENTER_COLUMN = (BOARD_COLUMNS - 1) / 2

useGLTF.preload(STAND_URL)
useGLTF.preload(COIN_URLS.A)
useGLTF.preload(COIN_URLS.B)

const columnToX = (column: number) =>
  (column - (BOARD_COLUMNS - 1) / 2) * COLUMN_SPACING
const rowToY = (row: number) =>
  (BOARD_ROWS - 1 - row - (BOARD_ROWS - 1) / 2) * ROW_SPACING

function Stand() {
  const { scene } = useGLTF(STAND_URL)
  return <Clone object={scene} castShadow receiveShadow />
}

type ChipProps = {
  row: number
  column: number
  seat: Seat
  animated: boolean
}

function Chip({ row, column, seat, animated }: ChipProps) {
  const ref = useRef<Group>(null)
  const velocityRef = useRef(0)
  // Pre-existing pieces (from the init snapshot) start already settled — no
  // physics replay on reload.
  const settledRef = useRef(!animated)
  const targetY = rowToY(row)
  const initialY = animated ? CHIP_SPAWN_Y : targetY
  const { scene } = useGLTF(COIN_URLS[seat])

  useFrame((_, delta) => {
    const node = ref.current

    if (!node || settledRef.current) {
      return
    }

    const dt = Math.min(delta, MAX_PHYSICS_DT)
    velocityRef.current += GRAVITY * dt
    node.position.y += velocityRef.current * dt

    if (node.position.y <= targetY) {
      const impact = -velocityRef.current

      node.position.y = targetY

      if (impact < SETTLE_VELOCITY) {
        velocityRef.current = 0
        settledRef.current = true
      } else {
        velocityRef.current = impact * BOUNCE_RESTITUTION
      }
    }
  })

  return (
    <group
      ref={ref}
      position={[columnToX(column), initialY, CHIP_DEPTH]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <Clone object={scene} castShadow receiveShadow />
    </group>
  )
}

type PendingChipProps = {
  seat: Seat
  pendingColumn: number | null
}

function PendingChip({ seat, pendingColumn }: PendingChipProps) {
  const ref = useRef<Group>(null)
  const { scene } = useGLTF(COIN_URLS[seat])
  const targetColumn = pendingColumn ?? CENTER_COLUMN

  useFrame(({ clock }, delta) => {
    const node = ref.current

    if (!node) {
      return
    }

    const dt = Math.min(delta, MAX_PHYSICS_DT)
    const targetX = columnToX(targetColumn)
    // Smoothly slide between columns when the agent commits to a column.
    node.position.x = MathUtils.damp(node.position.x, targetX, 9, dt)
    // Subtle bob so the pending coin reads as alive.
    node.position.y =
      PENDING_HOVER_Y + Math.sin(clock.elapsedTime * 2.4) * 0.07
  })

  return (
    <group
      ref={ref}
      position={[columnToX(targetColumn), PENDING_HOVER_Y, CHIP_DEPTH]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <Clone object={scene} castShadow receiveShadow />
    </group>
  )
}

function BoardScene({
  board,
  currentSeat,
  animatedMoves,
  pendingColumn,
}: Board3DProps) {
  const chips = useMemo(
    () =>
      board.flatMap((row, rowIndex) =>
        row.flatMap((cell, columnIndex) =>
          cell === null
            ? []
            : [
                {
                  key: `${rowIndex}-${columnIndex}-${cell}`,
                  moveKey: `${rowIndex}:${columnIndex}`,
                  row: rowIndex,
                  column: columnIndex,
                  seat: cell,
                },
              ],
        ),
      ),
    [board],
  )

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        intensity={2.4}
        position={[4, 7, 6]}
        color="#f4ede1"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight intensity={0.6} position={[-6, 1, 6]} color="#cfc8b8" />

      <group rotation-x={-0.12} scale={SCENE_SCALE}>
        <Stand />

        {chips.map((chip) => (
          <Chip
            key={chip.key}
            row={chip.row}
            column={chip.column}
            seat={chip.seat}
            animated={animatedMoves.has(chip.moveKey)}
          />
        ))}

        {currentSeat ? (
          // Keying by seat ensures a clean swap (and reset to the centre
          // column) when the turn passes to the other player.
          <PendingChip
            key={currentSeat}
            seat={currentSeat}
            pendingColumn={pendingColumn}
          />
        ) : null}
      </group>

      <ContactShadows
        opacity={0.55}
        scale={12}
        blur={2.6}
        far={7}
        position={[0, -3.3, 0]}
        color="#000000"
      />
      <OrbitControls enablePan={false} minDistance={7} maxDistance={14} />
    </>
  )
}

export function Board3D({
  board,
  currentSeat,
  animatedMoves,
  pendingColumn,
}: Board3DProps) {
  return (
    <div className="board-stage">
      <Canvas
        camera={{ position: [0, 0.4, 8.8], fov: 38 }}
        shadows
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <BoardScene
          board={board}
          currentSeat={currentSeat}
          animatedMoves={animatedMoves}
          pendingColumn={pendingColumn}
        />
      </Canvas>
    </div>
  )
}
