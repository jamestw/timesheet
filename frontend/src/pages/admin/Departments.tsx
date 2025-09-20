import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
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

interface Company {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  company_id: number;
}

const Departments: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: '' });

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  }, []);

  const fetchDepartments = useCallback(async (companyId: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/companies/${companyId}/departments/`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (selectedCompany) {
      fetchDepartments(selectedCompany);
    }
  }, [selectedCompany, fetchDepartments]);

  const handleAddDepartment = async () => {
    if (!selectedCompany) return;
    try {
      await api.post(`/companies/${selectedCompany}/departments/`, newDepartment);
      setIsDialogOpen(false);
      fetchDepartments(selectedCompany);
    } catch (error) {
      console.error('Failed to add department:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>部門管理</CardTitle>
        <div className="flex items-center gap-4">
          <Select onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-[180px]">
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedCompany}>新增部門</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>新增部門</DialogTitle>
                <DialogDescription>
                  在這裡新增你的部門。完成後點擊儲存。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    部門名稱
                  </Label>
                  <Input
                    id="name"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({ name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddDepartment}>儲存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>部門名稱</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={2} className="text-center">載入中...</TableCell></TableRow>
            ) : departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell>{department.id}</TableCell>
                <TableCell>{department.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Departments;