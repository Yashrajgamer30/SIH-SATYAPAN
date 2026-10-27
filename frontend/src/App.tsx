import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useAuthStore } from './context/authStore';
import { Styleguide } from './pages/Styleguide';
import { ScrutinyDetail } from './pages/ScrutinyDetail';
import { AdminRuleBuilder } from './pages/AdminRuleBuilder';
import { LoginPage } from './pages/LoginPage';
import { InstituteDashboard } from './pages/InstituteDashboard';
import { OfficialsDashboard } from './pages/OfficialsDashboard';
import { ScanView } from './pages/ScanView';
import { InstitutePortalShell } from './components/layout/InstitutePortalShell';
import { OfficialsPortalShell } from './components/layout/OfficialsPortalShell';
import { SessionTimeoutModal } from './components/login/SessionTimeoutModal';
import { SignInTransition } from './components/login/SignInTransition';

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
  const { user, isAuthenticated, logout, checkSessionExpiry } = useAuthStore();

  const [currentRole, setCurrentRole] = useState<string>(() => user?.role || 'OFFICIAL_SCRUTINY');
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [activeScanDoc, setActiveScanDoc] = useState<string | null>(null);
  const [isLogoutTransition, setIsLogoutTransition] = useState(false);
  const [instituteNav, setInstituteNav] = useState('dashboard');
  const [officialsNav, setOfficialsNav] = useState('command');

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

  const isInstitute = currentRole.startsWith('INSTITUTE');

  const handleSelectApp = (id: number) => {
    // Open the full-screen forensic Scan View directly
    setActiveScanDoc('fire_noc_clean.pdf');
  };

  const handleBackFromDetail = () => {
    setSelectedAppId(null);
    setActiveScanDoc(null);
  };

  return (
    <>
      {isInstitute ? (
        /* Institute Portal Shell Layout */
        <InstitutePortalShell
          activeNav={instituteNav}
          onNavChange={(nav) => {
            setInstituteNav(nav);
            setSelectedAppId(null);
            setActiveScanDoc(null);
          }}
          onLogout={handleLogout}
        >
          <InstituteDashboard />
        </InstitutePortalShell>
      ) : (
        /* Officials Portal Shell Layout (Scrutiny Workbench) */
        <OfficialsPortalShell
          activeNav={officialsNav}
          onNavChange={(nav) => {
            setOfficialsNav(nav);
            if (nav === 'admin') {
              navigate('/rules');
            } else if (nav === 'verification-centre') {
              setActiveScanDoc('fire_noc_clean.pdf');
            } else {
              setSelectedAppId(null);
              setActiveScanDoc(null);
            }
          }}
          onLogout={handleLogout}
          onOpenCommandPalette={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
          }}
        >
          <OfficialsDashboard 
            onSelectApplication={handleSelectApp} 
          />
        </OfficialsPortalShell>
      )}

      {/* Full-Screen Forensic Document Scan View Modal (Showpiece 2) */}
      {activeScanDoc && (
        <ScanView
          documentId="demo-doc-01"
          initialFileName={activeScanDoc}
          onClose={() => setActiveScanDoc(null)}
        />
      )}

      {/* Regulatory Session Timeout Warning Modal */}
      <SessionTimeoutModal />

      {/* Reverse Transition Overlay on Logout */}
      <SignInTransition
        isActive={isLogoutTransition}
        mode="logout"
        onPeak={handleLogoutPeak}
        onComplete={handleLogoutComplete}
      />
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/styleguide" 
            element={
              <ProtectedRoute>
                <Styleguide />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rules" 
            element={
              <ProtectedRoute>
                <AdminRuleBuilder />
              </ProtectedRoute>
            } 
          />
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
    </ThemeProvider>
  );
}

export default App;
