import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Info, 
  HelpCircle,
  FileEdit,
  Send,
  Search,
  AlertOctagon,
  Award,
  Ban
} from 'lucide-react';

export type VerificationStatusType = 
  | 'VERIFIED' 
  | 'MISMATCH_DETECTED' 
  | 'EXPIRED' 
  | 'VERIFICATION_PENDING' 
  | 'SOURCE_UNAVAILABLE' 
  | 'MANUAL_REVIEW_REQUIRED';

export type ApplicationStatusType =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_SCRUTINY'
  | 'DEFICIENCY_COMMUNICATED'
  | 'RECOMMENDED'
  | 'NOT_RECOMMENDED'
  | 'APPROVED'
  | 'REJECTED';

export interface StatusChipProps {
  status: VerificationStatusType | ApplicationStatusType | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  size = 'md',
  className = ''
}) => {
  const { t } = useTranslation();

  const sizeClasses = size === 'sm' 
    ? 'text-[11px] px-2 py-0.5 gap-1' 
    : 'text-12 px-2.5 py-1 gap-1.5';

  // Config mapping for all 6 verification statuses
  const verificationConfig: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
    VERIFIED: {
      bg: 'bg-green-50',
      text: 'text-green-600 font-bold',
      border: 'border-green-600/30',
      icon: CheckCircle2,
      label: t('verificationStatus.VERIFIED', 'Verified Genuine')
    },
    MISMATCH_DETECTED: {
      bg: 'bg-danger-50',
      text: 'text-danger font-bold',
      border: 'border-danger/30',
      icon: XCircle,
      label: t('verificationStatus.MISMATCH_DETECTED', 'Mismatch Detected')
    },
    EXPIRED: {
      bg: 'bg-warning-50',
      text: 'text-warning font-bold',
      border: 'border-warning/30',
      icon: Clock,
      label: t('verificationStatus.EXPIRED', 'Expired Certificate')
    },
    VERIFICATION_PENDING: {
      bg: 'bg-gov-subtle',
      text: 'text-gov-muted font-semibold',
      border: 'border-gov-border',
      icon: Clock,
      label: t('verificationStatus.VERIFICATION_PENDING', 'Verification Pending')
    },
    SOURCE_UNAVAILABLE: {
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-700 dark:text-zinc-300 font-semibold',
      border: 'border-zinc-300 dark:border-zinc-700',
      icon: Info,
      label: t('verificationStatus.SOURCE_UNAVAILABLE', 'Source Unavailable')
    },
    MANUAL_REVIEW_REQUIRED: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300 font-bold',
      border: 'border-purple-300 dark:border-purple-800',
      icon: AlertTriangle,
      label: t('verificationStatus.MANUAL_REVIEW_REQUIRED', 'Manual Review Required')
    }
  };

  // Config mapping for Application statuses
  const applicationConfig: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
    DRAFT: {
      bg: 'bg-gov-subtle',
      text: 'text-gov-muted font-semibold',
      border: 'border-gov-border',
      icon: FileEdit,
      label: t('applicationStatus.DRAFT', 'Draft')
    },
    SUBMITTED: {
      bg: 'bg-info-50',
      text: 'text-info font-bold',
      border: 'border-info/30',
      icon: Send,
      label: t('applicationStatus.SUBMITTED', 'Submitted')
    },
    UNDER_SCRUTINY: {
      bg: 'bg-navy-50',
      text: 'text-navy-700 font-bold',
      border: 'border-navy-500/30',
      icon: Search,
      label: t('applicationStatus.UNDER_SCRUTINY', 'Under Scrutiny')
    },
    DEFICIENCY_COMMUNICATED: {
      bg: 'bg-warning-50',
      text: 'text-warning font-bold',
      border: 'border-warning/30',
      icon: AlertOctagon,
      label: t('applicationStatus.DEFICIENCY_COMMUNICATED', 'Deficiency Communicated')
    },
    RECOMMENDED: {
      bg: 'bg-green-50',
      text: 'text-green-600 font-bold',
      border: 'border-green-600/30',
      icon: Award,
      label: t('applicationStatus.RECOMMENDED', 'Recommended for EoA')
    },
    NOT_RECOMMENDED: {
      bg: 'bg-danger-50',
      text: 'text-danger font-bold',
      border: 'border-danger/30',
      icon: Ban,
      label: t('applicationStatus.NOT_RECOMMENDED', 'Not Recommended')
    },
    APPROVED: {
      bg: 'bg-green-50',
      text: 'text-green-600 font-bold',
      border: 'border-green-600/30',
      icon: CheckCircle2,
      label: t('applicationStatus.APPROVED', 'Approved')
    },
    REJECTED: {
      bg: 'bg-danger-50',
      text: 'text-danger font-bold',
      border: 'border-danger/30',
      icon: XCircle,
      label: t('applicationStatus.REJECTED', 'Rejected')
    }
  };

  const item = verificationConfig[status] || applicationConfig[status] || {
    bg: 'bg-gov-subtle',
    text: 'text-gov-text',
    border: 'border-gov-border',
    icon: HelpCircle,
    label: status
  };

  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border ${item.bg} ${item.text} ${item.border} ${sizeClasses} ${className} select-none`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
      <span>{item.label}</span>
    </span>
  );
};
