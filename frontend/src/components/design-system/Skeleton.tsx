import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = ""
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full w-10 h-10',
    rectangular: 'rounded-md w-full h-24'
  }[variant];

  return (
    <div
      style={{ width, height }}
      className={`animate-pulse bg-gov-border/60 ${variantStyles} ${className}`}
      aria-hidden="true"
    />
  );
};
