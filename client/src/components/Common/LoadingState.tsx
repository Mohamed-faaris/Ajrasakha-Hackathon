interface LoadingStateProps {
  message?: string
}

const LoadingState = ({ message = 'Loading insights...' }: LoadingStateProps) => (
  <div className="state">{message}</div>
)

export default LoadingState
