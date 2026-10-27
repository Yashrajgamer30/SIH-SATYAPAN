import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useAuthStore } from './context/authStore';
import { 
  ToastProvider, 
  UtilityBar, 
  MainHeader, 
  GovFooter, 
  CommandPalette
} from './components/design-system';
import { Styleguide } from './pages/Styleguide';
import { Dashboard } from './pages/Dashboard';
import { ScrutinyDetail } from './pages/ScrutinyDetail';
import { AdminRuleBuilder } from './pages/AdminRuleBuilder';
import { LoginPage } from './pages/LoginPage';
import { SessionTimeoutModal } from './components/login/SessionTimeoutModal';
import { SignInTransition } from './components/login/SignInTransition';
import { Layout, FileText, Sliders, Shield } from 'lucide-react';

// Route guard for authenticated regulatory access
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { user, isAuthenticated, logout, checkSessionExpiry } = useAuthStore();

  const [currentRole, setCurrentRole] = useState<string>(() => user?.role || 'OFFICIAL_SCRUTINY');
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isLogoutTransition, setIsLogoutTransition] = useState(false);

  // Synchronize user role whenever user changes in auth store
  useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    }
  }, [user?.role]);

  // Session timeout watchdog (checks every 5 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      checkSessionExpiry();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, checkSessionExpiry]);

  // Synchronize hash for instant tab switching
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#styleguide') {
        navigate('/styleguide');
      } else if (hash === '#rules') {
        navigate('/rules');
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

  // Handle Logout with Reverse Transition
  const handleLogout = () => {
    setIsLogoutTransition(true);
  };

  const handleLogoutPeak = async () => {
    await logout();
    navigate('/login');
  };

  const handleLogoutComplete = () => {
    setIsLogoutTransition(false);
  };

  const isStyleguide = location.pathname === '/styleguide';
  const isRules = location.pathname === '/rules';

  return (
    <div className="min-h-screen flex flex-col bg-gov-bg text-gov-text font-sans antialiased transition-colors duration-200">
      {/* 1 & 2: Tricolour Strip & Utility Accessibility Bar */}
      <UtilityBar />

      {/* 3: Main Header */}
      <MainHeader
        userRole={currentRole}
        userName={user?.name || "Authorized Official"}
        instituteName={user?.role?.startsWith('INSTITUTE') ? "Saraswati Institute of Technology" : "Western Regional Office, AICTE"}
        onRoleSwitch={setCurrentRole}
        onOpenCommandPalette={() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
        }}
        onLogout={handleLogout}
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
                !isStyleguide && !isRules ? 'border-saffron-500 text-saffron-500 font-bold' : 'border-transparent text-slate-200 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              {currentRole?.startsWith('INSTITUTE') ? 'Institute Dossier & EoA' : 'Scrutiny Roster & Desk'}
            </Link>

            <Link
              to="/rules"
              onClick={() => setSelectedAppId(null)}
              className={`py-3 px-3 font-semibold transition-colors border-b-2 inline-flex items-center gap-1.5 ${
                isRules ? 'border-saffron-500 text-saffron-500 font-bold' : 'border-transparent text-slate-200 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Rule Builder
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
          <Route path="/rules" element={<AdminRuleBuilder />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* 5: Official Government Footer */}
      <GovFooter />

      {/* Regulatory Session Timeout Warning Modal */}
      <SessionTimeoutModal />

      {/* Reverse Transition Overlay on Logout */}
      <SignInTransition
        isActive={isLogoutTransition}
        mode="logout"
        onPeak={handleLogoutPeak}
        onComplete={handleLogoutComplete}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
