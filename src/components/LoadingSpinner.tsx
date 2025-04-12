import React from 'react';

type SpinnerSize = 'small' | 'medium' | 'large';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium',
  className = '',
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  return (
    <div className={`${className} flex items-center justify-center`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-solid border-gray-200 border-t-blue-600`} />
    </div>
  );
};

export default LoadingSpinner; 