

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Common';
import { FileSpreadsheet, Copy, ArrowLeft, Save, FileText } from 'lucide-react';
import { ReportData } from '../types';
import { createProjectFromReport } from '../services/mockService';

const ReportPreview: React.FC = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);

  // Load data
  useEffect(() => {
    if (location.state?.reportData) {
      // Ensure signatures object exists if not provided by AI
      const loadedData = location.state.reportData;
      if (!loadedData.signatures) {
        loadedData.signatures = { manager: '', deptHead: '', independent: '', approver: '' };
      }
      setData(loadedData);
    } else {
      // Fallback blank structure
      const blank: ReportData = {
        guaranteeInfo: { projectName: '', beneficiary: '', productType: '', guaranteeNature: '', isHousing: '', amount: '', term: '', rate: '', feeNote: '', outstandingBalance: '', bank: '', bankFee: '', chargeMethod: '' },
        clientInfo: { name: '', established: '', nature: '', regCapital: '', paidCapital: '', scope: '', qualifications: '' },
        shareholders: [
          { name: '股东A', amount: '', ratio: '', method: '', controller: '', note: '' },
          { name: '股东B', amount: '', ratio: '', method: '', controller: '', note: '' }
        ],
        financials: { 
            totalAssets: { item: '总资产', yearLast: '', yearCurr: '', change: '', value: '', note: '' },
            receivables: { item: '应收账款', yearLast: '', yearCurr: '', change: '', value: '', note: '' },
            inventory: { item: '存货', yearLast: '', yearCurr: '', change: '', value: '', note: '' },
            netAssets: { item: '净资产', yearLast: '', yearCurr: '', change: '', value: '', note: '' },
            totalLiabilities: { item: '总负债', yearLast: '', yearCurr: '', change: '', value: '', note: '' },
            assetLiabRatio: { item: '资产负债率', yearLast: '', yearCurr: '', change: '', value: '', note: '' },
            revenue: { item: '营业收入', yearLast: '', yearCurr: '', change: '', value: '', note: '' },
            operatingProfit: { item: '营业利润', yearLast: '', yearCurr: '', change: '', value: '', note: '' },
            netProfit: { item: '净利润', yearLast: '', yearCurr: '', change: '', value: '', note: '' },
            receivablesTurnover: { item: '应收账款周转率', yearLast: '', yearCurr: '', change: '', value: '', note: '' },
            inventoryTurnover: { item: '存货周转率', yearLast: '', yearCurr: '', change: '', value: '', note: '' },
            taxRevenue: { item: '报税收入', yearLast: '', yearCurr: '', change: '', value: '', note: '' },
            creditNotes: ''
        },
        litigation: '', performance: '',
        projectDetails: { owner: '', funding: '', location: '', term: '', bidAmount: '', limitPrice: '', scope: '', paymentTerms: '', disclosure: '' },
        otherMatters: '', analysis: '',
        signatures: { manager: '', deptHead: '', independent: '', approver: '' }
      };
      setData(blank);
    }
  }, [location.state]);

  const handleCreateProject = async () => {
    if (!data) return;
    setIsCreating(true);
    try {
      await createProjectFromReport(data, 'BID');
      navigate('/app/home');
    } catch (error) { alert("保存失败"); } finally { setIsCreating(false); }
  };

  const handleCopyContent = async () => {
    if (!reportRef.current) return;
    try {
        const type = "text/html";
        const blob = new Blob([reportRef.current.innerHTML], { type });
        const data = [new ClipboardItem({ [type]: blob })];
        await navigator.clipboard.write(data);
        alert('已复制');
    } catch (err) { alert('复制失败'); }
  };

  const handleExportExcel = () => {
     if (!reportRef.current) return;
     const html = reportRef.current.outerHTML;
     const url = 'data:application/vnd.ms-excel;base64,' + btoa(unescape(encodeURIComponent(html)));
     const link = document.createElement('a');
     link.href = url;
     link.download = `Report_${data?.guaranteeInfo.projectName || 'Export'}.xls`;
     link.click();
  };

  // Editable Components - Force Black Text & Transparent Background (on white parent)
  const EditableInput = ({ value, onChange, className = '', align = 'center' }: { value?: string; onChange: (val: string) => void; className?: string, align?: 'left'|'center'|'right' }) => (
    <input 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)} 
      className={`w-full h-full bg-transparent outline-none px-1 font-serif text-black placeholder-gray-400 hover:bg-blue-50 focus:bg-blue-100 transition-colors ${className}`} 
      style={{ textAlign: align, color: '#000000' }}
    />
  );

  const EditableArea = ({ value, onChange, className = '', rows = 3 }: { value?: string; onChange: (val: string) => void; className?: string; rows?: number }) => (
    <textarea 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)} 
      rows={rows}
      className={`w-full h-full bg-transparent outline-none p-1 resize-none font-serif text-black placeholder-gray-400 hover:bg-blue-50 focus:bg-blue-100 transition-colors block ${className}`} 
      style={{ color: '#000000', minHeight: '100%' }}
    />
  );

  const updateState = (path: string, value: string) => {
    if (!data) return;
    const newData = JSON.parse(JSON.stringify(data));
    const keys = path.split('.');
    let current = newData;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}; // Safety init
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setData(newData);
  };

  if (!data) return <div className="p-10 text-white text-center">正在加载报告数据...</div>;

  // Calculate row spans dynamically
  const shareholderRows = (data.shareholders?.length || 0) + 2; // Header + Items + Footer
  
  // Financial Rows Calculation:
  // 1 Header Row + 12 Item Rows + 1 Footer Row = 14 Rows
  const financialRows = 14; 

  return (
    <div className="flex flex-col h-screen bg-gray-200">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 px-6 py-3 flex justify-between items-center shadow-md z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors">
             <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
             <FileText className="w-5 h-5 text-blue-800" />
             <h1 className="text-lg font-bold text-gray-900">评审报告预览</h1>
          </div>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" onClick={handleCopyContent} size="sm" className="border-gray-400 text-gray-800 hover:bg-gray-100"><Copy className="w-4 h-4 mr-2" /> 复制内容</Button>
           <Button variant="outline" onClick={handleExportExcel} size="sm" className="border-gray-400 text-gray-800 hover:bg-gray-100"><FileSpreadsheet className="w-4 h-4 mr-2" /> 导出 Excel</Button>
           <Button onClick={handleCreateProject} isLoading={isCreating} size="sm" className="bg-blue-700 hover:bg-blue-800 text-white border-none"><Save className="w-4 h-4 mr-2" /> 保存项目</Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-8 flex justify-center bg-gray-200">
        
        {/* Paper Container */}
        <div ref={reportRef} className="bg-white shadow-2xl p-10 max-w-[1100px] w-full min-h-[1400px] font-serif box-border text-black" style={{ color: '#000000' }}>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-black tracking-widest mb-2" style={{ fontFamily: '"SimSun", "Songti SC", serif' }}>保函业务简式评审报告</h1>
            <p className="text-sm text-gray-600">（2024年修订版）</p>
          </div>

          {/* Strict 7-Column Grid Layout */}
          <table className="w-full border-collapse border border-black text-sm text-black bg-white" style={{ tableLayout: 'fixed' }}>
            <colgroup>
               {/* 1. Side Header */}
               <col style={{width: '5%'}} />
               {/* 2. Label 1 / Item */}
               <col style={{width: '13%'}} />
               {/* 3. Value 1 / 2023 */}
               <col style={{width: '16%'}} />
               {/* 4. Label 2 / 2024 */}
               <col style={{width: '13%'}} />
               {/* 5. Value 2 / Change */}
               <col style={{width: '16%'}} />
               {/* 6. Label 3 / Current */}
               <col style={{width: '13%'}} />
               {/* 7. Value 3 / Note */}
               <col style={{width: '24%'}} />
            </colgroup>
            
            {/* --- 1. 保函要素 (Guarantee Info) --- */}
            <tbody>
              <tr>
                 <td rowSpan={6} className="border border-black font-bold text-center bg-gray-50 p-2 leading-tight">保函要素<div className="text-[10px] font-normal mt-1">(单位:万元、%)</div></td>
                 <td className="border border-black font-bold text-center bg-gray-50">项目名称</td>
                 <td className="border border-black" colSpan={2}><EditableInput value={data.guaranteeInfo.projectName} onChange={v => updateState('guaranteeInfo.projectName', v)} align="left" /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">保函受益人</td>
                 <td className="border border-black" colSpan={2}><EditableInput value={data.guaranteeInfo.beneficiary} onChange={v => updateState('guaranteeInfo.beneficiary', v)} align="left" /></td>
              </tr>
              <tr>
                 <td className="border border-black font-bold text-center bg-gray-50">保函品种</td>
                 <td className="border border-black"><EditableInput value={data.guaranteeInfo.productType} onChange={v => updateState('guaranteeInfo.productType', v)} /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">担保类型</td>
                 <td className="border border-black"><EditableInput value={data.guaranteeInfo.guaranteeNature} onChange={v => updateState('guaranteeInfo.guaranteeNature', v)} /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">是否涉房</td>
                 <td className="border border-black"><EditableInput value={data.guaranteeInfo.isHousing} onChange={v => updateState('guaranteeInfo.isHousing', v)} /></td>
              </tr>
              <tr>
                 <td className="border border-black font-bold text-center bg-gray-50">保函金额</td>
                 <td className="border border-black"><EditableInput value={data.guaranteeInfo.amount} onChange={v => updateState('guaranteeInfo.amount', v)} /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">保函期限</td>
                 <td className="border border-black"><EditableInput value={data.guaranteeInfo.term} onChange={v => updateState('guaranteeInfo.term', v)} /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">担保费率</td>
                 <td className="border border-black text-xs" rowSpan={2}>
                    <EditableArea rows={4} value={data.guaranteeInfo.rate} onChange={v => updateState('guaranteeInfo.rate', v)} />
                 </td>
              </tr>
              <tr>
                 <td className="border border-black font-bold text-center bg-gray-50">在保余额</td>
                 <td className="border border-black"><EditableInput value={data.guaranteeInfo.outstandingBalance} onChange={v => updateState('guaranteeInfo.outstandingBalance', v)} /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">合作银行</td>
                 <td className="border border-black"><EditableInput value={data.guaranteeInfo.bank} onChange={v => updateState('guaranteeInfo.bank', v)} /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">银行手续费</td>
                 <td className="border border-black text-center text-xs p-0">
                    <EditableInput value={data.guaranteeInfo.bankFee} onChange={v => updateState('guaranteeInfo.bankFee', v)} />
                 </td>
              </tr>
              <tr>
                 <td className="border border-black font-bold text-center bg-gray-50">收费计算方式</td>
                 <td className="border border-black" colSpan={5}>
                    <EditableArea rows={2} value={data.guaranteeInfo.chargeMethod} onChange={v => updateState('guaranteeInfo.chargeMethod', v)} />
                 </td>
              </tr>
              <tr>
                 <td className="border border-black text-[10px] p-1 bg-yellow-50 text-gray-800 italic" colSpan={6}>
                    填表说明: 保函品种指工程履约/预付款等。担保类型指独立/一般。银行手续费填写“/”代表我司商业保函。担保费应包含银行费。
                 </td>
              </tr>
            </tbody>

            {/* --- 2. 基本情况 (Basic Info) --- */}
            <tbody>
               <tr>
                 <td rowSpan={4} className="border border-black font-bold text-center bg-gray-50">基本情况</td>
                 <td className="border border-black font-bold text-center bg-gray-50">客户名称</td>
                 <td className="border border-black" colSpan={2}><EditableInput value={data.clientInfo.name} onChange={v => updateState('clientInfo.name', v)} align="left" /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">成立时间</td>
                 <td className="border border-black" colSpan={2}><EditableInput value={data.clientInfo.established} onChange={v => updateState('clientInfo.established', v)} /></td>
               </tr>
               <tr>
                 <td className="border border-black font-bold text-center bg-gray-50">企业性质</td>
                 <td className="border border-black"><EditableInput value={data.clientInfo.nature} onChange={v => updateState('clientInfo.nature', v)} /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">注册资本</td>
                 <td className="border border-black"><EditableInput value={data.clientInfo.regCapital} onChange={v => updateState('clientInfo.regCapital', v)} /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">实缴资本</td>
                 <td className="border border-black"><EditableInput value={data.clientInfo.paidCapital} onChange={v => updateState('clientInfo.paidCapital', v)} /></td>
               </tr>
               <tr>
                 <td className="border border-black font-bold text-center bg-gray-50">主营业务范围</td>
                 <td className="border border-black" colSpan={5}>
                    <EditableArea rows={3} value={data.clientInfo.scope} onChange={v => updateState('clientInfo.scope', v)} className="text-xs" />
                 </td>
               </tr>
               <tr>
                 <td className="border border-black font-bold text-center bg-gray-50">企业资质/人员</td>
                 <td className="border border-black" colSpan={5}>
                    <EditableArea rows={2} value={data.clientInfo.qualifications} onChange={v => updateState('clientInfo.qualifications', v)} className="text-xs" />
                 </td>
               </tr>
            </tbody>

            {/* --- 3. 股权结构 (Shareholders) --- */}
            <tbody>
              <tr>
                <td rowSpan={shareholderRows} className="border border-black font-bold text-center bg-gray-50">股权结构</td>
                <td className="border border-black font-bold text-center bg-gray-50" colSpan={2}>股东名称</td>
                <td className="border border-black font-bold text-center bg-gray-50">出资金额</td>
                <td className="border border-black font-bold text-center bg-gray-50">股权比例</td>
                <td className="border border-black font-bold text-center bg-gray-50">出资方式</td>
                <td className="border border-black font-bold text-center bg-gray-50">实际控制人/备注</td>
              </tr>
              {data.shareholders.map((sh, idx) => (
                <tr key={idx}>
                   <td className="border border-black" colSpan={2}><EditableInput value={sh.name} onChange={v => {const n = [...data.shareholders]; n[idx].name=v; setData({...data, shareholders: n})}} /></td>
                   <td className="border border-black"><EditableInput value={sh.amount} onChange={v => {const n = [...data.shareholders]; n[idx].amount=v; setData({...data, shareholders: n})}} /></td>
                   <td className="border border-black"><EditableInput value={sh.ratio} onChange={v => {const n = [...data.shareholders]; n[idx].ratio=v; setData({...data, shareholders: n})}} /></td>
                   <td className="border border-black"><EditableInput value={sh.method} onChange={v => {const n = [...data.shareholders]; n[idx].method=v; setData({...data, shareholders: n})}} /></td>
                   <td className="border border-black"><EditableInput value={sh.controller} onChange={v => {const n = [...data.shareholders]; n[idx].controller=v; setData({...data, shareholders: n})}} /></td>
                </tr>
              ))}
              <tr>
                 <td className="border border-black text-center font-bold" colSpan={2}>合计</td>
                 <td className="border border-black text-center">-</td>
                 <td className="border border-black text-center">100%</td>
                 <td className="border border-black text-center">-</td>
                 <td className="border border-black text-center">-</td>
              </tr>
            </tbody>

            {/* --- 4. 财务信息 (Financials) --- */}
            <tbody>
               {/* Header Row */}
               <tr>
                 <td rowSpan={financialRows} className="border border-black font-bold text-center bg-gray-50 leading-tight">财务信息<div className="text-[10px] font-normal mt-1">(单位:万元)</div></td>
                 <td className="border border-black font-bold text-center bg-gray-50">项目</td>
                 <td className="border border-black font-bold text-center bg-gray-50">2023年</td>
                 <td className="border border-black font-bold text-center bg-gray-50">2024年</td>
                 <td className="border border-black font-bold text-center bg-gray-50">增减变动</td>
                 <td className="border border-black font-bold text-center bg-gray-50">当期/实际</td>
                 <td className="border border-black font-bold text-center bg-gray-50">说明</td>
               </tr>
               
               {/* Data Rows */}
               {['totalAssets', 'receivables', 'inventory', 'netAssets', 'totalLiabilities', 'assetLiabRatio', 'revenue', 'operatingProfit', 'netProfit', 'receivablesTurnover', 'inventoryTurnover', 'taxRevenue'].map((key) => {
                  const row = (data.financials as any)[key];
                  const labelMap: any = {totalAssets:'总资产', receivables:'应收账款', inventory:'存货', netAssets:'净资产', totalLiabilities:'总负债', assetLiabRatio:'资产负债率', revenue:'营业收入', operatingProfit:'营业利润', netProfit:'净利润', receivablesTurnover:'应收账款周转率', inventoryTurnover:'存货周转率', taxRevenue:'报税收入'};
                  return (
                    <tr key={key}>
                       <td className="border border-black text-center font-medium bg-gray-50">{labelMap[key]}</td>
                       <td className="border border-black"><EditableInput value={row?.yearLast} onChange={v => updateState(`financials.${key}.yearLast`, v)} /></td>
                       <td className="border border-black"><EditableInput value={row?.yearCurr} onChange={v => updateState(`financials.${key}.yearCurr`, v)} /></td>
                       <td className="border border-black"><EditableInput value={row?.change} onChange={v => updateState(`financials.${key}.change`, v)} /></td>
                       <td className="border border-black"><EditableInput value={row?.value} onChange={v => updateState(`financials.${key}.value`, v)} /></td>
                       <td className="border border-black"><EditableInput value={row?.note} onChange={v => updateState(`financials.${key}.note`, v)} /></td>
                    </tr>
                  )
               })}
               
               {/* Footer Row */}
               <tr>
                 <td className="border border-black" colSpan={6}>
                    <EditableArea rows={2} value={data.financials.creditNotes} onChange={v => updateState('financials.creditNotes', v)} className="text-xs" />
                 </td>
               </tr>
            </tbody>

            {/* --- 5. 涉诉情况 --- */}
            <tbody>
              <tr>
                 <td className="border border-black font-bold text-center bg-gray-50">涉诉情况</td>
                 <td className="border border-black" colSpan={6}>
                    <EditableArea rows={3} value={data.litigation} onChange={v => updateState('litigation', v)} />
                 </td>
              </tr>
            </tbody>

            {/* --- 6. 履约经验 --- */}
            <tbody>
              <tr>
                 <td className="border border-black font-bold text-center bg-gray-50">履约经验</td>
                 <td className="border border-black" colSpan={6}>
                    <EditableArea rows={3} value={data.performance} onChange={v => updateState('performance', v)} />
                 </td>
              </tr>
            </tbody>

            {/* --- 7. 项目情况 (Project Details) - Layout based on screenshot --- */}
            <tbody>
               <tr>
                 <td rowSpan={6} className="border border-black font-bold text-center bg-gray-50">项目情况</td>
                 
                 {/* Row 1: Owner (Col 2), Owner Val (Col 3,4), Funding (Col 5), Funding Val (Col 6,7) */}
                 <td className="border border-black font-bold text-center bg-gray-50">项目业主</td>
                 <td className="border border-black" colSpan={2}><EditableInput value={data.projectDetails.owner} onChange={v => updateState('projectDetails.owner', v)} align="left" /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">资金来源</td>
                 <td className="border border-black" colSpan={2}><EditableInput value={data.projectDetails.funding} onChange={v => updateState('projectDetails.funding', v)} /></td>
               </tr>
               
               {/* Row 2: Location, Term */}
               <tr>
                 <td className="border border-black font-bold text-center bg-gray-50">履约地点</td>
                 <td className="border border-black" colSpan={2}><EditableInput value={data.projectDetails.location} onChange={v => updateState('projectDetails.location', v)} /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">履约期限</td>
                 <td className="border border-black" colSpan={2}><EditableInput value={data.projectDetails.term} onChange={v => updateState('projectDetails.term', v)} /></td>
               </tr>
               
               {/* Row 3: Bid Amount, Limit, Ratio */}
               <tr>
                 <td className="border border-black font-bold text-center bg-gray-50">中标金额</td>
                 <td className="border border-black"><EditableInput value={data.projectDetails.bidAmount} onChange={v => updateState('projectDetails.bidAmount', v)} /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">最高限价</td>
                 <td className="border border-black"><EditableInput value={data.projectDetails.limitPrice} onChange={v => updateState('projectDetails.limitPrice', v)} /></td>
                 <td className="border border-black font-bold text-center bg-gray-50">占比</td>
                 <td className="border border-black text-center">/</td>
               </tr>
               
               {/* Row 4: Scope */}
               <tr>
                  <td className="border border-black font-bold text-center bg-gray-50">建设内容</td>
                  <td className="border border-black" colSpan={5}>
                     <EditableArea rows={3} value={data.projectDetails.scope} onChange={v => updateState('projectDetails.scope', v)} />
                  </td>
               </tr>
               
               {/* Row 5: Payment */}
               <tr>
                  <td className="border border-black font-bold text-center bg-gray-50">付款方式</td>
                  <td className="border border-black" colSpan={5}>
                     <EditableArea rows={2} value={data.projectDetails.paymentTerms} onChange={v => updateState('projectDetails.paymentTerms', v)} />
                  </td>
               </tr>
               
               {/* Row 6: Disclosure */}
               <tr>
                  <td className="border border-black font-bold text-center bg-gray-50">重点披露</td>
                  <td className="border border-black" colSpan={5}>
                     <EditableArea rows={2} value={data.projectDetails.disclosure} onChange={v => updateState('projectDetails.disclosure', v)} />
                  </td>
               </tr>
            </tbody>

            {/* --- 8. 其他事项 --- */}
            <tbody>
              <tr>
                 <td className="border border-black font-bold text-center bg-gray-50">其他事项</td>
                 <td className="border border-black" colSpan={6}>
                    <EditableArea rows={3} value={data.otherMatters} onChange={v => updateState('otherMatters', v)} />
                 </td>
              </tr>
            </tbody>

            {/* --- 9. 综合分析 --- */}
            <tbody>
              <tr>
                 <td className="border border-black font-bold text-center bg-gray-50">A角履约<br/>能力分析</td>
                 <td className="border border-black p-2" colSpan={6}>
                    <EditableArea rows={10} value={data.analysis} onChange={v => updateState('analysis', v)} className="h-full min-h-[300px]" />
                 </td>
              </tr>
            </tbody>

            {/* --- 10. Signatures --- */}
            <tbody>
               <tr>
                  <td className="border border-black font-bold text-center bg-gray-50 p-4 align-middle">
                    项目经理<br/>B角复核
                  </td>
                  <td className="border border-black bg-white h-32 p-0" colSpan={6}>
                     <EditableArea value={data.signatures?.manager} onChange={v => updateState('signatures.manager', v)} className="h-full" />
                  </td>
               </tr>
               <tr>
                  <td className="border border-black font-bold text-center bg-gray-50 p-4 align-middle">
                    部门负责人<br/>审批意见
                  </td>
                  <td className="border border-black bg-white h-32 p-0" colSpan={6}>
                     <EditableArea value={data.signatures?.deptHead} onChange={v => updateState('signatures.deptHead', v)} className="h-full" />
                  </td>
               </tr>
               <tr>
                  <td className="border border-black font-bold text-center bg-gray-50 p-4 align-middle">
                    独立审查<br/>人审查意见
                  </td>
                  <td className="border border-black bg-white h-32 p-0" colSpan={6}>
                     <EditableArea value={data.signatures?.independent} onChange={v => updateState('signatures.independent', v)} className="h-full" />
                  </td>
               </tr>
               <tr>
                  <td className="border border-black font-bold text-center bg-gray-50 p-4 align-middle">
                    有权审批人<br/>审批意见
                  </td>
                  <td className="border border-black bg-white h-32 p-0" colSpan={6}>
                     <EditableArea value={data.signatures?.approver} onChange={v => updateState('signatures.approver', v)} className="h-full" />
                  </td>
               </tr>
            </tbody>

          </table>

        </div>
      </div>
    </div>
  );
};

export default ReportPreview;
