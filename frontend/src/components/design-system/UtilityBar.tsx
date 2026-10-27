import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { Eye, Sun, Moon, Contrast, Globe } from 'lucide-react';

export const UtilityBar: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme, fontSize, setFontSize, language, setLanguage } = useTheme();

  return (
    <div className="w-full bg-navy-900 text-white text-12 font-medium border-b border-navy-700/60 select-none">
      {/* 4px National Tricolour Strip */}
      <div className="h-1 w-full flex" aria-hidden="true">
        <div className="w-1/3 bg-saffron-500" />
        <div className="w-1/3 bg-white" />
        <div className="w-1/3 bg-green-600" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Accessibility Tools */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Skip to Main Content */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:inline-block focus:bg-saffron-500 focus:text-slate-900 focus:px-3 focus:py-1 focus:rounded focus:font-bold focus:ring-2 focus:ring-white z-50"
          >
            {t('skipToMain')}
          </a>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-300">
            <Eye className="w-3.5 h-3.5 text-saffron-500" aria-hidden="true" />
            <span>{t('screenReaderAccess')}</span>
          </span>
        </div>

        {/* Right Accessibility & Localization Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
          {/* Font Scaler (A- 90%, A 100%, A+ 115%) */}
          <div className="flex items-center bg-navy-700/80 rounded px-1 py-0.5 border border-navy-500/40" role="group" aria-label="Text sizing">
            <button
              type="button"
              onClick={() => setFontSize('sm')}
              className={`px-1.5 py-0.5 rounded text-11 font-bold transition-colors cursor-pointer ${
                fontSize === 'sm' ? 'bg-saffron-500 text-slate-900' : 'text-slate-200 hover:text-white'
              }`}
              title="Small text (90%)"
              aria-pressed={fontSize === 'sm'}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize('md')}
              className={`px-1.5 py-0.5 rounded text-12 font-bold transition-colors cursor-pointer ${
                fontSize === 'md' ? 'bg-saffron-500 text-slate-900' : 'text-slate-200 hover:text-white'
              }`}
              title="Standard text (100%)"
              aria-pressed={fontSize === 'md'}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('lg')}
              className={`px-1.5 py-0.5 rounded text-12 font-bold transition-colors cursor-pointer ${
                fontSize === 'lg' ? 'bg-saffron-500 text-slate-900' : 'text-slate-200 hover:text-white'
              }`}
              title="Large text (115%)"
              aria-pressed={fontSize === 'lg'}
            >
              A+
            </button>
          </div>

          {/* Theme Selector (Light, Dark, High-Contrast) */}
          <div className="flex items-center bg-navy-700/80 rounded px-1 py-0.5 border border-navy-500/40" role="group" aria-label="Theme mode">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-1 rounded transition-colors cursor-pointer ${
                theme === 'light' ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
              title="Light Theme"
              aria-pressed={theme === 'light'}
            >
              <Sun className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="sr-only">Light Theme</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-1 rounded transition-colors cursor-pointer ${
                theme === 'dark' ? 'bg-navy-900 text-saffron-500 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
              title="Dark Theme"
              aria-pressed={theme === 'dark'}
            >
              <Moon className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="sr-only">Dark Theme</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('high-contrast')}
              className={`p-1 rounded transition-colors cursor-pointer ${
                theme === 'high-contrast' ? 'bg-black text-[#FFD600] ring-1 ring-[#FFD600]' : 'text-slate-300 hover:text-white'
              }`}
              title="High Contrast Theme (WCAG 7:1)"
              aria-pressed={theme === 'high-contrast'}
            >
              <Contrast className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="sr-only">High Contrast Theme</span>
            </button>
          </div>

          {/* Language Switcher (English | हिन्दी | मराठी) */}
          <div className="flex items-center bg-navy-700/80 rounded px-1 py-0.5 border border-navy-500/40" role="group" aria-label="Select Language">
            <Globe className="w-3.5 h-3.5 text-saffron-500 ml-1 mr-1" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded text-11 font-bold transition-colors cursor-pointer ${
                language === 'en' ? 'bg-saffron-500 text-slate-900' : 'text-slate-200 hover:text-white'
              }`}
              aria-pressed={language === 'en'}
            >
              English
            </button>
            <span className="text-slate-400">|</span>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-1.5 py-0.5 rounded text-11 font-bold transition-colors cursor-pointer ${
                language === 'hi' ? 'bg-saffron-500 text-slate-900' : 'text-slate-200 hover:text-white'
              }`}
              aria-pressed={language === 'hi'}
            >
              हिन्दी
            </button>
            <span className="text-slate-400">|</span>
            <button
              type="button"
              onClick={() => setLanguage('mr')}
              className={`px-1.5 py-0.5 rounded text-11 font-bold transition-colors cursor-pointer ${
                language === 'mr' ? 'bg-saffron-500 text-slate-900' : 'text-slate-200 hover:text-white'
              }`}
              aria-pressed={language === 'mr'}
            >
              मराठी
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
