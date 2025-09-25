import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useUser } from '../../contexts/UserContext'; // Import useUser
import { Button } from '@/components/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/components/ui/select';
import { Calendar } from '@/components/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/components/lib/utils';

// Interfaces
interface Company {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface User {
  id: number;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
}

interface AttendanceRecord {
  id: number;
  record_time: string;
  record_type: string;
  status: string;
  user: User;
  company: Company;
}

const Attendance: React.FC = () => {
  const { user: loggedInUser, isLoading: isUserLoading } = useUser();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isSuperAdmin = loggedInUser?.role === 'super_admin';

  // --- Data Fetching Callbacks ---
  const fetchCompanies = useCallback(async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  }, []);

  const fetchDepartments = useCallback(async (companyId: string) => {
    try {
      const response = await api.get(`/companies/${companyId}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      setDepartments([]);
    }
  }, []);

  const fetchUsers = useCallback(async (companyId: string) => {
    try {
      const response = await api.get(`/companies/${companyId}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    }
  }, []);

  // --- Main Logic Hooks ---
  useEffect(() => {
    if (isSuperAdmin) {
      fetchCompanies();
    }
  }, [isSuperAdmin, fetchCompanies]);

  useEffect(() => {
    if (!isUserLoading && loggedInUser) {
      let companyIdToUse: string | null = null;
      if (isSuperAdmin) {
        companyIdToUse = selectedCompany;
      } else {
        companyIdToUse = String(loggedInUser.company_id);
      }

      if (companyIdToUse) {
        fetchDepartments(companyIdToUse);
        fetchUsers(companyIdToUse);
      } else {
        setDepartments([]);
        setUsers([]);
      }
      // Reset selections when company changes
      setSelectedDepartment(null);
      setSelectedUser(null);
    }
  }, [selectedCompany, loggedInUser, isUserLoading, isSuperAdmin, fetchDepartments, fetchUsers]);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      
      if (isSuperAdmin) {
        if (selectedCompany) params.company_id = selectedCompany;
      } else if (loggedInUser) {
        params.company_id = loggedInUser.company_id;
      }

      if (selectedDepartment) params.department_id = selectedDepartment;
      if (selectedUser) params.user_id = selectedUser;
      if (startDate) params.start_date = format(startDate, 'yyyy-MM-dd');
      if (endDate) params.end_date = format(endDate, 'yyyy-MM-dd');

      const response = await api.get('/attendance/records', { params });
      setAttendanceRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompany, selectedDepartment, selectedUser, startDate, endDate, isSuperAdmin, loggedInUser]);

  if (isUserLoading) {
    return <p>載入使用者資訊中...</p>;
  }

  const getFullName = (user: User) => {
    return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>打卡紀錄</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {isSuperAdmin && (
            <Select onValueChange={setSelectedCompany} value={selectedCompany || ''}>
              <SelectTrigger>
                <SelectValue placeholder="選擇公司" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={String(company.id)}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {isSuperAdmin && (
            <Select onValueChange={setSelectedDepartment} value={selectedDepartment || ''} disabled={!selectedCompany && isSuperAdmin}>
              <SelectTrigger>
                <SelectValue placeholder="選擇部門" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select onValueChange={setSelectedUser} value={selectedUser || ''} disabled={!selectedCompany && isSuperAdmin}>
            <SelectTrigger>
              <SelectValue placeholder="選擇使用者" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={String(user.id)}>
                  {getFullName(user)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 items-center col-span-2 md:col-span-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "yyyy-MM-dd") : "開始日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "yyyy-MM-dd") : "結束日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /></PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleSearch} className="col-span-full md:col-span-1">查詢</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              {isSuperAdmin && <TableHead>公司</TableHead>}
              <TableHead>使用者</TableHead>
              <TableHead>時間</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>狀態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={isSuperAdmin ? 6 : 5} className="text-center">載入中...</TableCell></TableRow>
            ) : attendanceRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.id}</TableCell>
                {isSuperAdmin && <TableCell>{record.company.name}</TableCell>}
                <TableCell>{getFullName(record.user)}</TableCell>
                <TableCell>{format(new Date(record.record_time), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                <TableCell>{record.record_type}</TableCell>
                <TableCell>{record.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Attendance;