import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'violet' | 'slate';
}

export default function LoadingSpinner({ size = 'md', color = 'violet' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    white: 'border-white border-t-transparent',
    violet: 'border-violet-600 border-t-transparent',
    slate: 'border-slate-600 border-t-transparent',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
