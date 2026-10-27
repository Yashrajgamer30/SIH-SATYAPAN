import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../context/authStore';
import { UtilityBar, GovFooter, AshokaEmblem, CommandPalette } from '../design-system';
import {
  LayoutDashboard, ListOrdered, FileText, CheckCircle, Building2,
  Gavel, ShieldCheck, BarChart3, Settings, Search, Bell, Menu,
  ChevronLeft, ChevronRight, LogOut, Lock, KeyRound
} from 'lucide-react';

interface OfficialsPortalShellProps {
  children: React.ReactNode;
  activeNav?: string;
  onNavChange?: (nav: string) => void;
  onLogout: () => void;
  onOpenCommandPalette?: () => void;
}

export const OfficialsPortalShell: React.FC<OfficialsPortalShellProps> = ({
  children,
  activeNav = 'command',
  onNavChange,
  onLogout,
  onOpenCommandPalette
}) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { id: 'command', label: 'Command Dashboard', icon: LayoutDashboard },
    { id: 'smart-queue', label: 'Smart Queue', icon: ListOrdered, badge: '6' },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'verification-centre', label: 'Verification Centre', icon: CheckCircle },
    { id: 'infra-compliance', label: 'Infra Compliance', icon: Building2 },
    { id: 'decisions', label: 'Decisions', icon: Gavel },
    { id: 'audit-security', label: 'Audit & Security', icon: ShieldCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'admin', label: 'Admin Rules', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gov-bg text-gov-text font-sans antialiased transition-colors">
      {/* 1. Global Accessibility & Utility Bar */}
      <UtilityBar />

      {/* Command Palette Modal */}
      <CommandPalette />

      {/* 2. Deeper Navy Header: 'Scrutiny Workbench' */}
      <header className="bg-navy-950 text-white border-b border-navy-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Emblem, Brand & 'Scrutiny Workbench' Label */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-navy-900 transition-colors"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <AshokaEmblem className="w-8 h-10 text-white shrink-0" />
              <div>
                <span className="text-18 font-black tracking-tight text-saffron-500 leading-none block">
                  SATYAPAN
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                  Scrutiny Workbench
                </span>
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-2 border-l border-navy-800 pl-4 ml-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-12 font-medium text-slate-300">
                Western Regional Office (WRO) • Active Scrutiny Roster
              </span>
            </div>
          </div>

          {/* Center: Global Search & Command Palette Ctrl+K */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div 
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-navy-900/90 border border-navy-700/80 hover:border-saffron-500 text-12 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors shadow-inner"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search application no, institute, or rule...</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-navy-950 border border-navy-700 text-[10px] font-mono text-slate-300">
                Ctrl+K
              </kbd>
            </div>
          </div>

          {/* Right: Security Chip, Notification Bell, Role Badge, Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Security Chip: 'Session secured | Activity logged' */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-900 text-green-400 border border-navy-700/80 text-11 font-mono font-semibold">
              <Lock className="w-3 h-3 text-green-400" />
              <span>Session secured | Activity logged</span>
            </div>

            {/* Notification Bell with count */}
            <button
              type="button"
              className="relative p-2 rounded-full text-slate-300 hover:text-white hover:bg-navy-900 transition-colors"
              title="Official alerts & SSE signals"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Role Badge */}
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-saffron-500/20 text-saffron-300 border border-saffron-500/40 text-11 font-bold uppercase tracking-wider font-mono">
              {user?.role || "OFFICIAL_SCRUTINY"}
            </span>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-navy-700 hover:border-saffron-500 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-navy-800 text-saffron-400 border border-navy-700 font-bold flex items-center justify-center text-12">
                  {(user?.name || "Dr. Arvind")[0]}
                </div>
                <div className="hidden md:block pr-1">
                  <div className="text-12 font-bold text-white leading-tight">
                    {user?.name || "Dr. Arvind Deshmukh"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Official Signer
                  </div>
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl py-2 z-50 text-13 text-white">
                  <div className="px-4 py-2 border-b border-navy-800">
                    <p className="font-bold">{user?.name || "Dr. Arvind Deshmukh"}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{user?.email || "scrutiny@aicte.demo"}</p>
                  </div>
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); alert("Opening Official Key & Audit Delegation..."); }}
                    className="w-full text-left px-4 py-2 text-slate-200 hover:bg-navy-800 transition-colors"
                  >
                    Digital Signature Key
                  </button>
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); alert("Viewing Immutable Chain Status..."); }}
                    className="w-full text-left px-4 py-2 text-slate-200 hover:bg-navy-800 transition-colors"
                  >
                    Cryptographic Audit Chain
                  </button>
                  <div className="my-1 border-t border-navy-800" />
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); onLogout(); }}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-950/40 flex items-center gap-2 font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out from Workbench</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Workspace with Responsive Left Sidebar */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 gap-6 relative">
        {/* Mobile Backdrop Overlay */}
        {!isSidebarCollapsed && (
          <div
            onClick={() => setIsSidebarCollapsed(true)}
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
            aria-hidden="true"
          />
        )}

        {/* Responsive Left Sidebar: Mobile Drawer (< lg) + Inline Collapsible (lg+) */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-0 lg:block transition-all duration-300 ${
            isSidebarCollapsed
              ? '-translate-x-full lg:translate-x-0 lg:w-16'
              : 'translate-x-0 w-72 lg:w-64'
          }`}
        >
          <div className="h-full lg:h-auto bg-white dark:bg-navy-900 rounded-none lg:rounded-2xl border-r lg:border border-slate-200/80 dark:border-navy-700/80 shadow-2xl lg:shadow-xs p-4 lg:p-3 sticky top-0 lg:top-24 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Mobile Drawer Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-navy-800 lg:hidden">
                <div className="flex items-center gap-2">
                  <AshokaEmblem className="w-6 h-8 text-navy-900 dark:text-white" />
                  <span className="font-black text-saffron-500 text-16">SATYAPAN</span>
                </div>
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1 rounded-lg text-gov-muted hover:text-navy-900 dark:hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavChange?.(item.id);
                        if (window.innerWidth < 1024) setIsSidebarCollapsed(true);
                      }}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-13 font-semibold transition-all ${
                        isActive
                          ? 'bg-navy-900 dark:bg-navy-800 text-white border-l-4 border-saffron-500 shadow-sm'
                          : 'text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-saffron-500' : ''}`} />
                      {(!isSidebarCollapsed || window.innerWidth < 1024) && (
                        <span className="truncate flex-1 text-left">{item.label}</span>
                      )}
                      {(!isSidebarCollapsed || window.innerWidth < 1024) && item.badge && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-12 font-medium text-gov-muted hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                {!isSidebarCollapsed && <span>Collapse Sidebar</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Dynamic Content Area */}
        <main className="flex-1 min-w-0 w-full">
          {children}
        </main>
      </div>

      {/* 4. Official Footer */}
      <GovFooter />
    </div>
  );
};
