import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export interface AdvisoryBannerProps {
  customMessage?: string;
  className?: string;
}

export const AdvisoryBanner: React.FC<AdvisoryBannerProps> = ({
  customMessage,
  className = ""
}) => {
  const { t } = useTranslation();

  return (
    <div
      role="note"
      aria-label="AICTE Official Mandate Advisory"
      className={`p-3.5 sm:p-4 bg-amber-500/10 border-l-4 border-saffron-500 rounded-r shadow-xs flex items-start gap-3 text-gov-text ${className}`}
    >
      <AlertTriangle className="w-5 h-5 text-saffron-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="text-12 font-bold text-amber-900 dark:text-saffron-500 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          AICTE Regulatory Mandate: Decision Support Only
        </p>
        <p className="text-12 sm:text-14 text-amber-950 dark:text-slate-200 mt-0.5 leading-relaxed font-medium">
          {customMessage || t('advisoryBanner')}
        </p>
      </div>
    </div>
  );
};
