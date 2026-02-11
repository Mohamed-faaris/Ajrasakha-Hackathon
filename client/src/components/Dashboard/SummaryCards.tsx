import type { Coverage, TopMover } from '@shared/types'

interface SummaryCardsProps {
  coverage?: Coverage
  movers?: TopMover[]
}

const SummaryCards = ({ coverage, movers = [] }: SummaryCardsProps) => {
  const gainers = movers.filter((item) => item.direction === 'up')
  const losers = movers.filter((item) => item.direction === 'down')
  const topGainer = gainers[0]
  const topLoser = losers[0]

  return (
    <div className="grid grid-3">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Coverage</div>
          <span className="chip">APMCs</span>
        </div>
        <div className="stat-value">{coverage ? `${coverage.coveragePercent}%` : '--'}</div>
        <div className="stat-label">
          {coverage ? `${coverage.coveredApmcs} of ${coverage.totalApmcs} APMCs` : 'Awaiting data'}
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Top Gainer</div>
          <span className="badge up">Up</span>
        </div>
        <div className="stat-value">{topGainer ? topGainer.cropName : '--'}</div>
        <div className="stat-label">
          {topGainer ? `+${topGainer.changePct.toFixed(1)}%` : 'No movers yet'}
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Top Loser</div>
          <span className="badge down">Down</span>
        </div>
        <div className="stat-value">{topLoser ? topLoser.cropName : '--'}</div>
        <div className="stat-label">
          {topLoser ? `${topLoser.changePct.toFixed(1)}%` : 'No movers yet'}
        </div>
      </div>
    </div>
  )
}

export default SummaryCards
