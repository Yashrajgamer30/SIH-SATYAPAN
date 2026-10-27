import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Clock, RefreshCw, LogOut } from 'lucide-react';
import { useAuthStore } from '../../context/authStore';

export const SessionTimeoutModal: React.FC = () => {
  const { t } = useTranslation();
  const {
    isSessionExpiring,
    sessionExpiresAt,
    extendSession,
    logout,
    dismissExpiryWarning
  } = useAuthStore();

  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    if (!isSessionExpiring || !sessionExpiresAt) return;

    const updateRemaining = () => {
      const ms = sessionExpiresAt - Date.now();
      const sec = Math.max(0, Math.floor(ms / 1000));
      setRemainingSeconds(sec);
      if (sec <= 0) {
        logout();
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [isSessionExpiring, sessionExpiresAt, logout]);

  if (!isSessionExpiring) return null;

  const handleExtend = async () => {
    setIsExtending(true);
    try {
      await extendSession();
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-sm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-timeout-title"
        aria-describedby="session-timeout-desc"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-2xl p-6 overflow-hidden"
        >
          {/* Top Amber Warning Banner Accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-saffron-500 via-amber-400 to-saffron-600" />

          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 id="session-timeout-title" className="text-16 font-bold text-navy-900 dark:text-white">
                {t('login.sessionExpiringTitle')}
              </h2>
              <p id="session-timeout-desc" className="text-12 text-gov-muted mt-1 leading-relaxed">
                {t('login.sessionExpiringDesc')}
              </p>
            </div>
          </div>

          {/* Countdown Display Card */}
          <div className="my-5 p-4 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200 dark:border-navy-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-12 font-medium text-gov-muted">
              <Clock className="w-4 h-4 text-saffron-500" />
              <span>{t('login.sessionRemaining')}</span>
            </div>

            <div className="flex items-baseline gap-1 font-mono">
              <span className={`text-28 font-black tabular-nums ${
                remainingSeconds <= 15 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-navy-900 dark:text-white'
              }`}>
                {remainingSeconds}
              </span>
              <span className="text-11 text-gov-muted font-sans">sec</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => logout()}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-navy-700 text-gov-text hover:bg-slate-100 dark:hover:bg-navy-800 text-13 font-semibold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('common.logout')}</span>
            </button>

            <button
              type="button"
              onClick={handleExtend}
              disabled={isExtending}
              className="px-5 py-2.5 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white text-13 font-bold transition-all shadow-md shadow-saffron-500/20 flex items-center gap-2 active:scale-95 disabled:opacity-75"
            >
              <RefreshCw className={`w-4 h-4 ${isExtending ? 'animate-spin' : ''}`} />
              <span>{t('login.extendSession')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
