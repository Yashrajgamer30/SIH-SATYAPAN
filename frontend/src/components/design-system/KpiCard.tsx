import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  sparklineData?: { value: number }[];
  icon?: React.ReactNode;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  sparklineData,
  icon,
  className = ''
}) => {
  const changeStyles = {
    positive: 'text-green-600 bg-green-50 border-green-600/30',
    negative: 'text-danger bg-danger-50 border-danger/30',
    neutral: 'text-gov-muted bg-gov-subtle border-gov-border'
  }[changeType];

  const TrendIcon = changeType === 'positive' 
    ? ArrowUpRight 
    : changeType === 'negative' 
      ? ArrowDownRight 
      : Minus;

  const sparklineStroke = changeType === 'negative' ? 'var(--danger)' : changeType === 'positive' ? 'var(--green-600)' : 'var(--navy-500)';

  return (
    <div className={`p-4 bg-gov-surface border border-gov-border rounded-lg shadow-xs flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-12 font-semibold text-gov-muted uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-24 sm:text-32 font-bold text-gov-text tabular-nums">
              {value}
            </span>
            {change && (
              <span className={`inline-flex items-center text-12 font-bold px-1.5 py-0.5 rounded border ${changeStyles}`}>
                <TrendIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{change}</span>
              </span>
            )}
          </div>
        </div>

        {icon && (
          <div className="w-10 h-10 rounded-lg bg-navy-50 border border-navy-500/20 text-navy-700 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between mt-3 pt-2 border-t border-gov-border/60">
        {subtitle && (
          <p className="text-12 text-gov-muted">
            {subtitle}
          </p>
        )}

        {sparklineData && sparklineData.length > 0 && (
          <div className="w-24 h-8 ml-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sparklineStroke}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
