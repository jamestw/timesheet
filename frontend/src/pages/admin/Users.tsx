
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useUser } from '../../contexts/UserContext';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/components/ui/dialog';
import { Input } from '@/components/components/ui/input';
import { Label } from '@/components/components/ui/label';
import { Switch } from '@/components/components/ui/switch';

// Interfaces
interface Company { id: number; name: string; }
interface Department { id: number; name: string; }
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_active: boolean;
  department_id: number | null;
}

type UserEditData = {
  first_name?: string | null;
  last_name?: string | null;
  password?: string;
  role?: string;
  department_id?: number | null;
  is_active?: boolean;
};

const UsersComponent: React.FC = () => {
  const { user: loggedInUser, isLoading: isUserLoading } = useUser();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add User State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'employee', department_id: '' });

  // Edit User State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<UserEditData>({});

  const isSuperAdmin = loggedInUser?.role === 'super_admin';

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
      const response = await api.get(`/companies/${companyId}/departments/`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      setDepartments([]);
    }
  }, []);

  const fetchUsers = useCallback(async (companyId: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/companies/${companyId}/users/`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        if (selectedCompany !== companyIdToUse) {
            setSelectedCompany(companyIdToUse);
        }
      }

      if (companyIdToUse) {
        if (!departments.length) fetchDepartments(companyIdToUse);
        if (!users.length) fetchUsers(companyIdToUse);
      } else {
        setUsers([]);
        setDepartments([]);
      }
    }
  }, [loggedInUser, isUserLoading, selectedCompany, isSuperAdmin, fetchDepartments, fetchUsers, departments.length, users.length]);


  const handleOpenEditDialog = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      department_id: user.department_id,
      is_active: user.is_active,
      password: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEditFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleEditSelectChange = (field: keyof UserEditData) => (value: string) => {
    const val = field === 'department_id' ? Number(value) : value;
    setEditFormData(prev => ({ ...prev, [field]: val }));
  };
  
  const handleEditSwitchChange = (field: keyof UserEditData) => (checked: boolean) => {
    setEditFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !selectedCompany) return;
    const updatePayload: UserEditData = { ...editFormData };
    if (!updatePayload.password) {
      delete updatePayload.password;
    }

    try {
      await api.put(`/companies/${selectedCompany}/users/${editingUser.id}/`, updatePayload);
      setIsEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers(selectedCompany);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const getFullName = (user: User) => [user.first_name, user.last_name].filter(Boolean).join(' ') || 'N/A';

  if (isUserLoading) return <p>載入使用者資訊中...</p>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>使用者管理</CardTitle>
        <div className="flex items-center gap-4">
          {isSuperAdmin && (
            <Select onValueChange={setSelectedCompany} value={selectedCompany || undefined}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="選擇公司" /></SelectTrigger>
              <SelectContent>{companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedCompany}>新增使用者</Button>
            </DialogTrigger>
            <DialogContent> {/* ... Add User Dialog Content ... */}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>使用者名稱</TableHead>
              <TableHead>全名</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>啟用</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center">載入中...</TableCell></TableRow>
            ) : users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{getFullName(user)}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.is_active ? '是' : '否'}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(user)}>編輯</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>編輯使用者: {editingUser?.username}</DialogTitle>
            <DialogDescription>修改使用者資料，完成後點擊儲存。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first_name" className="text-right">名字</Label>
              <Input id="first_name" value={editFormData.first_name || ''} onChange={handleEditFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_name" className="text-right">姓氏</Label>
              <Input id="last_name" value={editFormData.last_name || ''} onChange={handleEditFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">新密碼</Label>
              <Input id="password" type="password" placeholder="留空則不修改" onChange={handleEditFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department_id" className="text-right">部門</Label>
              <Select onValueChange={handleEditSelectChange('department_id')} value={String(editFormData.department_id || '')}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="選擇部門" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">角色</Label>
              <Select onValueChange={handleEditSelectChange('role')} value={editFormData.role}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="選擇角色" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="department_head">Department Head</SelectItem>
                  {isSuperAdmin && <SelectItem value="company_admin">Company Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">啟用狀態</Label>
              <Switch id="is_active" checked={editFormData.is_active} onCheckedChange={handleEditSwitchChange('is_active')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateUser}>儲存變更</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UsersComponent;
