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
import { StaticInfoPage } from './pages/StaticInfoPage';
import { InstitutePortalShell } from './components/layout/InstitutePortalShell';
import { OfficialsPortalShell } from './components/layout/OfficialsPortalShell';
import { SessionTimeoutModal } from './components/login/SessionTimeoutModal';
import { SignInTransition } from './components/login/SignInTransition';

// Institute Pages
import { InstituteProfileView } from './pages/institute/InstituteProfileView';
import { FacultyView } from './pages/institute/FacultyView';
import { StudentsView } from './pages/institute/StudentsView';
import { NewApplicationWizard } from './pages/institute/NewApplicationWizard';
import { TrackApplicationsView } from './pages/institute/TrackApplicationsView';
import { DocumentsVaultView } from './pages/institute/DocumentsVaultView';
import { ReportsAndDownloadsView } from './pages/institute/ReportsAndDownloadsView';
import { SahayakHelpView } from './pages/institute/SahayakHelpView';
import { NotificationsView } from './pages/institute/NotificationsView';


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

  const isInstitute = currentRole.startsWith('INSTITUTE');

  // Dynamic document title updater based on current active workspace view
  useEffect(() => {
    if (activeScanDoc) {
      document.title = 'Forensic Document Scanner | SATYAPAN - AICTE';
      return;
    }
    if (isInstitute) {
      const titles: Record<string, string> = {
        'dashboard': 'Institute Dashboard',
        'profile': 'Institute Profile',
        'faculty': 'Faculty Register',
        'students': 'Student Records',
        'new-app': 'New Application',
        'track-app': 'Track Applications',
        'documents': 'Document Vault',
        'reports': 'Reports & Downloads',
        'notifications': 'Notifications',
        'help': 'Sahayak AI Help'
      };
      const label = titles[instituteNav] || 'Institute Portal';
      document.title = `${label} | SATYAPAN - AICTE`;
    } else {
      const titles: Record<string, string> = {
        'command': 'Command Dashboard',
        'smart-queue': 'Smart Scrutiny Queue',
        'cross-verifications': 'Cross-Verification Centre',
        'fraud-watch': 'Fraud & Risk Watch',
        'deficiencies': 'Deficiency Manager',
        'hearings': 'Virtual Hearing Board',
        'reports': 'Regional Reports',
        'settings': 'System Settings'
      };
      const label = titles[officialsNav] || 'Officials Workbench';
      document.title = `${label} | SATYAPAN - AICTE`;
    }
  }, [isInstitute, instituteNav, officialsNav, activeScanDoc]);

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
          {instituteNav === 'dashboard' && <InstituteDashboard />}
          {instituteNav === 'profile' && <InstituteProfileView />}
          {instituteNav === 'faculty' && <FacultyView />}
          {instituteNav === 'students' && <StudentsView />}
          {instituteNav === 'new-app' && <NewApplicationWizard />}
          {(instituteNav === 'track' || instituteNav === 'track-app') && <TrackApplicationsView />}
          {(instituteNav === 'vault' || instituteNav === 'documents') && <DocumentsVaultView />}
          {instituteNav === 'reports' && <ReportsAndDownloadsView />}
          {instituteNav === 'help' && <SahayakHelpView />}
          {instituteNav === 'notifications' && <NotificationsView />}
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

// Dynamic document title sync for top-level pages
const RouteTitleHandler: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const p = location.pathname;
    if (p === '/login') {
      document.title = 'Sign In | SATYAPAN - AICTE';
    } else if (p === '/policies') {
      document.title = 'Website Policies | SATYAPAN - AICTE';
    } else if (p === '/accessibility') {
      document.title = 'Accessibility Statement | SATYAPAN - AICTE';
    } else if (p === '/terms') {
      document.title = 'Terms and Conditions | SATYAPAN - AICTE';
    } else if (p === '/help') {
      document.title = 'Help & Support | SATYAPAN - AICTE';
    } else if (p === '/contact') {
      document.title = 'Contact Us | SATYAPAN - AICTE';
    } else if (p === '/feedback') {
      document.title = 'Feedback | SATYAPAN - AICTE';
    } else if (p === '/rules') {
      document.title = 'Admin Rule Builder | SATYAPAN - AICTE';
    } else if (p === '/styleguide') {
      document.title = 'Design System Styleguide | SATYAPAN - AICTE';
    }
  }, [location.pathname]);

  return null;
};

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <RouteTitleHandler />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/policies" element={<StaticInfoPage />} />
          <Route path="/accessibility" element={<StaticInfoPage />} />
          <Route path="/terms" element={<StaticInfoPage />} />
          <Route path="/help" element={<StaticInfoPage />} />
          <Route path="/contact" element={<StaticInfoPage />} />
          <Route path="/feedback" element={<StaticInfoPage />} />
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
