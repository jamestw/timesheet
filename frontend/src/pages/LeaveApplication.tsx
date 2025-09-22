import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import { Button } from '@/components/components/ui/button';
import { Input } from '@/components/components/ui/input';
import { Label } from '@/components/components/ui/label';
import { Textarea } from '@/components/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/components/ui/tabs";
import BottomNavigation from '../components/BottomNavigation';
import { useUser } from '../contexts/UserContext';

interface LeaveType {
  value: string;
  label: string;
}

interface LeaveApplication {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  reviewed_by?: number;
  reviewed_at?: string;
  review_comment?: string;
  created_at: string;
}

const LeaveApplication: React.FC = () => {
  const { user, isLoading: userLoading } = useUser();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });

  // Time mode state
  const [timeMode, setTimeMode] = useState<'full_day' | 'custom'>('full_day');

  // Separate date and time states for better control
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');

  // Generate time options in 10-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push({ value: time, label: time });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Combine date and time into datetime-local format
  const combineDateAndTime = (date: string, time: string) => {
    if (!date) return '';
    return `${date}T${time}`;
  };

  // Update combined datetime when date or time changes
  useEffect(() => {
    if (timeMode === 'full_day') {
      // For full day, set start to 00:00 and end to 23:59
      setFormData(prev => ({
        ...prev,
        start_date: startDate ? `${startDate}T00:00` : '',
        end_date: endDate ? `${endDate}T23:59` : ''
      }));
    } else {
      // For custom time, use selected times
      setFormData(prev => ({
        ...prev,
        start_date: combineDateAndTime(startDate, startTime),
        end_date: combineDateAndTime(endDate, endTime)
      }));
    }
  }, [startDate, startTime, endDate, endTime, timeMode]);

  // Load leave types and applications
  useEffect(() => {
    // Only load data if user is authenticated
    if (user) {
      loadLeaveTypes();
      loadApplications();
    }
  }, [user]);

  const loadLeaveTypes = async () => {
    try {
      console.log('Loading leave types...');
      const response = await api.get('/leaves/types');
      console.log('Leave types response:', response.data);
      setLeaveTypes(response.data);
    } catch (error: any) {
      console.error('Failed to load leave types:', error);
      setAlert({
        type: 'error',
        message: `載入請假類型失敗: ${error.response?.data?.detail || error.message}`
      });
    }
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/leaves/');
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to load applications:', error);
      setAlert({ type: 'error', message: '載入請假記錄失敗' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.leave_type || !startDate || !endDate || !formData.reason) {
      setAlert({ type: 'error', message: '請填寫所有必填欄位' });
      return;
    }

    if (timeMode === 'custom' && (!startTime || !endTime)) {
      setAlert({ type: 'error', message: '請選擇開始和結束時間' });
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setAlert({ type: 'error', message: '結束日期必須晚於開始日期' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/leaves/', {
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason
      });

      setAlert({ type: 'success', message: '請假申請提交成功！' });
      setFormData({ leave_type: '', start_date: '', end_date: '', reason: '' });
      setStartDate('');
      setEndDate('');
      setStartTime('09:00');
      setEndTime('18:00');
      setTimeMode('full_day');
      loadApplications(); // Reload applications
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.response?.data?.detail || '提交申請失敗，請稍後再試'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待審核';
      case 'approved': return '已核准';
      case 'rejected': return '已拒絕';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
  };

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">載入中...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-800">請假申請</h1>
        </div>
      </header>

      {/* Alert */}
      {alert && (
        <div className="p-4">
          <Alert className={alert.type === 'error' ? 'border-red-200' : 'border-green-200'}>
            {alert.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertTitle>{alert.type === 'error' ? '錯誤' : '成功'}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="apply" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="apply">申請請假</TabsTrigger>
            <TabsTrigger value="history">請假記錄</TabsTrigger>
          </TabsList>

          {/* Apply Tab */}
          <TabsContent value="apply">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Calendar className="mr-2 h-5 w-5" />
                  請假申請表單
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="leave_type">請假類型 *</Label>
                    <Select value={formData.leave_type} onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, leave_type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇請假類型" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time Mode Selection */}
                  <div>
                    <Label>請假時間類型 *</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="timeMode"
                          value="full_day"
                          checked={timeMode === 'full_day'}
                          onChange={(e) => setTimeMode(e.target.value as 'full_day' | 'custom')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>全天</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="timeMode"
                          value="custom"
                          checked={timeMode === 'custom'}
                          onChange={(e) => setTimeMode(e.target.value as 'full_day' | 'custom')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>自訂</span>
                      </label>
                    </div>
                  </div>

                  {timeMode === 'full_day' ? (
                    /* Full Day Mode - Start and End Date in one row */
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date">開始日期 *</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_date">結束日期 *</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Custom Mode - Date and Time in one row each */
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start_date">開始日期 *</Label>
                          <Input
                            id="start_date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="start_time">開始時間 *</Label>
                          <Select value={startTime} onValueChange={setStartTime}>
                            <SelectTrigger>
                              <SelectValue placeholder="選擇開始時間" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {timeOptions.map((time) => (
                                <SelectItem key={time.value} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="end_date">結束日期 *</Label>
                          <Input
                            id="end_date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_time">結束時間 *</Label>
                          <Select value={endTime} onValueChange={setEndTime}>
                            <SelectTrigger>
                              <SelectValue placeholder="選擇結束時間" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {timeOptions.map((time) => (
                                <SelectItem key={time.value} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="reason">請假事由 *</Label>
                    <Textarea
                      id="reason"
                      placeholder="請輸入請假原因..."
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? '提交中...' : '提交申請'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Eye className="mr-2 h-5 w-5" />
                  請假記錄
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">載入中...</div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暫無請假記錄
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>類型</TableHead>
                          <TableHead>日期</TableHead>
                          <TableHead>狀態</TableHead>
                          <TableHead>事由</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell>
                              {leaveTypes.find(t => t.value === app.leave_type)?.label || app.leave_type}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div>{format(new Date(app.start_date), 'MM/dd')}</div>
                              <div className="text-xs text-gray-500">
                                ~ {format(new Date(app.end_date), 'MM/dd')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                {getStatusText(app.status)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="truncate max-w-32" title={app.reason}>
                                {app.reason}
                              </div>
                              {app.review_comment && (
                                <div className="text-xs text-gray-500 mt-1">
                                  備註: {app.review_comment}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default LeaveApplication;