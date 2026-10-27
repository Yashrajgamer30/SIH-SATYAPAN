import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'saffron' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-saffron-500 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

  const sizeStyles = {
    sm: "text-12 px-2.5 py-1.5 gap-1.5",
    md: "text-14 px-3.5 py-2 gap-2",
    lg: "text-16 px-5 py-2.5 gap-2.5"
  }[size];

  const variantStyles = {
    primary: "bg-navy-700 hover:bg-navy-900 text-white shadow-xs border border-transparent",
    secondary: "bg-gov-surface hover:bg-gov-subtle text-gov-text border border-gov-border shadow-xs",
    saffron: "bg-saffron-500 hover:bg-[#E68524] text-slate-900 font-bold shadow-xs border border-transparent",
    danger: "bg-danger hover:bg-[#A91B1B] text-white shadow-xs border border-transparent",
    ghost: "bg-transparent hover:bg-gov-subtle text-gov-text border border-transparent"
  }[variant];

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      
      <span>{children}</span>
      
      {!isLoading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
