import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  errorCode?: string | number;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Service Communication Error",
  errorCode = "ERR_REGULATORY_GATEWAY_TIMEOUT",
  message = "Unable to connect to the simulated issuing authority gateway. Please verify network access or re-run the verification pipeline.",
  onRetry,
  retryLabel = "Retry Verification",
  className = ""
}) => {
  return (
    <div className={`p-8 sm:p-12 text-center bg-gov-surface border border-danger/30 rounded-lg shadow-xs flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}>
      <div className="w-16 h-16 rounded-full bg-danger-50 border border-danger/30 text-danger flex items-center justify-center mb-4">
        <AlertOctagon className="w-8 h-8 stroke-[1.5]" aria-hidden="true" />
      </div>

      <span className="text-11 font-mono font-bold px-2 py-0.5 rounded bg-danger-50 text-danger border border-danger/20 mb-2">
        {errorCode}
      </span>

      <h3 className="text-16 sm:text-18 font-bold text-gov-text">
        {title}
      </h3>

      <p className="text-14 text-gov-muted mt-1.5 max-w-sm">
        {message}
      </p>

      {onRetry && (
        <div className="mt-5">
          <Button
            variant="danger"
            onClick={onRetry}
            leftIcon={<RotateCw className="w-4 h-4" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
