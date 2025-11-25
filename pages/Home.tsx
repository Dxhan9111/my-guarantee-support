
import React, { useEffect, useState, useMemo } from 'react';
import { Card, Button } from '../components/ui/Common';
import { getProjects, updateProjectStatus } from '../services/mockService';
import { Project, ProjectStatus, BondTypeLabels } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Plus, Clock, ChevronRight, TrendingUp, Briefcase, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  const fetchProjects = () => {
    getProjects().then(setProjects);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    await updateProjectStatus(projectId, newStatus as ProjectStatus);
    fetchProjects();
  };

  // Generate real chart data from projects (Last 7 days)
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
      
      const count = projects.filter(p => {
        // Handle ISO string comparison roughly
        return p.createTime.startsWith(dateKey);
      }).length;
      
      data.push({ name: label, count });
    }
    return data;
  }, [projects]);

  const stats = [
    { label: '新增任务', value: projects.length.toString(), icon: Plus, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: '待评审', value: projects.filter(p => p.status === ProjectStatus.REVIEWING).length.toString(), icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: '已通过', value: projects.filter(p => p.status === ProjectStatus.APPROVED).length.toString(), icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: '已归档', value: projects.filter(p => p.status === ProjectStatus.COMPLETED).length.toString(), icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  ];

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.APPROVED: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case ProjectStatus.REVIEWING: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case ProjectStatus.REJECTED: return 'bg-red-500/10 text-red-400 border-red-500/20';
      case ProjectStatus.COMPLETED: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-700/50 text-slate-400 border-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
             工作台
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            欢迎回来，今日系统运行正常，所有服务已就绪。
          </p>
        </div>
        <Button onClick={() => navigate('/app/create/select')} size="lg" className="shadow-lg shadow-blue-600/20">
          <Plus className="w-5 h-5 mr-2" />
          新建保函业务
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-2xl flex items-center justify-between transition-transform hover:-translate-y-1">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">{stat.label}</p>
              <h2 className="text-3xl font-bold text-white">{stat.value}</h2>
            </div>
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
               <stat.icon className="w-8 h-8" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Project Grid */}
        <div className="lg:col-span-2 space-y-6">
           <Card title="进行中的业务">
             <div className="overflow-x-auto">
               <table className="min-w-full text-left">
                 <thead>
                   <tr className="border-b border-white/5 text-xs font-medium text-slate-400">
                     <th className="px-6 py-4 whitespace-nowrap">项目名称 / 客户</th>
                     <th className="px-6 py-4 whitespace-nowrap">保函类型</th>
                     <th className="px-6 py-4 whitespace-nowrap">当前状态</th>
                     <th className="px-6 py-4 text-right whitespace-nowrap">操作</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {projects.length > 0 ? (
                     projects.slice(0, 8).map((p) => (
                       <tr key={p.id} className="group hover:bg-white/5 transition-colors">
                         <td className="px-6 py-4 align-middle">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate max-w-[200px]" title={p.name}>{p.name}</span>
                              <span className="text-xs text-slate-500 truncate max-w-[200px]">{p.customerName}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4 align-middle whitespace-nowrap">
                            <span className="text-xs font-medium text-slate-300 bg-slate-700/50 px-2.5 py-1 rounded-full border border-slate-600 inline-block">
                               {BondTypeLabels[p.bondType]}
                            </span>
                         </td>
                         <td className="px-6 py-4 align-middle whitespace-nowrap">
                           <select 
                             value={p.status} 
                             onChange={(e) => handleStatusChange(p.id, e.target.value)}
                             className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer outline-none transition-all appearance-none ${getStatusColor(p.status)}`}
                           >
                             <option className="bg-slate-800 text-slate-300" value={ProjectStatus.DRAFT}>草稿</option>
                             <option className="bg-slate-800 text-slate-300" value={ProjectStatus.REVIEWING}>待评审</option>
                             <option className="bg-slate-800 text-slate-300" value={ProjectStatus.APPROVED}>已通过</option>
                             <option className="bg-slate-800 text-slate-300" value={ProjectStatus.REJECTED}>已驳回</option>
                             <option className="bg-slate-800 text-slate-300" value={ProjectStatus.COMPLETED}>已完成</option>
                           </select>
                         </td>
                         <td className="px-6 py-4 text-right align-middle whitespace-nowrap">
                           <button onClick={() => navigate('/app/history')} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                              <ChevronRight className="w-5 h-5" />
                           </button>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr>
                       <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                         暂无进行中的业务
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </Card>
        </div>

        {/* Analytics & Tools */}
        <div className="space-y-6">
          <Card title="业务量趋势 (近7天)">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b'}} 
                    interval={0}
                    padding={{ left: 10, right: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px' }}
                    itemStyle={{ color: '#60a5fa' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between items-center text-sm text-slate-400 border-t border-white/5 pt-4">
               <span>近期活跃度</span>
               <span className="text-emerald-400 flex items-center gap-1 font-bold"><TrendingUp className="w-4 h-4" /> 正常</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
