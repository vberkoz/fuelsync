interface ErrorAlertProps {
  error: Error | unknown;
  className?: string;
}

export function ErrorAlert({ error, className = '' }: ErrorAlertProps) {
  const message = error instanceof Error ? error.message : 'An error occurred';
  
  return (
    <div className={`bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg ${className}`}>
      {message}
    </div>
  );
}
