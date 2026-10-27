import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Lock, Mail, Eye, EyeOff, RotateCw, ShieldCheck,
  Copy, Check, AlertCircle, ArrowRight, KeyRound, Building
} from 'lucide-react';
import { useAuthStore } from '../../context/authStore';

interface LoginCardProps {
  onSuccess: (user: any) => void;
  isTransitioning?: boolean;
}

export const LoginCard: React.FC<LoginCardProps> = ({ onSuccess, isTransitioning = false }) => {
  const { t } = useTranslation();
  const { login, verifyOtp, isLoading, mfaChallenge } = useAuthStore();

  // Active Tab: 'institute' vs 'official'
  const [activeTab, setActiveTab] = useState<'institute' | 'official'>('institute');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Arithmetic Captcha State
  const [captchaNum1, setCaptchaNum1] = useState(7);
  const [captchaNum2, setCaptchaNum2] = useState(5);
  const [captchaInput, setCaptchaInput] = useState('');

  // 6-digit OTP State for Officials Step 2
  const [otpStep, setOtpStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(30);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Feedback State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessTick, setIsSuccessTick] = useState(false);
  const [copiedChip, setCopiedChip] = useState<string | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // Generate arithmetic captcha
  const refreshCaptcha = () => {
    const n1 = Math.floor(Math.random() * 8) + 2;
    const n2 = Math.floor(Math.random() * 8) + 1;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setCaptchaInput('');
  };

  useEffect(() => {
    refreshCaptcha();
  }, [activeTab]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (otpStep && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, otpTimer]);

  // Demo Accounts Data
  const demoAccounts = [
    {
      roleKey: 'login.faculty',
      role: 'Faculty',
      tab: 'institute' as const,
      email: 'faculty@demo-institute.in',
      password: 'Demo@1234',
      badgeKey: 'login.facultyDesc'
    },
    {
      roleKey: 'login.instituteAdmin',
      role: 'Institute Admin',
      tab: 'institute' as const,
      email: 'admin@demo-institute.in',
      password: 'Demo@1234',
      badgeKey: 'login.instituteAdminDesc'
    },
    {
      roleKey: 'login.scrutinyOfficer',
      role: 'Scrutiny Officer',
      tab: 'official' as const,
      email: 'scrutiny@aicte.demo',
      password: 'Demo@1234',
      badgeKey: 'login.scrutinyOfficerDesc'
    },
    {
      roleKey: 'login.seniorOfficer',
      role: 'Senior Officer',
      tab: 'official' as const,
      email: 'senior@aicte.demo',
      password: 'Demo@1234',
      badgeKey: 'login.seniorOfficerDesc'
    }
  ];

  // Auto-fill typing animation for Demo Chips
  const handleSelectDemoAccount = (acc: typeof demoAccounts[0]) => {
    setActiveTab(acc.tab);
    setOtpStep(false);
    setErrorMessage(null);

    // Fast typewriter effect into inputs
    setEmail('');
    setPassword('');
    const targetEmail = acc.email;
    const targetPw = acc.password;

    let emailIdx = 0;
    const emailInterval = setInterval(() => {
      emailIdx++;
      setEmail(targetEmail.slice(0, emailIdx));
      if (emailIdx >= targetEmail.length) {
        clearInterval(emailInterval);
        setPassword(targetPw);
        // Auto-solve arithmetic captcha for frictionless presentation
        setCaptchaInput(String(captchaNum1 + captchaNum2));
      }
    }, 15);
  };

  const handleCopyCredentials = (e: React.MouseEvent, acc: typeof demoAccounts[0]) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${acc.email} | ${acc.password}`);
    setCopiedChip(acc.role);
    setTimeout(() => setCopiedChip(null), 2000);
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. If currently in OTP Step
    if (otpStep) {
      const fullOtp = otpDigits.join('');
      if (fullOtp.length !== 6) {
        setErrorMessage('Please enter the complete 6-digit verification code.');
        setShakeTrigger((prev) => prev + 1);
        return;
      }

      try {
        const user = await verifyOtp(fullOtp);
        setIsSuccessTick(true);
        setTimeout(() => onSuccess(user), 500);
      } catch (err: any) {
        setErrorMessage(err.message || 'Verification failed. Incorrect OTP code.');
        setShakeTrigger((prev) => prev + 1);
      }
      return;
    }

    // 2. Validate Captcha
    if (parseInt(captchaInput, 10) !== captchaNum1 + captchaNum2) {
      setErrorMessage('Security calculation is incorrect. Please re-check the sum.');
      setShakeTrigger((prev) => prev + 1);
      refreshCaptcha();
      return;
    }

    // 3. Authenticate with Backend
    try {
      const result = await login(email, password);

      if (result.mfaRequired) {
        setOtpStep(true);
        setDemoOtpHint(result.demoHint || '123456');
        setOtpTimer(30);
        // Auto-focus first digit
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      } else {
        // Direct Login Success
        setIsSuccessTick(true);
        const { user } = useAuthStore.getState();
        setTimeout(() => onSuccess(user), 500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid official credentials. Access denied.');
      setShakeTrigger((prev) => prev + 1);
    }
  };

  // OTP Digits Handling
  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    // Auto-advance focus
    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
    }
  };

  const isOfficial = activeTab === 'official';
  const accentColor = isOfficial ? 'navy' : 'saffron';

  return (
    <motion.div
      animate={{
        x: shakeTrigger ? [-12, 12, -8, 8, -4, 4, 0] : 0,
        opacity: isTransitioning ? 0 : 1,
        filter: isTransitioning ? 'blur(12px)' : 'blur(0px)',
        scale: isTransitioning ? 0.94 : 1
      }}
      transition={{ duration: 0.45 }}
      className="relative w-full max-w-md rounded-2xl bg-white/70 dark:bg-navy-900/75 backdrop-blur-md border border-white/70 dark:border-navy-700/70 shadow-2xl p-6 sm:p-8 flex flex-col justify-between transition-colors"
      style={{
        boxShadow: isOfficial
          ? '0 20px 45px -12px rgba(31, 58, 147, 0.22)'
          : '0 20px 45px -12px rgba(255, 153, 51, 0.22)'
      }}
    >
      <div>
        {/* Card Header & Portal Segmented Switch */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-11 uppercase font-bold tracking-wider text-gov-muted flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${isOfficial ? 'bg-navy-700 dark:bg-navy-500' : 'bg-saffron-500'
                  }`}
              />
              {isOfficial ? t('login.officialPortal') : t('login.institutionalPortal')}
            </span>
            <span className="text-[11px] font-mono text-gov-muted bg-slate-100 dark:bg-navy-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-navy-700">
              HTTPS • AES-256
            </span>
          </div>

          {/* Segmented Toggle with Framer Motion layoutId */}
          <div className="relative grid grid-cols-2 p-1 rounded-xl bg-slate-100/90 dark:bg-navy-950/80 border border-slate-200/80 dark:border-navy-800">
            <button
              type="button"
              onClick={() => { setActiveTab('institute'); setOtpStep(false); setErrorMessage(null); }}
              className={`relative z-10 py-2 text-13 font-semibold text-center transition-colors flex items-center justify-center gap-1.5 ${!isOfficial ? 'text-navy-900 dark:text-white' : 'text-gov-muted hover:text-navy-900 dark:hover:text-white'
                }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{t('login.instituteTab')}</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('official'); setOtpStep(false); setErrorMessage(null); }}
              className={`relative z-10 py-2 text-13 font-semibold text-center transition-colors flex items-center justify-center gap-1.5 ${isOfficial ? 'text-navy-900 dark:text-white' : 'text-gov-muted hover:text-navy-900 dark:hover:text-white'
                }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('login.officialTab')}</span>
            </button>

            {/* Sliding Pill Indicator */}
            <motion.div
              layoutId="loginTabIndicator"
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
              className={`absolute inset-y-1 rounded-lg shadow-sm ${!isOfficial
                ? 'left-1 w-[calc(50%-4px)] bg-white dark:bg-navy-800 border-b-2 border-saffron-500'
                : 'left-[50%] w-[calc(50%-4px)] bg-white dark:bg-navy-800 border-b-2 border-navy-700 dark:border-navy-500'
                }`}
            />
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-12 text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!otpStep ? (
            /* STEP 1: Email + Password + Captcha */
            <motion.div
              key="step-credentials"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* User ID / Email with Floating Label */}
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  className={`peer w-full h-12 pl-10 pr-3 rounded-xl border bg-white/60 dark:bg-navy-950/50 text-gov-text text-14 outline-none transition-all placeholder-transparent focus:ring-2 ${isOfficial
                    ? 'border-slate-300 dark:border-navy-700 focus:border-navy-700 focus:ring-navy-500/20'
                    : 'border-slate-300 dark:border-navy-700 focus:border-saffron-500 focus:ring-saffron-500/20'
                    }`}
                />
                <label
                  htmlFor="login-email"
                  className="absolute left-10 -top-2.5 px-1 bg-white/90 dark:bg-navy-900 rounded text-11 font-medium text-gov-muted transition-all peer-placeholder-shown:text-14 peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-11 peer-focus:bg-white/90 dark:peer-focus:bg-navy-900"
                >
                  {t('login.emailLabel')}
                </label>
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gov-muted" />
              </div>

              {/* Password with Show/Hide Toggle */}
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  className={`peer w-full h-12 pl-10 pr-10 rounded-xl border bg-white/60 dark:bg-navy-950/50 text-gov-text text-14 outline-none transition-all placeholder-transparent focus:ring-2 ${isOfficial
                    ? 'border-slate-300 dark:border-navy-700 focus:border-navy-700 focus:ring-navy-500/20'
                    : 'border-slate-300 dark:border-navy-700 focus:border-saffron-500 focus:ring-saffron-500/20'
                    }`}
                />
                <label
                  htmlFor="login-password"
                  className="absolute left-10 -top-2.5 px-1 bg-white/90 dark:bg-navy-900 rounded text-11 font-medium text-gov-muted transition-all peer-placeholder-shown:text-14 peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-11 peer-focus:bg-white/90 dark:peer-focus:bg-navy-900"
                >
                  {t('login.passwordLabel')}
                </label>
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gov-muted" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  className="absolute right-3 top-3.5 text-gov-muted hover:text-gov-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Arithmetic Security Captcha */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-between px-3 h-11 rounded-xl bg-slate-100/80 dark:bg-navy-950/80 border border-slate-200 dark:border-navy-800 text-13 font-mono font-bold select-none text-navy-900 dark:text-slate-200">
                  <span>{captchaNum1} + {captchaNum2} = ?</span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    title={t('login.refreshCaptcha')}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-navy-800 text-gov-muted hover:text-navy-900 dark:hover:text-white transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-28">
                  <input
                    type="text"
                    required
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('login.captchaPlaceholder')}
                    className={`w-full h-11 px-3 text-center rounded-xl border bg-white/60 dark:bg-navy-950/50 text-gov-text text-14 font-mono font-bold outline-none focus:ring-2 ${isOfficial
                      ? 'border-slate-300 dark:border-navy-700 focus:border-navy-700 focus:ring-navy-500/20'
                      : 'border-slate-300 dark:border-navy-700 focus:border-saffron-500 focus:ring-saffron-500/20'
                      }`}
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-12 text-gov-muted pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-saffron-500 focus:ring-saffron-500/30"
                  />
                  <span>{t('login.rememberMe')}</span>
                </label>
                <a
                  href="#forgot-password"
                  onClick={(e) => { e.preventDefault(); alert(t('login.forgotAlert')); }}
                  className="hover:underline text-navy-700 dark:text-saffron-400 font-medium"
                >
                  {t('login.forgotPassword')}
                </a>
              </div>
            </motion.div>
          ) : (
            /* STEP 2: Officials 6-Digit MFA OTP Verification */
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 py-1"
            >
              <div className="text-center space-y-1">
                <div className="inline-flex p-2.5 rounded-full bg-navy-50 dark:bg-navy-800 text-navy-700 dark:text-saffron-400 mb-1">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-15 font-bold text-navy-900 dark:text-white">
                  {t('login.mfaTitle')}
                </h3>
                <p className="text-12 text-gov-muted">
                  {t('login.mfaDesc')} <span className="font-semibold text-navy-900 dark:text-slate-200">{email}</span>.
                </p>
              </div>

              {/* 6 OTP Input Boxes */}
              <div className="flex items-center justify-center gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-18 font-mono font-bold rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-navy-900 dark:text-white outline-none focus:border-navy-700 dark:focus:border-saffron-500 focus:ring-2 focus:ring-navy-500/20"
                  />
                ))}
              </div>

              {/* Demo OTP Hint Badge & Resend Countdown */}
              <div className="flex flex-col items-center gap-2 pt-1">
                {demoOtpHint && (
                  <button
                    type="button"
                    onClick={() => {
                      const digits = demoOtpHint.split('').slice(0, 6);
                      setOtpDigits(digits);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-11 font-mono font-semibold bg-saffron-50 text-saffron-700 dark:bg-saffron-950/60 dark:text-saffron-300 border border-saffron-300 dark:border-saffron-800 hover:bg-saffron-100 transition-colors"
                  >
                    <span>{t('login.autoFillDemoOtp')}: <strong>{demoOtpHint}</strong></span>
                  </button>
                )}

                <div className="flex items-center gap-3 text-12 text-gov-muted">
                  {otpTimer > 0 ? (
                    <span>{t('login.resendIn')} <strong className="tabular-nums font-mono">{otpTimer}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOtpTimer(30)}
                      className="text-navy-700 dark:text-saffron-400 font-semibold hover:underline"
                    >
                      {t('login.resendCode')}
                    </button>
                  )}
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="text-gov-muted hover:underline"
                  >
                    {t('login.backToCredentials')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Sign-In Button */}
          <button
            type="submit"
            disabled={isLoading || isSuccessTick}
            className={`w-full h-12 rounded-xl font-bold text-14 flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-85 ${isSuccessTick
              ? 'bg-green-600 text-white'
              : isOfficial
                ? 'bg-navy-900 hover:bg-navy-800 text-white shadow-navy-900/20'
                : 'bg-saffron-500 hover:bg-saffron-600 text-white shadow-saffron-500/25'
              }`}
          >
            {isSuccessTick ? (
              <span className="inline-flex items-center gap-2">
                <Check className="w-5 h-5 text-white animate-bounce" />
                <span>{t('login.verifiedSessionStarting')}</span>
              </span>
            ) : isLoading ? (
              <span className="inline-flex items-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>{t('login.authenticating')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span>{otpStep ? t('login.completeMfa') : isOfficial ? t('login.signInOfficial') : t('login.signInInstitute')}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Security Logging Banner */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gov-muted font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
          <span>{t('login.securityNotice')}</span>
        </div>
      </div>

      {/* Pinned Presentation Demo Accounts Panel */}
      <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-navy-700/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-11 font-bold tracking-wider text-navy-900 dark:text-slate-200 uppercase">
            {t('login.demoAccountsTitle')}
          </span>
          <span className="text-[10px] text-gov-muted font-mono">
            {t('login.syntheticCredentials')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {demoAccounts.map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => handleSelectDemoAccount(acc)}
              title={`Click to fill ${acc.email} (${t(acc.roleKey)})`}
              className="group text-left p-2 rounded-xl bg-slate-50/90 dark:bg-navy-950/70 hover:bg-white dark:hover:bg-navy-800/90 border border-slate-200/70 dark:border-navy-800 transition-all flex items-center justify-between shadow-2xs hover:shadow-xs"
            >
              <div className="overflow-hidden pr-1">
                <div className="flex items-center gap-1">
                  <span className="text-12 font-bold text-navy-900 dark:text-white truncate">
                    {t(acc.roleKey)}
                  </span>
                </div>
                <div className="text-[10px] text-gov-muted truncate font-mono">
                  {acc.email.split('@')[0]}
                </div>
              </div>

              <div
                onClick={(e) => handleCopyCredentials(e, acc)}
                title="Copy email & password to clipboard"
                className="p-1 rounded text-gov-muted hover:text-navy-900 dark:hover:text-white transition-colors"
              >
                {copiedChip === acc.role ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
