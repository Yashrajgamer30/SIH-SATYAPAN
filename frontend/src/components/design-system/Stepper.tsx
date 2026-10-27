import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string | number;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  activeStep: number; // 0-indexed
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStep,
  onStepClick,
  className = ""
}) => {
  return (
    <nav aria-label="Progress Stepper" className={`w-full ${className}`}>
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, idx) => {
          const isCompleted = idx < activeStep;
          const isCurrent = idx === activeStep;
          const isClickable = Boolean(onStepClick && (isCompleted || isCurrent));

          return (
            <li
              key={step.id}
              className={`relative flex-1 flex flex-col items-center ${
                idx !== steps.length - 1 ? 'after:content-[""] after:w-full after:h-0.5 after:border-b after:border-gov-border after:inline-block after:absolute after:top-4 after:left-1/2 after:z-0' : ''
              } ${idx < activeStep ? 'after:!border-navy-700' : ''}`}
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(idx)}
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold text-12 transition-all duration-200 outline-none
                  ${isCompleted 
                    ? 'bg-navy-700 text-white border-navy-700' 
                    : isCurrent 
                      ? 'bg-saffron-500 text-slate-900 border-saffron-500 ring-4 ring-saffron-50' 
                      : 'bg-gov-surface text-gov-muted border-gov-border'
                  }
                  ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                  focus-visible:ring-2 focus-visible:ring-saffron-500
                `}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </button>

              <div className="text-center mt-2 px-1">
                <p className={`text-12 font-bold ${isCurrent ? 'text-navy-900 dark:text-white' : isCompleted ? 'text-gov-text' : 'text-gov-muted'}`}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-[11px] text-gov-muted hidden sm:block">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
