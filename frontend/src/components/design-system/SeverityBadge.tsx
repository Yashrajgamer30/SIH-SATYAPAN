import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertCircle, AlertTriangle, Flame } from 'lucide-react';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SeverityBadgeProps {
  level: SeverityLevel;
  showIcon?: boolean;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  level,
  showIcon = true,
  className = ''
}) => {
  const { t } = useTranslation();

  const config: Record<SeverityLevel, { bg: string; text: string; border: string; icon: any; label: string }> = {
    LOW: {
      bg: 'bg-green-50',
      text: 'text-green-600 font-bold',
      border: 'border-green-600/30',
      icon: ShieldCheck,
      label: t('severity.LOW', 'Low Risk')
    },
    MEDIUM: {
      bg: 'bg-info-50',
      text: 'text-info font-bold',
      border: 'border-info/30',
      icon: AlertCircle,
      label: t('severity.MEDIUM', 'Medium Deficiency')
    },
    HIGH: {
      bg: 'bg-warning-50',
      text: 'text-warning font-bold',
      border: 'border-warning/30',
      icon: AlertTriangle,
      label: t('severity.HIGH', 'High Deficiency')
    },
    CRITICAL: {
      bg: 'bg-danger-50',
      text: 'text-danger font-bold',
      border: 'border-danger/30',
      icon: Flame,
      label: t('severity.CRITICAL', 'Critical Anomaly')
    }
  };

  const item = config[level] || config.LOW;
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-12 border ${item.bg} ${item.text} ${item.border} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
      <span>{item.label}</span>
    </span>
  );
};
