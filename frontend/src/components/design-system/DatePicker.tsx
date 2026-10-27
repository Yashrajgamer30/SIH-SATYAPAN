import React, { forwardRef, useId } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(({
  label,
  helperText,
  error,
  required,
  id: customId,
  className = '',
  disabled,
  ...props
}, ref) => {
  const autoId = useId();
  const id = customId || autoId;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  return (
    <div className={`relative w-full ${className}`}>
      <label
        htmlFor={id}
        className="block text-12 font-semibold text-gov-text mb-1"
      >
        {label} {required && <span className="text-danger">*</span>}
      </label>

      <div className="relative">
        <input
          ref={ref}
          id={id}
          type="date"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`block w-full px-3 py-2 text-14 text-gov-text bg-gov-surface border rounded transition-colors duration-200 outline-none
            ${error 
              ? 'border-danger focus:ring-1 focus:ring-danger' 
              : 'border-gov-border focus:border-navy-700 focus:ring-1 focus:ring-navy-700'
            }
            disabled:bg-gov-subtle disabled:opacity-60 disabled:cursor-not-allowed
          `}
          {...props}
        />
        <div className="absolute right-3 top-2.5 pointer-events-none text-gov-muted">
          {error ? (
            <AlertCircle className="w-4 h-4 text-danger" aria-hidden="true" />
          ) : (
            <Calendar className="w-4 h-4" aria-hidden="true" />
          )}
        </div>
      </div>

      {error ? (
        <p id={errorId} className="mt-1 text-12 font-medium text-danger flex items-center gap-1">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="mt-1 text-12 text-gov-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

DatePicker.displayName = 'DatePicker';
