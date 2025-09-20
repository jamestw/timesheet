import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUser } from '../contexts/UserContext';

// Assuming shadcn/ui components are available
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('Attempting login with username:', username);
    try {
      const requestBody = new URLSearchParams({
        username: username,
        password: password,
      });
      console.log('Request Body:', requestBody.toString());
      const response = await api.post(
        '/login/access-token',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      console.log('Login successful, response:', response.data);
      localStorage.setItem('access_token', response.data.access_token);

      // Refresh user data after successful login
      console.log('Login: Calling refreshUser to update UserContext');
      await refreshUser();

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err.response?.data);
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Replace with shadcn/ui Card component */}
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">登入</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">電子信箱</label>
            {/* Replace with shadcn/ui Input component */}
            <input
              type="email"
              id="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="請輸入電子信箱"
              required
              style={{ backgroundColor: 'white', WebkitAppearance: 'none' }}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">密碼</label>
            {/* Replace with shadcn/ui Input component */}
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline bg-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              required
              style={{ backgroundColor: 'white', WebkitAppearance: 'none' }}
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            {/* Replace with shadcn/ui Button component */}
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              登入
            </button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              還沒有帳號？{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-blue-500 hover:text-blue-700 font-medium"
              >
                立即註冊
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
