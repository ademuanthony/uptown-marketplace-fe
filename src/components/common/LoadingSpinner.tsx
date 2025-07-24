interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function LoadingSpinner({ size = 'medium', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-300 border-t-primary-600`} />
    </div>
  );
}