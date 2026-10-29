import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export const GovFooter: React.FC = () => {
  const { t } = useTranslation();

  const footerLinks = [
    { label: t('footer.websitePolicies'), href: '/policies' },
    { label: t('footer.accessibilityStatement'), href: '/accessibility' },
    { label: t('footer.terms'), href: '/terms' },
    { label: t('footer.help'), href: '/help' },
    { label: t('footer.contact'), href: '/contact' },
    { label: t('footer.feedback'), href: '/feedback' }
  ];

  return (
    <footer className="bg-navy-900 text-slate-300 border-t-2 border-saffron-500 mt-auto text-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation Links Grid */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 pb-6 border-b border-navy-700/60 font-medium">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="hover:text-saffron-500 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Center & Meta Information */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-11 text-slate-400">
          <div>
            <p className="font-semibold text-white">
              SATYAPAN • National Regulatory Verification & Decision Support System
            </p>
            <p className="mt-1">
              {t('footer.copyright')}
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1.5">
            <Link
              to="/demo/health"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono font-bold uppercase tracking-wider text-[10px] hover:bg-emerald-500/30 transition-colors cursor-pointer"
              title="Click to open Grand Finale Pre-Presentation Health Inspection"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              DEMO MODE: ACTIVE (HEALTH CHECK)
            </Link>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-saffron-500/10 text-saffron-500 border border-saffron-500/30 font-bold uppercase tracking-wider text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('prototypeNotice')}
            </span>
            <span className="tabular-nums font-mono">
              {t('lastUpdated')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
