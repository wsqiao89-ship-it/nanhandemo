
import React, { useState, useMemo } from 'react';
import { ChevronLeft, Menu, Camera, PenTool, CheckCircle, AlertTriangle, Clock, Save, User, Truck, FileText, Shield, Factory, Calendar, Layers, ChevronRight, Search, Edit, Trash2, X, FileCheck, DollarSign, PieChart, TrendingUp } from 'lucide-react';
import { StockRecord, Order, OrderStatus } from '../types';
import { MOCK_ORDERS } from '../constants'; // Import MOCK_ORDERS for stats

interface AppSimulationProps {
  onSaveProduction?: (records: StockRecord[]) => void;
  pendingTasks?: Order[];
  onApprove?: (order: Order) => void;
  onReject?: (order: Order) => void;
}

// Define the shape of a submission
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
  driverName: string;
  driverId: string;
  escortName: string;
  escortId: string;
  qualificationCert: string;
  hazmatCert: string;
  // Verification fields (initially empty or default)
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
    mainPlate: '', trailerPlate: '', approvedLoad: '', unloadQty: '',
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

// Mock 2 existing submissions
const MOCK_SUBMISSIONS: SubmissionData[] = [
  {
    ...INITIAL_FORM_DATA,
    id: 'SUB-001',
    senderUnit: '鲁西化工集团',
    mainPlate: '鲁C88888',
    driverName: '张建国',
    unloadQty: '32',
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
    entryTime: '2023-10-30 09:15',
    transportUnit: '北方运输',
    escortName: '王保障'
  }
];

export const AppSimulation: React.FC<AppSimulationProps> = ({ onSaveProduction, pendingTasks = [], onApprove, onReject }) => {
  const [view, setView] = useState<'home' | 'driver' | 'staff-list' | 'staff-detail' | 'production' | 'todo-list' | 'stats'>('home');
  
  // List of submissions waiting for verification
  const [submissions, setSubmissions] = useState<SubmissionData[]>(MOCK_SUBMISSIONS);
  
  // The current form data being edited (either by driver or staff)
  const [formData, setFormData] = useState<SubmissionData>(INITIAL_FORM_DATA);

  // --- PRODUCTION STATE ---
  const [prodForm, setProdForm] = useState({
    batchNo: `BATCH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-01`,
    date: new Date().toISOString().split('T')[0],
    line1: { output: '', fluorite: '', sulf98: '', sulf105: '' },
    line2: { output: '', fluorite: '', sulf98: '', sulf105: '' },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProdChange = (line: 'line1' | 'line2', field: string, value: string) => {
    setProdForm(prev => ({
      ...prev,
      [line]: { ...prev[line], [field]: value }
    }));
  };

  // --- Actions ---

  const handleDriverSubmit = () => {
    if (formData.id) {
        // Update existing
        setSubmissions(prev => prev.map(s => s.id === formData.id ? { ...formData, entryTime: s.entryTime } : s));
        alert('修改保存成功！');
        setView('staff-list'); // Return to list if editing
    } else {
        // Create new
        const newSubmission: SubmissionData = {
          ...formData,
          id: `SUB-${Date.now()}`,
          entryTime: new Date().toLocaleString('zh-CN', { hour12: false })
        };
        setSubmissions(prev => [newSubmission, ...prev]);
        alert('提交成功！请等待现场人员核验。');
        setView('home');
    }
    setFormData(INITIAL_FORM_DATA);
  };

  const handleStaffSelect = (sub: SubmissionData) => {
    setFormData(sub);
    setView('staff-detail');
  };

  const handleEditSubmission = (e: React.MouseEvent, sub: SubmissionData) => {
    e.stopPropagation();
    setFormData(sub);
    setView('driver'); // Reuse driver view for editing
  };

  const handleDeleteSubmission = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这条待查验记录吗？')) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleStaffApprove = () => {
    // Remove from pending list
    setSubmissions(prev => prev.filter(s => s.id !== formData.id));
    alert('核准完成，允许出厂！');
    setFormData(INITIAL_FORM_DATA);
    setView('staff-list'); // Go back to list
  };

  const handleSaveProd = () => {
    if (!onSaveProduction) return;
    
    const records: StockRecord[] = [];
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const ref = `生产消耗-${prodForm.batchNo}`;

    const addRec = (product: string, qtyStr: string) => {
      const qty = parseFloat(qtyStr);
      if (qty > 0) {
        records.push({
          id: `prod-${Date.now()}-${Math.random()}`,
          date: now,
          type: 'out',
          product,
          qty,
          ref,
          plate: '-',
          materialType: 'semi'
        });
      }
    };

    addRec('萤石', prodForm.line1.fluorite);
    addRec('98%硫酸', prodForm.line1.sulf98);
    addRec('105%硫酸', prodForm.line1.sulf105);
    addRec('萤石', prodForm.line2.fluorite);
    addRec('98%硫酸', prodForm.line2.sulf98);
    addRec('105%硫酸', prodForm.line2.sulf105);

    onSaveProduction(records);
    alert('生产日报已提交，原料消耗已同步至库存记录！');
    setView('home');
  };

  // --- Components ---

  const RadioGroup = ({ label, field, required = false }: any) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
        <label className="text-sm text-gray-700 flex items-center gap-1">
            {required && <span className="text-red-500">*</span>}
            {label}
        </label>
        <div className="flex gap-4">
            <label className="flex items-center gap-1 cursor-pointer">
                <input type="radio" checked={formData[field as keyof typeof formData] === true} onChange={() => handleInputChange(field, true)} className="w-4 h-4 text-blue-600" />
                <span className="text-sm">有/是</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
                <input type="radio" checked={formData[field as keyof typeof formData] === false} onChange={() => handleInputChange(field, false)} className="w-4 h-4 text-gray-400" />
                <span className="text-sm">无/否</span>
            </label>
        </div>
    </div>
  );

  const InputRow = ({ label, field, type="text", placeholder="" }: any) => (
      <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">{label}</label>
          <input 
            type={type}
            className="w-full border-b border-gray-200 py-1 text-sm focus:outline-none focus:border-blue-500 bg-transparent"
            value={formData[field as keyof typeof formData] as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
          />
      </div>
  );

  const ProdInput = ({ label, value, onChange }: any) => (
    <div className="mb-2">
      <label className="text-xs text-gray-500">{label}</label>
      <input 
        type="number" 
        className="w-full border border-gray-300 rounded p-1.5 text-sm font-medium"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0.0"
      />
    </div>
  );

  const SectionTitle = ({ title, icon: Icon, color = "blue" }: any) => (
      <div className={`bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 flex items-center gap-2 border-l-4 border-${color}-600 mt-4 mb-2`}>
          {Icon && <Icon size={14} className={`text-${color}-600`}/>} {title}
      </div>
  );

  // --- Views ---

  const HomeView = () => (
      <div className="h-full bg-gray-50 flex flex-col">
          <div className="bg-blue-600 h-48 rounded-b-[3rem] relative flex items-center justify-center shadow-lg">
              <div className="text-center text-white">
                  <Truck size={48} className="mx-auto mb-2 opacity-90"/>
                  <h1 className="text-2xl font-bold">数字化工厂</h1>
                  <p className="text-blue-100 text-sm">Digital Factory App</p>
              </div>
          </div>
          
          <div className="flex-1 p-6 -mt-10 space-y-4">
              {/* My To-Do Button */}
              <button onClick={() => setView('todo-list')} className="w-full bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all border border-gray-100 relative overflow-hidden">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                      <FileCheck size={24} />
                  </div>
                  <div className="text-left flex-1">
                      <h3 className="font-bold text-gray-800 text-lg">我的待办</h3>
                      <p className="text-gray-500 text-sm">审批、审核与确认事项</p>
                  </div>
                  {pendingTasks.length > 0 && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
                          {pendingTasks.length}
                      </div>
                  )}
              </button>

              <button onClick={() => setView('stats')} className="w-full bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all border border-gray-100">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                      <PieChart size={24} />
                  </div>
                  <div className="text-left">
                      <h3 className="font-bold text-gray-800 text-lg">统计分析</h3>
                      <p className="text-gray-500 text-sm">查看经营数据日报</p>
                  </div>
              </button>

              <button onClick={() => { setFormData(INITIAL_FORM_DATA); setView('driver'); }} className="w-full bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all border border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <User size={24} />
                  </div>
                  <div className="text-left">
                      <h3 className="font-bold text-gray-800 text-lg">驾驶员填报</h3>
                      <p className="text-gray-500 text-sm">硫酸卸货信息登记</p>
                  </div>
              </button>

              <button onClick={() => setView('staff-list')} className="w-full bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all border border-gray-100">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <Shield size={24} />
                  </div>
                  <div className="text-left">
                      <h3 className="font-bold text-gray-800 text-lg">卸货查验核准</h3>
                      <p className="text-gray-500 text-sm">选择车辆进行安全检查</p>
                  </div>
              </button>

              <button onClick={() => setView('production')} className="w-full bg-white p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all border border-gray-100">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                      <Factory size={24} />
                  </div>
                  <div className="text-left">
                      <h3 className="font-bold text-gray-800 text-lg">生产日报录入</h3>
                      <p className="text-gray-500 text-sm">每日产量与原料消耗</p>
                  </div>
              </button>
          </div>
      </div>
  );

  const StatisticsView = () => {
      // Calculate Stats on the fly from MOCK_ORDERS
      const stats = useMemo(() => {
          const salesOrders = MOCK_ORDERS.filter(o => o.type === 'sales');
          const totalRevenue = salesOrders.reduce((acc, o) => acc + (o.quantity * o.unitPrice), 0);
          const totalTons = salesOrders.reduce((acc, o) => acc + o.quantity, 0);
          
          // Simple day grouping
          const dailyData: Record<string, number> = {};
          salesOrders.forEach(o => {
              dailyData[o.shipDate] = (dailyData[o.shipDate] || 0) + (o.quantity * o.unitPrice);
          });
          const trend = Object.entries(dailyData).sort().slice(-7).map(([date, val]) => ({ date: date.slice(5), val })); // Last 7 data points

          return { totalRevenue, totalTons, trend };
      }, []);

      const maxValue = Math.max(...stats.trend.map(t => t.val), 100);

      return (
        <div className="h-full bg-gray-50 flex flex-col">
            <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
                <button onClick={() => setView('home')}><ChevronLeft /></button>
                <h2 className="font-bold text-lg">经营统计</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Total Card */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
                    <div className="text-indigo-100 text-sm mb-1">本月累计销售</div>
                    <div className="text-3xl font-bold">¥{(stats.totalRevenue / 10000).toFixed(2)}w</div>
                    <div className="flex gap-4 mt-4 text-xs font-medium text-indigo-100">
                        <div className="bg-white/20 px-2 py-1 rounded">销量: {stats.totalTons}吨</div>
                        <div className="bg-white/20 px-2 py-1 rounded flex items-center gap-1"><TrendingUp size={12}/> 环比 +12%</div>
                    </div>
                </div>

                {/* Mini Chart */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-500"/> 近7日销售趋势
                    </h3>
                    <div className="flex items-end justify-between h-32 gap-2">
                        {stats.trend.length > 0 ? stats.trend.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                <div className="w-full bg-blue-100 rounded-t-sm relative group-hover:bg-blue-200 transition-colors" style={{ height: `${(d.val / maxValue) * 100}%` }}></div>
                                <div className="text-[10px] text-gray-400">{d.date}</div>
                            </div>
                        )) : <div className="w-full text-center text-gray-400 text-xs mt-10">暂无数据</div>}
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-700">最新大额订单</div>
                    {MOCK_ORDERS.filter(o => o.type === 'sales').slice(0, 5).map(o => (
                        <div key={o.id} className="p-4 border-b border-gray-100 last:border-0 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-gray-800 text-sm">{o.customerName}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{o.productName} | {o.shipDate}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-indigo-600 text-sm">¥{((o.quantity * o.unitPrice)/10000).toFixed(2)}w</div>
                                <div className="text-xs text-gray-400">{o.quantity}吨</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      );
  };

  const TodoListView = () => (
    <div className="h-full bg-white flex flex-col">
        <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
            <button onClick={() => setView('home')}><ChevronLeft /></button>
            <h2 className="font-bold text-lg">待办事项</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {pendingTasks.length === 0 ? (
                <div className="text-center text-gray-400 py-10 flex flex-col items-center">
                   <div className="bg-gray-100 p-4 rounded-full mb-3"><CheckCircle size={32} className="text-green-500"/></div>
                   <p>暂无待办事项</p>
                   <p className="text-xs mt-1">您已完成所有审批任务</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingTasks.map(task => (
                        <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            {/* Header Badge */}
                            <div className="flex justify-between items-start mb-3">
                                <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${task.status === OrderStatus.PendingAudit ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {task.status === OrderStatus.PendingAudit ? <FileCheck size={12}/> : <DollarSign size={12}/>}
                                    {task.status === OrderStatus.PendingAudit ? '订单审核' : '价格审批'}
                                </div>
                                <span className="text-xs text-gray-400">{task.history[0]?.date.split(' ')[0]}</span>
                            </div>
                            
                            {/* Content */}
                            <div className="mb-4">
                                <h3 className="font-bold text-gray-800 text-lg">{task.customerName}</h3>
                                <div className="text-sm text-gray-500 mt-1 flex justify-between">
                                    <span>{task.productName}</span>
                                    <span>{task.quantity} 吨</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    金额: <span className="font-bold text-gray-700">¥{(task.quantity * task.unitPrice).toLocaleString()}</span>
                                </div>
                                {task.status === OrderStatus.PriceApproval && (
                                    <div className="text-xs text-yellow-600 mt-1 bg-yellow-50 px-2 py-1 rounded">
                                        申请调价
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                                <button 
                                    onClick={() => onReject && onReject(task)}
                                    className="py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50 active:scale-95 transition-all"
                                >
                                    驳回
                                </button>
                                <button 
                                    onClick={() => onApprove && onApprove(task)}
                                    className="py-2.5 rounded-lg bg-black text-white text-sm font-bold shadow-md hover:bg-gray-800 active:scale-95 transition-all"
                                >
                                    批准
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );

  const DriverView = () => (
      <div className="h-full bg-white flex flex-col">
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
              <button onClick={() => setView(formData.id ? 'staff-list' : 'home')}><ChevronLeft /></button>
              <h2 className="font-bold text-lg">{formData.id ? '修改申报信息' : '硫酸卸货信息填写'}</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-20">
              <SectionTitle title="发货与运输单位信息" icon={FileText} />
              <InputRow label="发货单位" field="senderUnit" placeholder="请输入发货单位" />
              <InputRow label="道路运输证号" field="roadTransportCert" />
              <InputRow label="运输单位" field="transportUnit" />
              <InputRow label="经营许可证号" field="businessLicense" />
              <SectionTitle title="车辆资质情况" icon={Truck} />
              <div className="grid grid-cols-2 gap-4">
                  <InputRow label="主车牌号" field="mainPlate" placeholder="鲁C..." />
                  <InputRow label="挂车牌号" field="trailerPlate" />
                  <InputRow label="核定载重 (吨)" field="approvedLoad" type="number" />
                  <InputRow label="卸车数量 (吨)" field="unloadQty" type="number" />
              </div>
              <SectionTitle title="人员资质情况" icon={User} />
              <InputRow label="驾驶人姓名" field="driverName" />
              <InputRow label="身份证号" field="driverId" />
              <InputRow label="从业资格证号" field="qualificationCert" />
              <div className="border-t my-2 border-dashed"></div>
              <InputRow label="押运员姓名" field="escortName" />
              <InputRow label="身份证号" field="escortId" />
              <InputRow label="危险货物运输操作证" field="hazmatCert" />
              <div className="mt-6 p-3 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-100 flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5" />
                  <span>本人承诺以上填写信息真实有效，并严格遵守厂区安全规定。</span>
              </div>
          </div>
          <div className="p-4 border-t bg-white absolute bottom-0 w-full">
              <button onClick={handleDriverSubmit} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg active:scale-95 transition-transform">
                  {formData.id ? '保存修改' : '提交表单'}
              </button>
          </div>
      </div>
  );

  const StaffListView = () => (
    <div className="h-full bg-white flex flex-col">
        <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
            <button onClick={() => setView('home')}><ChevronLeft /></button>
            <h2 className="font-bold text-lg">待查验车辆列表</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="bg-white rounded-lg p-2 flex items-center gap-2 border mb-4">
               <Search size={18} className="text-gray-400"/>
               <input type="text" placeholder="搜索车牌号..." className="flex-1 outline-none text-sm"/>
            </div>
            
            {submissions.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                   <Truck size={48} className="mx-auto mb-2 opacity-20"/>
                   <p>暂无待查验车辆</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {submissions.map(sub => (
                        <div key={sub.id} onClick={() => handleStaffSelect(sub)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform flex justify-between items-center cursor-pointer group">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg text-gray-800">{sub.mainPlate}</span>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">待卸货</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                    <p>司机: {sub.driverName}</p>
                                    <p>货物: 硫酸 ({sub.unloadQty}吨)</p>
                                    <p>进厂: {sub.entryTime.split(' ')[1]}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {/* Action Buttons */}
                                <button 
                                    onClick={(e) => handleEditSubmission(e, sub)} 
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="编辑/修改"
                                >
                                    <Edit size={18} />
                                </button>
                                <button 
                                    onClick={(e) => handleDeleteSubmission(e, sub.id)} 
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="删除"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <ChevronRight className="text-gray-300 ml-1" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );

  const StaffDetailView = () => (
      <div className="h-full bg-white flex flex-col">
          <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
              <button onClick={() => setView('staff-list')}><ChevronLeft /></button>
              <h2 className="font-bold text-lg">卸货查验核准</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-20">
              <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-2 border-b pb-2">
                      <span className="font-bold text-gray-700">{formData.mainPlate}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">正在作业</span>
                  </div>
                  <div className="text-xs text-gray-500 grid grid-cols-2 gap-y-1">
                      <span>司机: {formData.driverName}</span>
                      <span>押运: {formData.escortName}</span>
                      <span>单位: {formData.transportUnit}</span>
                      <span>数量: {formData.unloadQty} 吨</span>
                  </div>
              </div>
              <SectionTitle title="卸车前安全配置检查" icon={Shield} color="green" />
              <div className="space-y-1">
                  <RadioGroup label="三角顶灯" field="triangleLight" />
                  <RadioGroup label="反光条" field="reflectiveStrips" />
                  <RadioGroup label="矩形标牌" field="rectSign" />
                  <RadioGroup label="应急器材" field="emergencyKit" />
                  <RadioGroup label="导静电荷" field="staticGrounding" />
                  <RadioGroup label="*防波板" field="baffles" required />
                  <RadioGroup label="毒爆腐蚀标志" field="hazmatSigns" />
                  <RadioGroup label="*速断阀" field="cutoffValve" required />
                  <RadioGroup label="防火帽" field="sparkArrestor" />
              </div>
              <SectionTitle title="一致性与完好性" icon={CheckCircle} color="green" />
              <RadioGroup label="车辆/罐体与行驶证一致" field="photoMatch" required />
              <RadioGroup label="卸车软管是否完好" field="hoseIntact" required />
              <SectionTitle title="作业数据记录" icon={FileText} color="green" />
              <div className="grid grid-cols-2 gap-4">
                  <InputRow label="分析结果 (%)" field="analysisResult" />
                  <InputRow label="卸入储罐号" field="tankId" />
                  <InputRow label="卸车前液位 (m)" field="levelBefore" type="number" />
                  <InputRow label="卸车后液位 (m)" field="levelAfter" type="number" />
              </div>
              <div className="mt-2 border rounded p-2 bg-gray-50">
                  <div className="text-xs font-bold text-gray-600 mb-2">上班液位记录 (米)</div>
                  <div className="grid grid-cols-4 gap-2">
                      <InputRow label="DCS 1#" field="startDcs1" />
                      <InputRow label="DCS 2#" field="startDcs2" />
                      <InputRow label="现场 1#" field="startSite1" />
                      <InputRow label="现场 2#" field="startSite2" />
                  </div>
              </div>
              <div className="mt-2 border rounded p-2 bg-gray-50">
                  <div className="text-xs font-bold text-gray-600 mb-2">下班液位记录 (米)</div>
                  <div className="grid grid-cols-4 gap-2">
                      <InputRow label="DCS 1#" field="endDcs1" />
                      <InputRow label="DCS 2#" field="endDcs2" />
                      <InputRow label="现场 1#" field="endSite1" />
                      <InputRow label="现场 2#" field="endSite2" />
                  </div>
              </div>
              <SectionTitle title="卸车后检查" icon={CheckCircle} color="green" />
              <RadioGroup label="软管是否收好" field="hoseStored" />
              <RadioGroup label="阀门是否关闭" field="valveClosed" />
              <RadioGroup label="硫酸有无泄漏" field="leakCheck" />
              <SectionTitle title="时间与签字" icon={Clock} color="green" />
              <div className="grid grid-cols-2 gap-4 mb-2">
                  <InputRow label="入厂时间" field="entryTime" type="datetime-local" />
                  <InputRow label="出厂时间" field="exitTime" type="datetime-local" />
              </div>
              <InputRow label="备注" field="remark" placeholder="异常情况说明..." />
              <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="border border-dashed border-gray-300 rounded h-16 flex items-center justify-center text-gray-400 bg-gray-50 cursor-pointer hover:bg-white" onClick={() => handleInputChange('unloaderSign', '已签字')}>
                      {formData.unloaderSign ? <span className="font-handwriting text-black font-bold text-lg">王操作</span> : '卸车员签字'}
                  </div>
                  <div className="border border-dashed border-gray-300 rounded h-16 flex items-center justify-center text-gray-400 bg-gray-50 cursor-pointer hover:bg-white" onClick={() => handleInputChange('supervisorSign', '已签字')}>
                      {formData.supervisorSign ? <span className="font-handwriting text-black font-bold text-lg">李监管</span> : '监管人员签字'}
                  </div>
              </div>
          </div>
          <div className="p-4 border-t bg-white absolute bottom-0 w-full">
              <button onClick={handleStaffApprove} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <Save size={18} /> 确认核准 & 归档
              </button>
          </div>
      </div>
  );

  const ProductionView = () => (
    <div className="h-full bg-white flex flex-col">
        <div className="bg-purple-600 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-10">
            <button onClick={() => setView('home')}><ChevronLeft /></button>
            <h2 className="font-bold text-lg">生产日报录入</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
            <SectionTitle title="基础信息" icon={Calendar} color="purple" />
            <div className="space-y-3">
               <div>
                  <label className="text-xs text-gray-500">日期</label>
                  <input type="date" className="w-full border-b border-gray-200 py-1 text-sm bg-transparent" value={prodForm.date} onChange={e => setProdForm({...prodForm, date: e.target.value})} />
               </div>
               <div>
                  <label className="text-xs text-gray-500">生产批次号</label>
                  <input type="text" className="w-full border-b border-gray-200 py-1 text-sm bg-transparent font-mono" value={prodForm.batchNo} onChange={e => setProdForm({...prodForm, batchNo: e.target.value})} />
               </div>
            </div>

            <SectionTitle title="1号线生产数据" icon={Factory} color="purple" />
            <div className="bg-purple-50 p-4 rounded-lg space-y-3">
               <ProdInput label="今日产量 (成品吨)" value={prodForm.line1.output} onChange={(v: string) => handleProdChange('line1', 'output', v)} />
               <div className="border-t border-purple-200 my-2 pt-2">
                  <p className="text-xs font-bold text-purple-800 mb-2">原料消耗 (吨)</p>
                  <div className="grid grid-cols-3 gap-3">
                     <ProdInput label="萤石" value={prodForm.line1.fluorite} onChange={(v: string) => handleProdChange('line1', 'fluorite', v)} />
                     <ProdInput label="98硫酸" value={prodForm.line1.sulf98} onChange={(v: string) => handleProdChange('line1', 'sulf98', v)} />
                     <ProdInput label="105硫酸" value={prodForm.line1.sulf105} onChange={(v: string) => handleProdChange('line1', 'sulf105', v)} />
                  </div>
               </div>
            </div>

            <SectionTitle title="2号线生产数据" icon={Factory} color="purple" />
            <div className="bg-purple-50 p-4 rounded-lg space-y-3">
               <ProdInput label="今日产量 (成品吨)" value={prodForm.line2.output} onChange={(v: string) => handleProdChange('line2', 'output', v)} />
               <div className="border-t border-purple-200 my-2 pt-2">
                  <p className="text-xs font-bold text-purple-800 mb-2">原料消耗 (吨)</p>
                  <div className="grid grid-cols-3 gap-3">
                     <ProdInput label="萤石" value={prodForm.line2.fluorite} onChange={(v: string) => handleProdChange('line2', 'fluorite', v)} />
                     <ProdInput label="98硫酸" value={prodForm.line2.sulf98} onChange={(v: string) => handleProdChange('line2', 'sulf98', v)} />
                     <ProdInput label="105硫酸" value={prodForm.line2.sulf105} onChange={(v: string) => handleProdChange('line2', 'sulf105', v)} />
                  </div>
               </div>
            </div>
        </div>

        <div className="p-4 border-t bg-white absolute bottom-0 w-full">
            <button onClick={handleSaveProd} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                <Save size={18} /> 保存并生成消耗记录
            </button>
        </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center h-[calc(100vh-100px)] overflow-hidden bg-gray-100 p-4">
        {/* Phone Frame */}
        <div className="relative w-[375px] h-[750px] bg-black rounded-[3rem] shadow-2xl border-8 border-gray-800 overflow-hidden shrink-0">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-32 bg-black rounded-b-xl z-20"></div>
            
            {/* Status Bar Mock */}
            <div className="absolute top-2 w-full px-6 flex justify-between text-white text-xs z-20 font-medium">
                <span>9:41</span>
                <div className="flex gap-1">
                    <span>5G</span>
                    <span>100%</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="w-full h-full bg-white pt-8 relative">
                {view === 'home' && <HomeView />}
                {view === 'todo-list' && <TodoListView />}
                {view === 'stats' && <StatisticsView />}
                {view === 'driver' && <DriverView />}
                {view === 'staff-list' && <StaffListView />}
                {view === 'staff-detail' && <StaffDetailView />}
                {view === 'production' && <ProductionView />}
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full opacity-50 z-20"></div>
        </div>
        
        {/* Helper Text */}
        <div className="ml-10 hidden lg:block max-w-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">APP 移动端模拟</h2>
            <p className="text-gray-600 mb-4">
                此页面模拟司机端、现场操作员及生产班组使用的移动 APP 界面。
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-500">
                <li><span className="font-bold text-red-600">我的待办:</span> 随时随地处理审批任务（如财务审核、价格审批），数据与PC端实时同步。</li>
                <li><span className="font-bold text-indigo-600">统计分析:</span> 查看企业经营数据日报、销售趋势及业绩排行。</li>
                <li><span className="font-bold text-blue-600">驾驶员填报:</span> 司机入厂前或排队时填写详细的车辆、人员及货物资质信息。</li>
                <li><span className="font-bold text-green-600">卸货查验核准:</span> 现场人员先选择车辆，再核对信息，进行卸车安全检查。</li>
                <li><span className="font-bold text-purple-600">生产日报录入:</span> 班组每日填报产出与消耗，系统自动扣减原料库存。</li>
            </ul>
        </div>
    </div>
  );
};
