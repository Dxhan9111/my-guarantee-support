import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/ui/Common';
import { useAuth } from '../App';
import { getLogs, MOCK_LOGS } from '../services/mockService';
import { OperationLog } from '../types';
import { User, Lock, History } from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'logs'>('profile');

  useEffect(() => {
    getLogs().then(setLogs);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">个人设置</h1>

      <div className="flex space-x-4 border-b border-slate-200">
        <button
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('profile')}
        >
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>个人资料</span>
          </div>
        </button>
        <button
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('logs')}
        >
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>操作日志</span>
          </div>
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2" title="基本信息">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-2xl font-bold">
                  {user?.name.charAt(0)}
                </div>
                <div>
                  <Button size="sm" variant="outline">更换头像</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="姓名" defaultValue={user?.name} />
                <Input label="用户名" defaultValue={user?.username} disabled className="bg-slate-50" />
                <Input label="邮箱" defaultValue={user?.email} />
                <Input label="角色" defaultValue={user?.role} disabled className="bg-slate-50" />
              </div>
              <div className="pt-4 flex justify-end">
                <Button>保存修改</Button>
              </div>
            </div>
          </Card>
          
          <Card title="安全设置">
            <div className="space-y-4">
               <div>
                 <h4 className="text-sm font-medium text-slate-700 flex items-center">
                   <Lock className="w-4 h-4 mr-2" /> 修改密码
                 </h4>
                 <div className="mt-3 space-y-3">
                   <Input type="password" placeholder="当前密码" />
                   <Input type="password" placeholder="新密码" />
                   <Input type="password" placeholder="确认新密码" />
                   <Button variant="secondary" className="w-full">更新密码</Button>
                 </div>
               </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'logs' && (
        <Card title="最近操作日志">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">操作类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">详情</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">操作人</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {log.user}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Settings;