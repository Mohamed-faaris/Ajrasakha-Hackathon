import type { TopMover } from '@shared/types'
import EmptyState from '../Common/EmptyState'

interface TopMoversListProps {
  movers: TopMover[]
}

const TopMoversList = ({ movers }: TopMoversListProps) => {
  if (!movers.length) {
    return <EmptyState message="No movers found for this window." />
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Crop</th>
            <th>Latest</th>
            <th>Previous</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {movers.slice(0, 6).map((item) => (
            <tr key={item.cropId}>
              <td>{item.cropName}</td>
              <td>{item.latestPrice}</td>
              <td>{item.previousPrice}</td>
              <td>
                <span className={`badge ${item.direction === 'up' ? 'up' : 'down'}`}>
                  {item.changePct > 0 ? '+' : ''}
                  {item.changePct.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TopMoversList
