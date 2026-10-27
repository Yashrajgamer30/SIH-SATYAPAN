import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, CheckCircle2, XCircle, Clock } from 'lucide-react';

// Mandated Principle 1 Banner
export const AdvisoryBanner: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-amber-500/10 border-l-4 border-amber-500 p-3 sm:p-4 mb-4 rounded-r shadow-sm flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs sm:text-sm font-semibold text-amber-900 tracking-wide uppercase">
          AICTE Official Mandate
        </p>
        <p className="text-xs sm:text-sm text-amber-800">
          {t('advisoryBanner')}
        </p>
      </div>
    </div>
  );
};

// Mandated Principle 6 Badge
export const SimulatedSourceBadge: React.FC<{ sourceName?: string }> = ({ sourceName }) => {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
      <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
      {t('simulatedSource')} {sourceName ? `• ${sourceName}` : ''}
    </span>
  );
};

// Mandated Exact Verification Status Badge (Principle 5)
interface StatusBadgeProps {
  status: 'VERIFIED' | 'MISMATCH_DETECTED' | 'EXPIRED' | 'VERIFICATION_PENDING' | 'SOURCE_UNAVAILABLE' | 'MANUAL_REVIEW_REQUIRED';
}

export const VerificationStatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();

  const config = {
    VERIFIED: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      icon: CheckCircle2,
      label: t('status.VERIFIED')
    },
    MISMATCH_DETECTED: {
      bg: 'bg-rose-50 text-rose-700 border-rose-300',
      icon: XCircle,
      label: t('status.MISMATCH_DETECTED')
    },
    EXPIRED: {
      bg: 'bg-amber-50 text-amber-700 border-amber-300',
      icon: Clock,
      label: t('status.EXPIRED')
    },
    VERIFICATION_PENDING: {
      bg: 'bg-slate-50 text-slate-700 border-slate-300',
      icon: Clock,
      label: t('status.VERIFICATION_PENDING')
    },
    SOURCE_UNAVAILABLE: {
      bg: 'bg-zinc-50 text-zinc-700 border-zinc-300',
      icon: Info,
      label: t('status.SOURCE_UNAVAILABLE')
    },
    MANUAL_REVIEW_REQUIRED: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-300',
      icon: AlertTriangle,
      label: t('status.MANUAL_REVIEW_REQUIRED')
    }
  }[status] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-300',
    icon: Info,
    label: status
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};
