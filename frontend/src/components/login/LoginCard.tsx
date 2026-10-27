import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Mail, Eye, EyeOff, RotateCw, ShieldCheck,
  Copy, Check, AlertCircle, ArrowRight, KeyRound, Building
} from 'lucide-react';
import { useAuthStore } from '../../context/authStore';
import { useTheme } from '../../context/ThemeContext';

interface LoginCardProps {
  onSuccess: (user: any) => void;
  isTransitioning?: boolean;
}

const LOGIN_STRINGS: Record<string, Record<string, string>> = {
  en: {
    officialPortal: "Official Scrutiny",
    institutionalPortal: "Institutional EoA Portal",
    instituteTab: "Institute Login",
    officialTab: "Officials Login",
    emailLabel: "User ID or Official Email",
    passwordLabel: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    captchaPlaceholder: "Result",
    refreshCaptcha: "Refresh CAPTCHA problem",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    forgotAlert: "Contact institutional policy administrator to reset regulatory credentials.",
    signInInstitute: "Sign in to Institute Desk",
    signInOfficial: "Sign in to Officials Portal",
    completeMfa: "Complete MFA Verification",
    authenticating: "Authenticating with Gateway...",
    verifiedSessionStarting: "Verified • Session Starting",
    mfaTitle: "Multi-Factor Authentication",
    mfaDesc: "Enter the 6-digit one-time authorization code generated for",
    autoFillDemoOtp: "Click to auto-fill Demo OTP",
    resendIn: "Resend code in",
    resendCode: "Resend code",
    backToCredentials: "Back to credentials",
    securityNotice: "Authorised users only. All logins and mutations are cryptographically logged.",
    demoAccountsTitle: "Demo Accounts for Presentation",
    syntheticCredentials: "Synthetic credentials",
    faculty: "Faculty",
    facultyDesc: "Academic Dossier",
    instituteAdmin: "Institute Admin",
    instituteAdminDesc: "Principal / Management",
    scrutinyOfficer: "Scrutiny Officer",
    scrutinyOfficerDesc: "Official MFA",
    seniorOfficer: "Senior Officer",
    seniorOfficerDesc: "Regional Director",
    validationOtpLength: "Please enter the complete 6-digit verification code.",
    validationCaptcha: "Security calculation is incorrect. Please re-check the sum."
  },
  hi: {
    officialPortal: "आधिकारिक जांच",
    institutionalPortal: "संस्थान ईओए पोर्टल",
    instituteTab: "संस्थान लॉगिन",
    officialTab: "अधिकारी लॉगिन",
    emailLabel: "यूज़र आईडी या आधिकारिक ईमेल",
    passwordLabel: "पासवर्ड",
    showPassword: "पासवर्ड दिखाएं",
    hidePassword: "पासवर्ड छुपाएं",
    captchaPlaceholder: "उत्तर",
    refreshCaptcha: "सुरक्षा गणना बदलें",
    rememberMe: "मुझे याद रखें",
    forgotPassword: "पासवर्ड भूल गए?",
    forgotAlert: "नियामक क्रेडेंशियल रीसेट करने के लिए संस्थागत व्यवस्थापक से संपर्क करें।",
    signInInstitute: "संस्थान डेस्क में प्रवेश करें",
    signInOfficial: "अधिकारी पोर्टल में प्रवेश करें",
    completeMfa: "एमएफए सत्यापन पूर्ण करें",
    authenticating: "गेटवे से सत्यापन जारी है...",
    verifiedSessionStarting: "सत्यापित • सत्र प्रारंभ हो रहा है",
    mfaTitle: "मल्टी-फ़ैक्टर प्रमाणीकरण",
    mfaDesc: "के लिए उत्पन्न 6-अंकीय एकमुश्त प्रमाणीकरण कोड दर्ज करें",
    autoFillDemoOtp: "डेमो ओटीपी ऑटो-फिल करें",
    resendIn: "पुनः कोड भेजें",
    resendCode: "कोड पुनः भेजें",
    backToCredentials: "क्रेडेंशियल्स पर वापस जाएं",
    securityNotice: "केवल अधिकृत उपयोगकर्ता। सभी लॉगिन और संशोधन क्रिप्टोग्राफ़िक रूप से रिकॉर्ड किए जाते हैं।",
    demoAccountsTitle: "प्रस्तुति हेतु डेमो खाते",
    syntheticCredentials: "सिंथेटिक क्रेडेंशियल्स",
    faculty: "संकाय (Faculty)",
    facultyDesc: "शैक्षणिक विवरणिका",
    instituteAdmin: "संस्थान प्रशासक",
    instituteAdminDesc: "प्राचार्य / प्रबंधन",
    scrutinyOfficer: "जांच अधिकारी",
    scrutinyOfficerDesc: "आधिकारिक एमएफए",
    seniorOfficer: "वरिष्ठ अधिकारी",
    seniorOfficerDesc: "क्षेत्रीय निदेशक",
    validationOtpLength: "कृपया पूरा 6-अंकीय सत्यापन कोड दर्ज करें।",
    validationCaptcha: "सुरक्षा गणना सही नहीं है। कृपया जोड़ की पुनः जांच करें।"
  },
  mr: {
    officialPortal: "अधिकृत तपासणी",
    institutionalPortal: "संस्था ईओए पोर्टल",
    instituteTab: "संस्था लॉगिन",
    officialTab: "अधिकारी लॉगिन",
    emailLabel: "वापरकर्ता आयडी किंवा अधिकृत ईमेल",
    passwordLabel: "पासवर्ड",
    showPassword: "पासवर्ड दाखवा",
    hidePassword: "पासवर्ड लपवा",
    captchaPlaceholder: "उत्तर",
    refreshCaptcha: "सुरक्षा गणित बदला",
    rememberMe: "माझी नोंद ठेवा",
    forgotPassword: "पासवर्ड विसरलात?",
    forgotAlert: "नियामक क्रेडेन्शियल्स रीसेट करण्यासाठी संस्थात्मक प्रशासकाशी संपर्क साधा.",
    signInInstitute: "संस्था कक्षात प्रवेश करा",
    signInOfficial: "अधिकारी पोर्टलमध्ये प्रवेश करा",
    completeMfa: "एमएफए पडताळणी पूर्ण करा",
    authenticating: "गेटवेसह प्रमाणीकरण सुरू आहे...",
    verifiedSessionStarting: "प्रमाणित • सत्र सुरू होत आहे",
    mfaTitle: "मल्टी-फॅक्टर प्रमाणीकरण",
    mfaDesc: "या खात्यासाठी निर्माण केलेला ६-अंकी पडताळणी कोड प्रविष्ट करा",
    autoFillDemoOtp: "डेमो ओटीपी ऑटो-फिल करा",
    resendIn: "पुन्हा कोड पाठवा",
    resendCode: "कोड पुन्हा पाठवा",
    backToCredentials: "माहितीवर परत जा",
    securityNotice: "केवळ अधिकृत वापरकर्त्यांसाठी. सर्व लॉगिन व बदल क्रिप्टोग्राफिकरीत्या नोंदवले जातात.",
    demoAccountsTitle: "सादरीकरणासाठी डेमो खाती",
    syntheticCredentials: "सिंथेटिक क्रेडेन्शियल्स",
    faculty: "प्राध्यापक (Faculty)",
    facultyDesc: "शैक्षणिक संचिका",
    instituteAdmin: "संस्था प्रशासक",
    instituteAdminDesc: "प्राचार्य / व्यवस्थापन",
    scrutinyOfficer: "तपासणी अधिकारी",
    scrutinyOfficerDesc: "अधिकृत एमएफए",
    seniorOfficer: "वरिष्ठ अधिकारी",
    seniorOfficerDesc: "विभागीय संचालक",
    validationOtpLength: "कृपया संपूर्ण ६-अंकी पडताळणी कोड प्रविष्ट करा.",
    validationCaptcha: "सुरक्षा गणना चुकीची आहे. कृपया बेरजेची पुनर्तपासणी करा."
  }
};

export const LoginCard: React.FC<LoginCardProps> = ({ onSuccess, isTransitioning = false }) => {
  const { language } = useTheme();
  const { login, verifyOtp, isLoading } = useAuthStore();

  const txt = (key: string): string => {
    const dict = LOGIN_STRINGS[language] || LOGIN_STRINGS.en;
    return dict[key] || LOGIN_STRINGS.en[key] || key;
  };

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
      roleKey: 'faculty',
      role: 'Faculty',
      tab: 'institute' as const,
      email: 'faculty@demo-institute.in',
      password: 'Demo@1234',
      badgeKey: 'facultyDesc'
    },
    {
      roleKey: 'instituteAdmin',
      role: 'Institute Admin',
      tab: 'institute' as const,
      email: 'admin@demo-institute.in',
      password: 'Demo@1234',
      badgeKey: 'instituteAdminDesc'
    },
    {
      roleKey: 'scrutinyOfficer',
      role: 'Scrutiny Officer',
      tab: 'official' as const,
      email: 'scrutiny@aicte.demo',
      password: 'Demo@1234',
      badgeKey: 'scrutinyOfficerDesc'
    },
    {
      roleKey: 'seniorOfficer',
      role: 'Senior Officer',
      tab: 'official' as const,
      email: 'senior@aicte.demo',
      password: 'Demo@1234',
      badgeKey: 'seniorOfficerDesc'
    }
  ];

  // Auto-fill typing animation for Demo Chips
  const handleSelectDemoAccount = (acc: typeof demoAccounts[0]) => {
    setActiveTab(acc.tab);
    setOtpStep(false);
    setErrorMessage(null);

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

    if (otpStep) {
      const fullOtp = otpDigits.join('');
      if (fullOtp.length !== 6) {
        setErrorMessage(txt('validationOtpLength'));
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

    if (parseInt(captchaInput, 10) !== captchaNum1 + captchaNum2) {
      setErrorMessage(txt('validationCaptcha'));
      setShakeTrigger((prev) => prev + 1);
      refreshCaptcha();
      return;
    }

    try {
      const result = await login(email, password);

      if (result.mfaRequired) {
        setOtpStep(true);
        setDemoOtpHint(result.demoHint || '123456');
        setOtpTimer(30);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      } else {
        setIsSuccessTick(true);
        const { user } = useAuthStore.getState();
        setTimeout(() => onSuccess(user), 500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid official credentials. Access denied.');
      setShakeTrigger((prev) => prev + 1);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

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

  return (
    <motion.div
      animate={{
        x: shakeTrigger ? [-12, 12, -8, 8, -4, 4, 0] : 0,
        opacity: isTransitioning ? 0 : 1,
        filter: isTransitioning ? 'blur(12px)' : 'blur(0px)',
        scale: isTransitioning ? 0.94 : 1
      }}
      transition={{ duration: 0.45 }}
      className={`relative w-full max-w-md rounded-2xl bg-white/90 dark:bg-navy-900/90 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between transition-all ${
        isOfficial 
          ? 'border-2 border-navy-700/60 dark:border-navy-500/80 ring-4 ring-navy-700/15 dark:ring-navy-500/25 shadow-[0_20px_50px_rgba(15,28,63,0.3)]' 
          : 'border-2 border-saffron-500/60 dark:border-saffron-500/70 ring-4 ring-saffron-500/20 dark:ring-saffron-500/25 shadow-[0_20px_50px_rgba(255,153,51,0.25)]'
      }`}
    >
      <div>
        {/* Card Header & Portal Segmented Switch */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-11 uppercase font-bold tracking-wider text-gov-muted flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${isOfficial ? 'bg-navy-700 dark:bg-navy-500' : 'bg-saffron-500'}`}
              />
              {isOfficial ? txt('officialPortal') : txt('institutionalPortal')}
            </span>
            <span className="text-[11px] font-mono text-gov-muted bg-slate-100 dark:bg-navy-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-navy-700">
              HTTPS • AES-256
            </span>
          </div>

          {/* Segmented Toggle with Framer Motion layoutId */}
          <div className="relative grid grid-cols-2 p-1 rounded-xl bg-slate-100/95 dark:bg-navy-950/90 border border-slate-200/80 dark:border-navy-800">
            <button
              type="button"
              onClick={() => { setActiveTab('institute'); setOtpStep(false); setErrorMessage(null); }}
              className={`relative z-10 py-2.5 text-13 font-bold text-center transition-colors flex items-center justify-center gap-1.5 ${
                !isOfficial ? 'text-navy-900 dark:text-white' : 'text-gov-muted hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>{txt('instituteTab')}</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('official'); setOtpStep(false); setErrorMessage(null); }}
              className={`relative z-10 py-2.5 text-13 font-bold text-center transition-colors flex items-center justify-center gap-1.5 ${
                isOfficial ? 'text-navy-900 dark:text-white' : 'text-gov-muted hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{txt('officialTab')}</span>
            </button>

            {/* Sliding Pill Indicator */}
            <motion.div
              layoutId="loginTabIndicator"
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
              className={`absolute inset-y-1 rounded-lg shadow-sm ${
                !isOfficial
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
                  className={`peer w-full h-12 pl-10 pr-3 rounded-xl border bg-white/70 dark:bg-navy-950/70 text-gov-text text-14 outline-none transition-all placeholder-transparent focus:ring-2 ${
                    isOfficial
                      ? 'border-slate-300 dark:border-navy-700 focus:border-navy-700 focus:ring-navy-500/20'
                      : 'border-slate-300 dark:border-navy-700 focus:border-saffron-500 focus:ring-saffron-500/20'
                  }`}
                />
                <label
                  htmlFor="login-email"
                  className="absolute left-10 -top-2.5 px-1 bg-white dark:bg-navy-900 rounded text-11 font-medium text-gov-muted transition-all peer-placeholder-shown:text-14 peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-11 peer-focus:bg-white dark:peer-focus:bg-navy-900"
                >
                  {txt('emailLabel')}
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
                  className={`peer w-full h-12 pl-10 pr-10 rounded-xl border bg-white/70 dark:bg-navy-950/70 text-gov-text text-14 outline-none transition-all placeholder-transparent focus:ring-2 ${
                    isOfficial
                      ? 'border-slate-300 dark:border-navy-700 focus:border-navy-700 focus:ring-navy-500/20'
                      : 'border-slate-300 dark:border-navy-700 focus:border-saffron-500 focus:ring-saffron-500/20'
                  }`}
                />
                <label
                  htmlFor="login-password"
                  className="absolute left-10 -top-2.5 px-1 bg-white dark:bg-navy-900 rounded text-11 font-medium text-gov-muted transition-all peer-placeholder-shown:text-14 peer-placeholder-shown:top-3 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-11 peer-focus:bg-white dark:peer-focus:bg-navy-900"
                >
                  {txt('passwordLabel')}
                </label>
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gov-muted" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? txt('hidePassword') : txt('showPassword')}
                  className="absolute right-3 top-3.5 text-gov-muted hover:text-gov-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Arithmetic Security Captcha */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-between px-3 h-11 rounded-xl bg-slate-100/90 dark:bg-navy-950/90 border border-slate-200 dark:border-navy-800 text-13 font-mono font-bold select-none text-navy-900 dark:text-slate-200">
                  <span>{captchaNum1} + {captchaNum2} = ?</span>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    title={txt('refreshCaptcha')}
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
                    placeholder={txt('captchaPlaceholder')}
                    className={`w-full h-11 px-3 text-center rounded-xl border bg-white/70 dark:bg-navy-950/70 text-gov-text text-14 font-mono font-bold outline-none focus:ring-2 ${
                      isOfficial
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
                  <span>{txt('rememberMe')}</span>
                </label>
                <a
                  href="#forgot-password"
                  onClick={(e) => { e.preventDefault(); alert(txt('forgotAlert')); }}
                  className="hover:underline text-navy-700 dark:text-saffron-400 font-medium"
                >
                  {txt('forgotPassword')}
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
                  {txt('mfaTitle')}
                </h3>
                <p className="text-12 text-gov-muted">
                  {txt('mfaDesc')} <span className="font-semibold text-navy-900 dark:text-slate-200">{email}</span>.
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
                    <span>{txt('autoFillDemoOtp')}: <strong>{demoOtpHint}</strong></span>
                  </button>
                )}

                <div className="flex items-center gap-3 text-12 text-gov-muted">
                  {otpTimer > 0 ? (
                    <span>{txt('resendIn')} <strong className="tabular-nums font-mono">{otpTimer}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOtpTimer(30)}
                      className="text-navy-700 dark:text-saffron-400 font-semibold hover:underline"
                    >
                      {txt('resendCode')}
                    </button>
                  )}
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="text-gov-muted hover:underline"
                  >
                    {txt('backToCredentials')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Sign-In Button */}
          <button
            type="submit"
            disabled={isLoading || isSuccessTick}
            className={`w-full h-12 rounded-xl font-bold text-14 flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-85 ${
              isSuccessTick
                ? 'bg-green-600 text-white'
                : isOfficial
                  ? 'bg-navy-900 hover:bg-navy-800 text-white shadow-navy-900/20'
                  : 'bg-saffron-500 hover:bg-saffron-600 text-white shadow-saffron-500/25'
            }`}
          >
            {isSuccessTick ? (
              <span className="inline-flex items-center gap-2">
                <Check className="w-5 h-5 text-white animate-bounce" />
                <span>{txt('verifiedSessionStarting')}</span>
              </span>
            ) : isLoading ? (
              <span className="inline-flex items-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>{txt('authenticating')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span>{otpStep ? txt('completeMfa') : isOfficial ? txt('signInOfficial') : txt('signInInstitute')}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Security Logging Banner */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gov-muted font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
          <span>{txt('securityNotice')}</span>
        </div>
      </div>

      {/* Pinned Presentation Demo Accounts Panel */}
      <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-navy-700/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-11 font-bold tracking-wider text-navy-900 dark:text-slate-200 uppercase">
            {txt('demoAccountsTitle')}
          </span>
          <span className="text-[10px] text-gov-muted font-mono">
            {txt('syntheticCredentials')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {demoAccounts.map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => handleSelectDemoAccount(acc)}
              title={`Click to fill ${acc.email} (${txt(acc.roleKey)})`}
              className="group text-left p-2 rounded-xl bg-slate-50/90 dark:bg-navy-950/70 hover:bg-white dark:hover:bg-navy-800/90 border border-slate-200/70 dark:border-navy-800 transition-all flex items-center justify-between shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div className="overflow-hidden pr-1">
                <div className="flex items-center gap-1">
                  <span className="text-12 font-bold text-navy-900 dark:text-white truncate">
                    {txt(acc.roleKey)}
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
