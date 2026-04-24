import { useEffect, useRef } from 'react'

type ReasoningLog = {
  key: string
  turn: number
  player: string
  seat: 'A' | 'B'
  reasoningText: string
  textText: string
  rationale?: string
  column?: number | null
  invalidReason?: string
}

type ReasoningPanelProps = {
  logs: ReasoningLog[]
  status: 'loading' | 'streaming' | 'ended' | 'error'
  error: string | null
}

export function ReasoningPanel({
  logs,
  status,
  error,
}: ReasoningPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    container.scrollTop = container.scrollHeight
  }, [logs])

  return (
    <aside className="rail">
      <div className="rail__scroll" ref={containerRef}>
        {logs.length === 0 ? (
          <p className="rail__empty">
            {status === 'error'
              ? 'stream interrupted.'
              : 'awaiting first thought…'}
          </p>
        ) : (
          logs.map((log) => (
            <article className="entry" key={log.key}>
              <header className="entry__head">
                <span>
                  turn {log.turn + 1} · {log.player}
                </span>
                <span>{log.seat}</span>
              </header>

              {log.reasoningText ? (
                <p className="entry__thinking">thinking…</p>
              ) : null}

              {log.reasoningText ? (
                <p className="entry__reasoning">{log.reasoningText}</p>
              ) : null}

              {log.textText ? (
                <p className="entry__transcript">{log.textText}</p>
              ) : null}

              {log.rationale ? (
                <p className="entry__decision">{log.rationale}</p>
              ) : null}

              {log.column !== undefined ? (
                <p className="entry__footer">
                  {log.column === null
                    ? '— forfeit —'
                    : `→ column ${log.column + 1}`}
                </p>
              ) : null}

              {log.invalidReason ? (
                <p className="entry__error">{log.invalidReason}</p>
              ) : null}
            </article>
          ))
        )}
      </div>

      {error ? <p className="rail__error">{error}</p> : null}
    </aside>
  )
}
