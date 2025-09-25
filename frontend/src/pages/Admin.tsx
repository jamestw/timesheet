import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOut, LayoutDashboard, Building, Users, Briefcase, UserCheck, Calendar, BarChart3 } from 'lucide-react'; // Added icons
import Companies from './admin/Companies';
import Departments from './admin/Departments';
import UsersComponent from './admin/Users'; // Renamed to avoid conflict
import Attendance from './admin/Attendance';
import UserApproval from './admin/UserApproval';
import LeaveManagement from './admin/LeaveManagement';
import Reports from './admin/Reports';
import { Button } from '@/components/components/ui/button';
import api from '../services/api';

type AdminPage = 'companies' | 'departments' | 'users' | 'attendance' | 'approval' | 'leaves' | 'reports';

interface CurrentUser {
  email: string;
  full_name?: string;
  role: 'super_admin' | 'company_admin' | 'department_head' | 'employee';
  company_id: number;
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Determine current page from URL parameter
  const getCurrentPage = (): AdminPage => {
    if (section && ['companies', 'departments', 'users', 'attendance', 'approval', 'leaves', 'reports'].includes(section)) {
      return section as AdminPage;
    }
    // Default based on user role if no valid section in URL
    if (currentUser?.role === 'super_admin') {
      return 'companies';
    }
    return 'users';
  };

  const [page, setPage] = useState<AdminPage>(getCurrentPage());

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/users/me');
        const user = response.data as CurrentUser;
        setCurrentUser(user);

        // If no section in URL, redirect to appropriate default page
        if (!section) {
          const defaultPage = user.role === 'super_admin' ? 'companies' : 'users';
          navigate(`/admin/${defaultPage}`, { replace: true });
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        navigate('/login');
      }
    };
    fetchCurrentUser();
  }, [navigate, section]);

  // Update page state when URL changes
  useEffect(() => {
    setPage(getCurrentPage());
  }, [section, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const handlePageChange = (newPage: AdminPage) => {
    navigate(`/admin/${newPage}`);
  };

  const renderPage = () => {
    // Ensure a valid page is rendered if the user is not a super_admin
    if (currentUser?.role !== 'super_admin' && (page === 'companies' || page === 'departments')) {
        return <UsersComponent />;
    }

    switch (page) {
      case 'companies':
        return <Companies />;
      case 'departments':
        return <Departments />;
      case 'users':
        return <UsersComponent />;
      case 'attendance':
        return <Attendance />;
      case 'approval':
        return <UserApproval />;
      case 'leaves':
        return <LeaveManagement />;
      case 'reports':
        return <Reports />;
      default:
        // Default to a safe page based on role
        return currentUser?.role === 'super_admin' ? <Companies /> : <UsersComponent />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Sidebar */}
      <aside className="w-48 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            後台管理系統
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            管理面板
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {currentUser?.role === 'super_admin' && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-3">
                系統管理
              </h3>
              <div className="space-y-1">
                <NavItem
                  icon={<Building className="w-5 h-5" />}
                  label="公司管理"
                  page="companies"
                  currentPage={page}
                  setPage={handlePageChange}
                />
                <NavItem
                  icon={<Briefcase className="w-5 h-5" />}
                  label="部門管理"
                  page="departments"
                  currentPage={page}
                  setPage={handlePageChange}
                />
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-3">
              日常管理
            </h3>
            <div className="space-y-1">
              <NavItem
                icon={<Users className="w-5 h-5" />}
                label="使用者管理"
                page="users"
                currentPage={page}
                setPage={handlePageChange}
              />
              <NavItem
                icon={<UserCheck className="w-5 h-5" />}
                label="用戶審核"
                page="approval"
                currentPage={page}
                setPage={handlePageChange}
              />
              <NavItem
                icon={<LayoutDashboard className="w-5 h-5" />}
                label="打卡紀錄"
                page="attendance"
                currentPage={page}
                setPage={handlePageChange}
              />
              <NavItem
                icon={<Calendar className="w-5 h-5" />}
                label="請假管理"
                page="leaves"
                currentPage={page}
                setPage={handlePageChange}
              />
              <NavItem
                icon={<BarChart3 className="w-5 h-5" />}
                label="報表管理"
                page="reports"
                currentPage={page}
                setPage={handlePageChange}
              />
            </div>
          </div>
        </nav>

        {/* User info and logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          {currentUser && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {(currentUser.full_name || currentUser.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {currentUser.full_name || currentUser.email}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentUser.role === 'super_admin' ? '超級管理員' :
                   currentUser.role === 'company_admin' ? '公司管理員' :
                   currentUser.role === 'department_head' ? '部門主管' : '員工'}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <LogOut className="mr-2 h-4 w-4" />
            登出
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {page === 'companies' ? '公司管理' :
                 page === 'departments' ? '部門管理' :
                 page === 'users' ? '使用者管理' :
                 page === 'attendance' ? '打卡紀錄' :
                 page === 'approval' ? '用戶審核' :
                 page === 'leaves' ? '請假管理' :
                 page === 'reports' ? '報表管理' : '管理面板'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {page === 'companies' ? '管理系統中的所有公司資訊' :
                 page === 'departments' ? '管理公司部門結構' :
                 page === 'users' ? '管理系統使用者帳號' :
                 page === 'attendance' ? '查看員工打卡記錄' :
                 page === 'approval' ? '審核員工註冊申請' :
                 page === 'leaves' ? '審核員工請假申請' :
                 page === 'reports' ? '查看員工出勤統計和個人記錄表' : '選擇要管理的功能'}
              </p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {currentUser ? renderPage() : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-500 dark:text-slate-400">載入中...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper component for navigation items
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  page: AdminPage;
  currentPage: AdminPage;
  setPage: (page: AdminPage) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, page, currentPage, setPage }) => (
  <button
    onClick={() => setPage(page)}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left group ${
      currentPage === page
        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
    }`}
  >
    <span className={`${currentPage === page ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
      {icon}
    </span>
    <span className="font-medium">{label}</span>
  </button>
);

export default Admin;
