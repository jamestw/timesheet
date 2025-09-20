import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { Clock, LogOut, Calendar, AlertCircle } from 'lucide-react';

import api from '../services/api';
import { Button } from '@/components/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from "@/components/components/ui/toggle-group"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/components/ui/table"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/components/ui/alert"


import { useUser } from '../contexts/UserContext'; // Import useUser hook


// Define the structure of an attendance record
interface AttendanceRecord {
  id: number;
  record_time: string;
  record_type: 'check-in' | 'check-out' | 'other';
  status: string;
}

type AttendanceType = 'check-in' | 'check-out' | 'other';


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser(); // Get user from context
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('check-in');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'company_admin';

  // Debug logging
  console.log("Dashboard - Current user:", user);
  console.log("Dashboard - User role:", user?.role);
  console.log("Dashboard - Is admin:", isAdmin);

  const fetchAttendanceRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday as the first day
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

      const params = {
        start_date: format(weekStart, 'yyyy-MM-dd'),
        end_date: format(weekEnd, 'yyyy-MM-dd'),
      };

      const response = await api.get('/attendance/records', { params });
      setAttendanceRecords(response.data);
    } catch (error: any) {
      console.error('Failed to fetch attendance records:', error);
      setMessage({ type: 'error', text: '無法載入打卡紀錄。' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('瀏覽器不支援地理位置功能'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = '無法取得位置資訊';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '使用者拒絕位置存取權限';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '位置資訊無法取得';
              break;
            case error.TIMEOUT:
              errorMessage = '取得位置資訊逾時';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  const handlePunch = async () => {
    setMessage(null);
    try {
      if (attendanceType === 'check-in' || attendanceType === 'check-out') {
        // Get user's current location
        setMessage({ type: 'success', text: '正在取得位置資訊...' });
        const location = await getCurrentLocation();

        // Send attendance request with location
        const response = await api.post(`/attendance/${attendanceType}`, {
          latitude: location.latitude,
          longitude: location.longitude,
        });

        setMessage({
          type: 'success',
          text: `${response.data.message || `${attendanceType} successful.`} 距離公司: ${response.data.distance_from_company}m`
        });
        fetchAttendanceRecords(); // Refresh records after action
      } else {
        setMessage({ type: 'error', text: '此功能尚未實現。' });
      }
    } catch (error: any) {
      console.error('Attendance error:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || error.message || `${attendanceType} failed.` });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const getRecordTypeDisplay = (type: AttendanceType) => {
    switch (type) {
      case 'check-in': return '上班';
      case 'check-out': return '下班';
      default: return '其他';
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-3xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">儀表板</h1>
          <div className="flex items-center gap-2">
            {user?.email && (
              <span className="text-sm text-gray-600 px-2">
                {user.email}
              </span>
            )}
            {isAdmin && (
              <Button variant="ghost" onClick={() => navigate('/admin')}>
                後台管理
              </Button>
            )}
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              登出
            </Button>
          </div>
        </header>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{message.type === 'error' ? '錯誤' : '成功'}</AlertTitle>
            <AlertDescription>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Card className="w-full mb-8">
          <CardHeader className="text-center">
            <CardTitle>打卡鐘</CardTitle>
            <CardDescription>請選擇類型後打卡</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <ToggleGroup
              type="single"
              value={attendanceType}
              onValueChange={(value: AttendanceType) => {
                if (value) setAttendanceType(value);
              }}
            >
              <ToggleGroupItem value="check-in">上班</ToggleGroupItem>
              <ToggleGroupItem value="check-out">下班</ToggleGroupItem>
              <ToggleGroupItem value="other" disabled>其他</ToggleGroupItem>
            </ToggleGroup>
            <Button size="lg" className="w-48 h-16 rounded-full text-xl" onClick={handlePunch}>
              <Clock className="mr-2 h-6 w-6" />
              打卡
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              本周打卡紀錄
            </CardTitle>
            <CardDescription>
              以下是您本周的打卡時間紀錄。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead>狀態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center">載入中...</TableCell></TableRow>
                ) : attendanceRecords.length > 0 ? (
                  attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.record_time), 'yyyy-MM-dd (E)')}</TableCell>
                      <TableCell>{format(new Date(record.record_time), 'HH:mm:ss')}</TableCell>
                      <TableCell>{getRecordTypeDisplay(record.record_type)}</TableCell>
                      <TableCell>{record.status}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center">本周無打卡紀錄。</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
