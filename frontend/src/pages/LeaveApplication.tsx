import React from 'react';
import { Calendar, Construction, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/components/ui/card"
import BottomNavigation from '../components/BottomNavigation';

const LeaveApplication: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-800">請假申請</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Calendar className="mr-2 h-5 w-5" />
              請假申請系統
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Construction className="w-20 h-20 mx-auto mb-6 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">功能開發中</h3>
              <p className="text-gray-500 mb-6">
                請假申請功能正在開發中，敬請期待！
              </p>

              <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-blue-800 font-medium">預計功能</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-2 text-left">
                  <li>• 病假申請</li>
                  <li>• 事假申請</li>
                  <li>• 特休申請</li>
                  <li>• 申請狀態查詢</li>
                  <li>• 主管審核流程</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default LeaveApplication;