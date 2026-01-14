
import React, { useState, useMemo } from 'react';
import { ChevronLeft, Menu, Camera, PenTool, CheckCircle, AlertTriangle, Clock, Save, User, Truck, FileText, Shield, Factory, Calendar, Layers, ChevronRight, Search, Edit, Trash2, X, FileCheck, DollarSign, PieChart, TrendingUp, ScanLine, Box, ArrowDownCircle, ArrowUpCircle, RefreshCw, ClipboardCheck, List, Send, QrCode, Archive, LogOut } from 'lucide-react';
import { StockRecord, Order, OrderStatus } from '../types';
import { MOCK_ORDERS, MOCK_WAREHOUSES } from '../constants';

interface AppSimulationProps {
  onSaveProduction?: (records: StockRecord[]) => void;
  pendingTasks?: Order[];
  stockRecords?: StockRecord[];
  gateRecords?: any[];
  onApprove?: (order: Order) => void;
  onReject?: (order: Order) => void;
}

interface SubmissionData {
  id: string;
  senderUnit: string;
  roadTransportCert: string;
  transportUnit: string;
  businessLicense: string;
  mainPlate: string;
  trailerPlate: string;
  approvedLoad: string;
  unloadQty: string;
  unit: '吨' | 'kg';
  driverName: string;
  driverId: string;
  escortName: string;
  escortId: string;
  qualificationCert: string;
  hazmatCert: string;
  triangleLight: boolean;
  reflectiveStrips: boolean;
  rectSign: boolean;
  emergencyKit: boolean;
  staticGrounding: boolean;
  baffles: boolean;
  hazmatSigns: boolean;
  cutoffValve: boolean;
  sparkArrestor: boolean;
  photoMatch: boolean;
  hoseIntact: boolean;
  hoseStored: boolean;
  valveClosed: boolean;
  leakCheck: boolean;
  analysisResult: string;
  tankId: string;
  levelBefore: string;
  levelAfter: string;
  startDcs1: string; startDcs2: string;
  startSite1: string; startSite2: string;
  endDcs1: string; endDcs2: string;
  endSite1: string; endSite2: string;
  remark: string;
  entryTime: string;
  exitTime: string;
  unloaderSign: string;
  supervisorSign: string;
}

const INITIAL_FORM_DATA: SubmissionData = {
    id: '',
    senderUnit: '', roadTransportCert: '', transportUnit: '', businessLicense: '',
    mainPlate: '', trailerPlate: '', approvedLoad: '', unloadQty: '', unit: '吨',
    driverName: '', driverId: '', escortName: '', escortId: '',
    qualificationCert: '', hazmatCert: '',
    triangleLight: true, reflectiveStrips: true, rectSign: true, emergencyKit: true,
    staticGrounding: true, baffles: true, hazmatSigns: true, cutoffValve: true, sparkArrestor: true,
    photoMatch: true, hoseIntact: true, hoseStored: false, valveClosed: false, leakCheck: false,
    analysisResult: '', tankId: '', levelBefore: '', levelAfter: '',
    startDcs1: '', startDcs2: '', startSite1: '', startSite2: '',
    endDcs1: '', endDcs2: '', endSite1: '', endSite2: '',
    remark: '', entryTime: '', exitTime: '', unloaderSign: '', supervisorSign: ''
};

const MOCK_SUBMISSIONS: SubmissionData[] = [
  {
    ...INITIAL_FORM_DATA,
    id: 'SUB-001',
    senderUnit: '鲁西化工集团',
    mainPlate: '鲁C88888',
    driverName: '张建国',
    unloadQty: '32',
    unit: '吨',
    entryTime: '2023-10-30 08:30',
    transportUnit: '及第物流',
    escortName: '李安全'
  },
  {
    ...INITIAL_FORM_DATA,
    id: 'SUB-002',
    senderUnit: '山东黄金冶炼厂',
    mainPlate: '冀B99999',
    driverName: '赵大力',
    unloadQty: '30',
    unit: '吨',
    entryTime: '2023-10-30 09:15',
    transportUnit: '北方运输',
    escortName: '王保障'
  }
];

export const AppSimulation: React.FC<AppSimulationProps> = ({ onSaveProduction, pendingTasks = [], stockRecords = [], gateRecords = [], onApprove, onReject }) => {
  const [view, setView] = useState<'home' | 'driver' | 'staff-list' | 'staff-detail' | 'production' | 'todo-list' | 'stats' | 'pda'>('home');
  const [submissions, setSubmissions] = useState<SubmissionData[]>(MOCK_SUBMISSIONS);
  const [formData, setFormData] = useState<SubmissionData>(INITIAL_FORM_DATA);
  
  // Todo List State
  const [todoTab, setTodoTab] = useState<'pending' | 'done'>('pending');
  const [doneHistory, setDoneHistory] = useState<any[]>([]);

  // Production State
  const [prodForm, setProdForm] = useState({
    batchNo: `BATCH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-01`,
    date: new Date().toISOString().split('T')[0],
    line1: { output: '', outputUnit: '吨', fluorite: '', fluoriteUnit: '吨', sulf98: '', sulf98Unit: '吨', sulf105: '', sulf105Unit: '吨' },
    line2: { output: '', outputUnit: '吨', fluorite: '', fluoriteUnit: '吨', sulf98: '', sulf98Unit: '吨', sulf105: '', sulf105Unit: '吨' },
  });

  // --- Compute Unified Todo List ---
  const unifiedTodoList = useMemo(() => {
      const items: any[] = [];
      
      // Orders (Financial & Price)
      pendingTasks.forEach(task => {
          items.push({
              id: task.id,
              type: task.status === OrderStatus.PriceApproval ? 'price' : 'financial',
              title: task.status === OrderStatus.PriceApproval ? '价格审批' : '财务审核',
              subTitle: `${task.customerName} - ${task.productName}`,
              time: task.history[0]?.date,
              data: task,
              desc: `${task.quantity} ${task.unit || '吨'} | ¥${(task.quantity * task.unitPrice).toLocaleString()}`
          });
      });

      // Stock
      stockRecords.forEach(rec => {
          items.push({
              id: rec.id,
              type: 'stock',
              title: '出入库审批',
              subTitle: `${rec.type === 'in' ? '入库' : '出库'} - ${rec.product}`,
              time: rec.date,
              data: rec,
              desc: `${rec.type === 'in' ? '+' : '-'}${rec.qty} ${rec.unit || '吨'} | ${rec.ref}`
          });
      });

      // Gate
      gateRecords.forEach(gate => {
          items.push({
              id: `gate-${gate.id}`,
              type: 'gate',
              title: '门岗放行',
              subTitle: `${gate.plate} - ${gate.customerName}`,
              time: gate.exitTime,
              data: gate,
              desc: `实重: ${gate.actualWeight}吨 | 司机: ${gate.driver}`
          });
      });

      return items.sort((a,b) => b.time.localeCompare(a.time));
  }, [pendingTasks, stockRecords, gateRecords]);


  const handleInputChange = (field: string, value: any) => { setFormData(prev => ({ ...prev, [field]: value })); };
  
  // Drivers View Logic
  const handleDriverSubmit = () => {
    if(formData.id) {
        setSubmissions(prev => prev.map(s => s.id === formData.id ? { ...formData, entryTime: s.entryTime } : s));
        alert('修改保存成功！');
        setView('staff-list');
    } else {
        const newSubmission = { ...formData, id: `SUB-${Date.now()}`, entryTime: new Date().toLocaleString('zh-CN', { hour12: false }) };
        setSubmissions(prev => [newSubmission, ...prev]);
        alert('提交成功！');
        setView('home');
    }
    setFormData(INITIAL_FORM_DATA);
  };

  const handleStaffSelect = (sub: SubmissionData) => {
    setFormData(sub);
    setView('staff-detail');
  };

  const handleStaffApprove = () => {
    setSubmissions(prev => prev.filter(s => s.id !== formData.id));
    alert('核准完成！');
    setFormData(INITIAL_FORM_DATA);
    setView('staff-list');
  };

  // Production Logic
  const handleProdChange = (line: 'line1' | 'line2', field: string, value: string) => {
    setProdForm(prev => ({ ...prev, [line]: { ...prev[line], [field]: value } }));
  };

  const handleSaveProd = () => {
    if (!onSaveProduction) return;
    const records: StockRecord[] = [];
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const ref = `生产消耗-${prodForm.batchNo}`;
    
    // Helper to add record
    const addRec = (product: string, qtyStr: string, type: 'in' | 'out', matType: 'finished' | 'semi') => {
        const qty = parseFloat(qtyStr);
        if (qty > 0) records.push({ 
            id: `prod-${Date.now()}-${Math.random()}`, 
            date: now, 
            type, 
            product, 
            qty, 
            unit: '吨',
            ref, 
            plate: '-', 
            materialType: matType,
            operator: '生产班组',
            confirmer: '系统自动'
        });
    };

    // Line 1
    addRec('湿法氟化铝', prodForm.line1.output, 'in', 'finished');
    addRec('萤石', prodForm.line1.fluorite, 'out', 'semi');
    addRec('98%硫酸', prodForm.line1.sulf98, 'out', 'semi');
    
    // Line 2
    addRec('湿法氟化铝', prodForm.line2.output, 'in', 'finished');
    addRec('萤石', prodForm.line2.fluorite, 'out', 'semi');
    addRec('98%硫酸', prodForm.line2.sulf98, 'out', 'semi');

    onSaveProduction(records);
    alert('生产日报已提交！');
    setView('home');
  };

  // Unified Approval Logic
  const handleMobileApprove = (item: any) => {
      if (confirm(`确认批准: ${item.title}?`)) {
          // In a real app, this would dispatch to different handlers
          // Here we mock the behavior and move to done
          if (item.type === 'price' || item.type === 'financial') {
              if (onApprove) onApprove(item.data);
          } else {
              // Mock for stock/gate
              alert('操作已批准');
          }
          
          setDoneHistory(prev => [{...item, status: 'approved', doneTime: new Date().toLocaleString('zh-CN', {hour12: false})}, ...prev]);
      }
  };

  const handleMobileReject = (item: any) => {
      if (confirm(`确认驳回: ${item.title}?`)) {
          if ((item.type === 'price' || item.type === 'financial') && onReject) {
              onReject(item.data);
          } else {
              alert('操作已驳回');
          }
          setDoneHistory(prev => [{...item, status: 'rejected', doneTime: new Date().toLocaleString('zh-CN', {hour12: false})}, ...prev]);
      }
  };

  // Components
  const RadioGroup = ({ label, field, required = false }: any) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
        <label className="text-sm text-gray-700 flex items-center gap-1">{required && <span className="text-red-500">*</span>}{label}</label>
        <div className="flex gap-4">
            <label className="flex items-center gap-1"><input type="radio" checked={formData[field] === true} onChange={() => handleInputChange(field, true)} className="w-4 h-4 text-blue-600" /><span className="text-sm">有/是</span></label>
            <label className="flex items-center gap-1"><input type="radio" checked={formData[field] === false} onChange={() => handleInputChange(field, false)} className="w-4 h-4 text-gray-400" /><span className="text-sm">无/否</span></label>
        </div>
    </div>
  );
  const InputRow = ({ label, field, type="text", placeholder="" }: any) => (<div className="mb-3"><label className="block text-xs text-gray-500 mb-1">{label}</label><input type={type} className="w-full border-b border-gray-200 py-1 text-sm bg-transparent" value={formData[field]} onChange={(e) => handleInputChange(field, e.target.value)} placeholder={placeholder} /></div>);
  const SectionTitle = ({ title, icon: Icon, color = "blue" }: any) => (<div className={`bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 flex items-center gap-2 border-l-4 border-${color}-600 mt-4 mb-2`}>{Icon && <Icon size={14} className={`text-${color}-600`}/>} {title}</div>);

  // --- Views ---
  const HomeView = () => (
      <div className="h-full bg-gray-50 flex flex-col">
          <div className="bg-blue-600 h-48 rounded-b-[3rem] relative flex items-center justify-center shadow-lg">
              <div className="text-center text-white"><Truck size={48} className="mx-auto mb-2 opacity-90"/><h1 className="text-2xl font-bold">南韩化工厂</h1><p className="text-blue-100 text-sm">Nanhan Chemical App</p></div>
          </div>
          <div className="flex-1 p-6 -mt-10 space-y-4 pb-20">
              <button onClick={() => setView('todo-list')} className="w-full bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all border border-gray-100 relative overflow-hidden">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500"><FileCheck size={24} /></div>
                  <div className="text-left flex-1"><h3 className="font-bold text-gray-800 text-lg">我的待办</h3><p className="text-gray-500 text-sm">审批、审核与确认事项</p></div>
                  {unifiedTodoList.length > 0 && (<div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">{unifiedTodoList.length}</div>)}
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setView('pda')} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all border border-gray-100 h-32">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white shadow-md"><ScanLine size={20} /></div><div className="text-center"><h3 className="font-bold text-gray-800 text-sm">智能仓储 PDA</h3><p className="text-gray-400 text-[10px]">扫码/库存/盘点</p></div>
                </button>
                <button onClick={() => setView('stats')} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all border border-gray-100 h-32">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600"><PieChart size={20} /></div><div className="text-center"><h3 className="font-bold text-gray-800 text-sm">统计分析</h3><p className="text-gray-400 text-[10px]">经营数据日报</p></div>
                </button>
              </div>
              <button onClick={() => { setFormData(INITIAL_FORM_DATA); setView('driver'); }} className="w-full bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all border border-gray-100"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><User size={24} /></div><div className="text-left"><h3 className="font-bold text-gray-800 text-lg">驾驶员填报 (硫酸)</h3><p className="text-gray-500 text-sm">硫酸卸货信息登记</p></div></button>
              <button onClick={() => setView('staff-list')} className="w-full bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all border border-gray-100"><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600"><Shield size={24} /></div><div className="text-left"><h3 className="font-bold text-gray-800 text-lg">卸货查验核准 (员工)</h3><p className="text-gray-500 text-sm">选择车辆进行安全检查</p></div></button>
              <button onClick={() => setView('production')} className="w-full bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all border border-gray-100"><div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600"><Factory size={24} /></div><div className="text-left"><h3 className="font-bold text-gray-800 text-lg">生产日报录入</h3><p className="text-gray-500 text-sm">每日产量与原料消耗</p></div></button>
          </div>
      </div>
  );

  const TodoListView = () => (
    <div className="h-full bg-gray-50 flex flex-col">
       <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
          <button onClick={() => setView('home')}><ChevronLeft /></button>
          <h2 className="font-bold text-lg">审批中心</h2>
       </div>
       
       <div className="flex bg-white shadow-sm shrink-0">
          <button 
            onClick={() => setTodoTab('pending')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 ${todoTab === 'pending' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'}`}
          >
            我的待办 ({unifiedTodoList.length})
          </button>
          <button 
            onClick={() => setTodoTab('done')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 ${todoTab === 'done' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'}`}
          >
            我的已办
          </button>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
          {todoTab === 'pending' ? (
              unifiedTodoList.length === 0 ? <div className="text-center text-gray-400 mt-20">暂无待办事项</div> : (
                 unifiedTodoList.map(task => (
                    <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                       <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                                 task.type === 'price' ? 'bg-yellow-500' :
                                 task.type === 'financial' ? 'bg-purple-500' :
                                 task.type === 'stock' ? 'bg-orange-500' : 'bg-green-500'
                             }`}>
                                 {task.type === 'price' ? <DollarSign size={14}/> : 
                                  task.type === 'financial' ? <FileText size={14}/> :
                                  task.type === 'stock' ? <Archive size={14}/> : <LogOut size={14}/>}
                             </div>
                             <div>
                                <h3 className="font-bold text-gray-800 text-sm">{task.title}</h3>
                                <div className="text-xs text-gray-500">{task.subTitle}</div>
                             </div>
                          </div>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded">{task.time.split(' ')[0]}</span>
                       </div>
                       
                       <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-3 border border-gray-100">
                          {task.desc}
                       </div>

                       <div className="flex gap-2">
                          <button onClick={() => handleMobileReject(task)} className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-bold active:scale-95 transition-transform">驳回</button>
                          <button onClick={() => handleMobileApprove(task)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-md active:scale-95 transition-transform">批准</button>
                       </div>
                    </div>
                 ))
              )
          ) : (
              // Done List
              doneHistory.length === 0 ? <div className="text-center text-gray-400 mt-20">暂无历史记录</div> : (
                  doneHistory.map(task => (
                    <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 opacity-80">
                       <div className="flex justify-between items-start mb-2">
                          <div>
                             <h3 className="font-bold text-gray-700">{task.title}</h3>
                             <div className="text-xs text-gray-500 mt-1">{task.subTitle}</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${task.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {task.status === 'approved' ? <CheckCircle size={10} /> : <X size={10} />} 
                             {task.status === 'approved' ? '已批准' : '已驳回'}
                          </span>
                       </div>
                       <div className="text-xs text-gray-400 text-right mt-2">处理时间: {task.doneTime}</div>
                    </div>
                  ))
              )
          )}
       </div>
    </div>
  );

  // ... (ProductionView, DriverView, StaffListView, StaffDetailView, PDAView, StatisticsView - No major logic changes, just ensuring pb-20 for bottom padding) ...
  const ProductionView = () => (
    <div className="h-full bg-white flex flex-col">
       <div className="bg-purple-600 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
          <button onClick={() => setView('home')}><ChevronLeft /></button>
          <h2 className="font-bold text-lg">生产日报填报</h2>
       </div>
       <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="bg-purple-50 p-4 rounded-xl mb-6">
             <label className="block text-purple-800 text-xs font-bold mb-1">生产批次号 (自动)</label>
             <div className="text-xl font-mono font-bold text-purple-900">{prodForm.batchNo}</div>
             <label className="block text-purple-800 text-xs font-bold mt-3 mb-1">生产日期</label>
             <input type="date" value={prodForm.date} onChange={e => setProdForm({...prodForm, date: e.target.value})} className="w-full bg-white border border-purple-200 rounded p-2 text-sm" />
          </div>

          <SectionTitle title="1号产线数据" icon={Factory} color="blue" />
          <div className="space-y-3 px-2">
             <div className="flex justify-between items-center"><label className="text-sm text-gray-600">成品产量 (湿法氟化铝)</label><input type="number" className="w-24 border-b border-gray-300 text-center focus:border-blue-500 outline-none" placeholder="0.00" value={prodForm.line1.output} onChange={e => handleProdChange('line1', 'output', e.target.value)}/></div>
             <div className="text-xs text-gray-400 mt-2 mb-1 pl-1">原料消耗</div>
             <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                <div><label className="block text-xs text-gray-500">萤石</label><input type="number" className="w-full border rounded p-1 text-sm" placeholder="0.00" value={prodForm.line1.fluorite} onChange={e => handleProdChange('line1', 'fluorite', e.target.value)}/></div>
                <div><label className="block text-xs text-gray-500">98%硫酸</label><input type="number" className="w-full border rounded p-1 text-sm" placeholder="0.00" value={prodForm.line1.sulf98} onChange={e => handleProdChange('line1', 'sulf98', e.target.value)}/></div>
             </div>
          </div>

          <SectionTitle title="2号产线数据" icon={Factory} color="orange" />
          <div className="space-y-3 px-2">
             <div className="flex justify-between items-center"><label className="text-sm text-gray-600">成品产量 (湿法氟化铝)</label><input type="number" className="w-24 border-b border-gray-300 text-center focus:border-orange-500 outline-none" placeholder="0.00" value={prodForm.line2.output} onChange={e => handleProdChange('line2', 'output', e.target.value)}/></div>
             <div className="text-xs text-gray-400 mt-2 mb-1 pl-1">原料消耗</div>
             <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                <div><label className="block text-xs text-gray-500">萤石</label><input type="number" className="w-full border rounded p-1 text-sm" placeholder="0.00" value={prodForm.line2.fluorite} onChange={e => handleProdChange('line2', 'fluorite', e.target.value)}/></div>
                <div><label className="block text-xs text-gray-500">98%硫酸</label><input type="number" className="w-full border rounded p-1 text-sm" placeholder="0.00" value={prodForm.line2.sulf98} onChange={e => handleProdChange('line2', 'sulf98', e.target.value)}/></div>
             </div>
          </div>

          <button onClick={handleSaveProd} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold shadow-lg mt-8 active:scale-95 transition-transform flex items-center justify-center gap-2">
             <Save size={18}/> 提交生产日报
          </button>
       </div>
    </div>
  );

  // ... (DriverView, StaffListView, StaffDetailView, PDAView, StatisticsView with pb-20 added) ...
  const DriverView = () => (
    <div className="h-full bg-white flex flex-col">
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
            <button onClick={() => setView('home')}><ChevronLeft /></button>
            <h2 className="font-bold text-lg">驾驶员填报</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-20">
            <SectionTitle title="基础信息" icon={Truck} />
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-4">
                <InputRow label="发货单位" field="senderUnit" placeholder="请输入发货单位" />
                <InputRow label="运输单位" field="transportUnit" placeholder="请输入运输单位" />
                <div className="grid grid-cols-2 gap-4">
                    <InputRow label="主车牌号" field="mainPlate" placeholder="例: 鲁C..." />
                    <InputRow label="挂车牌号" field="trailerPlate" placeholder="例: 鲁C..." />
                </div>
            </div>

            <SectionTitle title="人员信息" icon={User} />
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-4">
                <div className="grid grid-cols-2 gap-4">
                    <InputRow label="驾驶员姓名" field="driverName" />
                    <InputRow label="押运员姓名" field="escortName" />
                </div>
                <InputRow label="卸货数量 (吨)" field="unloadQty" type="number" placeholder="0.00" />
            </div>

            <button onClick={handleDriverSubmit} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg mt-4 active:scale-95 transition-transform flex items-center justify-center gap-2">
                <Send size={18} /> 提交登记
            </button>
        </div>
    </div>
  );

  const StaffListView = () => (
    <div className="h-full bg-gray-50 flex flex-col">
        <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
            <button onClick={() => setView('home')}><ChevronLeft /></button>
            <h2 className="font-bold text-lg">卸货查验列表</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-20">
            {submissions.length === 0 ? <div className="text-center text-gray-400 mt-20">暂无待查验车辆</div> : (
                submissions.map(sub => (
                    <div key={sub.id} onClick={() => handleStaffSelect(sub)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-3 active:bg-green-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-lg text-gray-800">{sub.mainPlate}</div>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">待核准</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                            <div>发货: {sub.senderUnit}</div>
                            <div className="flex justify-between"><span>司机: {sub.driverName}</span><span>{sub.entryTime}</span></div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );

  const StaffDetailView = () => (
    <div className="h-full bg-white flex flex-col">
        <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
            <button onClick={() => setView('staff-list')}><ChevronLeft /></button>
            <h2 className="font-bold text-lg">查验: {formData.mainPlate}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-20">
            <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
                <div className="font-bold">申报信息:</div>
                {formData.senderUnit} | {formData.driverName} | {formData.unloadQty}吨
            </div>

            <SectionTitle title="车辆资质检查" icon={FileText} color="green" />
            <div className="bg-white rounded-lg px-2 mb-2">
                <RadioGroup label="道路运输证" field="roadTransportCert" required />
                <RadioGroup label="驾驶员资格证" field="qualificationCert" required />
            </div>

            <SectionTitle title="安全设施检查" icon={AlertTriangle} color="orange" />
            <div className="bg-white rounded-lg px-2 mb-2">
                <RadioGroup label="危险品标志灯/牌" field="triangleLight" />
                <RadioGroup label="车身反光标识" field="reflectiveStrips" />
                <RadioGroup label="应急处理包" field="emergencyKit" />
                <RadioGroup label="静电拖地带" field="staticGrounding" />
                <RadioGroup label="阻火器" field="sparkArrestor" />
                <RadioGroup label="切断阀" field="cutoffValve" />
            </div>

            <SectionTitle title="卸货前确认" icon={CheckCircle} color="blue" />
            <div className="bg-white rounded-lg px-2 mb-2">
                <RadioGroup label="人车证件相符" field="photoMatch" />
                <RadioGroup label="卸料软管完好" field="hoseIntact" />
                <RadioGroup label="阀门关闭状态" field="valveClosed" />
                <RadioGroup label="接口无泄漏" field="leakCheck" />
            </div>

            <button onClick={handleStaffApprove} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg mt-6 active:scale-95 transition-transform flex items-center justify-center gap-2">
                <Shield size={18} /> 确认核准并放行
            </button>
        </div>
    </div>
  );

  const StatisticsView = () => {
          const stats = useMemo(() => {
              const salesOrders = MOCK_ORDERS.filter(o => o.type === 'sales');
              const totalRevenue = salesOrders.reduce((acc, o) => acc + (o.quantity * o.unitPrice), 0);
              const totalTons = salesOrders.reduce((acc, o) => acc + o.quantity, 0);
              const dailyData: any = {};
              salesOrders.forEach(o => {
                  dailyData[o.shipDate] = (dailyData[o.shipDate] || 0) + (o.quantity * o.unitPrice);
              });
              const trend = Object.entries(dailyData).sort().slice(-7).map(([date, val]: any) => ({ date: date.slice(5), val }));
              return { totalRevenue, totalTons, trend };
          }, []);
          const maxValue = Math.max(...stats.trend.map(t => t.val), 100);

          return (
            <div className="h-full bg-gray-50 flex flex-col">
                <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
                    <button onClick={() => setView('home')}><ChevronLeft /></button>
                    <h2 className="font-bold text-lg">经营统计</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
                        <div className="text-indigo-100 text-sm mb-1">本月累计销售</div>
                        <div className="text-3xl font-bold">¥{(stats.totalRevenue / 10000).toFixed(2)}w</div>
                        <div className="flex gap-4 mt-4 text-xs font-medium text-indigo-100">
                            <div className="bg-white/20 px-2 py-1 rounded">销量: {stats.totalTons}吨</div>
                            <div className="bg-white/20 px-2 py-1 rounded flex items-center gap-1"><TrendingUp size={12}/> 环比 +12%</div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500"/> 近7日销售趋势</h3>
                        <div className="flex items-end justify-between h-32 gap-2">
                            {stats.trend.length > 0 ? stats.trend.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div className="w-full bg-blue-100 rounded-t-sm relative group-hover:bg-blue-200 transition-colors" style={{ height: `${(d.val / maxValue) * 100}%` }}></div>
                                    <div className="text-[10px] text-gray-400">{d.date}</div>
                                </div>
                            )) : <div className="w-full text-center text-gray-400 text-xs mt-10">暂无数据</div>}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-700">最新大额订单</div>
                        {MOCK_ORDERS.filter(o => o.type === 'sales').slice(0, 5).map(o => (
                            <div key={o.id} className="p-4 border-b border-gray-100 last:border-0 flex justify-between items-center">
                                <div><div className="font-bold text-gray-800 text-sm">{o.customerName}</div><div className="text-xs text-gray-500 mt-0.5">{o.productName} | {o.shipDate}</div></div>
                                <div className="text-right"><div className="font-bold text-indigo-600 text-sm">¥{((o.quantity * o.unitPrice)/10000).toFixed(2)}w</div><div className="text-xs text-gray-400">{o.quantity}吨</div></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          );
      };

      const PDAView = () => {
          const [tab, setTab] = useState<'ops'|'inv'|'rec'>('ops');
          const [mode, setMode] = useState<'gen'|'in'|'out'|'dispatch'|'transfer'|'count'|null>(null);
          const [form, setForm] = useState({ 
              barcode: '', weight: '', inWeight: '', unit: '吨', plate: '', 
              product: '湿法氟化铝', type: 'finished', customer: '' 
          });

          const resetForm = () => setForm({ barcode: '', weight: '', inWeight: '', unit: '吨', plate: '', product: '湿法氟化铝', type: 'finished', customer: '' });

          return (
            <div className="h-full bg-gray-50 flex flex-col">
                <div className="bg-slate-800 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
                    <button onClick={() => setView('home')}><ChevronLeft /></button>
                    <h2 className="font-bold text-lg">智能仓储 PDA</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 pb-20">
                    {tab === 'ops' && (
                        <>
                            {mode === null ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={()=>{setMode('in');resetForm()}} className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center gap-3 active:bg-blue-50 h-32"><ArrowDownCircle className="text-green-500" size={32}/><span className="font-bold text-gray-700">扫码入库</span></button>
                                    <button onClick={()=>{setMode('out');resetForm()}} className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center gap-3 active:bg-blue-50 h-32"><ArrowUpCircle className="text-orange-500" size={32}/><span className="font-bold text-gray-700">普通出库</span></button>
                                    <button onClick={()=>{setMode('dispatch');resetForm()}} className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center gap-3 active:bg-blue-50 h-32"><Send className="text-indigo-500" size={32}/><span className="font-bold text-gray-700">销售发货</span></button>
                                    <button onClick={()=>{setMode('transfer');resetForm()}} className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center gap-3 active:bg-blue-50 h-32"><RefreshCw className="text-blue-500" size={32}/><span className="font-bold text-gray-700">移库调拨</span></button>
                                    <button onClick={()=>{setMode('count');resetForm()}} className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center gap-3 active:bg-blue-50 h-32"><ClipboardCheck className="text-purple-500" size={32}/><span className="font-bold text-gray-700">盘点</span></button>
                                    <button onClick={()=>{setMode('gen');resetForm()}} className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center gap-3 active:bg-blue-50 h-32"><ScanLine className="text-slate-500" size={32}/><span className="font-bold text-gray-700">条码生成</span></button>
                                </div>
                            ) : (
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex justify-between mb-4 border-b pb-2"><h3 className="font-bold text-gray-800">{mode==='gen'?'条码生成':mode==='in'?'入库':mode==='out'?'出库':mode==='dispatch'?'发货':mode==='transfer'?'移库':'盘点'}</h3><button onClick={()=>setMode(null)} className="text-sm text-gray-500">取消</button></div>
                                    
                                    {mode === 'gen' ? (
                                        <div className="space-y-3">
                                            <select className="w-full border p-2 rounded bg-white text-sm" value={form.product} onChange={e=>setForm({...form, product:e.target.value})}><option>湿法氟化铝</option><option>氧化铝</option></select>
                                            <div className="flex gap-4"><label><input type="radio" checked={form.type==='finished'} onChange={()=>setForm({...form, type:'finished'})}/> 成品</label><label><input type="radio" checked={form.type==='semi'} onChange={()=>setForm({...form, type:'semi'})}/> 半成品</label></div>
                                            {form.type==='finished' && <input type="text" className="w-full border p-2 rounded text-sm" placeholder="客户名称 (可选)" value={form.customer} onChange={e=>setForm({...form, customer:e.target.value})}/>}
                                            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">生成并打印</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <input type="text" className="w-full border p-2 rounded text-sm" placeholder="扫描条码" autoFocus />
                                            
                                            {mode === 'dispatch' && <input type="text" className="w-full border p-2 rounded text-sm border-red-300 bg-red-50" placeholder="车牌号 (必填)" value={form.plate} onChange={e=>setForm({...form, plate:e.target.value})}/>}
                                            
                                            {mode === 'in' && <div className="grid grid-cols-2 gap-2"><select className="border p-2 rounded text-sm"><option>仓库</option></select><select className="border p-2 rounded text-sm"><option>区域</option></select></div>}
                                            
                                            {mode === 'transfer' && (
                                                <div className="space-y-2 pt-2 border-t">
                                                    <div className="text-xs font-bold">移入位置 & 入库量</div>
                                                    <div className="grid grid-cols-2 gap-2"><select className="border p-2 rounded text-sm"><option>仓库</option></select><select className="border p-2 rounded text-sm"><option>区域</option></select></div>
                                                    <input type="number" className="w-full border p-2 rounded text-sm" placeholder="入库重量" value={form.inWeight} onChange={e=>setForm({...form, inWeight:e.target.value})}/>
                                                </div>
                                            )}

                                            <div className="flex">
                                                <input type="number" className="w-full border p-2 rounded-l text-sm" placeholder={mode==='transfer'?'出库重量':'数量/重量'} value={form.weight} onChange={e=>setForm({...form, weight:e.target.value})}/>
                                                <select className="border p-2 rounded-r bg-gray-100 text-sm" value={form.unit} onChange={e=>setForm({...form, unit:e.target.value as any})}><option>吨</option><option>kg</option></select>
                                            </div>
                                            
                                            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold" onClick={()=>{alert('提交成功'); setMode(null);}}>确认提交</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    {tab === 'inv' && <div className="text-center text-gray-400 py-10">库存查询列表 (模拟)</div>}
                    {tab === 'rec' && <div className="text-center text-gray-400 py-10">操作记录列表 (模拟)</div>}
                </div>
                <div className="bg-white border-t border-gray-200 flex justify-around p-1 pb-3">
                    <button onClick={() => setTab('ops')} className={`flex flex-col items-center justify-center p-2 rounded-lg w-full transition-colors ${tab === 'ops' ? 'text-slate-800' : 'text-gray-400 hover:text-gray-600'}`}><ScanLine size={24} className={tab === 'ops' ? 'fill-current opacity-20' : ''}/><span className="text-[10px] font-bold mt-1">作业</span></button>
                    <button onClick={() => setTab('inv')} className={`flex flex-col items-center justify-center p-2 rounded-lg w-full transition-colors ${tab === 'inv' ? 'text-slate-800' : 'text-gray-400 hover:text-gray-600'}`}><Box size={24} className={tab === 'inv' ? 'fill-current opacity-20' : ''}/><span className="text-[10px] font-bold mt-1">库存</span></button>
                    <button onClick={() => setTab('rec')} className={`flex flex-col items-center justify-center p-2 rounded-lg w-full transition-colors ${tab === 'rec' ? 'text-slate-800' : 'text-gray-400 hover:text-gray-600'}`}><List size={24} className={tab === 'rec' ? 'fill-current opacity-20' : ''}/><span className="text-[10px] font-bold mt-1">记录</span></button>
                </div>
            </div>
          );
      };

  return (
    <div className="flex justify-center items-center h-[calc(100vh-100px)] overflow-auto bg-gray-100 p-4">
        <div className="relative w-[375px] min-h-[750px] bg-black rounded-[3rem] shadow-2xl border-8 border-gray-800 overflow-hidden shrink-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-32 bg-black rounded-b-xl z-20"></div>
            <div className="w-full h-full bg-white pt-8 relative min-h-[734px] flex flex-col">
                {view === 'home' && <HomeView />}
                {view === 'pda' && <PDAView />}
                {view === 'driver' && <DriverView />}
                {view === 'staff-list' && <StaffListView />}
                {view === 'staff-detail' && <StaffDetailView />}
                {view === 'production' && <ProductionView />}
                {view === 'todo-list' && <TodoListView />}
                {view === 'stats' && <StatisticsView />}
            </div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full opacity-50 z-20"></div>
        </div>
    </div>
  );
};
