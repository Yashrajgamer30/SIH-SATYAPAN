import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { useAuthStore } from './context/authStore';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { InstituteLayout } from './layouts/InstituteLayout';
import { OfficialsLayout } from './layouts/OfficialsLayout';
import { ScannerLayout } from './layouts/ScannerLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { InstituteDashboard } from './pages/InstituteDashboard';
import { OfficialsDashboard } from './pages/OfficialsDashboard';
import { AdminRuleBuilder } from './pages/AdminRuleBuilder';
import { ScanView } from './pages/ScanView';
import { ScrutinyDetail } from './pages/ScrutinyDetail';
import { SmartQueueView } from './pages/SmartQueueView';
import { VerificationCentreView } from './pages/VerificationCentreView';
import { StaticInfoPage } from './pages/StaticInfoPage';
import { Styleguide } from './pages/Styleguide';
import { PlaceholderPageView } from './pages/PlaceholderPageView';

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

// Modals
import { SessionTimeoutModal } from './components/login/SessionTimeoutModal';

// Route Guard for authenticated regulatory access
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'INSTITUTE' | 'OFFICIAL' }> = ({
  children,
  requiredRole
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'INSTITUTE' && user?.role && !user.role.startsWith('INSTITUTE')) {
    return <Navigate to="/official/dashboard" replace />;
  }

  if (requiredRole === 'OFFICIAL' && user?.role && user.role.startsWith('INSTITUTE')) {
    return <Navigate to="/institute/dashboard" replace />;
  }

  return <>{children}</>;
};

// Root Redirect Component
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role?.startsWith('INSTITUTE')) {
    return <Navigate to="/institute/dashboard" replace />;
  }

  return <Navigate to="/official/dashboard" replace />;
};

// Scrutiny Detail Route Param Wrapper
const ScrutinyDetailRouteWrapper: React.FC = () => {
  const { appId } = useParams<{ appId?: string }>();
  const navigate = useNavigate();

  return (
    <ScrutinyDetail
      appId={appId || '1'}
      onBack={() => navigate('/official/smart-queue')}
    />
  );
};

// Dynamic document title updater based on current route
const RouteTitleHandler: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const p = location.pathname;
    if (p === '/login') {
      document.title = 'Sign In | SATYAPAN - AICTE';
    } else if (p.includes('/scan')) {
      document.title = 'Forensic Document Scanner | SATYAPAN - AICTE';
    } else if (p.startsWith('/official/admin/rules')) {
      document.title = 'Admin Rules and Checklists | SATYAPAN - AICTE';
    } else if (p.startsWith('/official/dashboard')) {
      document.title = 'Command Dashboard | SATYAPAN - AICTE';
    } else if (p.startsWith('/official/')) {
      document.title = 'Scrutiny Workbench | SATYAPAN - AICTE';
    } else if (p.startsWith('/institute/dashboard')) {
      document.title = 'Institute Dashboard | SATYAPAN - AICTE';
    } else if (p.startsWith('/institute/')) {
      document.title = 'Institute Portal | SATYAPAN - AICTE';
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
    } else if (p === '/styleguide') {
      document.title = 'Design System Styleguide | SATYAPAN - AICTE';
    }
  }, [location.pathname]);

  return null;
};

// Session Watchdog
const SessionWatchdog: React.FC = () => {
  const { isAuthenticated, checkSessionExpiry } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      checkSessionExpiry();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, checkSessionExpiry]);

  return null;
};

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <RouteTitleHandler />
        <SessionWatchdog />
        <SessionTimeoutModal />

        <Routes>
          {/* Public Route Group: /login only */}
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Legacy & Shortcut Redirects */}
          <Route path="/rules" element={<Navigate to="/official/admin/rules" replace />} />
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

          {/* Institute Route Group: /institute/** */}
          <Route
            path="/institute"
            element={
              <ProtectedRoute requiredRole="INSTITUTE">
                <InstituteLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/institute/dashboard" replace />} />
            <Route path="dashboard" element={<InstituteDashboard />} />
            <Route path="profile" element={<InstituteProfileView />} />
            <Route path="faculty" element={<FacultyView />} />
            <Route path="students" element={<StudentsView />} />
            <Route path="new-application" element={<NewApplicationWizard />} />
            <Route path="new-app" element={<Navigate to="/institute/new-application" replace />} />
            <Route path="track" element={<TrackApplicationsView />} />
            <Route path="track-app" element={<Navigate to="/institute/track" replace />} />
            <Route path="documents" element={<DocumentsVaultView />} />
            <Route path="vault" element={<Navigate to="/institute/documents" replace />} />
            <Route path="reports" element={<ReportsAndDownloadsView />} />
            <Route path="notifications" element={<NotificationsView />} />
            <Route path="help" element={<SahayakHelpView />} />
            <Route
              path="*"
              element={
                <PlaceholderPageView
                  title="Institute Portal Module"
                  description="This technical institute self-service module is being synchronized with the national registry."
                />
              }
            />
          </Route>

          {/* Officials Route Group: /official/** */}
          <Route
            path="/official"
            element={
              <ProtectedRoute requiredRole="OFFICIAL">
                <OfficialsLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/official/dashboard" replace />} />
            <Route path="dashboard" element={<OfficialsDashboard />} />
            <Route path="command" element={<Navigate to="/official/dashboard" replace />} />
            <Route path="smart-queue" element={<SmartQueueView />} />
            <Route path="applications" element={<Navigate to="/official/smart-queue" replace />} />
            <Route path="applications/:appId" element={<ScrutinyDetailRouteWrapper />} />
            <Route path="verification-centre" element={<VerificationCentreView />} />
            <Route
              path="infra-compliance"
              element={
                <PlaceholderPageView
                  title="Infrastructure Compliance"
                  description="Automated GIS master plan overlays and built-up instructional area CAD checks."
                />
              }
            />
            <Route
              path="decisions"
              element={
                <PlaceholderPageView
                  title="Regulatory Decisions & EOA"
                  description="Extension of Approval sanction orders, deficiency hearing letters, and executive notifications."
                />
              }
            />
            <Route
              path="audit-security"
              element={
                <PlaceholderPageView
                  title="Cryptographic Audit Ledger"
                  description="Immutable SHA-256 chained transaction logs of all official decisions and system actions."
                />
              }
            />
            <Route
              path="analytics"
              element={
                <PlaceholderPageView
                  title="Regional Analytics & Reports"
                  description="State-wise compliance indices, disposal rates, and anomaly detection distribution metrics."
                />
              }
            />
            <Route path="admin/rules" element={<AdminRuleBuilder />} />
            <Route
              path="*"
              element={
                <PlaceholderPageView
                  title="Officials Workbench Module"
                  description="This scrutiny module is active in the SATYAPAN production environment."
                />
              }
            />
          </Route>

          {/* ScannerLayout: ONLY the scan route */}
          <Route
            path="/official/applications/:appId/students/:studentId/documents/:docId/scan"
            element={
              <ProtectedRoute requiredRole="OFFICIAL">
                <ScannerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ScanView />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
