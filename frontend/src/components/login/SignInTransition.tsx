import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import emblemSvg from '../../assets/emblem.svg';
import { ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';

export interface SignInTransitionProps {
  isActive: boolean;
  mode?: 'login' | 'logout';
  userName?: string;
  userRole?: string;
  onPeak?: () => void;
  onComplete?: () => void;
}

export const SignInTransition: React.FC<SignInTransitionProps> = ({
  isActive,
  mode = 'login',
  userName = 'Authorized Officer',
  userRole = 'OFFICIAL_SCRUTINY',
  onPeak,
  onComplete
}) => {
  // Check system prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const [phase, setPhase] = useState<'idle' | 'emblem-center' | 'pulse-ring' | 'flash-peak' | 'shoot-forward' | 'fade-out' | 'done'>('idle');

  useEffect(() => {
    if (!isActive) {
      setPhase('idle');
      return;
    }

    if (prefersReducedMotion) {
      // 300ms cross-fade fallback
      const peakTimer = setTimeout(() => {
        onPeak?.();
      }, 150);

      const completeTimer = setTimeout(() => {
        setPhase('done');
        onComplete?.();
      }, 300);

      return () => {
        clearTimeout(peakTimer);
        clearTimeout(completeTimer);
      };
    }

    // Full cinematic choreographed sequence
    setPhase('emblem-center');

    // 1. Center emblem and expand pulse ring (350ms)
    const t1 = setTimeout(() => {
      setPhase('pulse-ring');
    }, 350);

    // 2. Build up radial flash to peak (850ms)
    const t2 = setTimeout(() => {
      setPhase('flash-peak');
      onPeak?.(); // Route change occurs at peak
    }, 850);

    // 3. Emblem shoots forward towards viewer (1150ms)
    const t3 = setTimeout(() => {
      setPhase('shoot-forward');
    }, 1150);

    // 4. Flash dissolve revealing dashboard (1450ms)
    const t4 = setTimeout(() => {
      setPhase('fade-out');
    }, 1450);

    // 5. Complete (1850ms)
    const t5 = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 1850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isActive, prefersReducedMotion, onPeak, onComplete]);

  if (!isActive || phase === 'done') return null;

  // Reduced motion: 300ms cross-fade fallback
  if (prefersReducedMotion) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-navy-950/95 transition-opacity duration-300"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <img src={emblemSvg} alt="State Emblem" className="w-16 h-20 object-contain" />
          <h2 className="text-18 font-bold text-navy-900 dark:text-white">
            {mode === 'logout' ? 'Session Terminated' : 'Identity Verified'}
          </h2>
          <p className="text-12 text-gov-muted">
            {mode === 'logout' ? 'Cryptographic tokens cleared safely.' : `Loading dashboard for ${userName}...`}
          </p>
        </div>
      </div>
    );
  }

  // Reverse transition for logout
  if (mode === 'logout') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/90 backdrop-blur-md"
        role="alert"
        aria-live="assertive"
      >
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4 text-center p-8 max-w-md rounded-2xl bg-white/10 border border-white/20 shadow-2xl backdrop-blur-lg"
        >
          <div className="p-4 rounded-full bg-saffron-500/20 text-saffron-400 border border-saffron-500/40">
            <LogOut className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-20 font-bold text-white mb-1">
              Official Session Terminated
            </h2>
            <p className="text-13 text-slate-300">
              Access token revoked from regulatory vault. Returning to secure gateway...
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Forward transition for Sign-in
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-auto select-none"
      role="status"
      aria-live="assertive"
    >
      {/* 1. Backdrop blur darkening */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'fade-out' ? 0 : 0.85 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 bg-navy-950"
      />

      {/* 2. Expanding Tricolour Pulse Rings */}
      <AnimatePresence>
        {(phase === 'pulse-ring' || phase === 'flash-peak') && (
          <>
            {/* Saffron Ring */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0.9 }}
              animate={{ scale: 2.8, opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute w-72 h-72 rounded-full border-4 border-saffron-500 pointer-events-none"
            />
            {/* White / Gold Ring */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
              className="absolute w-72 h-72 rounded-full border-2 border-white pointer-events-none"
            />
            {/* India Green Ring */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0.85 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="absolute w-72 h-72 rounded-full border-3 border-green-500 pointer-events-none"
            />
          </>
        )}
      </AnimatePresence>

      {/* 3. Radial Golden / White Flash at Peak */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{
          opacity: phase === 'flash-peak' ? 1 : phase === 'shoot-forward' ? 0.9 : phase === 'fade-out' ? 0 : 0,
          scale: phase === 'flash-peak' || phase === 'shoot-forward' ? 3.5 : 0.4
        }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle at center, rgba(255, 255, 255, 1) 0%, rgba(255, 168, 77, 0.75) 30%, rgba(19, 136, 8, 0.4) 60%, transparent 80%)'
        }}
      />

      {/* 4. Center Ashoka Emblem Shared Motion */}
      <div className="relative z-20 flex flex-col items-center">
        <motion.div
          initial={{ y: 20, scale: 0.8, opacity: 0 }}
          animate={{
            y: 0,
            scale: phase === 'shoot-forward' ? 8.5 : phase === 'flash-peak' ? 1.35 : 1.15,
            opacity: phase === 'shoot-forward' ? 0 : 1,
            filter: phase === 'shoot-forward' ? 'blur(16px)' : 'blur(0px)'
          }}
          transition={{
            scale: { duration: phase === 'shoot-forward' ? 0.45 : 0.4, ease: phase === 'shoot-forward' ? 'easeIn' : 'easeOut' },
            opacity: { duration: 0.3 }
          }}
          className="relative flex items-center justify-center"
        >
          {/* Subtle Golden Halo behind Emblem */}
          <div className="absolute -inset-8 rounded-full bg-saffron-500/30 blur-2xl animate-pulse" />

          <img
            src={emblemSvg}
            alt="State Emblem of India"
            className="w-24 h-32 sm:w-28 sm:h-36 object-contain drop-shadow-[0_10px_25px_rgba(255,153,51,0.5)]"
          />
        </motion.div>

        {/* 5. Welcome Caption & Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{
            opacity: phase === 'shoot-forward' || phase === 'fade-out' ? 0 : 1,
            y: phase === 'shoot-forward' ? -20 : 0
          }}
          transition={{ duration: 0.3 }}
          className="mt-6 flex flex-col items-center text-center space-y-2 px-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-12 font-bold uppercase tracking-wider">
              Cryptographic Identity Verified
            </span>
          </div>

          <h1 className="text-24 sm:text-28 font-extrabold text-white tracking-tight drop-shadow-md">
            Welcome to SATYAPAN
          </h1>

          <div className="flex items-center gap-2 text-13 font-medium text-slate-200">
            <span>{userName}</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded bg-saffron-500/20 text-saffron-300 font-mono text-11 border border-saffron-500/40">
              {userRole}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
