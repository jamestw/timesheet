import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, Save } from 'lucide-react';
import api from '../services/api';
import { Button } from '@/components/components/ui/button';
import { Input } from '@/components/components/ui/input';
import { Label } from '@/components/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/components/ui/card"
import {
  Alert,
  AlertDescription,
} from "@/components/components/ui/alert"
import { useUser } from '../contexts/UserContext';
import BottomNavigation from '../components/BottomNavigation';

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  employee_number: string | null;
  role: string;
  company_id: number;
}

const Settings: React.FC = () => {
  const { user, refreshUser } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/me');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: '新密碼與確認密碼不一致' });
      return;
    }

    if (passwordData.new_password.length < 6) {
      setMessage({ type: 'error', text: '新密碼長度至少需要6個字符' });
      return;
    }

    try {
      await api.put('/users/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      setMessage({ type: 'success', text: '密碼修改成功' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordSection(false);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || '密碼修改失敗'
      });
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'super_admin': return '系統管理員';
      case 'company_admin': return '公司管理員';
      case 'department_head': return '部門主管';
      case 'employee': return '員工';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white shadow-sm px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-800">個人設定</h1>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">載入中...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-800">個人設定</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Message */}
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <User className="mr-2 h-5 w-5" />
              個人資料
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="email">電子信箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">姓</Label>
                  <Input
                    id="firstName"
                    value={profile?.first_name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">名</Label>
                  <Input
                    id="lastName"
                    value={profile?.last_name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">電話</Label>
                <Input
                  id="phone"
                  value={profile?.phone || '未設定'}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="employeeNumber">員工編號</Label>
                <Input
                  id="employeeNumber"
                  value={profile?.employee_number || '未設定'}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="role">角色</Label>
                <Input
                  id="role"
                  value={getRoleDisplay(profile?.role || '')}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              * 個人資料需要聯繫管理員進行修改
            </div>
          </CardContent>
        </Card>

        {/* Password Change Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Lock className="mr-2 h-5 w-5" />
              密碼設定
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showPasswordSection ? (
              <Button
                onClick={() => setShowPasswordSection(true)}
                variant="outline"
                className="w-full"
              >
                <Lock className="mr-2 h-4 w-4" />
                修改密碼
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Label htmlFor="currentPassword">目前密碼</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        current_password: e.target.value
                      }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Label htmlFor="newPassword">新密碼</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        new_password: e.target.value
                      }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Label htmlFor="confirmPassword">確認新密碼</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        confirm_password: e.target.value
                      }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handlePasswordChange}
                    className="flex-1"
                    disabled={!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    儲存
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPasswordSection(false);
                      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                      setMessage(null);
                    }}
                    variant="outline"
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Settings;