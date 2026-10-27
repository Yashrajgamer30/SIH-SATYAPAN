import React from 'react';
import { FileSearch } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Applications Found",
  description = "No pending regulatory submissions or records match the applied criteria.",
  actionLabel,
  onAction,
  icon,
  className = ""
}) => {
  return (
    <div className={`p-8 sm:p-12 text-center bg-gov-surface border border-gov-border rounded-lg shadow-xs flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}>
      {/* Government Line Illustration */}
      <div className="w-16 h-16 rounded-full bg-navy-50 border border-navy-500/20 text-navy-700 flex items-center justify-center mb-4">
        {icon || <FileSearch className="w-8 h-8 stroke-[1.5]" aria-hidden="true" />}
      </div>

      <h3 className="text-16 sm:text-18 font-bold text-gov-text">
        {title}
      </h3>

      <p className="text-14 text-gov-muted mt-1.5 max-w-sm">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
