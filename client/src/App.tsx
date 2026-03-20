import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import Layout from '@/components/Layout';
import ChatPage from '@/pages/ChatPage';
import RemindersPage from '@/pages/RemindersPage';
import ProfilePage from '@/pages/ProfilePage';
import EmergencyPage from '@/pages/EmergencyPage';
import SetupPage from '@/pages/SetupPage';
import FamilyLoginPage from '@/pages/family/FamilyLoginPage';
import FamilyDashboardPage from '@/pages/family/FamilyDashboardPage';

/** Route guard: redirect to /setup if not set up */
const RequireSetup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSetupComplete } = useUserStore();
  const location = useLocation();

  if (!isSetupComplete) {
    return <Navigate to="/setup" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/** Route guard: redirect to /chat if already set up */
const RedirectIfSetup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSetupComplete } = useUserStore();

  if (isSetupComplete) {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Setup page - only accessible when not set up */}
      <Route
        path="/setup"
        element={
          <RedirectIfSetup>
            <SetupPage />
          </RedirectIfSetup>
        }
      />

      {/* Family pages - no setup required */}
      <Route path="/family" element={<FamilyLoginPage />} />
      <Route path="/family/dashboard" element={<FamilyDashboardPage />} />

      {/* Emergency page - always accessible but wrapped in layout */}
      <Route
        path="/emergency"
        element={
          <Layout>
            <EmergencyPage />
          </Layout>
        }
      />

      {/* Main pages - require setup */}
      <Route
        path="/"
        element={
          <RequireSetup>
            <Layout>
              <ChatPage />
            </Layout>
          </RequireSetup>
        }
      />
      <Route
        path="/chat"
        element={
          <RequireSetup>
            <Layout>
              <ChatPage />
            </Layout>
          </RequireSetup>
        }
      />
      <Route
        path="/reminders"
        element={
          <RequireSetup>
            <Layout>
              <RemindersPage />
            </Layout>
          </RequireSetup>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireSetup>
            <Layout>
              <ProfilePage />
            </Layout>
          </RequireSetup>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const { checkSetup, loadUser } = useUserStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const hasSetup = checkSetup();
      if (hasSetup) {
        const userId = localStorage.getItem('userId');
        if (userId) {
          await loadUser(userId);
        }
      }
      setInitialized(true);
    };
    init();
  }, [checkSetup, loadUser]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-elder-base text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
