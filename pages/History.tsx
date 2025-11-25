import React, { useEffect, useState } from 'react';
import { Card, Input, Badge, Button } from '../components/ui/Common';
import { getProjects } from '../services/mockService';
import { Project, BondTypeLabels, ProjectStatus } from '../types';
import { Search, Filter, Download, Eye, FileText } from 'lucide-react';

const History: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const filteredProjects = projects.filter(p => 
    p.name.includes(filter) || p.customerName.includes(filter)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">报告历史</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
             <Input 
               className="pl-9" 
               placeholder="搜索项目或客户名称..." 
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
             />
          </div>
          <Button variant="outline" className="px-3">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">项目信息</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">生成时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredProjects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{p.name}</div>
                        <div className="text-sm text-slate-500">{p.customerName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {BondTypeLabels[p.bondType]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(p.updateTime).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={p.status === ProjectStatus.APPROVED ? 'success' : 'default'}>{p.status}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                       <button className="text-slate-400 hover:text-primary-600" title="预览">
                         <Eye className="w-4 h-4" />
                       </button>
                       <button className="text-slate-400 hover:text-primary-600" title="下载 PDF">
                         <Download className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    没有找到相关记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Mock */}
        <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                显示 <span className="font-medium">1</span> 到 <span className="font-medium">{filteredProjects.length}</span> 条，共 <span className="font-medium">{filteredProjects.length}</span> 条
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">上一页</button>
                <button className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-primary-600 hover:bg-slate-50">1</button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50">下一页</button>
              </nav>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default History;