
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Modal, Badge } from '../components/ui/Common';
import { BondTypeLabels, BondType, Project, ReportData } from '../types';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Loader2, Sparkles, Wand2, BrainCircuit, Trash2, FolderOpen, Files, ArrowDown, LayoutList, Layers, ShieldCheck, Building2, Cpu, ScanLine } from 'lucide-react';
import { getProjects } from '../services/mockService';
import { analyzeDocuments, extractBasicInfo, classifyFiles } from '../services/aiService';

// --- Granular Item Types ---
type BusinessMode = 'CREDIT_ENTERPRISE' | 'NON_CREDIT_ENTERPRISE'; 

interface UploadItem {
  id: string;
  label: string;
  description?: string;
  required: boolean;
}

interface UploadGroup {
  id: string;
  title: string;
  items: UploadItem[];
}

// --- Configuration Factory ---
const getChecklistConfig = (bondType: string, mode: BusinessMode): UploadGroup[] => {
  const basicItems: UploadItem[] = [
    { id: 'license', label: '营业执照复印件', required: true },
    { id: 'articles', label: '公司章程', required: true },
    { id: 'legal_id', label: '法定代表人身份证', required: true },
    { id: 'credit_report', label: '征信报告及授权书', description: '最近2个月内', required: true },
  ];

  const financialItems: UploadItem[] = [
    { id: 'finance_prev_year', label: '前年度财务报表', description: '如2022年度审计报告', required: false },
    { id: 'finance_last_year', label: '上年度财务报表', description: '如2023年度审计报告', required: true },
    { id: 'finance_current', label: '近期财务报表', description: '最近一期月报/季报', required: true },
  ];

  const projectItems: UploadItem[] = [];
  const contractItems: UploadItem[] = [];
  const counterGuaranteeItems: UploadItem[] = [];

  if (bondType === BondType.BID) {
    projectItems.push({ id: 'tender_doc', label: '招标文件/邀请函', description: '下载版', required: true });
  } else {
    projectItems.push({ id: 'award_notice', label: '中标通知书/公示截图', required: true });
    if (bondType === BondType.QUALITY) {
       contractItems.push({ id: 'completion_cert', label: '竣工验收证明/试车合格证', required: true });
       contractItems.push({ id: 'main_contract', label: '主合同', description: '关注质保期条款', required: true });
    } else if (bondType === BondType.MIGRANT_WORKER) {
       contractItems.push({ id: 'construction_contract', label: '施工主合同', description: '关注工资支付条款', required: true });
       contractItems.push({ id: 'wage_agreement', label: '农民工工资专户协议', required: false });
    } else {
       contractItems.push({ id: 'main_contract', label: '主合同', description: '已签或草稿', required: true });
       }
  }

  if (bondType !== BondType.BID) {
    contractItems.push({ id: 'past_performance', label: '过往业绩清单及合同', description: '不少于2份', required: false });
  }

  if (mode === 'NON_CREDIT_ENTERPRISE') {
    counterGuaranteeItems.push({ id: 'guarantor_corp_license', label: '法人反担保-营业执照', required: false });
    counterGuaranteeItems.push({ id: 'guarantor_corp_articles', label: '法人反担保-公司章程', required: false });
    counterGuaranteeItems.push({ id: 'guarantor_corp_finance', label: '法人反担保-近期财报', required: false });
    counterGuaranteeItems.push({ id: 'guarantor_person_id', label: '自然人反担保-身份证', required: false });
    counterGuaranteeItems.push({ id: 'guarantor_person_marriage', label: '自然人反担保-婚姻证明', required: false });
    counterGuaranteeItems.push({ id: 'guarantor_person_assets', label: '自然人反担保-财产清单', description: '房产证/车辆登记证等', required: false });
    counterGuaranteeItems.push({ id: 'guarantor_person_credit', label: '自然人反担保-征信报告', required: false });
    counterGuaranteeItems.push({ id: 'collateral_cert', label: '抵质押物权证复印件', description: '原件核对后复印', required: false });
  }

  const groups: UploadGroup[] = [];
  groups.push({ id: 'basic_group', title: '基础资料 (申请人)', items: basicItems });
  groups.push({ id: 'financial_group', title: '财务资料 (申请人)', items: financialItems });

  if (projectItems.length > 0) {
    groups.push({ id: 'project_group', title: '项目背景资料', items: projectItems });
  }
  if (contractItems.length > 0) {
    groups.push({ id: 'contract_group', title: '合同及履约资料', items: contractItems });
  }
  if (mode === 'NON_CREDIT_ENTERPRISE') {
    groups.push({ id: 'counter_guarantee_group', title: '反担保资料 (非授信企业必填)', items: counterGuaranteeItems });
  }
  groups.push({ id: 'system_group', title: '系统流程附件', items: [
    { id: 'application_form', label: '业务申请书/审批表', required: false }
  ]});

  return groups;
};

interface FileUploadRecord {
  fileId: string;
  fileObj: File;
  base64: string;
  status: 'uploading' | 'done' | 'error';
  smartName?: string; 
}

const DataUpload: React.FC = () => {
  const { typeId } = useParams<{ typeId: string }>();
  const navigate = useNavigate();
  
  const [businessMode, setBusinessMode] = useState<BusinessMode>('CREDIT_ENTERPRISE');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSmartFilling, setIsSmartFilling] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [autoFillDone, setAutoFillDone] = useState(false);
  
  const [historyProjects, setHistoryProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    projectName: '',
    customerName: '',
    amount: '',
    beneficiary: '',
    feeDescription: '' 
  });

  const [fileMap, setFileMap] = useState<Record<string, FileUploadRecord[]>>({});
  const checklistGroups = getChecklistConfig(typeId || BondType.BID, businessMode);

  useEffect(() => {
    if (showHistoryModal) {
      getProjects().then(setHistoryProjects);
    }
  }, [showHistoryModal]);

  const readFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      for (const file of files) {
        const id = Math.random().toString(36).substr(2, 9);
        const record: FileUploadRecord = { 
          fileId: id, fileObj: file, base64: '', status: 'uploading', smartName: file.name 
        };
        setFileMap(prev => ({ ...prev, [itemId]: [...(prev[itemId] || []), record] }));
        try {
          const b64 = await readFileToBase64(file);
          setFileMap(prev => ({ ...prev, [itemId]: prev[itemId].map(r => r.fileId === id ? { ...r, base64: b64, status: 'done' } : r) }));
        } catch (err) {
          setFileMap(prev => ({ ...prev, [itemId]: prev[itemId].map(r => r.fileId === id ? { ...r, status: 'error' } : r) }));
        }
      }
    }
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsClassifying(true);
    setUploadProgress(0);
    const timer = setInterval(() => {
      setUploadProgress(old => (old < 30 ? old + 5 : (old < 80 ? old + 1 : old)));
    }, 200);

    const fileList = Array.from(files) as File[];
    const activeItems = checklistGroups.flatMap(g => g.items);

    try {
      const filePayloads = await Promise.all(fileList.map(async f => ({
        name: f.name, mimeType: f.type || 'application/pdf', data: await readFileToBase64(f)
      })));
      setUploadProgress(40); 
      const results = await classifyFiles(filePayloads, activeItems);
      setUploadProgress(90); 

      const newMap = { ...fileMap };
      results.forEach((res, idx) => {
        if (idx >= fileList.length) return;
        const originalFile = fileList[idx];
        const originalPayload = filePayloads[idx];
        let targetId = res.categoryId;
        const isValidId = activeItems.some(i => i.id === targetId);
        if (!isValidId && targetId !== 'other_materials') {
          targetId = 'other_materials';
        }
        if (!newMap[targetId]) newMap[targetId] = [];
        newMap[targetId].push({
          fileId: Math.random().toString(36).substr(2, 9),
          fileObj: originalFile,
          base64: originalPayload.data,
          status: 'done',
          smartName: res.suggestedName || originalFile.name 
        });
      });
      setFileMap(newMap);
      setUploadProgress(100);
    } catch (error) {
      alert("批量识别失败");
    } finally {
      clearInterval(timer);
      setTimeout(() => { setIsClassifying(false); setUploadProgress(0); e.target.value = ''; }, 800);
    }
  };

  const removeFile = (itemId: string, fileId: string) => {
    setFileMap(prev => ({ ...prev, [itemId]: prev[itemId].filter(f => f.fileId !== fileId) }));
  };

  const handleSmartFill = async () => {
    const allFiles: { data: string; mimeType: string }[] = [];
    Object.values(fileMap).forEach(list => {
      list.forEach(f => { if (f.status === 'done') allFiles.push({ data: f.base64, mimeType: f.fileObj.type || 'application/pdf' }); });
    });
    if (allFiles.length === 0) { alert("请先上传文件"); return; }

    setIsSmartFilling(true);
    try {
      const info = await extractBasicInfo(allFiles);
      setFormData(prev => ({
        ...prev,
        projectName: info.projectName || prev.projectName,
        customerName: info.customerName || prev.customerName,
        amount: info.amount || prev.amount,
        beneficiary: info.beneficiary || prev.beneficiary
      }));
      setAutoFillDone(true);
    } catch (e) { alert("智能识别失败"); } finally { setIsSmartFilling(false); }
  };

  const handleGenerateReport = async () => {
    const missing: string[] = [];
    checklistGroups.forEach(g => {
      g.items.forEach(item => {
        if (item.required && (!fileMap[item.id] || fileMap[item.id].length === 0)) missing.push(item.label);
      });
    });
    if (missing.length > 0) {
      const proceed = window.confirm(`缺少以下必传资料：\n${missing.slice(0, 5).join('\n')}${missing.length > 5 ? '...' : ''}\n\n是否仍要强制生成？`);
      if (!proceed) return;
    }
    setIsAnalyzing(true);
    try {
      const validFiles: { data: string; mimeType: string }[] = [];
      Object.values(fileMap).forEach(list => {
        list.forEach(f => { if (f.status === 'done') validFiles.push({ data: f.base64, mimeType: f.fileObj.type || 'application/pdf' }); });
      });
      const reportData = await analyzeDocuments(validFiles, formData.feeDescription);
      if (reportData.guaranteeInfo) {
        if (formData.projectName) reportData.guaranteeInfo.projectName = formData.projectName;
        if (formData.amount) reportData.guaranteeInfo.amount = formData.amount;
        if (formData.beneficiary) reportData.guaranteeInfo.beneficiary = formData.beneficiary;
      }
      if (reportData.clientInfo && formData.customerName) reportData.clientInfo.name = formData.customerName;
      navigate(`/app/create/preview/new-${Date.now()}`, { state: { reportData } });
    } catch (e) { 
      console.error(e);
      alert("生成失败，请重试"); 
    } finally { setIsAnalyzing(false); }
  };

  const renderStatusIcon = (itemId: string, required: boolean) => {
    const files = fileMap[itemId];
    if (files && files.length > 0) return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (required) return <div className="w-2 h-2 rounded-full bg-red-500"></div>;
    return <div className="w-2 h-2 rounded-full bg-slate-600"></div>;
  };

  const renderFileList = (files: FileUploadRecord[], itemId: string) => {
    if (!files || files.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
         {files.map(f => (
           <div key={f.fileId} className="group relative flex items-center bg-slate-700/50 text-slate-200 text-xs px-2.5 py-1.5 rounded-full border border-slate-600 hover:bg-white/10 transition-colors">
             <div className="flex flex-col min-w-0 mr-2">
                <span className="truncate max-w-[200px]" title={f.smartName}>
                   {f.smartName || f.fileObj.name}
                </span>
             </div>
             <button onClick={() => removeFile(itemId, f.fileId)} className="hover:text-red-400 p-1">
               <Trash2 className="w-3.5 h-3.5" />
             </button>
           </div>
         ))}
       </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* 1. Header & Mode Switch */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-panel p-6 rounded-2xl">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <h1 className="text-2xl font-bold text-white tracking-wide">
               {BondTypeLabels[typeId as BondType] || '保函'}业务 - 资料采集
             </h1>
           </div>
           <p className="text-slate-400 text-sm">请根据下方清单上传或拖入文件，系统将自动进行分类和识别。</p>
        </div>

        <div className="bg-slate-900/50 p-1 rounded-xl flex items-center border border-slate-700">
          <button onClick={() => setBusinessMode('CREDIT_ENTERPRISE')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${businessMode === 'CREDIT_ENTERPRISE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
             授信企业申请
          </button>
          <button onClick={() => setBusinessMode('NON_CREDIT_ENTERPRISE')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${businessMode === 'NON_CREDIT_ENTERPRISE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
             非授信企业申请
          </button>
        </div>

        <Button variant="outline" onClick={() => setShowHistoryModal(true)} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" /> 复用历史资料
        </Button>
      </div>

      {/* 2. Loading Overlay (Clean Tech) */}
      {(isAnalyzing || isSmartFilling || isClassifying) && (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center backdrop-blur-md">
          <div className="w-full max-w-md p-8 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl text-center">
             {isClassifying ? (
               <div>
                  <div className="relative w-16 h-16 mx-auto mb-6">
                     <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                     <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                     <Sparkles className="absolute inset-0 m-auto text-blue-500 w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">正在进行 AI 智能分类</h3>
                  <p className="text-slate-400 text-sm mb-6">正在分析文档内容并归档...</p>
                  
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-right text-xs text-blue-400 mt-2 font-mono">{Math.round(uploadProgress)}%</p>
               </div>
             ) : (
                <div>
                  <BrainCircuit className="w-16 h-16 text-indigo-500 mx-auto mb-6 animate-pulse" />
                  <h3 className="text-xl font-bold text-white mb-2">正在生成评审报告</h3>
                  <p className="text-slate-400 text-sm">正在提取关键信息并撰写分析...</p>
                </div>
             )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: Checklist */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Smart Upload Zone */}
          <div className="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/30 hover:bg-slate-800/50 transition-all duration-300 hover:border-blue-500 p-10 text-center">
            <input 
              type="file" multiple 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
              onChange={handleBatchUpload}
              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
            />
            <div className="relative z-0 pointer-events-none transform group-hover:scale-105 transition-transform duration-300">
               <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                 <Upload className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">智能批量上传</h3>
               <p className="text-slate-400 text-sm">拖入或点击上传所有文件，AI 将自动识别并归类到下方清单</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-white/5 pb-2 mt-8">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <LayoutList className="w-4 h-4 text-blue-500" /> 资料清单
            </h3>
            <Badge variant="default">已上传: {Object.values(fileMap).reduce((acc, curr) => acc + curr.length, 0)}</Badge>
          </div>

          {/* Granular Groups */}
          {checklistGroups.map(group => (
            <div key={group.id} className="glass-panel rounded-xl overflow-hidden">
              <div className="bg-slate-800/50 px-4 py-3 border-b border-white/5">
                 <span className="font-bold text-slate-300 text-xs uppercase tracking-wider">{group.title}</span>
              </div>
              <div className="divide-y divide-white/5">
                {group.items.map(item => {
                  const uploadedFiles = fileMap[item.id] || [];
                  const isDone = uploadedFiles.length > 0;
                  
                  return (
                    <div key={item.id} className={`p-4 transition-colors ${isDone ? 'bg-blue-500/5' : 'hover:bg-white/5'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                           <div className="mt-1 flex-shrink-0">{renderStatusIcon(item.id, item.required)}</div>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2">
                               <span className={`text-sm font-medium ${isDone ? 'text-white' : 'text-slate-400'}`}>
                                 {item.label}
                               </span>
                               {item.required && !isDone && <span className="text-[10px] text-red-400 border border-red-500/30 px-1 rounded bg-red-500/10">必传</span>}
                             </div>
                             {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                             {renderFileList(uploadedFiles, item.id)}
                           </div>
                        </div>

                        <div className="relative ml-4 flex-shrink-0">
                           <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleManualUpload(e, item.id)} />
                           <Button size="sm" variant="ghost" className="text-xs">
                             <Upload className="w-3 h-3 mr-1" /> 上传
                           </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {(fileMap['other_materials'] && fileMap['other_materials'].length > 0) && (
             <div className="glass-panel rounded-xl border border-amber-500/30">
               <div className="bg-amber-500/10 px-4 py-3 border-b border-amber-500/20">
                  <span className="font-bold text-amber-400 text-xs flex items-center uppercase tracking-wider">
                    <FolderOpen className="w-4 h-4 mr-2" /> 其他未分类资料
                  </span>
               </div>
               <div className="p-4">
                  {renderFileList(fileMap['other_materials'], 'other_materials')}
               </div>
             </div>
          )}

          <Button onClick={handleSmartFill} className="w-full h-14 text-lg font-bold shadow-xl shadow-indigo-600/20 bg-gradient-to-r from-indigo-500 to-purple-600">
             <Wand2 className="w-5 h-5 mr-2" /> 智能提取项目信息
          </Button>

        </div>

        {/* RIGHT: Confirmation Panel */}
        <div className="lg:col-span-5 sticky top-6">
          <Card title="信息确认与生成" className={`border-t-4 ${autoFillDone ? 'border-t-emerald-500' : 'border-t-slate-600'}`}>
            <div className="space-y-5">
              <Input label="项目名称" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} placeholder="等待智能提取..." />
              <Input label="申请人 (客户)" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                 <Input label="保函金额" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                 <Input label="受益人" value={formData.beneficiary} onChange={e => setFormData({...formData, beneficiary: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">收费及反担保情况说明</label>
                <textarea 
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-3 h-24 text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-slate-500"
                  placeholder="请输入费率、收费方式及反担保措施的特别说明..."
                  value={formData.feeDescription}
                  onChange={e => setFormData({...formData, feeDescription: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-white/5">
                 <Button size="lg" className="w-full text-base shadow-xl shadow-blue-600/30" onClick={handleGenerateReport} isLoading={isAnalyzing}>
                    <FileText className="w-5 h-5 mr-2" /> 生成评审报告
                 </Button>
              </div>
            </div>
          </Card>
        </div>

      </div>

      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="选择历史项目">
        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
          {historyProjects.map(p => (
            <div key={p.id} className="p-3 border border-white/5 rounded-xl bg-slate-800/50 hover:bg-slate-700 cursor-pointer flex justify-between items-center group transition-all"
               onClick={() => {
                 setFormData(prev => ({ ...prev, projectName: p.name, customerName: p.customerName, amount: p.amount.toString() }));
                 setShowHistoryModal(false);
               }}
            >
              <div>
                <div className="font-bold text-white group-hover:text-blue-400">{p.name}</div>
                <div className="text-xs text-slate-400">{p.customerName}</div>
              </div>
              <ArrowDown className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
            </div>
          ))}
        </div>
      </Modal>

    </div>
  );
};

export default DataUpload;
