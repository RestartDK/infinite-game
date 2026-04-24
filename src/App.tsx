import { Suspense, lazy, useEffect, useState } from 'react'

import { H2HMatrix } from './components/H2HMatrix'
import { PlayerCard } from './components/PlayerCard'
import { ReasoningPanel } from './components/ReasoningPanel'
import { useGameStream } from './hooks/useGameStream'
import './App.css'

const Board3D = lazy(async () => {
  const module = await import('./components/Board3D')
  return { default: module.Board3D }
})

const useClock = (): string => {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function App() {
  const {
    animatedMoves,
    board,
    currentPlayer,
    currentSeat,
    error,
    headToHead,
    logs,
    models,
    pendingColumn,
    players,
    stats,
    status,
    totals,
    winner,
  } = useGameStream()

  const clock = useClock()

  const leftModel = models?.[0] ?? null
  const rightModel = models?.[1] ?? null

  const movesA = board.reduce(
    (sum, row) => sum + row.filter((cell) => cell === 'A').length,
    0,
  )
  const movesB = board.reduce(
    (sum, row) => sum + row.filter((cell) => cell === 'B').length,
    0,
  )

  const currentPlayerName =
    currentPlayer && models
      ? models.find((model) => model.id === currentPlayer)?.shortName ?? currentPlayer
      : null
  const winnerName =
    winner === 'draw'
      ? 'Draw'
      : winner
        ? models?.find((model) => model.id === winner)?.shortName ?? winner
        : null

  const totalsLeft = leftModel ? totals[leftModel.id] : null
  const totalsRight = rightModel ? totals[rightModel.id] : null

  return (
    <main className="app-shell">
      <header className="top-bar">
        {leftModel && totalsLeft ? (
          <PlayerCard
            model={leftModel}
            seat="A"
            totals={totalsLeft}
            against={rightModel}
            record={headToHead}
            isActive={currentSeat === 'A' && status === 'streaming'}
            moves={movesA}
            align="left"
          />
        ) : (
          <div className="player-slot">
            <span className="player-slot__row">
              <span className="badge badge--initials">··</span>
              <span className="name">awaiting player</span>
            </span>
          </div>
        )}

        <div className="top-bar__center">
          <span className="top-bar__score">
            <span className="dot" /> {totalsLeft?.wins ?? 0}
            {' — '}
            {totalsRight?.wins ?? 0} <span className="dot" />
          </span>
          <span className="top-bar__time">{clock}</span>
          <span className="top-bar__status" data-state={status}>
            {status === 'ended' && winnerName
              ? `result · ${winnerName}`
              : currentPlayerName
                ? `on move · ${currentPlayerName}`
                : status}
          </span>
        </div>

        {rightModel && totalsRight ? (
          <PlayerCard
            model={rightModel}
            seat="B"
            totals={totalsRight}
            against={leftModel}
            record={headToHead}
            isActive={currentSeat === 'B' && status === 'streaming'}
            moves={movesB}
            align="right"
          />
        ) : (
          <div className="player-slot player-slot--right">
            <span className="player-slot__row">
              <span className="name">awaiting player</span>
              <span className="badge badge--initials">··</span>
            </span>
          </div>
        )}
      </header>

      <section className="stage">
        <div className="board-stage-wrapper">
          <Suspense
            fallback={<div className="rail__empty">loading scene…</div>}
          >
            <Board3D
              board={board}
              currentSeat={currentSeat}
              animatedMoves={animatedMoves}
              pendingColumn={pendingColumn}
            />
          </Suspense>

          <div className="board-overlay">
            {players ? `${players[0]} · vs · ${players[1]}` : 'awaiting matchup'}
          </div>
        </div>

        <ReasoningPanel logs={logs} status={status} error={error} />
      </section>

      <footer className="footer">
        <H2HMatrix records={stats?.headToHead ?? []} />
      </footer>
    </main>
  )
}

export default App
