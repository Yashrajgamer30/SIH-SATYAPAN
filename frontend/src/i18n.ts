import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export type SupportedLanguage = 'en' | 'hi' | 'mr';

const resources = {
  en: {
    translation: {
      appName: "AICTE SATYAPAN",
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
      }
    }
  },
  hi: {
    translation: {
      appName: "एआईसीटीई सत्यापन",
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
      }
    }
  },
  mr: {
    translation: {
      appName: "एआयसीटीई सत्यापन",
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
