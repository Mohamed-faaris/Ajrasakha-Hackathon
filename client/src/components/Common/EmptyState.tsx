interface EmptyStateProps {
  message?: string
}

const EmptyState = ({ message = 'No data available for the selected filters.' }: EmptyStateProps) => (
  <div className="state">{message}</div>
)

export default EmptyState
