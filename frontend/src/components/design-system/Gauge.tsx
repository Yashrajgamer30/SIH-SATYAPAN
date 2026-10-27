import React from 'react';

export interface GaugeProps {
  value: number; // 0 to 100
  title?: string;
  subtitle?: string;
  size?: number;
  className?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  title = "Advisory Risk Index",
  subtitle = "AI Decision Support Score",
  size = 180,
  className = ""
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  
  // Semicircle parameters
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const arcLength = Math.PI * radius; // 180 degrees
  const strokeDashoffset = arcLength - (arcLength * clamped) / 100;

  // Color determination
  const getColor = (val: number) => {
    if (val < 25) return 'var(--green-600)';
    if (val < 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getLabel = (val: number) => {
    if (val < 25) return 'LOW RISK';
    if (val < 60) return 'MODERATE DEFICIENCY';
    return 'HIGH DEFICIENCY';
  };

  const strokeColor = getColor(clamped);

  return (
    <div className={`flex flex-col items-center text-center p-4 bg-gov-surface border border-gov-border rounded-lg shadow-xs ${className}`}>
      {title && (
        <p className="text-12 font-semibold text-gov-muted uppercase tracking-wider mb-2">
          {title}
        </p>
      )}

      <div className="relative" style={{ width: size, height: size / 1.7 }}>
        <svg
          width={size}
          height={size / 1.6 + 10}
          viewBox={`0 0 ${size} ${size / 1.6 + 10}`}
          className="overflow-visible"
        >
          {/* Background Track Arc */}
          <path
            d={`M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <path
            d={`M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
          <span className="text-24 sm:text-32 font-black text-gov-text tabular-nums leading-none">
            {clamped}
            <span className="text-14 text-gov-muted font-normal">/100</span>
          </span>
          <span 
            className="text-11 font-bold tracking-wider mt-1 px-2 py-0.5 rounded"
            style={{ color: strokeColor }}
          >
            {getLabel(clamped)}
          </span>
        </div>
      </div>

      {subtitle && (
        <p className="text-12 text-gov-muted mt-3">
          {subtitle}
        </p>
      )}
    </div>
  );
};
