
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { tokenManager, tokenAutoRefresh } from './services/api';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import LeaveApplication from './pages/LeaveApplication';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

function App() {
  useEffect(() => {
    // 應用啟動時檢查是否有tokens，如果有則啟動自動更新機制
    const accessToken = tokenManager.getAccessToken();
    const refreshToken = tokenManager.getRefreshToken();

    if (accessToken && refreshToken) {
      tokenAutoRefresh.start();
      console.log('Token自動更新機制已在應用啟動時啟動');
    }

    // 清理函數：在應用卸載時停止自動更新
    return () => {
      tokenAutoRefresh.stop();
    };
  }, []);

  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/records" element={<Records />} />
          <Route path="/leave" element={<LeaveApplication />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/:section" element={<Admin />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
