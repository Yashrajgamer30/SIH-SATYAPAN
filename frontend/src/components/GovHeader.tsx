import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  FileCheck, 
  ShieldCheck, 
  Globe, 
  Sliders, 
  Sun, 
  Moon, 
  Type, 
  UserCheck, 
  LogOut, 
  AlertCircle 
} from 'lucide-react';

interface HeaderProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  fontSize: 'sm' | 'md' | 'lg';
  onFontSizeChange: (size: 'sm' | 'md' | 'lg') => void;
}

export const GovHeader: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  highContrast,
  onToggleHighContrast,
  fontSize,
  onFontSizeChange
}) => {
  const { t, i18n } = useTranslation();

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
      {/* Top Tri-Color Strip and Accessibility Bar */}
      <div className="h-1.5 w-full flex">
        <div className="w-1/3 bg-[#FF671F]" />
        <div className="w-1/3 bg-white" />
        <div className="w-1/3 bg-[#046A38]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Emblem and Portal Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tighter border-2 border-amber-500 shadow-sm">
            AICTE
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                {t('appName')}
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                APH 2026-27
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* Right: Language, Font Scaler, High Contrast, and Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
            <button
              onClick={() => i18n.changeLanguage('en')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                i18n.language === 'en' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => i18n.changeLanguage('hi')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                i18n.language === 'hi' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => i18n.changeLanguage('mr')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                i18n.language === 'mr' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मराठी
            </button>
          </div>

          {/* Accessibility Font Size (A- A A+) */}
          <div className="hidden md:flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => onFontSizeChange('sm')}
              className={`px-1.5 py-1 rounded font-semibold ${fontSize === 'sm' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'}`}
              title="Font Small"
            >
              A-
            </button>
            <button
              onClick={() => onFontSizeChange('md')}
              className={`px-1.5 py-1 rounded font-semibold ${fontSize === 'md' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'}`}
              title="Font Standard"
            >
              A
            </button>
            <button
              onClick={() => onFontSizeChange('lg')}
              className={`px-1.5 py-1 rounded font-semibold ${fontSize === 'lg' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'}`}
              title="Font Large"
            >
              A+
            </button>
          </div>

          {/* High Contrast Toggle */}
          <button
            onClick={onToggleHighContrast}
            className={`p-1.5 rounded-md border text-xs flex items-center gap-1 font-medium ${
              highContrast ? 'bg-black text-yellow-300 border-yellow-300' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="High Contrast Accessibility"
          >
            {highContrast ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Contrast</span>
          </button>

          {/* Persona Role Switcher for Hackathon Evaluation */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="OFFICIAL_SCRUTINY">Role: Scrutiny Official</option>
              <option value="OFFICIAL_SENIOR">Role: Senior AICTE Director</option>
              <option value="INSTITUTE_ADMIN">Role: Saraswati IT Admin</option>
              <option value="SYSTEM_ADMIN">Role: System Policy Admin</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
