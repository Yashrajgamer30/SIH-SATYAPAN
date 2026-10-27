import React from 'react';
import { useTranslation } from 'react-i18next';
import { AshokaEmblem } from './Emblem';
import { NotificationBell } from './NotificationBell';
import { Avatar } from './Avatar';
import { Search, LogOut, Shield } from 'lucide-react';

export interface MainHeaderProps {
  userRole?: string;
  userName?: string;
  instituteName?: string;
  onLogout?: () => void;
  onRoleSwitch?: (role: string) => void;
  onOpenCommandPalette?: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  userRole = "OFFICIAL_SCRUTINY",
  userName = "Dr. Arvind Deshmukh",
  instituteName = "Western Regional Office, AICTE",
  onLogout,
  onRoleSwitch,
  onOpenCommandPalette
}) => {
  const { t } = useTranslation();

  return (
    <header className="bg-gov-surface border-b border-gov-border shadow-xs sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Left: Emblem, Official Ministry Line, and SATYAPAN Branding */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-navy-900 dark:text-white flex-shrink-0">
            <AshokaEmblem className="w-9 h-11 sm:w-11 sm:h-13" />
          </div>

          <div className="border-l border-gov-border pl-3 sm:pl-4">
            <div className="text-[10px] sm:text-12 font-bold text-gov-muted uppercase tracking-wider leading-tight">
              {t('bharatSarkar')} | {t('govIndia')}
            </div>
            <div className="text-[10px] sm:text-11 font-semibold text-gov-text leading-tight mt-0.5 line-clamp-1">
              {t('aicteMinistryHi')} | {t('aicteMinistry')}
            </div>

            {/* Product Name with Saffron Underline */}
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-16 sm:text-20 font-black tracking-tight text-navy-900 dark:text-white leading-none relative">
                {t('productName')}
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-saffron-500 rounded-full" />
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-navy-50 text-navy-700 dark:bg-navy-900 dark:text-saffron-500 rounded border border-navy-500/20 uppercase tracking-wider font-mono">
                APH 2026-27
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Search Ctrl+K, Notification Bell, User Chip */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {/* Command Palette Trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-gov-subtle border border-gov-border text-12 text-gov-muted hover:text-gov-text hover:border-navy-500 transition-colors cursor-pointer"
            title="Press Ctrl+K to search"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search portal...</span>
            <kbd className="px-1 py-0.2 bg-gov-surface border border-gov-border rounded text-[10px] font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* User Profile Chip */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gov-border">
            <Avatar name={userName} size="sm" status="online" />
            <div className="hidden lg:block text-left">
              <p className="text-12 font-bold text-gov-text leading-tight">
                {userName}
              </p>
              <p className="text-[11px] text-gov-muted leading-tight truncate max-w-[150px]">
                {instituteName}
              </p>
            </div>

            {/* Role Switcher Pill */}
            {onRoleSwitch && (
              <select
                value={userRole}
                onChange={(e) => onRoleSwitch(e.target.value)}
                aria-label="Switch Persona Role"
                className="text-11 font-bold bg-navy-50 text-navy-900 dark:bg-navy-900 dark:text-saffron-500 border border-navy-500/30 rounded px-2 py-1 outline-none cursor-pointer"
              >
                <option value="OFFICIAL_SCRUTINY">Role: Scrutiny Officer</option>
                <option value="OFFICIAL_SENIOR">Role: Senior AICTE Director</option>
                <option value="INSTITUTE_ADMIN">Role: Institute Principal</option>
                <option value="SYSTEM_ADMIN">Role: Policy Administrator</option>
              </select>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded hover:bg-danger-50 text-gov-muted hover:text-danger transition-colors cursor-pointer"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
