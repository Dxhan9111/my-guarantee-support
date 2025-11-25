import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button, Input } from '../components/ui/Common';
import { ShieldCheck, Lock, User } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      login();
      navigate('/app/home');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden bg-slate-900">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80"></div>
      
      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl shadow-2xl shadow-blue-600/30 transform rotate-12 hover:rotate-0 transition-transform duration-500">
             <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            保函通业务系统
          </h1>
          <p className="text-slate-400 text-sm">智能 · 高效 · 安全的非融资担保业务平台</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl relative">
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="text-center mb-4">
              <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium">
                系统运行正常
              </span>
            </div>
            
            <Input 
              label="账号" 
              placeholder="请输入用户名" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />

            <Input 
              label="密码" 
              type="password" 
              placeholder="请输入密码" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-slate-400 hover:text-white cursor-pointer select-none">
                <input type="checkbox" className="mr-2 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-offset-0" />
                保持登录
              </label>
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">忘记密码？</a>
            </div>

            <Button type="submit" size="lg" className="w-full text-base shadow-xl shadow-blue-600/20" isLoading={isLoading}>
               <Lock className="w-4 h-4 mr-2" />
               安全登录
            </Button>
          </form>
          
        </div>
        
        <p className="text-center text-slate-500 text-xs mt-8">
          © 2025 重庆三峡融资担保集团. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;