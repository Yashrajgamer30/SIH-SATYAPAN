import React, { useState, forwardRef, useId } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  required?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(({
  label,
  helperText,
  error,
  success,
  required,
  id: customId,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  className = '',
  disabled,
  ...props
}, ref) => {
  const autoId = useId();
  const id = customId || autoId;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? '');

  const hasContent = (value !== undefined ? String(value).length > 0 : String(internalValue).length > 0) || isFocused;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`peer block w-full px-3 pt-5 pb-2 text-14 text-gov-text bg-gov-surface border rounded transition-all duration-200 outline-none
            ${error 
              ? 'border-danger focus:ring-1 focus:ring-danger' 
              : success 
                ? 'border-green-600 focus:ring-1 focus:ring-green-600' 
                : 'border-gov-border focus:border-navy-700 focus:ring-1 focus:ring-navy-700'
            }
            disabled:bg-gov-subtle disabled:opacity-60 disabled:cursor-not-allowed
          `}
          placeholder=" "
          {...props}
        />

        {/* Floating Label */}
        <label
          htmlFor={id}
          className={`absolute left-3 transition-all duration-200 pointer-events-none select-none text-gov-muted
            ${hasContent 
              ? 'top-1.5 text-12 font-semibold text-navy-700' 
              : 'top-3.5 text-14'
            }
            ${error ? '!text-danger' : ''}
          `}
        >
          {label} {required && <span className="text-danger">*</span>}
        </label>

        {/* Status Indicator Icon */}
        <div className="absolute right-3 top-3.5 flex items-center pointer-events-none">
          {error && <AlertCircle className="w-4 h-4 text-danger" aria-hidden="true" />}
          {!error && success && <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden="true" />}
        </div>
      </div>

      {/* Helper or Inline Error text */}
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

FormField.displayName = 'FormField';
