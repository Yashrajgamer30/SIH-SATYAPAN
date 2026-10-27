import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../context/authStore';
import { UtilityBar, GovFooter, AshokaEmblem } from '../design-system';
import {
  LayoutDashboard, Building, Users, GraduationCap, PlusCircle,
  FileSearch, FolderLock, DownloadCloud, Bell, HelpCircle,
  ChevronLeft, ChevronRight, LogOut, Shield, CheckCircle2, AlertCircle, Menu
} from 'lucide-react';

interface InstitutePortalShellProps {
  children: React.ReactNode;
  activeNav?: string;
  onNavChange?: (nav: string) => void;
  onLogout: () => void;
}

export const InstitutePortalShell: React.FC<InstitutePortalShellProps> = ({
  children,
  activeNav = 'dashboard',
  onNavChange,
  onLogout
}) => {
  const { t } = useTranslation();
  const { language } = useTheme();
  const { user } = useAuthStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  // Time-based and localised greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName = user?.name || "Dr. Meera Kulkarni";

    if (language === 'hi') {
      if (hour < 12) return `नमस्ते, शुभ प्रभात, ${userName}`;
      if (hour < 17) return `नमस्ते, शुभ दोपहर, ${userName}`;
      return `नमस्ते, शुभ संध्या, ${userName}`;
    }

    if (language === 'mr') {
      if (hour < 12) return `नमस्कार, शुभ सकाळ, ${userName}`;
      if (hour < 17) return `नमस्कार, शुभ दुपार, ${userName}`;
      return `नमस्कार, शुभ संध्याकाळ, ${userName}`;
    }

    // Default English
    if (hour < 12) return `Good morning, ${userName}`;
    if (hour < 17) return `Good afternoon, ${userName}`;
    return `Good evening, ${userName}`;
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Institute Profile', icon: Building },
    { id: 'faculty', label: 'Faculty', icon: Users },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'new-app', label: 'New Application', icon: PlusCircle },
    { id: 'track', label: 'Track Applications', icon: FileSearch },
    { id: 'vault', label: 'Documents Vault', icon: FolderLock },
    { id: 'reports', label: 'Reports & Downloads', icon: DownloadCloud },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notificationCount },
    { id: 'help', label: 'Sahayak Help', icon: HelpCircle }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gov-bg text-gov-text font-sans antialiased transition-colors">
      {/* 1. Global Utility Bar (Accessibility, Languages, Themes) */}
      <UtilityBar />

      {/* 2. Top Bar for Institute Portal */}
      <header className="bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Branding & Greeting */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-lg text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <AshokaEmblem className="w-8 h-10 text-navy-900 dark:text-white shrink-0" />
              <div>
                <span className="text-18 font-black tracking-tight text-saffron-500 leading-none block">
                  SATYAPAN
                </span>
                <span className="text-[10px] uppercase font-bold text-gov-muted tracking-wider">
                  Institutional Portal
                </span>
              </div>
            </div>

            <div className="hidden md:block border-l border-slate-200 dark:border-navy-700 pl-4 ml-2">
              <h1 className="text-14 sm:text-15 font-bold text-navy-900 dark:text-white leading-tight">
                {getGreeting()}
              </h1>
              <p className="text-11 text-gov-muted mt-0.5">
                <span className="text-amber-600 dark:text-amber-400 font-medium">Today for you: </span>
                2 documents expiring in 15 days, 1 deficiency awaiting reply
              </p>
            </div>
          </div>

          {/* Right: Institute ID chip, Notification Bell, Profile Menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Institute name and AICTE ID chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-12 font-medium text-navy-900 dark:text-slate-200">
              <Building className="w-3.5 h-3.5 text-saffron-500" />
              <span className="font-bold">Saraswati Institute of Technology</span>
              <span className="text-[11px] font-mono text-gov-muted">• AICTE-1-3324901</span>
            </div>

            {/* Notification Bell with count */}
            <button
              type="button"
              className="relative p-2 rounded-full text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-navy-700 hover:border-saffron-500 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-saffron-500 text-white font-bold flex items-center justify-center text-12">
                  {(user?.name || "Dr. Meera")[0]}
                </div>
                <div className="hidden lg:block pr-2">
                  <div className="text-12 font-bold text-navy-900 dark:text-white leading-tight">
                    {user?.name || "Dr. Meera Kulkarni"}
                  </div>
                  <div className="text-[10px] text-gov-muted uppercase font-mono">
                    {user?.role || "INSTITUTE_ADMIN"}
                  </div>
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-xl py-2 z-50 text-13">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-800">
                    <p className="font-bold text-navy-900 dark:text-white">{user?.name || "Dr. Meera Kulkarni"}</p>
                    <p className="text-[11px] text-gov-muted font-mono">{user?.email || "admin@demo-institute.in"}</p>
                  </div>
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); alert("Opening Profile & Regulatory Affiliation..."); }}
                    className="w-full text-left px-4 py-2 text-gov-text hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
                  >
                    Institutional Profile
                  </button>
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); alert("Opening Security & 2FA Configuration..."); }}
                    className="w-full text-left px-4 py-2 text-gov-text hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
                  >
                    Security & MFA Settings
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-navy-800" />
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); onLogout(); }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out from Portal</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Workspace with Responsive Sidebar */}
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
                          ? 'bg-saffron-500 text-white shadow-sm shadow-saffron-500/20'
                          : 'text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {(!isSidebarCollapsed || window.innerWidth < 1024) && (
                        <span className="truncate flex-1 text-left">{item.label}</span>
                      )}
                      {(!isSidebarCollapsed || window.innerWidth < 1024) && item.badge && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-white text-saffron-600' : 'bg-red-600 text-white'
                        }`}>
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
