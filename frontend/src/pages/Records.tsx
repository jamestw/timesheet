import React, { useState, useEffect, useCallback } from 'react';
import { startOfMonth, endOfMonth, format, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar, Clock, Filter } from 'lucide-react';

import api from '../services/api';
import { Button } from '@/components/components/ui/button';
import {
  Card,
  CardContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/components/ui/select"

import BottomNavigation from '../components/BottomNavigation';

interface AttendanceRecord {
  id: number;
  record_time: string;
  record_type: 'check_in' | 'check_out' | 'other';
  status: string;
}

type DateRange = 'week' | 'month' | 'all';

const Records: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('week');

  const getRecordTypeDisplay = (type: string) => {
    switch (type) {
      case 'check_in': return '上班';
      case 'check-in': return '上班';
      case 'check_out': return '下班';
      case 'check-out': return '下班';
      default: return '其他';
    }
  };

  const getDateRangeParams = () => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (dateRange) {
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'all':
        startDate = new Date(today.getFullYear(), 0, 1); // Start of year
        endDate = today;
        break;
      default:
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
    }

    return {
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
    };
  };

  const fetchAttendanceRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = getDateRangeParams();
      const response = await api.get('/attendance/records', { params });
      setAttendanceRecords(response.data);
    } catch (error: any) {
      console.error('Failed to fetch attendance records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  const getRangeLabel = () => {
    switch (dateRange) {
      case 'week': return '本周';
      case 'month': return '本月';
      case 'all': return '全部';
      default: return '本周';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-800">打卡紀錄</h1>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="all">全部</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Calendar className="mr-2 h-5 w-5" />
              {getRangeLabel()}打卡紀錄 ({attendanceRecords.length} 筆)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">載入中...</div>
            ) : attendanceRecords.length > 0 ? (
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
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {format(new Date(record.record_time), 'MM/dd (E)')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.record_time), 'HH:mm')}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.record_type === 'check_in'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {getRecordTypeDisplay(record.record_type)}
                        </span>
                      </TableCell>
                      <TableCell>
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
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>暫無{getRangeLabel()}打卡紀錄</p>
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

export default Records;