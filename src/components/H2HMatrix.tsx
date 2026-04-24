import type { HeadToHeadRecord } from '../../lib/contracts'
import { MODELS } from '../../lib/models'

type H2HMatrixProps = {
  records: HeadToHeadRecord[]
}

const findRecord = (
  leftId: (typeof MODELS)[number]['id'],
  rightId: (typeof MODELS)[number]['id'],
  records: HeadToHeadRecord[],
) =>
  records.find(
    (record) =>
      (record.modelA === leftId && record.modelB === rightId) ||
      (record.modelA === rightId && record.modelB === leftId),
  )

const formatCell = (
  rowId: (typeof MODELS)[number]['id'],
  columnId: (typeof MODELS)[number]['id'],
  records: HeadToHeadRecord[],
) => {
  const record = findRecord(rowId, columnId, records)

  if (!record) {
    return '0-0-0'
  }

  if (record.modelA === rowId) {
    return `${record.winsA}-${record.winsB}-${record.draws}`
  }

  return `${record.winsB}-${record.winsA}-${record.draws}`
}

export function H2HMatrix({ records }: H2HMatrixProps) {
  return (
    <section className="h2h">
      <span className="h2h__title">head · to · head</span>

      <div className="h2h__grid">
        <div className="h2h__cell h2h__cell--head" />
        {MODELS.map((model) => (
          <div className="h2h__cell h2h__cell--head" key={`col-${model.id}`}>
            {model.shortName}
          </div>
        ))}

        {MODELS.map((rowModel) => (
          <div className="h2h__row" key={rowModel.id} style={{ display: 'contents' }}>
            <div className="h2h__cell h2h__cell--row">{rowModel.shortName}</div>

            {MODELS.map((columnModel) => (
              <div
                className={`h2h__cell ${rowModel.id === columnModel.id ? 'h2h__cell--diag' : ''}`}
                key={`${rowModel.id}-${columnModel.id}`}
              >
                {rowModel.id === columnModel.id
                  ? '—'
                  : formatCell(rowModel.id, columnModel.id, records)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
