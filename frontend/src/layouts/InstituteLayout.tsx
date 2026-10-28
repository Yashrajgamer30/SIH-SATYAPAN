import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../context/authStore';
import { UtilityBar, GovFooter, AshokaEmblem } from '../components/design-system';
import { PageContainer } from '../components/layout/PageContainer';
import { BreadcrumbItem } from '../components/design-system/Breadcrumb';
import {
  LayoutDashboard, Building, Users, GraduationCap, PlusCircle,
  FileSearch, FolderLock, DownloadCloud, Bell, HelpCircle,
  ChevronLeft, ChevronRight, LogOut, Menu
} from 'lucide-react';

interface RouteMeta {
  title: string;
  subtitle: string;
  breadcrumbs: BreadcrumbItem[];
}

function getInstituteRouteMeta(pathname: string): RouteMeta {
  if (pathname.includes('/institute/profile')) {
    return {
      title: 'Institute Profile & Accreditation',
      subtitle: 'Statutory institutional details, land ownership, and AICTE approval history',
      breadcrumbs: [
        { label: 'Portal', href: '/institute/dashboard' },
        { label: 'Profile' }
      ]
    };
  }
  if (pathname.includes('/institute/faculty')) {
    return {
      title: 'Faculty Register',
      subtitle: 'Faculty appointments, Cadre distribution (1:2:6), and Aadhaar-seeded records',
      breadcrumbs: [
        { label: 'Portal', href: '/institute/dashboard' },
        { label: 'Faculty' }
      ]
    };
  }
  if (pathname.includes('/institute/students')) {
    return {
      title: 'Student Enrollment Records',
      subtitle: 'Approved intake capacity, student registers, and APAAR ID synchronisation',
      breadcrumbs: [
        { label: 'Portal', href: '/institute/dashboard' },
        { label: 'Students' }
      ]
    };
  }
  if (pathname.includes('/institute/new-app') || pathname.includes('/institute/new-application')) {
    return {
      title: 'New Regulatory Application',
      subtitle: 'Step-by-step regulatory submission wizard for Extension of Approval (EOA) 2026-27',
      breadcrumbs: [
        { label: 'Portal', href: '/institute/dashboard' },
        { label: 'New Application' }
      ]
    };
  }
  if (pathname.includes('/institute/track')) {
    return {
      title: 'Track Application Status',
      subtitle: 'Real-time scrutiny milestones, deficiency requests, and virtual hearing status',
      breadcrumbs: [
        { label: 'Portal', href: '/institute/dashboard' },
        { label: 'Track Applications' }
      ]
    };
  }
  if (pathname.includes('/institute/documents') || pathname.includes('/institute/vault')) {
    return {
      title: 'Encrypted Documents Vault',
      subtitle: 'AES-256 encrypted regulatory certificates, Fire NOCs, and land extracts',
      breadcrumbs: [
        { label: 'Portal', href: '/institute/dashboard' },
        { label: 'Document Vault' }
      ]
    };
  }
  if (pathname.includes('/institute/reports')) {
    return {
      title: 'Reports & Downloads',
      subtitle: 'Download signed application dossiers, deficiency checklists, and compliance certificates',
      breadcrumbs: [
        { label: 'Portal', href: '/institute/dashboard' },
        { label: 'Reports' }
      ]
    };
  }
  if (pathname.includes('/institute/notifications')) {
    return {
      title: 'Statutory Notifications',
      subtitle: 'Official AICTE communications, hearing notices, and compliance alerts',
      breadcrumbs: [
        { label: 'Portal', href: '/institute/dashboard' },
        { label: 'Notifications' }
      ]
    };
  }
  if (pathname.includes('/institute/help')) {
    return {
      title: 'Sahayak AI Regulatory Helpdesk',
      subtitle: 'Automated guidance on AICTE Approval Process Handbook (APH 2026-27) norms',
      breadcrumbs: [
        { label: 'Portal', href: '/institute/dashboard' },
        { label: 'Sahayak Help' }
      ]
    };
  }
  return {
    title: 'Institute Dashboard',
    subtitle: 'Technical Institute Regulatory Self-Service Portal (AICTE APH 2026-27)',
    breadcrumbs: [
      { label: 'Portal', href: '/institute/dashboard' },
      { label: 'Dashboard' }
    ]
  };
}

export const InstituteLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useTheme();
  const { user, logout } = useAuthStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', path: '/institute/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', path: '/institute/profile', label: 'Institute Profile', icon: Building },
    { id: 'faculty', path: '/institute/faculty', label: 'Faculty', icon: Users },
    { id: 'students', path: '/institute/students', label: 'Students', icon: GraduationCap },
    { id: 'new-app', path: '/institute/new-application', label: 'New Application', icon: PlusCircle },
    { id: 'track', path: '/institute/track', label: 'Track Applications', icon: FileSearch },
    { id: 'vault', path: '/institute/documents', label: 'Documents Vault', icon: FolderLock },
    { id: 'reports', path: '/institute/reports', label: 'Reports & Downloads', icon: DownloadCloud },
    { id: 'notifications', path: '/institute/notifications', label: 'Notifications', icon: Bell, badge: '3' },
    { id: 'help', path: '/institute/help', label: 'Sahayak Help', icon: HelpCircle }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const meta = getInstituteRouteMeta(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-gov-bg text-gov-text font-sans antialiased transition-colors">
      {/* 1. Global Utility Bar */}
      <UtilityBar />

      {/* 2. Top Header */}
      <header className="h-[68px] bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4 whitespace-nowrap">
          {/* Left: Branding */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-lg text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/institute/dashboard" className="flex items-center gap-2.5">
              <AshokaEmblem className="w-8 h-10 text-navy-900 dark:text-white shrink-0" />
              <div>
                <span className="text-18 font-black tracking-tight text-saffron-500 leading-none block">
                  SATYAPAN
                </span>
                <span className="text-[10px] uppercase font-bold text-gov-muted tracking-wider leading-none">
                  AICTE Institute Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-saffron-500 text-white font-bold text-13 flex items-center justify-center shadow-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'MK'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-13 font-bold text-gov-text leading-tight">
                    {user?.name || 'Dr. Meera Kulkarni'}
                  </div>
                  <div className="text-[11px] text-gov-muted leading-tight">
                    AICTE Permanent ID: 1-3324901
                  </div>
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-2xl py-2 z-50 text-13">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-800">
                    <p className="font-bold text-gov-text truncate">{user?.name || 'Dr. Meera Kulkarni'}</p>
                    <p className="text-[11px] text-gov-muted truncate">Saraswati Institute of Technology</p>
                  </div>
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Workspace */}
      <div className="flex-1 flex max-w-[1440px] mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 gap-6 relative">
        {/* Mobile Backdrop Overlay */}
        {!isSidebarCollapsed && (
          <div
            onClick={() => setIsSidebarCollapsed(true)}
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-0 lg:block transition-all duration-300 ${
            isSidebarCollapsed
              ? '-translate-x-full lg:translate-x-0 lg:w-16'
              : 'translate-x-0 w-72 lg:w-64'
          }`}
        >
          <div className="h-full lg:h-auto bg-white dark:bg-navy-900 rounded-none lg:rounded-2xl border-r lg:border border-slate-200/80 dark:border-navy-700/80 shadow-2xl lg:shadow-xs p-4 lg:p-3 sticky top-0 lg:top-24 flex flex-col justify-between overflow-y-auto">
            <div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/institute/dashboard' && location.pathname.startsWith(item.path));

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.path);
                        if (window.innerWidth < 1024) setIsSidebarCollapsed(true);
                      }}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`w-full h-[44px] flex items-center gap-3 px-3 transition-all ${
                        isActive
                          ? 'bg-saffron-50 dark:bg-navy-800 text-saffron-600 dark:text-saffron-400 border-l-4 border-saffron-500 rounded-r-xl rounded-l-none font-bold'
                          : 'text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800/60 rounded-xl font-medium'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-saffron-500' : ''}`} />
                      {(!isSidebarCollapsed || window.innerWidth < 1024) && (
                        <span className="truncate flex-1 text-left text-[14px]">{item.label}</span>
                      )}
                      {(!isSidebarCollapsed || window.innerWidth < 1024) && item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-saffron-500 text-white">
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

        {/* Dynamic Content Area with PageContainer contract */}
        <main className="flex-1 min-w-0 w-full">
          <PageContainer
            title={meta.title}
            subtitle={meta.subtitle}
            breadcrumbs={meta.breadcrumbs}
          >
            {children || <Outlet />}
          </PageContainer>
        </main>
      </div>

      {/* 4. Footer */}
      <GovFooter />
    </div>
  );
};

export default InstituteLayout;
