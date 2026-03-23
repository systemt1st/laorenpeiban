import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Clock, UserIcon } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    path: '/chat',
    label: '对话',
    icon: <MessageCircle size={24} />,
  },
  {
    path: '/reminders',
    label: '提醒',
    icon: <Clock size={24} />,
  },
  {
    path: '/profile',
    label: '我的',
    icon: <UserIcon size={24} />,
  },
];

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string): boolean => {
    if (path === '/chat') {
      return location.pathname === '/' || location.pathname === '/chat';
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="flex items-center justify-around h-[64px] max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-0.5 transition-colors touch-target ${
                active ? 'text-primary-500' : 'text-gray-400'
              }`}
            >
              <span className={active ? 'text-primary-500' : 'text-gray-400'}>
                {item.icon}
              </span>
              <span
                className={`text-[15px] font-medium ${
                  active ? 'text-primary-500' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavBar;
