import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, LogOut, AlertCircle, Calendar } from 'lucide-react';

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

import { useUser } from '../contexts/UserContext';
import BottomNavigation from '../components/BottomNavigation';


// Define the structure of an attendance record
interface AttendanceRecord {
  id: number;
  record_time: string;
  record_type: 'check_in' | 'check_out' | 'other';
  status: string;
}

type AttendanceType = 'check-in' | 'check-out' | 'other';


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [attendanceType, setAttendanceType] = useState<AttendanceType>(() => {
    // Default to morning/afternoon based on current time
    const currentHour = new Date().getHours();
    return currentHour < 12 ? 'check-in' : 'check-out';
  });
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'company_admin';

  // Debug logging
  console.log("Dashboard - Current user:", user);
  console.log("Dashboard - User role:", user?.role);
  console.log("Dashboard - Is admin:", isAdmin);

  // Get current time info for display
  const getCurrentTimeInfo = () => {
    const now = new Date();
    const hour = now.getHours();
    const period = hour < 12 ? '上午' : '下午';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const time = `${displayHour}:${now.getMinutes().toString().padStart(2, '0')}`;

    return {
      date: format(now, 'yyyy年M月d日 EEEE', { locale: undefined }),
      time: `${time}${period}`,
      period
    };
  };

  const timeInfo = getCurrentTimeInfo();

  const fetchTodayAttendanceRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const params = {
        start_date: format(today, 'yyyy-MM-dd'),
        end_date: format(today, 'yyyy-MM-dd'),
      };

      const response = await api.get('/attendance/records', { params });
      setAttendanceRecords(response.data);
    } catch (error: any) {
      console.error('Failed to fetch attendance records:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayAttendanceRecords();
  }, [fetchTodayAttendanceRecords]);

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
        fetchTodayAttendanceRecords(); // Refresh records after action
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

  const getRecordTypeDisplay = (type: string) => {
    switch (type) {
      case 'check_in': return '上班';
      case 'check-in': return '上班';
      case 'check_out': return '下班';
      case 'check-out': return '下班';
      default: return '其他';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-800">U-Clock</h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                後台
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-6 py-8">
        {/* Date and Time Display */}
        <div className="text-center mb-8">
          <p className="text-gray-600 text-sm mb-2">{timeInfo.date}</p>
          <h2 className="text-4xl font-bold text-gray-800 mb-1">{timeInfo.time}</h2>
        </div>

        {/* Error/Success Message */}
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6 max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{message.type === 'error' ? '錯誤' : '成功'}</AlertTitle>
            <AlertDescription className="text-sm">
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Attendance Type Toggle */}
        <div className="mb-8">
          <ToggleGroup
            type="single"
            value={attendanceType}
            onValueChange={(value: AttendanceType) => {
              if (value) setAttendanceType(value);
            }}
            className="bg-gray-100 p-1 rounded-lg"
          >
            <ToggleGroupItem
              value="check-in"
              className="data-[state=on]:bg-green-600 data-[state=on]:text-white data-[state=on]:shadow-md px-6 py-2 rounded-md transition-all text-gray-700 hover:text-gray-900"
            >
              上班
            </ToggleGroupItem>
            <ToggleGroupItem
              value="check-out"
              className="data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-md px-6 py-2 rounded-md transition-all text-gray-700 hover:text-gray-900"
            >
              下班
            </ToggleGroupItem>
            <ToggleGroupItem
              value="other"
              disabled
              className="px-6 py-2 rounded-md opacity-50 cursor-not-allowed text-gray-400"
            >
              其他
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Punch Button */}
        <Button
          size="lg"
          className={`w-40 h-40 rounded-full text-lg shadow-lg hover:shadow-xl transition-all ${
            attendanceType === 'check-in'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={handlePunch}
        >
          <div className="flex flex-col items-center">
            <Clock className="w-10 h-10 mb-2" />
            <span className="text-white font-medium">打卡</span>
          </div>
        </Button>

        {/* User Info */}
        {user?.email && (
          <p className="text-gray-500 text-sm mt-8">
            {user.email}
          </p>
        )}
      </div>

      {/* Today's Attendance Records */}
      <div className="px-4 pb-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Calendar className="mr-2 h-4 w-4" />
              今日打卡紀錄
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-gray-500 text-sm">載入中...</div>
            ) : attendanceRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">時間</TableHead>
                    <TableHead className="text-xs">類型</TableHead>
                    <TableHead className="text-xs">狀態</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm py-2">
                        {format(new Date(record.record_time), 'HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-sm py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.record_type === 'check_in'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {getRecordTypeDisplay(record.record_type)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          record.status === 'normal'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status === 'normal' ? '正常' : record.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>今日尚無打卡紀錄</p>
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

export default Dashboard;
