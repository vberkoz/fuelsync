interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
};

export function LoadingSpinner({ message, size = 'md' }: LoadingSpinnerProps) {
  return (
    <div className="text-center py-12">
      <div className={`inline-block ${sizeClasses[size]} animate-spin rounded-full border-solid border-indigo-600 border-r-transparent`}></div>
      {message && <p className="mt-4 text-slate-400">{message}</p>}
    </div>
  );
}
