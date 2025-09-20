import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Button } from '@/components/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
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
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  attendance_distance_limit: number;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    attendance_distance_limit: '100',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
  });

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewCompany((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddCompany = async () => {
    try {
      // Prepare data with proper type conversion for latitude/longitude/distance
      const companyData = {
        ...newCompany,
        latitude: newCompany.latitude ? parseFloat(newCompany.latitude) : null,
        longitude: newCompany.longitude ? parseFloat(newCompany.longitude) : null,
        attendance_distance_limit: newCompany.attendance_distance_limit ? parseFloat(newCompany.attendance_distance_limit) : 100.0,
      };

      if (isEditMode && editingCompanyId) {
        await api.put(`/companies/${editingCompanyId}`, companyData);
      } else {
        await api.post('/companies', companyData);
      }
      setIsDialogOpen(false);
      setIsEditMode(false);
      setEditingCompanyId(null);
      resetForm();
      fetchCompanies();
    } catch (error) {
      console.error('Failed to save company:', error);
    }
  };

  const handleEditCompany = (company: Company) => {
    setNewCompany({
      name: company.name,
      address: company.address || '',
      latitude: company.latitude?.toString() || '',
      longitude: company.longitude?.toString() || '',
      attendance_distance_limit: company.attendance_distance_limit?.toString() || '100',
      contact_person: company.contact_person || '',
      contact_email: company.contact_email || '',
      contact_phone: company.contact_phone || '',
    });
    setEditingCompanyId(company.id);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteCompany = async (companyId: number) => {
    if (window.confirm('確定要刪除這家公司嗎？')) {
      try {
        await api.delete(`/companies/${companyId}`);
        fetchCompanies();
      } catch (error) {
        console.error('Failed to delete company:', error);
      }
    }
  };

  const resetForm = () => {
    setNewCompany({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      attendance_distance_limit: '100',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
    });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsEditMode(false);
      setEditingCompanyId(null);
      resetForm();
    }
    setIsDialogOpen(open);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>公司管理</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>新增公司</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? '編輯公司' : '新增公司'}</DialogTitle>
              <DialogDescription>
                {isEditMode ? '修改公司資料。完成後點擊儲存。' : '在這裡新增你的公司。完成後點擊儲存。'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  公司名稱
                </Label>
                <Input id="name" value={newCompany.name} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  地址
                </Label>
                <Input id="address" value={newCompany.address} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="latitude" className="text-right">
                  緯度
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="例如: 25.033"
                  value={newCompany.latitude}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="longitude" className="text-right">
                  經度
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="例如: 121.565"
                  value={newCompany.longitude}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="attendance_distance_limit" className="text-right">
                  打卡距離限制 (公尺)
                </Label>
                <Input
                  id="attendance_distance_limit"
                  type="number"
                  min="10"
                  max="5000"
                  step="10"
                  placeholder="例如: 100"
                  value={newCompany.attendance_distance_limit}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact_person" className="text-right">
                  聯絡人
                </Label>
                <Input id="contact_person" value={newCompany.contact_person} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact_email" className="text-right">
                  聯絡信箱
                </Label>
                <Input id="contact_email" value={newCompany.contact_email} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact_phone" className="text-right">
                  聯絡電話
                </Label>
                <Input id="contact_phone" value={newCompany.contact_phone} onChange={handleInputChange} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddCompany}>
                {isEditMode ? '更新' : '儲存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>公司名稱</TableHead>
              <TableHead>地址</TableHead>
              <TableHead>緯度</TableHead>
              <TableHead>經度</TableHead>
              <TableHead>打卡距離限制(m)</TableHead>
              <TableHead>聯絡人</TableHead>
              <TableHead>聯絡信箱</TableHead>
              <TableHead>聯絡電話</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={10} className="text-center">載入中...</TableCell></TableRow>
            ) : companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell>{company.id}</TableCell>
                <TableCell>{company.name}</TableCell>
                <TableCell>{company.address || '-'}</TableCell>
                <TableCell>{company.latitude || '-'}</TableCell>
                <TableCell>{company.longitude || '-'}</TableCell>
                <TableCell>{company.attendance_distance_limit || 100}m</TableCell>
                <TableCell>{company.contact_person || '-'}</TableCell>
                <TableCell>{company.contact_email || '-'}</TableCell>
                <TableCell>{company.contact_phone || '-'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCompany(company)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCompany(company.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Companies;
