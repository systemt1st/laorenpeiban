import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import NavBar from './NavBar';
import SOSButton from './SOSButton';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show layout on setup, family, or emergency pages
  const hideLayout =
    location.pathname === '/setup' ||
    location.pathname === '/family' ||
    location.pathname.startsWith('/family/') ||
    location.pathname === '/emergency';
  const showFloatingSOS = location.pathname !== '/' && location.pathname !== '/chat';

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA]">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 safe-area-top">
        <div className="flex items-center justify-between h-[56px] px-4 max-w-lg mx-auto">
          <h1 className="text-elder-lg font-bold text-[#212121]">
            老人陪伴助手
          </h1>
          <button
            onClick={() => navigate('/profile')}
            className="touch-target flex items-center justify-center w-[44px] h-[44px] rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="设置"
          >
            <Settings size={24} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-[56px] pb-[64px] overflow-y-auto scrollbar-thin">
        <div className="max-w-lg mx-auto">
          {children}
        </div>
      </main>

      {/* SOS floating button */}
      {showFloatingSOS && <SOSButton />}

      {/* Bottom navigation */}
      <NavBar />
    </div>
  );
};

export default Layout;
