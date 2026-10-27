import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { 
  ToastProvider, 
  UtilityBar, 
  MainHeader, 
  GovFooter, 
  CommandPalette,
  Breadcrumb
} from './components/design-system';
import { Styleguide } from './pages/Styleguide';
import { Dashboard } from './pages/Dashboard';
import { ScrutinyDetail } from './pages/ScrutinyDetail';
import { AdminRuleBuilder } from './pages/AdminRuleBuilder';
import { Layout, FileText, Sliders, Shield } from 'lucide-react';

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const [currentRole, setCurrentRole] = useState<string>('OFFICIAL_SCRUTINY');
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Synchronize hash for instant tab switching
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#styleguide') {
        navigate('/styleguide');
      } else if (hash === '#rules') {
        navigate('/');
        setSelectedAppId(null);
      } else if (hash === '#app-1') {
        navigate('/');
        setSelectedAppId(1);
      } else if (hash === '#app-2') {
        navigate('/');
        setSelectedAppId(2);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [navigate]);

  const isStyleguide = location.pathname === '/styleguide';

  return (
    <div className="min-h-screen flex flex-col bg-gov-bg text-gov-text font-sans antialiased transition-colors duration-200">
      {/* 1 & 2: Tricolour Strip & Utility Accessibility Bar */}
      <UtilityBar />

      {/* 3: Main Header */}
      <MainHeader
        userRole={currentRole}
        onRoleSwitch={setCurrentRole}
        onOpenCommandPalette={() => {
          // Trigger keyboard event for Ctrl+K
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
        }}
        onLogout={() => alert("Logged out from AICTE SATYAPAN Official Session.")}
      />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette />

      {/* Primary Navigation Bar */}
      <nav aria-label="Portal Navigation" className="bg-navy-900 text-white text-12 border-b border-navy-700 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-4">
            <Link
              to="/"
              onClick={() => setSelectedAppId(null)}
              className={`py-3 px-3 font-semibold transition-colors border-b-2 inline-flex items-center gap-1.5 ${
                !isStyleguide ? 'border-saffron-500 text-saffron-500 font-bold' : 'border-transparent text-slate-200 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Scrutiny Roster & Desk
            </Link>

            <Link
              to="/styleguide"
              className={`py-3 px-3 font-semibold transition-colors border-b-2 inline-flex items-center gap-1.5 ${
                isStyleguide ? 'border-saffron-500 text-saffron-500 font-bold' : 'border-transparent text-slate-200 hover:text-white'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              Design System & Styleguide (/styleguide)
            </Link>
          </div>

          <div className="text-[11px] text-slate-300 hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Prototype for SIH - synthetic data only</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 outline-none" tabIndex={-1}>
        <Routes>
          <Route path="/styleguide" element={<Styleguide />} />
          <Route 
            path="/" 
            element={
              selectedAppId ? (
                <ScrutinyDetail 
                  appId={selectedAppId} 
                  onBack={() => setSelectedAppId(null)} 
                />
              ) : (
                <Dashboard 
                  currentRole={currentRole} 
                  onSelectApplication={(id) => setSelectedAppId(id)} 
                />
              )
            } 
          />
        </Routes>
      </main>

      {/* 5: Official Government Footer */}
      <GovFooter />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
