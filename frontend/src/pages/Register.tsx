import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/components/ui/button';
import { Input } from '@/components/components/ui/input';
import { Label } from '@/components/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/components/ui/card';
import { UserPlus, ArrowLeft } from 'lucide-react';
import api from '../services/api';

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  phone: string;
  gender: string;
  birth_date: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  id_number: string;
  employee_number: string;
  company_tax_id: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<RegisterForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    gender: 'female', // 女性預設
    birth_date: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    id_number: '',
    employee_number: '',
    company_tax_id: ''
  });

  // Auto-generate unique username based on email and timestamp
  const generateUsername = (email: string) => {
    const emailPrefix = email.split('@')[0];
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    return `${emailPrefix}_${timestamp}`;
  };

  const handleChange = (field: keyof RegisterForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password ||
        !formData.first_name || !formData.last_name || !formData.company_tax_id) {
      setError('請填寫所有必填欄位');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('密碼確認不一致');
      return false;
    }

    if (formData.password.length < 6) {
      setError('密碼長度至少需要6個字元');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('請輸入有效的電子郵件地址');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const registrationData = {
        username: generateUsername(formData.email), // Auto-generate username
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null,
        gender: formData.gender || null,
        birth_date: formData.birth_date || null,
        address: formData.address || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        id_number: formData.id_number || null,
        employee_number: formData.employee_number || null,
        company_tax_id: formData.company_tax_id
      };

      const response = await api.post('/register', registrationData);

      setSuccess(response.data.message);

      // 清空表單
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone: '',
        gender: '',
        birth_date: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        id_number: '',
        employee_number: '',
        company_tax_id: ''
      });

    } catch (error: any) {
      setError(error.response?.data?.detail || '註冊失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-green-700">註冊成功！</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{success}</p>
            <Button onClick={handleBackToLogin} className="w-full">
              返回登入頁面
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToLogin}
              className="p-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                員工註冊
              </CardTitle>
              <CardDescription>
                填寫您的資料申請加入公司
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 帳號資訊 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">帳號資訊</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">電子郵件 <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="請輸入電子郵件"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">使用者名稱將自動產生</p>
                </div>
                {/* 密碼跟確認密碼同一列 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">密碼 <span className="text-red-500">*</span></Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="請輸入密碼"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">確認密碼 <span className="text-red-500">*</span></Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="請再次輸入密碼"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 基本資料 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">基本資料</h3>
              <div className="space-y-4">
                {/* 姓跟名同一列 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">姓氏 <span className="text-red-500">*</span></Label>
                    <Input
                      id="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      placeholder="請輸入姓氏"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">名字 <span className="text-red-500">*</span></Label>
                    <Input
                      id="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      placeholder="請輸入名字"
                      required
                    />
                  </div>
                </div>

                {/* 手機跟身分證同一列 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">手機號碼</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="請輸入手機號碼"
                    />
                  </div>
                  <div>
                    <Label htmlFor="id_number">身分證字號</Label>
                    <Input
                      id="id_number"
                      type="text"
                      value={formData.id_number}
                      onChange={(e) => handleChange('id_number', e.target.value)}
                      placeholder="請輸入身分證字號"
                    />
                  </div>
                </div>

                {/* 性別，出生同一列 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>性別</Label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={formData.gender === 'female'}
                          onChange={(e) => handleChange('gender', e.target.value)}
                          className="w-3 h-3 text-blue-600"
                        />
                        <span className="text-xs">女性</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={formData.gender === 'male'}
                          onChange={(e) => handleChange('gender', e.target.value)}
                          className="w-3 h-3 text-blue-600"
                        />
                        <span className="text-xs">男性</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="other"
                          checked={formData.gender === 'other'}
                          onChange={(e) => handleChange('gender', e.target.value)}
                          className="w-3 h-3 text-blue-600"
                        />
                        <span className="text-xs">其他</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="birth_date">出生日期</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => handleChange('birth_date', e.target.value)}
                    />
                  </div>
                </div>

                {/* 公司統編地址同一列 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_tax_id">公司統編 <span className="text-red-500">*</span></Label>
                    <Input
                      id="company_tax_id"
                      type="text"
                      value={formData.company_tax_id}
                      onChange={(e) => handleChange('company_tax_id', e.target.value)}
                      placeholder="請輸入公司統一編號"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">地址</Label>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="請輸入地址"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="employee_number">員工編號</Label>
                  <Input
                    id="employee_number"
                    type="text"
                    value={formData.employee_number}
                    onChange={(e) => handleChange('employee_number', e.target.value)}
                    placeholder="請輸入員工編號"
                  />
                </div>
              </div>
            </div>

            {/* 緊急聯絡人 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">緊急聯絡人</h3>
              {/* 緊急聯絡人姓名，電話同一列 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name">緊急聯絡人姓名</Label>
                  <Input
                    id="emergency_contact_name"
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                    placeholder="請輸入緊急聯絡人姓名"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_phone">緊急聯絡人電話</Label>
                  <Input
                    id="emergency_contact_phone"
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                    placeholder="請輸入緊急聯絡人電話"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? '註冊中...' : '提交註冊申請'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;