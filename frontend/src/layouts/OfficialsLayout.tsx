import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../context/authStore';
import { UtilityBar, GovFooter, AshokaEmblem, CommandPalette } from '../components/design-system';
import { PageContainer } from '../components/layout/PageContainer';
import { BreadcrumbItem } from '../components/design-system/Breadcrumb';
import {
  LayoutDashboard, ListOrdered, FileText, CheckCircle, Building2,
  Gavel, ShieldCheck, BarChart3, Settings, Search, Bell, Menu,
  ChevronLeft, ChevronRight, LogOut, ExternalLink
} from 'lucide-react';

interface RouteMeta {
  title: string;
  subtitle: string;
  breadcrumbs: BreadcrumbItem[];
}

function getRouteMeta(pathname: string): RouteMeta {
  if (pathname.includes('/official/admin/rules')) {
    return {
      title: 'Admin Rules and Checklists',
      subtitle: 'Regulatory APH rule engine, validation thresholds, and immutable versioning',
      breadcrumbs: [
        { label: 'Admin', href: '/official/admin/rules' },
        { label: 'Rules and Checklists' }
      ]
    };
  }
  if (pathname.includes('/official/smart-queue')) {
    return {
      title: 'Smart Scrutiny Queue',
      subtitle: 'Prioritized institutional approval queue based on automated risk scoring',
      breadcrumbs: [
        { label: 'Workbench', href: '/official/dashboard' },
        { label: 'Smart Queue' }
      ]
    };
  }
  if (pathname.includes('/official/verification-centre')) {
    return {
      title: 'Verification Centre',
      subtitle: 'Multi-registry corroboration and automated forensic cross-checks',
      breadcrumbs: [
        { label: 'Workbench', href: '/official/dashboard' },
        { label: 'Verification Centre' }
      ]
    };
  }
  if (pathname.includes('/official/infra-compliance')) {
    return {
      title: 'Infra Compliance',
      subtitle: 'Built-up instructional and administrative carpet area checks',
      breadcrumbs: [
        { label: 'Workbench', href: '/official/dashboard' },
        { label: 'Infra Compliance' }
      ]
    };
  }
  if (pathname.includes('/official/decisions')) {
    return {
      title: 'Decisions & Approvals',
      subtitle: 'Executive regulatory decisions, deficiency letters, and EOA dispatch',
      breadcrumbs: [
        { label: 'Workbench', href: '/official/dashboard' },
        { label: 'Decisions' }
      ]
    };
  }
  if (pathname.includes('/official/audit-security')) {
    return {
      title: 'Audit & Cryptographic Security',
      subtitle: 'SHA-256 hash-chained immutable audit log of official regulatory scrutiny',
      breadcrumbs: [
        { label: 'Workbench', href: '/official/dashboard' },
        { label: 'Audit & Security' }
      ]
    };
  }
  if (pathname.includes('/official/analytics')) {
    return {
      title: 'Regional Analytics & Reporting',
      subtitle: 'National and regional technical approval trends and compliance metrics',
      breadcrumbs: [
        { label: 'Workbench', href: '/official/dashboard' },
        { label: 'Analytics' }
      ]
    };
  }
  if (pathname.includes('/official/applications/')) {
    return {
      title: 'Application Scrutiny Dossier',
      subtitle: 'Detailed documentary findings, evidence overlays, and regulatory sign-off',
      breadcrumbs: [
        { label: 'Workbench', href: '/official/dashboard' },
        { label: 'Applications', href: '/official/applications' },
        { label: 'Dossier' }
      ]
    };
  }
  if (pathname.includes('/official/applications')) {
    return {
      title: 'Institutional Applications',
      subtitle: 'All technical institution approval submissions for academic cycle 2026-27',
      breadcrumbs: [
        { label: 'Workbench', href: '/official/dashboard' },
        { label: 'Applications' }
      ]
    };
  }
  // Default Dashboard
  return {
    title: 'Command Dashboard',
    subtitle: 'National AICTE Institutional Approval & Scrutiny Workbench',
    breadcrumbs: [
      { label: 'Workbench', href: '/official/dashboard' },
      { label: 'Command Dashboard' }
    ]
  };
}

export const OfficialsLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { id: 'command', path: '/official/dashboard', label: 'Command Dashboard', icon: LayoutDashboard },
    { id: 'smart-queue', path: '/official/smart-queue', label: 'Smart Queue', icon: ListOrdered, badge: '6' },
    { id: 'applications', path: '/official/applications', label: 'Applications', icon: FileText },
    { id: 'verification-centre', path: '/official/verification-centre', label: 'Verification Centre', icon: CheckCircle },
    { id: 'infra-compliance', path: '/official/infra-compliance', label: 'Infra Compliance', icon: Building2 },
    { id: 'decisions', path: '/official/decisions', label: 'Decisions', icon: Gavel },
    { id: 'audit-security', path: '/official/audit-security', label: 'Audit & Security', icon: ShieldCheck },
    { id: 'analytics', path: '/official/analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'admin', path: '/official/admin/rules', label: 'Admin Rules', icon: Settings }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const meta = getRouteMeta(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-gov-bg text-gov-text font-sans antialiased transition-colors">
      {/* 1. Global Accessibility & Utility Bar */}
      <UtilityBar />

      {/* Command Palette Modal */}
      <CommandPalette />

      {/* 2. Deeper Navy Header: 'Scrutiny Workbench' */}
      <header className="bg-[#0B1F4B] text-white border-b border-navy-800 sticky top-0 z-40 shadow-sm h-[68px] flex items-center">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 whitespace-nowrap">
          {/* Left: [menu] [emblem] [SATYAPAN / Scrutiny Workbench] */}
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

            <Link to="/official/dashboard" className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity">
              <AshokaEmblem className="h-10 w-auto text-white shrink-0 opacity-100" />
              <div className="flex flex-col justify-center leading-none">
                <span className="text-18 font-black tracking-tight text-white leading-tight block">
                  SATYAPAN
                </span>
                <span className="text-[10px] uppercase font-bold text-navy-50/80 tracking-wider leading-tight">
                  Scrutiny Workbench
                </span>
              </div>
            </Link>

            {/* Office Chip: 'Western Regional Office (WRO)' */}
            <div
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.12] border border-white/25 text-white text-12 font-medium shrink-0 max-w-[240px]"
              title="Western Regional Office (WRO) • Active Scrutiny Roster"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 animate-pulse" />
              <span className="truncate">Western Regional Office (WRO)</span>
            </div>
          </div>

          {/* Center: Search & Command Palette shortcut */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
              className="w-full h-10 px-3.5 rounded-xl bg-white/[0.10] border border-white/20 text-white/90 text-13 flex items-center justify-between cursor-pointer hover:bg-white/[0.15] transition-colors"
            >
              <div className="flex items-center gap-2 text-white/70">
                <Search className="w-4 h-4" />
                <span className="text-12">Search applications, institutions, rules...</span>
              </div>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono text-white">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Right: Quick actions, notifications, user profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-navy-900" />
            </button>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-saffron-500 text-white font-bold text-13 flex items-center justify-center shadow-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-13 font-bold text-white leading-tight">
                    {user?.name || 'Dr. Arvind Deshmukh'}
                  </div>
                  <div className="text-[11px] text-navy-50/70 leading-tight">
                    Senior Scrutiny Officer
                  </div>
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl py-2 z-50 text-13 text-white">
                  <div className="px-4 py-2 border-b border-navy-800">
                    <p className="font-bold truncate">{user?.name || 'Dr. Arvind Deshmukh'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email || 'scrutiny@aicte.demo'}</p>
                  </div>
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); alert('Digital Signature Key verified under IT Act 2000.'); }}
                    className="w-full text-left px-4 py-2 text-slate-200 hover:bg-navy-800 transition-colors"
                  >
                    Digital Signature Key
                  </button>
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); alert('Chained SHA-256 ledger integrity verified.'); }}
                    className="w-full text-left px-4 py-2 text-slate-200 hover:bg-navy-800 transition-colors"
                  >
                    Cryptographic Audit Chain
                  </button>
                  <div className="my-1 border-t border-navy-800" />
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }}
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

      {/* 3. Main Workspace with Sidebar & PageContainer */}
      <div className="flex-1 flex max-w-[1440px] mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 gap-6 relative">
        {/* Mobile Backdrop Overlay */}
        {!isSidebarCollapsed && (
          <div
            onClick={() => setIsSidebarCollapsed(true)}
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
            aria-hidden="true"
          />
        )}

        {/* Responsive Left Sidebar */}
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
                  const isActive = location.pathname === item.path || 
                    (item.path !== '/official/dashboard' && location.pathname.startsWith(item.path));

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
                          ? 'bg-navy-900/90 dark:bg-navy-800 text-white border-l-4 border-saffron-500 rounded-r-xl rounded-l-none font-medium shadow-xs'
                          : 'text-gov-muted hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800/60 rounded-xl font-medium'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-saffron-500' : ''}`} />
                      {(!isSidebarCollapsed || window.innerWidth < 1024) && (
                        <span className="truncate flex-1 text-left text-[14px]">{item.label}</span>
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

      {/* 4. Official Footer */}
      <GovFooter />
    </div>
  );
};

export default OfficialsLayout;
