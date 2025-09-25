import React, { useState, useEffect } from 'react';
import { Button } from '@/components/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/components/ui/card';
import { Badge } from '@/components/components/ui/badge';
import { Label } from '@/components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/components/ui/select';
import { Textarea } from '@/components/components/ui/textarea';
import { CheckCircle, XCircle, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

interface PendingUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  gender?: string;
  birth_date?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  company_tax_id: string;
  status: string;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
}

const UserApproval: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<{[key: number]: string}>({});
  const [rejectionReason, setRejectionReason] = useState<{[key: number]: string}>({});

  useEffect(() => {
    fetchPendingUsers();
    fetchDepartments();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/pending-users');
      setPendingUsers(response.data);
    } catch (error: any) {
      setError('載入待審核用戶失敗');
      console.error('Error fetching pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      // Assuming we have current user info to get company_id
      const userResponse = await api.get('/users/me');
      const companyId = userResponse.data.company_id;

      if (companyId) {
        const response = await api.get(`/companies/${companyId}/departments`);
        setDepartments(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleApproval = async (userId: number) => {
    try {
      const departmentId = selectedDepartment[userId] ? parseInt(selectedDepartment[userId]) : undefined;

      await api.post('/approve-user', null, {
        params: {
          user_id: userId,
          department_id: departmentId
        }
      });

      // Remove approved user from list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));

      // Clear department selection
      setSelectedDepartment(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });

    } catch (error: any) {
      setError(error.response?.data?.detail || '審核失敗');
      console.error('Error approving user:', error);
    }
  };

  const handleRejection = async (userId: number) => {
    const reason = rejectionReason[userId];
    if (!reason || reason.trim() === '') {
      setError('請輸入拒絕理由');
      return;
    }

    try {
      await api.post('/reject-user', null, {
        params: {
          user_id: userId,
          rejection_reason: reason
        }
      });

      // Remove rejected user from list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));

      // Clear rejection reason
      setRejectionReason(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });

    } catch (error: any) {
      setError(error.response?.data?.detail || '拒絕失敗');
      console.error('Error rejecting user:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserCheck className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用戶審核</h1>
          <p className="text-gray-600">審核待加入的員工申請</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">目前沒有待審核的用戶</h3>
            <p className="text-gray-500">所有用戶申請都已處理完成</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {user.first_name} {user.last_name}
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        待審核
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      @{user.username} • {user.email}
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    申請時間: {formatDate(user.created_at)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* 基本資料 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">手機號碼</Label>
                    <p className="text-sm text-gray-900">{user.phone || '未提供'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">性別</Label>
                    <p className="text-sm text-gray-900">
                      {user.gender === 'male' ? '男性' :
                       user.gender === 'female' ? '女性' :
                       user.gender === 'other' ? '其他' : '未提供'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">出生日期</Label>
                    <p className="text-sm text-gray-900">
                      {user.birth_date ? formatDate(user.birth_date) : '未提供'}
                    </p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label className="text-sm font-medium text-gray-700">地址</Label>
                    <p className="text-sm text-gray-900">{user.address || '未提供'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">緊急聯絡人</Label>
                    <p className="text-sm text-gray-900">{user.emergency_contact_name || '未提供'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">緊急聯絡電話</Label>
                    <p className="text-sm text-gray-900">{user.emergency_contact_phone || '未提供'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">公司統編</Label>
                    <p className="text-sm text-gray-900">{user.company_tax_id}</p>
                  </div>
                </div>

                {/* 審核操作 */}
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 核准區域 */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-green-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        核准申請
                      </h4>
                      <div>
                        <Label htmlFor={`department-${user.id}`}>分配部門（可選）</Label>
                        <Select
                          value={selectedDepartment[user.id] || ''}
                          onValueChange={(value) => setSelectedDepartment(prev => ({...prev, [user.id]: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選擇部門" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={() => handleApproval(user.id)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        核准申請
                      </Button>
                    </div>

                    {/* 拒絕區域 */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-red-700 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        拒絕申請
                      </h4>
                      <div>
                        <Label htmlFor={`reason-${user.id}`}>拒絕理由</Label>
                        <Textarea
                          id={`reason-${user.id}`}
                          placeholder="請輸入拒絕理由..."
                          value={rejectionReason[user.id] || ''}
                          onChange={(e) => setRejectionReason(prev => ({...prev, [user.id]: e.target.value}))}
                          rows={3}
                        />
                      </div>
                      <Button
                        onClick={() => handleRejection(user.id)}
                        variant="destructive"
                        className="w-full"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        拒絕申請
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserApproval;