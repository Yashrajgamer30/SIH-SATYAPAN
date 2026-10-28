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

function getInitials(name: string): string {
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'AD';
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
      <header className="bg-[#0B1F4B] text-white border-b border-navy-800 sticky top-0 z-40 shadow-sm h-[68px] flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 whitespace-nowrap">
          {/* Left: [menu] [emblem] [SATYAPAN / Scrutiny Workbench on two clean lines] */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors shrink-0"
              title="Toggle sidebar"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>

            <div className="flex items-center gap-2.5 shrink-0">
              <AshokaEmblem className="h-10 w-auto text-white shrink-0 opacity-100" />
              <div className="flex flex-col justify-center leading-none">
                <span className="text-18 font-black tracking-tight text-white leading-tight block">
                  SATYAPAN
                </span>
                <span className="text-[10px] uppercase font-bold text-navy-50/80 tracking-wider leading-tight">
                  Scrutiny Workbench
                </span>
              </div>
            </div>

            {/* Office Chip: 'Western Regional Office (WRO)', truncates */}
            <div
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.12] border border-white/25 text-white text-12 font-medium shrink-0 max-w-[240px]"
              title="Western Regional Office (WRO) • Active Scrutiny Roster"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 animate-pulse" />
              <span className="truncate">Western Regional Office (WRO)</span>
            </div>
          </div>

          {/* Center: Search Box - flex-1, min 260px, max 420px, Ctrl+K hint */}
          <div className="hidden md:flex items-center flex-1 min-w-[260px] max-w-[420px] mx-2">
            <div 
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-white/[0.12] border border-white/25 hover:border-white/50 text-white text-13 cursor-pointer transition-colors shadow-inner"
              title="Search application no., institute or rule (Ctrl+K)"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                <Search className="w-4 h-4 text-white/80 shrink-0" />
                <span className="truncate text-white/90 text-12">
                  Search application no., institute or rule
                </span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-white/20 border border-white/30 text-[10px] font-medium text-white shrink-0">
                Ctrl+K
              </kbd>
            </div>
          </div>

          {/* Search Icon button for smaller viewports (< md) */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="md:hidden p-2 rounded-lg bg-white/[0.12] border border-white/25 text-white hover:bg-white/20 transition-colors shrink-0"
            title="Search application no., institute or rule (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-white" />
          </button>

          {/* Right: Session secured chip | Bell with count | Role badge | Profile chip */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Session secured chip, compact: lock icon + 'Secured · Logged', full tooltip */}
            <div 
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.12] border border-white/25 text-white text-11 font-medium shrink-0 cursor-default"
              title="Session secured | Activity logged"
            >
              <Lock className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span>Secured · Logged</span>
            </div>

            {/* Bell with notification count */}
            <button
              type="button"
              className="relative p-2 rounded-full text-white hover:bg-white/10 transition-colors shrink-0"
              title="Official alerts & SSE signals"
              aria-label="Official alerts"
            >
              <Bell className="w-5 h-5 text-white" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Role Badge: human label 'Scrutiny Officer' */}
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-white/[0.12] text-white border border-white/25 text-11 font-semibold uppercase tracking-wider shrink-0">
              {user?.role === 'OFFICIAL_DIRECTOR' ? 'Regional Director' : 'Scrutiny Officer'}
            </span>

            {/* Profile Chip: avatar, name, designation, truncated */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-white/[0.12] border border-white/25 hover:border-white/50 transition-all text-left max-w-[190px]"
                title={`${user?.name || "Dr. Arvind Deshmukh"} • Official Signer`}
              >
                <div className="w-8 h-8 rounded-full bg-white/20 text-white font-bold flex items-center justify-center text-12 aspect-square shrink-0 select-none">
                  {getInitials(user?.name || "Dr. Arvind Deshmukh")}
                </div>
                <div className="hidden md:block min-w-0 pr-1">
                  <div className="text-12 font-bold text-white leading-tight truncate">
                    {user?.name || "Dr. Arvind Deshmukh"}
                  </div>
                  <div className="text-[10px] text-navy-50/70 leading-tight truncate">
                    Official Signer
                  </div>
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl py-2 z-50 text-13 text-white">
                  <div className="px-4 py-2 border-b border-navy-800">
                    <p className="font-bold truncate">{user?.name || "Dr. Arvind Deshmukh"}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email || "scrutiny@aicte.demo"}</p>
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
                      className={`w-full h-[44px] flex items-center gap-3 px-3 transition-all ${
                        isActive
                          ? 'bg-navy-900/90 dark:bg-navy-800 text-white border-l-4 border-saffron-500 rounded-r-xl rounded-l-none font-medium shadow-xs'
                          : 'text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800/60 rounded-xl font-medium'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-saffron-500' : ''}`} />
                      {(!isSidebarCollapsed || window.innerWidth < 1024) && (
                        <span className="truncate flex-1 text-left text-[15px]">{item.label}</span>
                      )}
                      {(!isSidebarCollapsed || window.innerWidth < 1024) && item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white">
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
