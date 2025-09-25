import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, Download, Search } from 'lucide-react';
import api from '../../services/api';
import { Button } from '@/components/components/ui/button';
import { Input } from '@/components/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/components/ui/tabs';

interface MonthlySummaryData {
  user_id: number;
  user_name: string;
  user_email: string;
  attendance_days: number;
  check_in_count: number;
  check_out_count: number;
  overtime_hours: number;
  overtime_sessions: number;
}

interface DailyRecord {
  date: string;
  weekday: string;
  weekday_zh: string;
  check_in: string | null;
  check_out: string | null;
  overtime_start: string | null;
  overtime_end: string | null;
  work_hours: number;
  overtime_hours: number;
}

interface IndividualRecord {
  user_info: {
    id: number;
    name: string;
    email: string;
    company_name: string;
    department_name: string;
  };
  period: {
    year: number;
    month: number;
    month_name: string;
  };
  daily_records: DailyRecord[];
  summary: {
    total_work_hours: number;
    total_overtime_hours: number;
    total_attendance_days: number;
    total_records: number;
  };
}

interface Company {
  id: number;
  name: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  // 用於顯示的完整姓名
  name?: string;
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('monthly');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryData[]>([]);
  const [individualRecord, setIndividualRecord] = useState<IndividualRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current user info
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchCompanies();
      // Auto-load monthly summary for company_admin
      if (currentUser.role === 'company_admin') {
        const companyId = currentUser.company_id.toString();
        setSelectedCompany(companyId);
        // Auto-fetch monthly summary when component loads for company_admin
        fetchMonthlySummaryForCompany(currentUser.company_id);

        // 立即觸發用戶列表載入
        setTimeout(() => {
          fetchUsersForCompany(companyId);
        }, 100);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedCompany) {
      fetchUsers();
      // Auto-refresh monthly summary when company, year, or month changes for company_admin
      if (currentUser?.role === 'company_admin' && activeTab === 'monthly') {
        fetchMonthlySummaryForCompany(parseInt(selectedCompany));
      }
    }
  }, [selectedCompany, year, month]);

  // Auto-refresh when activeTab changes for company_admin
  useEffect(() => {
    if (currentUser?.role === 'company_admin' && selectedCompany && activeTab === 'monthly') {
      fetchMonthlySummaryForCompany(parseInt(selectedCompany));
    }
  }, [activeTab]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me');
      console.log('Current user loaded:', response.data);
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      if (currentUser?.role === 'super_admin') {
        const response = await api.get('/companies');
        setCompanies(response.data);
      } else if (currentUser?.company_id) {
        // For company_admin, just set their company
        setSelectedCompany(currentUser.company_id.toString());
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const fetchUsersForCompany = async (companyId: string) => {
    if (!companyId) return;

    try {
      const response = await api.get(`/companies/${companyId}/users`);
      const usersWithName = response.data.map((user: User) => ({
        ...user,
        name: `${user.first_name} ${user.last_name}`.trim()
      }));
      setUsers(usersWithName);
      console.log('Fetched users for company', companyId, ':', usersWithName);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('無法載入員工列表');
    }
  };

  const fetchUsers = async () => {
    if (!selectedCompany) return;
    await fetchUsersForCompany(selectedCompany);
  };

  const fetchMonthlySummaryForCompany = async (companyId: number) => {
    setLoading(true);
    setError(null);

    try {
      const params: any = { year, month };
      if (currentUser?.role === 'super_admin') {
        params.company_id = companyId;
      }

      const response = await api.get('/reports/monthly-summary', { params });
      setMonthlySummary(response.data);
    } catch (error: any) {
      setError(error.response?.data?.detail || '獲取月度統計失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySummary = async () => {
    if (!selectedCompany) {
      setError('請選擇公司');
      return;
    }

    fetchMonthlySummaryForCompany(parseInt(selectedCompany));
  };

  const fetchIndividualRecord = async () => {
    if (!selectedUser) {
      setError('請選擇員工');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/reports/individual-record', {
        params: {
          user_id: parseInt(selectedUser),
          year,
          month
        }
      });
      setIndividualRecord(response.data);
    } catch (error: any) {
      setError(error.response?.data?.detail || '獲取個人記錄失敗');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(val =>
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportMonthlySummary = () => {
    const exportData = monthlySummary.map(item => ({
      '員工姓名': item.user_name,
      '員工信箱': item.user_email,
      '出勤天數': item.attendance_days,
      '上班打卡次數': item.check_in_count,
      '下班打卡次數': item.check_out_count,
      '加班時數': item.overtime_hours,
      '加班次數': item.overtime_sessions
    }));
    exportToCSV(exportData, `月度統計_${year}年${month}月`);
  };

  const exportIndividualRecord = () => {
    if (!individualRecord) return;

    const exportData = individualRecord.daily_records.map(record => ({
      '日期': record.date,
      '星期': record.weekday_zh,
      '上班時間': record.check_in || '',
      '下班時間': record.check_out || '',
      '加班開始': record.overtime_start || '',
      '加班結束': record.overtime_end || '',
      '工作時數': record.work_hours,
      '加班時數': record.overtime_hours
    }));

    exportToCSV(exportData, `個人出勤記錄_${individualRecord.user_info.name}_${year}年${month}月`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">報表管理</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            查詢條件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {currentUser?.role === 'super_admin' && (
              <div>
                <label className="block text-sm font-medium mb-1">公司</label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇公司" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">年份</label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min="2020"
                max="2030"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">月份</label>
              <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={m.toString()}>
                      {m}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>錯誤</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly">
            <Users className="w-4 h-4 mr-2" />
            月度員工統計
          </TabsTrigger>
          <TabsTrigger value="individual">
            <FileText className="w-4 h-4 mr-2" />
            個人出勤記錄
          </TabsTrigger>
        </TabsList>

        {/* Monthly Summary Tab */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    月度員工出勤統計
                  </CardTitle>
                  <CardDescription>
                    {year}年{month}月 - 所有員工出勤統計數據
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={fetchMonthlySummary} disabled={loading}>
                    {loading ? '查詢中...' : '查詢'}
                  </Button>
                  {monthlySummary.length > 0 && (
                    <Button variant="outline" onClick={exportMonthlySummary}>
                      <Download className="w-4 h-4 mr-2" />
                      匯出CSV
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">載入中...</div>
              ) : monthlySummary.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>員工姓名</TableHead>
                        <TableHead>員工信箱</TableHead>
                        <TableHead>出勤天數</TableHead>
                        <TableHead>上班打卡</TableHead>
                        <TableHead>下班打卡</TableHead>
                        <TableHead>加班時數</TableHead>
                        <TableHead>加班次數</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlySummary.map((item) => (
                        <TableRow key={item.user_id}>
                          <TableCell className="font-medium">{item.user_name}</TableCell>
                          <TableCell>{item.user_email}</TableCell>
                          <TableCell>{item.attendance_days}</TableCell>
                          <TableCell>{item.check_in_count}</TableCell>
                          <TableCell>{item.check_out_count}</TableCell>
                          <TableCell>{item.overtime_hours}</TableCell>
                          <TableCell>{item.overtime_sessions}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  請點擊查詢按鈕獲取數據
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual Record Tab */}
        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    個人出勤記錄表
                  </CardTitle>
                  <CardDescription>
                    {year}年{month}月 - 詳細個人出勤記錄
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={fetchIndividualRecord} disabled={loading || !selectedUser}>
                    {loading ? '查詢中...' : '查詢'}
                  </Button>
                  {individualRecord && (
                    <Button variant="outline" onClick={exportIndividualRecord}>
                      <Download className="w-4 h-4 mr-2" />
                      匯出CSV
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* User Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">選擇員工</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder={
                      users.length === 0
                        ? "請先選擇公司，載入員工列表..."
                        : "請選擇員工"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <SelectItem value="_loading" disabled>
                        {selectedCompany ? "載入員工列表中..." : "請先選擇公司"}
                      </SelectItem>
                    ) : (
                      users.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()} ({user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="text-center py-8">載入中...</div>
              ) : individualRecord ? (
                <div>
                  {/* Employee Info */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                    <h3 className="font-semibold mb-2">員工資訊</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">姓名：</span>
                        {individualRecord.user_info.name}
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">信箱：</span>
                        {individualRecord.user_info.email}
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">公司：</span>
                        {individualRecord.user_info.company_name}
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">部門：</span>
                        {individualRecord.user_info.department_name}
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {individualRecord.summary.total_attendance_days}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">出勤天數</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {individualRecord.summary.total_work_hours}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">工作時數</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {individualRecord.summary.total_overtime_hours}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">加班時數</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {individualRecord.summary.total_records}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">記錄數</div>
                    </div>
                  </div>

                  {/* Daily Records Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日期</TableHead>
                          <TableHead>星期</TableHead>
                          <TableHead>上班時間</TableHead>
                          <TableHead>下班時間</TableHead>
                          <TableHead>加班開始</TableHead>
                          <TableHead>加班結束</TableHead>
                          <TableHead>工作時數</TableHead>
                          <TableHead>加班時數</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {individualRecord.daily_records.map((record, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>{record.weekday_zh}</TableCell>
                            <TableCell>{record.check_in || '-'}</TableCell>
                            <TableCell>{record.check_out || '-'}</TableCell>
                            <TableCell>{record.overtime_start || '-'}</TableCell>
                            <TableCell>{record.overtime_end || '-'}</TableCell>
                            <TableCell>{record.work_hours}</TableCell>
                            <TableCell>{record.overtime_hours}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  請選擇員工後點擊查詢按鈕獲取數據
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;