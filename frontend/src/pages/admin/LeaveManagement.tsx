import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, FileText, CheckCircle, XCircle, Eye } from 'lucide-react';
import api from '../../services/api';
import { Button } from '@/components/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/components/ui/select";
import { Textarea } from "@/components/components/ui/textarea";
import { Label } from "@/components/components/ui/label";

interface LeaveApplication {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by?: number;
  reviewed_at?: string;
  review_comment?: string;
  created_at: string;
}

interface LeaveType {
  value: string;
  label: string;
}

const LeaveManagement: React.FC = () => {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');

  useEffect(() => {
    loadLeaveTypes();
    loadApplications();
  }, []);

  const loadLeaveTypes = async () => {
    try {
      const response = await api.get('/leaves/types');
      setLeaveTypes(response.data);
    } catch (error) {
      console.error('Failed to load leave types:', error);
    }
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/leaves/');
      setApplications(response.data);
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: `載入請假申請失敗: ${error.response?.data?.detail || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const getLeaveTypeLabel = (value: string) => {
    const type = leaveTypes.find(t => t.value === value);
    return type ? type.label : value;
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

  const handleReviewApplication = async () => {
    if (!selectedApplication) return;

    try {
      await api.put(`/leaves/${selectedApplication.id}/review`, {
        status: reviewAction,
        review_comment: reviewComment
      });

      setAlert({ type: 'success', message: `請假申請已${reviewAction === 'approved' ? '核准' : '拒絕'}` });
      setShowReviewModal(false);
      setSelectedApplication(null);
      setReviewComment('');
      loadApplications(); // Reload applications
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.response?.data?.detail || '審核失敗，請稍後再試'
      });
    }
  };

  const openReviewModal = (application: LeaveApplication, action: 'approved' | 'rejected') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
  };

  const formatDateShort = (dateString: string) => {
    return format(new Date(dateString), 'MM/dd');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">請假申請管理</h1>
        <div className="flex items-center space-x-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="篩選狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="pending">待審核</SelectItem>
              <SelectItem value="approved">已核准</SelectItem>
              <SelectItem value="rejected">已拒絕</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadApplications} disabled={loading}>
            {loading ? '載入中...' : '重新載入'}
          </Button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <Alert className={alert.type === 'error' ? 'border-red-200' : 'border-green-200'}>
          {alert.type === 'error' ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertTitle>{alert.type === 'error' ? '錯誤' : '成功'}</AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            請假申請列表 ({filteredApplications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">載入中...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filterStatus === 'all' ? '暫無請假申請' : `暫無${getStatusText(filterStatus)}的申請`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申請人</TableHead>
                    <TableHead>請假類型</TableHead>
                    <TableHead>請假時間</TableHead>
                    <TableHead>事由</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>申請時間</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {app.user.first_name} {app.user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{app.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getLeaveTypeLabel(app.leave_type)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {formatDateShort(app.start_date)} - {formatDateShort(app.end_date)}
                          </div>
                          <div className="flex items-center text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(app.start_date), 'HH:mm')} - {format(new Date(app.end_date), 'HH:mm')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={app.reason}>
                          {app.reason}
                        </div>
                        {app.review_comment && (
                          <div className="text-xs text-gray-500 mt-1">
                            審核備註: {app.review_comment}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {getStatusText(app.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(app.created_at)}
                      </TableCell>
                      <TableCell>
                        {app.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => openReviewModal(app, 'approved')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              核准
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => openReviewModal(app, 'rejected')}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              拒絕
                            </Button>
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

      {/* Review Modal */}
      {showReviewModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {reviewAction === 'approved' ? '核准' : '拒絕'}請假申請
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>申請人:</strong> {selectedApplication.user.first_name} {selectedApplication.user.last_name}
              </div>
              <div>
                <strong>請假類型:</strong> {getLeaveTypeLabel(selectedApplication.leave_type)}
              </div>
              <div>
                <strong>請假時間:</strong> {formatDate(selectedApplication.start_date)} - {formatDate(selectedApplication.end_date)}
              </div>
              <div>
                <strong>請假事由:</strong> {selectedApplication.reason}
              </div>
              <div>
                <Label htmlFor="reviewComment">審核備註</Label>
                <Textarea
                  id="reviewComment"
                  placeholder="請輸入審核備註（可選）..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewModal(false)}
                >
                  取消
                </Button>
                <Button
                  className={reviewAction === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  onClick={handleReviewApplication}
                >
                  確認{reviewAction === 'approved' ? '核准' : '拒絕'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;