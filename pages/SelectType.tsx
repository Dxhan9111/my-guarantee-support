import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Common';
import { BondType, BondTypeLabels, BondTypeDescriptions } from '../types';
import { Briefcase, Shield, Banknote, Award, Users, ArrowRight } from 'lucide-react';

const SelectType: React.FC = () => {
  const navigate = useNavigate();

  const types = [
    { id: BondType.BID, icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { id: BondType.PERFORMANCE, icon: Shield, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
    { id: BondType.ADVANCE_PAYMENT, icon: Banknote, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    { id: BondType.QUALITY, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    { id: BondType.MIGRANT_WORKER, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  ];

  const handleSelect = (typeId: string) => {
    navigate(`/app/create/upload/${typeId}`);
  };

  return (
    <div className="pb-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto pt-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-4">
          选择业务类型
        </h1>
        <p className="text-slate-400 text-lg">请根据客户需求选择相应的保函业务类型，系统将自动配置资料清单。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {types.map((type) => (
          <div 
            key={type.id} 
            className="group relative flex flex-col glass-panel rounded-2xl cursor-pointer transition-all duration-300 hover:bg-white/5 hover:border-white/20 hover:-translate-y-2 hover:shadow-xl"
            onClick={() => handleSelect(type.id)}
          >
            <div className="p-8 flex-1 flex flex-col items-center text-center">
              <div className={`
                w-20 h-20 rounded-2xl flex items-center justify-center mb-6 
                ${type.bg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
              `}>
                <type.icon className={`w-10 h-10 ${type.color}`} />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                {BondTypeLabels[type.id as BondType]}
              </h3>
              
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {BondTypeDescriptions[type.id as BondType]}
              </p>
            </div>

            <div className="p-6 pt-0 mt-auto w-full">
              <Button variant="ghost" className="w-full bg-slate-800/50 hover:bg-blue-600 hover:text-white transition-all">
                立即办理 <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectType;