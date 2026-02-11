interface ErrorStateProps {
  message?: string
}

const ErrorState = ({ message = 'Something went wrong. Try again.' }: ErrorStateProps) => (
  <div className="state">{message}</div>
)

export default ErrorState
