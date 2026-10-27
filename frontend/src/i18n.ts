import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export type SupportedLanguage = 'en' | 'hi' | 'mr';

const resources = {
  en: {
    translation: {
      appName: "SATYAPAN",
      productName: "SATYAPAN",
      tagline: "National AI Scrutiny & Regulatory Compliance Platform",
      govIndia: "Government of India",
      bharatSarkar: "भारत सरकार",
      aicteMinistry: "All India Council for Technical Education, Ministry of Education",
      aicteMinistryHi: "अखिल भारतीय तकनीकी शिक्षा परिषद",
      advisoryBanner: "AI result is advisory. Final regulatory decisions are strictly authorized by designated AICTE Scrutiny Officials with mandatory written remarks.",
      simulatedSource: "SIMULATED SOURCE",
      prototypeNotice: "Prototype for SIH - synthetic data only",
      lastUpdated: "Last updated: 27 October 2026",
      
      // Accessibility & Utility
      skipToMain: "Skip to main content",
      screenReaderAccess: "Screen Reader Access",
      fontSize: "Text Size",
      theme: {
        light: "Light",
        dark: "Dark",
        highContrast: "High Contrast"
      },
      
      // Navigation & Shell
      nav: {
        styleguide: "Design System & Styleguide",
        scrutinyDesk: "Scrutiny Desk",
        ruleBuilder: "Rule Configuration",
        auditTrail: "Audit Trails",
        documentation: "Guidelines"
      },
      
      // Footer Links
      footer: {
        websitePolicies: "Website Policies",
        accessibilityStatement: "Accessibility Statement",
        terms: "Terms of Use",
        help: "Help Desk",
        contact: "Contact Officials",
        feedback: "Citizen Feedback",
        copyright: "© 2026 All India Council for Technical Education (AICTE), New Delhi. All rights reserved."
      },
      
      // Verification Status Enums (Exact 6)
      verificationStatus: {
        VERIFIED: "Verified Genuine",
        MISMATCH_DETECTED: "Mismatch Detected",
        EXPIRED: "Expired Certificate",
        VERIFICATION_PENDING: "Verification Pending",
        SOURCE_UNAVAILABLE: "Source Unavailable",
        MANUAL_REVIEW_REQUIRED: "Manual Review Required"
      },

      // Application Statuses
      applicationStatus: {
        DRAFT: "Draft",
        SUBMITTED: "Submitted",
        UNDER_SCRUTINY: "Under Scrutiny",
        DEFICIENCY_COMMUNICATED: "Deficiency Communicated",
        RECOMMENDED: "Recommended for EoA",
        NOT_RECOMMENDED: "Not Recommended",
        APPROVED: "Approved",
        REJECTED: "Rejected"
      },

      // Severity Levels
      severity: {
        LOW: "Low Risk",
        MEDIUM: "Medium Deficiency",
        HIGH: "High Deficiency",
        CRITICAL: "Critical Anomaly"
      },

      // Component labels
      common: {
        search: "Search...",
        filter: "Filter",
        actions: "Actions",
        close: "Close",
        submit: "Submit",
        cancel: "Cancel",
        save: "Save",
        edit: "Edit",
        delete: "Delete",
        upload: "Upload",
        download: "Download",
        view: "View",
        loading: "Processing request...",
        status: "Status",
        date: "Date",
        remarks: "Remarks",
        officialRemarks: "Official Remarks (Mandatory)",
        requiredField: "This field is mandatory",
        logout: "Logout",
        role: "Role",
        confidence: "Confidence Score"
      },
      login: {
        institutionalPortal: "Institutional EoA Portal",
        officialPortal: "Official AICTE Scrutiny",
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
        authenticating: "Authenticating with AICTE Gateway...",
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
        scrutinyOfficerDesc: "AICTE Official MFA",
        seniorOfficer: "Senior Officer",
        seniorOfficerDesc: "Regional Director",
        validationOtpLength: "Please enter the complete 6-digit verification code.",
        validationCaptcha: "Security calculation is incorrect. Please re-check the sum.",
        sessionExpiringTitle: "Regulatory Session Expiring",
        sessionExpiringDesc: "Your active session will expire in 60 seconds due to inactivity. Extend session to continue your scrutiny review without data loss.",
        extendSession: "Extend Session",
        sessionRemaining: "Seconds remaining"
      }
    }
  },
  hi: {
    translation: {
      appName: "सत्यापन",
      productName: "सत्यापन",
      tagline: "राष्ट्रीय एआई जांच एवं विनियामक अनुपालन पोर्टल",
      govIndia: "भारत सरकार",
      bharatSarkar: "भारत सरकार",
      aicteMinistry: "अखिल भारतीय तकनीकी शिक्षा परिषद, शिक्षा मंत्रालय",
      aicteMinistryHi: "अखिल भारतीय तकनीकी शिक्षा परिषद",
      advisoryBanner: "एआई परिणाम केवल सलाहकार है। अंतिम विनियामक निर्णय केवल अधिकृत एआईसीटीई अधिकारियों द्वारा अनिवार्य लिखित टिप्पणियों के साथ लिए जाते हैं।",
      simulatedSource: "सिम्युलेटेड स्रोत",
      prototypeNotice: "एसआईएच प्रोटोटाइप - केवल सिंथेटिक डेटा",
      lastUpdated: "अंतिम अद्यतन: 27 अक्टूबर 2026",

      skipToMain: "मुख्य सामग्री पर जाएं",
      screenReaderAccess: "स्क्रीन रीडर पहुंच",
      fontSize: "पाठ आकार",
      theme: {
        light: "लाइट",
        dark: "डार्क",
        highContrast: "उच्च कंट्रास्ट"
      },

      nav: {
        styleguide: "डिज़ाइन सिस्टम और स्टाइलगाइड",
        scrutinyDesk: "जांच डेस्क",
        ruleBuilder: "नियम विन्यास",
        auditTrail: "ऑडिट ट्रेल्स",
        documentation: "दिशानिर्देश"
      },

      footer: {
        websitePolicies: "वेबसाइट नीतियां",
        accessibilityStatement: "सुलभता विवरण",
        terms: "उपयोग की शर्तें",
        help: "सहायता डेस्क",
        contact: "संपर्क अधिकारी",
        feedback: "नागरिक प्रतिक्रिया",
        copyright: "© 2026 अखिल भारतीय तकनीकी शिक्षा परिषद (एआईसीटीई), नई दिल्ली। सर्वाधिकार सुरक्षित।"
      },

      verificationStatus: {
        VERIFIED: "सत्यापित एवं प्रामाणिक",
        MISMATCH_DETECTED: "विसंगति पाई गई",
        EXPIRED: "समाप्त प्रमाणपत्र (Expired)",
        VERIFICATION_PENDING: "सत्यापन लंबित",
        SOURCE_UNAVAILABLE: "स्रोत अनुपलब्ध",
        MANUAL_REVIEW_REQUIRED: "अधिकारी समीक्षा आवश्यक"
      },

      applicationStatus: {
        DRAFT: "प्रारूप (Draft)",
        SUBMITTED: "प्रस्तुत किया गया",
        UNDER_SCRUTINY: "जांच के अधीन",
        DEFICIENCY_COMMUNICATED: "कमी सूचित की गई",
        RECOMMENDED: "मान्यता विस्तार अनुशंसित",
        NOT_RECOMMENDED: "अनुशंसित नहीं",
        APPROVED: "स्वीकृत",
        REJECTED: "अस्वीकृत"
      },

      severity: {
        LOW: "कम जोखिम",
        MEDIUM: "मध्यम कमी",
        HIGH: "उच्च कमी",
        CRITICAL: "गंभीर विसंगति"
      },

      common: {
        search: "खोजें...",
        filter: "फ़िल्टर",
        actions: "कार्य",
        close: "बंद करें",
        submit: "जमा करें",
        cancel: "रद्द करें",
        save: "सुरक्षित करें",
        edit: "संपादित करें",
        delete: "हटाएं",
        upload: "अपलोड करें",
        download: "डाउनलोड करें",
        view: "देखें",
        loading: "प्रक्रिया जारी है...",
        status: "स्थिति",
        date: "दिनांक",
        remarks: "टिप्पणी",
        officialRemarks: "आधिकारिक टिप्पणी (अनिवार्य)",
        requiredField: "यह फ़ील्ड अनिवार्य है",
        logout: "लॉगआउट",
        role: "भूमिका",
        confidence: "विश्वास स्कोर"
      },
      login: {
        institutionalPortal: "संस्थान ईओए पोर्टल",
        officialPortal: "आधिकारिक एआईसीटीई जांच",
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
        authenticating: "एआईसीटीई गेटवे से सत्यापन जारी है...",
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
        scrutinyOfficerDesc: "एआईसीटीई आधिकारिक एमएफए",
        seniorOfficer: "वरिष्ठ अधिकारी",
        seniorOfficerDesc: "क्षेत्रीय निदेशक",
        validationOtpLength: "कृपया पूरा 6-अंकीय सत्यापन कोड दर्ज करें।",
        validationCaptcha: "सुरक्षा गणना सही नहीं है। कृपया जोड़ की पुनः जांच करें।",
        sessionExpiringTitle: "नियामक सत्र समाप्त हो रहा है",
        sessionExpiringDesc: "निष्क्रियता के कारण आपका सक्रिय सत्र 60 सेकंड में समाप्त हो जाएगा। डेटा हानि के बिना समीक्षा जारी रखने के लिए सत्र बढ़ाएं।",
        extendSession: "सत्र बढ़ाएं",
        sessionRemaining: "सेकंड शेष"
      }
    }
  },
  mr: {
    translation: {
      appName: "सत्यापन",
      productName: "सत्यापन",
      tagline: "राष्ट्रीय कृत्रिम बुद्धिमत्ता तपासणी व नियामक अनुपालन पोर्टल",
      govIndia: "भारत सरकार",
      bharatSarkar: "भारत सरकार",
      aicteMinistry: "अखिल भारतीय तंत्रशिक्षण परिषद, शिक्षण मंत्रालय",
      aicteMinistryHi: "अखिल भारतीय तंत्रशिक्षण परिषद",
      advisoryBanner: "एआय निकाल केवळ सल्लागार स्वरूपाचा आहे. अंतिम निर्णय केवळ अधिकृत एआयसीटीई अधिकाऱ्यांच्या अनिवार्य लेखी शेऱ्यांसहच वैध ठरतात.",
      simulatedSource: "सिम्युलेटेड स्रोत",
      prototypeNotice: "एसआयएच प्रोटोटाइप - केवळ कृत्रिम (सिंथेटिक) डेटा",
      lastUpdated: "शेवटचे अद्यतन: 27 ऑक्टोबर 2026",

      skipToMain: "मुख्य मजकुराकडे जा",
      screenReaderAccess: "स्क्रीन रीडर सुविधा",
      fontSize: "अक्षर आकार",
      theme: {
        light: "लाइट",
        dark: "डार्क",
        highContrast: "हाय कॉन्ट्रास्ट"
      },

      nav: {
        styleguide: "डिझाइन सिस्टीम आणि स्टाइलगाइड",
        scrutinyDesk: "तपासणी कक्ष",
        ruleBuilder: "नियम व्यवस्थापन",
        auditTrail: "ऑडिट नोंदी",
        documentation: "मार्गदर्शक तत्त्वे"
      },

      footer: {
        websitePolicies: "वेबसाइट धोरणे",
        accessibilityStatement: "सुलभता विधान",
        terms: "वापराच्या अटी",
        help: "मदत कक्ष",
        contact: "संपर्क अधिकारी",
        feedback: "अभिप्राय नोंदवा",
        copyright: "© 2026 अखिल भारतीय तंत्रशिक्षण परिषद (एआयसीटीई), नवी दिल्ली. सर्व हक्क राखीव."
      },

      verificationStatus: {
        VERIFIED: "प्रमाणित वैध",
        MISMATCH_DETECTED: "विसंगती आढळली",
        EXPIRED: "मुदत संपलेले प्रमाणपत्र",
        VERIFICATION_PENDING: "पडताळणी प्रलंबित",
        SOURCE_UNAVAILABLE: "स्रोत अनुपलब्ध",
        MANUAL_REVIEW_REQUIRED: "अधिकारी पुनरावलोकन आवश्यक"
      },

      applicationStatus: {
        DRAFT: "मसुदा (Draft)",
        SUBMITTED: "सादर केले",
        UNDER_SCRUTINY: "तपासणी सुरू",
        DEFICIENCY_COMMUNICATED: "त्रुटी कळवण्यात आली",
        RECOMMENDED: "मान्यता विस्ताराची शिफारस",
        NOT_RECOMMENDED: "शिफारस नाही",
        APPROVED: "मंजूर",
        REJECTED: "नाकारले"
      },

      severity: {
        LOW: "कमी जोखीम",
        MEDIUM: "मध्यम त्रुटी",
        HIGH: "उच्च त्रुटी",
        CRITICAL: "गंभीर विसंगती"
      },

      common: {
        search: "शोधा...",
        filter: "फिल्टर",
        actions: "कृती",
        close: "बंद करा",
        submit: "सादर करा",
        cancel: "रद्द करा",
        save: "जतन करा",
        edit: "संपादित करा",
        delete: "हटवा",
        upload: "अपलोड करा",
        download: "डाउनलोड करा",
        view: "पहा",
        loading: "प्रक्रिया सुरू आहे...",
        status: "स्थिती",
        date: "दिनांक",
        remarks: "शेरा",
        officialRemarks: "अधिकृत शेरा (अनिवार्य)",
        requiredField: "हे क्षेत्र अनिवार्य आहे",
        logout: "लॉगआउट",
        role: "भूमिका",
        confidence: "विश्वास निर्देशांक"
      },
      login: {
        institutionalPortal: "संस्था ईओए पोर्टल",
        officialPortal: "अधिकृत एआयसीटीई तपासणी",
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
        authenticating: "एआयसीटीई गेटवेसह प्रमाणीकरण सुरू आहे...",
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
        scrutinyOfficerDesc: "एआयसीटीई अधिकृत एमएफए",
        seniorOfficer: "वरिष्ठ अधिकारी",
        seniorOfficerDesc: "विभागीय संचालक",
        validationOtpLength: "कृपया संपूर्ण ६-अंकी पडताळणी कोड प्रविष्ट करा.",
        validationCaptcha: "सुरक्षा गणना चुकीची आहे. कृपया बेरजेची पुनर्तपासणी करा.",
        sessionExpiringTitle: "नियामक सत्र संपुष्टात येत आहे",
        sessionExpiringDesc: "निष्क्रियतेमुळे आपले सक्रिय सत्र ६० सेकंदात संपुष्टात येईल. माहिती न गमावता तपासणी सुरू ठेवण्यासाठी सत्र वाढवा.",
        extendSession: "सत्र वाढवा",
        sessionRemaining: "सेकंद शिल्लक"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
