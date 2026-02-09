import type { Alert } from '@shared/types'
import EmptyState from '../Common/EmptyState'

interface AlertsPanelProps {
  alerts: Alert[]
}

const AlertsPanel = ({ alerts }: AlertsPanelProps) => {
  if (!alerts.length) {
    return <EmptyState message="No alerts triggered for these filters." />
  }

  return (
    <div className="grid">
      {alerts.slice(0, 5).map((alert) => (
        <div className="alert" key={alert.id}>
          <strong>{alert.cropName}</strong>
          <span>
            Threshold {alert.direction} {alert.thresholdPrice}
          </span>
          <span className="stat-label">
            {alert.mandiName ? `${alert.mandiName} • ` : ''}
            {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleDateString() : 'Monitoring'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default AlertsPanel
