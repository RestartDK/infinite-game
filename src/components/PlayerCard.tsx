import { useState } from 'react'

import type { HeadToHeadRecord, ModelTotals } from '../../lib/contracts'
import type { ModelConfig } from '../../lib/models'

type PlayerCardProps = {
  model: ModelConfig
  seat: 'A' | 'B'
  totals: ModelTotals
  against: ModelConfig | null
  record: HeadToHeadRecord | null
  isActive: boolean
  moves: number
  align: 'left' | 'right'
}

const getVersusRecord = (
  modelId: ModelConfig['id'],
  record: HeadToHeadRecord | null,
) => {
  if (!record) {
    return { wins: 0, losses: 0, draws: 0 }
  }

  if (record.modelA === modelId) {
    return {
      wins: record.winsA,
      losses: record.winsB,
      draws: record.draws,
    }
  }

  return {
    wins: record.winsB,
    losses: record.winsA,
    draws: record.draws,
  }
}

const TALLY_GLYPH: Record<'A' | 'B', string> = {
  A: '▲',
  B: '▼',
}

export function PlayerCard({
  model,
  seat,
  totals,
  against,
  record,
  isActive,
  moves,
  align,
}: PlayerCardProps) {
  const [iconFailed, setIconFailed] = useState(false)
  const versus = getVersusRecord(model.id, record)

  const tally = Array.from({ length: Math.min(moves, 24) }, () => TALLY_GLYPH[seat]).join('')

  return (
    <div className={`player-slot ${align === 'right' ? 'player-slot--right' : ''}`}>
      <span className={`player-slot__row ${isActive ? 'is-active' : ''}`}>
        {align === 'right' ? (
          <>
            <span className="name">{model.shortName}</span>
            <span className="delta">
              {totals.wins >= 0 ? `+${totals.wins}` : totals.wins}
            </span>
            <span className="badge" aria-hidden="true">
              {iconFailed ? (
                <span className="badge--initials">
                  {model.shortName.slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <img
                  src={model.icon}
                  alt=""
                  onError={() => setIconFailed(true)}
                  loading="lazy"
                />
              )}
            </span>
          </>
        ) : (
          <>
            <span className="badge" aria-hidden="true">
              {iconFailed ? (
                <span className="badge--initials">
                  {model.shortName.slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <img
                  src={model.icon}
                  alt=""
                  onError={() => setIconFailed(true)}
                  loading="lazy"
                />
              )}
            </span>
            <span className="name">{model.shortName}</span>
            <span className="delta">
              {totals.wins >= 0 ? `+${totals.wins}` : totals.wins}
            </span>
          </>
        )}
      </span>

      {tally ? (
        <span className="player-slot__captures" aria-label={`${moves} chips placed`}>
          {tally}
        </span>
      ) : null}

      <span className="player-slot__meta">
        {against
          ? `vs ${against.shortName} · ${versus.wins}-${versus.losses}-${versus.draws}`
          : 'awaiting opponent'}
      </span>
    </div>
  )
}
