import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import emblemSvg from '../../assets/emblem.svg';
import { FileCheck, Clock, Building2 } from 'lucide-react';

interface CounterProps {
  label: string;
  target: number;
  suffix?: string;
  icon: React.ReactNode;
}

const CountUpItem: React.FC<CounterProps> = ({ label, target, suffix = '', icon }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1600;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target]);

  return (
    <div className="flex flex-col p-3 rounded-xl bg-white/40 dark:bg-navy-900/40 backdrop-blur-xs border border-white/60 dark:border-navy-700/60 shadow-xs">
      <div className="flex items-center gap-1.5 text-xs text-gov-muted font-medium mb-1">
        <span className="text-navy-700 dark:text-saffron-500">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-24 font-bold text-navy-900 dark:text-white tabular-nums tracking-tight">
          {count.toLocaleString()}{suffix}
        </span>
      </div>
      <span className="text-[10px] text-gov-muted/80 font-mono tracking-wider mt-0.5 uppercase">
        Demo figures
      </span>
    </div>
  );
};

export const LoginLeftPanel: React.FC<{ isTransitioning?: boolean }> = ({ isTransitioning = false }) => {
  const { t, i18n } = useTranslation();
  const { language } = useTheme();

  // Multilingual Rotating Taglines
  const taglines: Record<string, string[]> = {
    en: [
      "Verified. Transparent. Trusted.",
      "Algorithmic Precision for Regulatory Integrity.",
      "Accelerating AICTE Approvals with Traceable AI."
    ],
    hi: [
      "सत्यापित. पारदर्शी. विश्वसनीय.",
      "नियामक अखंडता के लिए एल्गोरिथम सटीकता.",
      "विश्वसनीय एआई के साथ एआईसीटीई अनुमोदन में तेज़ी."
    ],
    mr: [
      "सत्यापित. पारदर्शक. विश्वासार्ह.",
      "नियामक अखंडतेसाठी अल्गोरिदम अचूकता.",
      "पारदर्शक एआयसह एआयसीटीई मंजुरी प्रक्रियेत गती."
    ]
  };

  const currentLang = (language in taglines) ? language : 'en';
  const langTaglines = taglines[currentLang];
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % langTaglines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [langTaglines.length]);

  return (
    <div className="relative flex flex-col justify-between h-full p-8 sm:p-12 lg:p-16 z-10 max-w-2xl">
      {/* Top Header Badge */}
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-12 font-semibold bg-saffron-500/10 text-saffron-700 dark:text-saffron-400 border border-saffron-500/30 backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-saffron-500 animate-pulse" />
          <span>भारत सरकार • Government of India</span>
        </span>
        <span className="text-12 font-medium text-gov-muted hidden sm:inline">
          Ministry of Education
        </span>
      </div>

      {/* Centerpiece: Floating Ashoka Lion Capital Emblem & Product Identity */}
      <div className="my-auto py-8 flex flex-col items-start">
        {/* Emblem with Floating Loop & Radial Pulse Glow */}
        <div className="relative mb-6">
          {/* Subtle Golden Radial Glow */}
          <div 
            className="absolute -inset-4 rounded-full bg-saffron-500/15 dark:bg-saffron-500/20 blur-xl animate-pulse pointer-events-none"
            style={{ animationDuration: '4s' }}
          />

          <motion.div
            animate={isTransitioning ? {} : { y: [-6, 6, -6] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <img 
              src={emblemSvg} 
              alt="State Emblem of India" 
              className="w-20 h-28 sm:w-24 sm:h-32 object-contain drop-shadow-md"
            />
          </motion.div>
        </div>

        {/* 'सत्यमेव जयते' in Noto Sans Devanagari */}
        <h2 className="text-18 font-bold font-devanagari tracking-widest text-navy-900 dark:text-slate-100 uppercase mb-2">
          सत्यमेव जयते
        </h2>

        {/* Product Name & Explanatory Tagline */}
        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-36 sm:text-44 font-extrabold tracking-tight text-navy-900 dark:text-white">
              AICTE <span className="text-saffron-500">SATYAPAN</span>
            </h1>
            <span className="text-10 font-bold px-2 py-0.5 rounded bg-navy-900 text-white dark:bg-saffron-500 dark:text-navy-900 uppercase tracking-widest">
              v2.0
            </span>
          </div>

          <p className="text-16 font-medium text-navy-700 dark:text-slate-300">
            AI-assisted validation for AICTE approvals
          </p>
        </div>

        {/* Rotating Tagline (Every 4s) with Framer Motion slide */}
        <div className="h-8 overflow-hidden relative w-full mb-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${currentLang}-${taglineIndex}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="text-16 sm:text-18 font-semibold text-saffron-600 dark:text-saffron-400 italic"
            >
              {langTaglines[taglineIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Regulatory Governance Note */}
        <div className="p-3.5 rounded-lg border-l-4 border-saffron-500 bg-saffron-50/70 dark:bg-saffron-500/10 text-12 text-gov-muted max-w-lg leading-relaxed">
          <span className="font-semibold text-navy-900 dark:text-slate-200">Mandated Notice: </span>
          All algorithmic extraction, tamper detection, and cross-verification results are strictly advisory support for designated AICTE Scrutiny Officials.
        </div>
      </div>

      {/* Bottom 3 Animated Metric Counters (Demo Figures) */}
      <div className="grid grid-cols-3 gap-3 w-full pt-4 border-t border-slate-200/60 dark:border-navy-700/60">
        <CountUpItem 
          label="Documents Scanned" 
          target={12480} 
          suffix="+"
          icon={<FileCheck className="w-3.5 h-3.5" />}
        />
        <CountUpItem 
          label="Review Time Saved" 
          target={78} 
          suffix="%"
          icon={<Clock className="w-3.5 h-3.5" />}
        />
        <CountUpItem 
          label="Institutes Onboarded" 
          target={2400} 
          suffix="+"
          icon={<Building2 className="w-3.5 h-3.5" />}
        />
      </div>
    </div>
  );
};
