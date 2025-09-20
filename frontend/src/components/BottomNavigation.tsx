import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, FileText, Calendar, Settings } from 'lucide-react';

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { key: 'attendance', icon: Clock, label: '打卡', path: '/dashboard' },
    { key: 'records', icon: FileText, label: '紀錄', path: '/records' },
    { key: 'leave', icon: Calendar, label: '假單', path: '/leave' },
    { key: 'settings', icon: Settings, label: '設定', path: '/settings' },
  ];

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'attendance';
    if (path === '/records') return 'records';
    if (path === '/leave') return 'leave';
    if (path === '/settings') return 'settings';
    return 'attendance';
  };

  const currentTab = getCurrentTab();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.key;
          const IconComponent = item.icon;

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <IconComponent className={`w-6 h-6 mb-1 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;