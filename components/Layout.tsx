import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { LayoutDashboard, FileText, Clock, Settings, LogOut, Menu, X, PlusCircle, Bell, ChevronRight, User, ShieldCheck } from 'lucide-react';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: '工作台', path: '/app/home', icon: LayoutDashboard },
    { name: '新建业务', path: '/app/create/select', icon: PlusCircle },
    { name: '业务档案', path: '/app/history', icon: Clock },
    { name: '系统设置', path: '/app/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/home')) return '工作台';
    if (path.includes('/create/select')) return '业务类型选择';
    if (path.includes('/create/upload')) return '资料采集与录入';
    if (path.includes('/create/preview')) return '报告预览与归档';
    if (path.includes('/history')) return '业务档案';
    if (path.includes('/settings')) return '系统设置';
    return '系统就绪';
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent">
      {/* Mobile Header */}
      <div className="md:hidden glass-panel border-b border-white/10 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">保</div>
           <span className="font-bold text-white text-lg">保函通</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 glass-panel border-r border-white/5 text-slate-300 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarOpen ? 'md:w-64' : 'md:w-20'}
        flex flex-col
      `}>
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-center border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap px-4">
             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/30">
                <ShieldCheck className="w-6 h-6" />
             </div>
             {sidebarOpen && (
               <div className="flex flex-col">
                 <span className="font-bold text-lg text-white">保函通</span>
                 <span className="text-xs text-slate-400">智能业务系统</span>
               </div>
             )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-3 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-4 py-3 rounded-xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/10'}
                ${!sidebarOpen && 'justify-center'}
              `}
              onClick={() => setMobileMenuOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${sidebarOpen && 'mr-3'}`} />
                  {sidebarOpen && <span className="font-medium">{item.name}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-black/10">
          <div className={`flex items-center ${!sidebarOpen && 'justify-center'}`}>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm font-semibold text-white">
                {user?.name.charAt(0)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
            </div>
            {sidebarOpen && (
              <div className="ml-3 flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">客户经理</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 ml-2 transition-all p-2 rounded-full hover:bg-white/5" title="退出登录">
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Toggle Button */}
        <div className="hidden md:flex justify-end p-2 border-t border-white/5">
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors">
             {sidebarOpen ? <Menu className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 z-10 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center">
             <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-3">
                {getPageTitle()}
             </h2>
          </div>
          <div className="flex items-center space-x-6">
            <button className="text-slate-400 hover:text-white relative group transition-transform hover:scale-110">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-900"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 z-10 relative scrollbar-thin">
          <div className="max-w-7xl mx-auto w-full pb-10">
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};