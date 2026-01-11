
import React, { useState, useMemo } from 'react';
import { ShoppingCart, Package, Gavel, FileText, List, Edit, Send, History, Globe, User, CheckCircle, XCircle, Clock, Filter, AlertCircle, TrendingUp, Download, Calendar } from 'lucide-react';

// --- Types ---
interface PriceRecord {
  id?: string;
  name?: string; // For Purchase/Common
  product?: string; // For Sale
  customer?: string; // For Customer Sale
  price: number;
  updateTime: string;
}

interface ApprovalRecord {
  billNo: string;
  priceType: 'purchase' | 'saleCommon' | 'saleCustomer';
  product: string;
  customer?: string;
  oldPrice: number;
  newPrice: number;
  submitTime: string;
  remark: string;
  status: 'pending' | 'handled';
  approvalStatus?: 'approved' | 'rejected';
  approver?: string;
  approveTime?: string;
  approveRemark?: string;
}

interface HistoryRecord extends ApprovalRecord {}

interface OrderPriceRecord {
  id: string;
  customer: string;
  product: string;
  priceType: string;
  price: number;
  qty: number;
  totalAmount: number;
  recordTime: string;
}

// --- Mock Data ---
const INITIAL_PURCHASE_PRICES = [
  { name: '萤石', price: 2800.00, updateTime: '2023-10-25 09:00:00' },
  { name: '再生水', price: 3.50, updateTime: '2023-10-25 09:00:00' },
  { name: '水玻璃', price: 850.00, updateTime: '2023-10-25 09:00:00' },
  { name: '液碱', price: 1200.00, updateTime: '2023-10-25 09:00:00' }
];

const INITIAL_SALE_COMMON = [
  { name: '氧化铝', price: 3200.00, updateTime: '2023-10-25 09:00:00' },
  { name: '湿法氟化铝', price: 9800.00, updateTime: '2023-10-25 09:00:00' },
  { name: '废塑料', price: 2300.00, updateTime: '2023-10-25 09:00:00' },
  { name: '废铁', price: 2900.00, updateTime: '2023-10-25 09:00:00' },
  { name: '碳酸钠', price: 1500.00, updateTime: '2023-10-25 09:00:00' },
  { name: '石子', price: 80.00, updateTime: '2023-10-25 09:00:00' }
];

const INITIAL_SALE_CUSTOMER = [
  { customer: 'A商贸有限公司', product: '氧化铝', price: 3150.00, updateTime: '2023-10-26 10:00:00' },
  { customer: 'B新材料科技', product: '湿法氟化铝', price: 9700.00, updateTime: '2023-10-26 10:00:00' },
  { customer: 'C建筑工程公司', product: '石子', price: 75.00, updateTime: '2023-10-26 10:00:00' }
];

const INITIAL_HISTORY: HistoryRecord[] = [
    {
        billNo: 'HIST001',
        priceType: 'purchase',
        product: '萤石',
        oldPrice: 2750.00,
        newPrice: 2800.00,
        submitTime: '2023-10-24 14:00:00',
        remark: '供应商调价',
        status: 'handled',
        approvalStatus: 'approved',
        approver: '张经理',
        approveTime: '2023-10-25 09:00:00',
        approveRemark: '同意'
    },
    {
        billNo: 'HIST002',
        priceType: 'saleCommon',
        product: '氧化铝',
        oldPrice: 3100.00,
        newPrice: 3200.00,
        submitTime: '2023-10-20 10:00:00',
        remark: '市场行情上涨',
        status: 'handled',
        approvalStatus: 'approved',
        approver: '李总',
        approveTime: '2023-10-21 09:30:00',
        approveRemark: '批准执行'
    }
];

const INITIAL_ORDER_Records: OrderPriceRecord[] = [
    { 
        id: 'ORD20231029001', 
        customer: 'A商贸有限公司', 
        product: '氧化铝', 
        priceType: '客户专属价', 
        price: 3150.00, 
        qty: 50, 
        totalAmount: 157500.00, 
        recordTime: '2023-10-29 10:30:00'
    },
    { 
        id: 'ORD20231029002', 
        customer: 'C建筑工程公司', 
        product: '石子', 
        priceType: '客户专属价', 
        price: 75.00, 
        qty: 1000, 
        totalAmount: 75000.00, 
        recordTime: '2023-10-29 11:15:00'
    }
];

// Mock Trend Data Generator
const generateTrendData = (basePrice: number) => {
  const data = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0].slice(5); // MM-DD
    // Random fluctuation +/- 5%
    const variance = (Math.random() - 0.5) * 0.1; 
    const price = basePrice * (1 + variance);
    data.push({ date: dateStr, price: Math.round(price) });
  }
  return data;
};


export const PriceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'purchase' | 'sale' | 'approval' | 'trend' | 'order'>('purchase');
  
  // Data State
  const [purchasePrices, setPurchasePrices] = useState<PriceRecord[]>(INITIAL_PURCHASE_PRICES);
  const [saleCommonPrices, setSaleCommonPrices] = useState<PriceRecord[]>(INITIAL_SALE_COMMON);
  const [saleCustomerPrices, setSaleCustomerPrices] = useState<PriceRecord[]>(INITIAL_SALE_CUSTOMER);
  
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRecord[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<HistoryRecord[]>(INITIAL_HISTORY);
  
  // Trend State
  const [trendType, setTrendType] = useState<'purchase' | 'sale'>('purchase');
  const [trendProduct, setTrendProduct] = useState('萤石');
  
  // Forms State
  const [purchaseForm, setPurchaseForm] = useState({ product: '', price: '', remark: '' });
  const [saleCommonForm, setSaleCommonForm] = useState({ product: '', price: '', remark: '' });
  const [saleCustomerForm, setSaleCustomerForm] = useState({ customer: '', product: '', price: '', remark: '' });

  // --- Actions ---

  const submitPurchasePrice = () => {
      if (!purchaseForm.product || !purchaseForm.price || !purchaseForm.remark) return alert('请填写完整信息');
      
      const current = purchasePrices.find(p => p.name === purchaseForm.product);
      const oldPrice = current ? current.price : 0;
      
      const newRequest: ApprovalRecord = {
          billNo: `PUR${Date.now()}`,
          priceType: 'purchase',
          product: purchaseForm.product,
          oldPrice,
          newPrice: parseFloat(purchaseForm.price),
          submitTime: new Date().toLocaleString('zh-CN', {hour12: false}),
          remark: purchaseForm.remark,
          status: 'pending'
      };
      
      setPendingApprovals(prev => [newRequest, ...prev]);
      setPurchaseForm({ product: '', price: '', remark: '' });
      alert('采购价格调整申请已提交，等待审批。');
  };

  const submitSaleCommonPrice = () => {
      if (!saleCommonForm.product || !saleCommonForm.price || !saleCommonForm.remark) return alert('请填写完整信息');

      const current = saleCommonPrices.find(p => p.name === saleCommonForm.product);
      const oldPrice = current ? current.price : 0;

      const newRequest: ApprovalRecord = {
          billNo: `SAL-COM${Date.now()}`,
          priceType: 'saleCommon',
          product: saleCommonForm.product,
          oldPrice,
          newPrice: parseFloat(saleCommonForm.price),
          submitTime: new Date().toLocaleString('zh-CN', {hour12: false}),
          remark: saleCommonForm.remark,
          status: 'pending'
      };

      setPendingApprovals(prev => [newRequest, ...prev]);
      setSaleCommonForm({ product: '', price: '', remark: '' });
      alert('通用出货价格调整申请已提交，等待审批。');
  };

  const submitSaleCustomerPrice = () => {
      if (!saleCustomerForm.customer || !saleCustomerForm.product || !saleCustomerForm.price || !saleCustomerForm.remark) return alert('请填写完整信息');

      const current = saleCustomerPrices.find(p => p.customer === saleCustomerForm.customer && p.product === saleCustomerForm.product);
      const oldPrice = current ? current.price : 0; 

      const newRequest: ApprovalRecord = {
          billNo: `SAL-CUS${Date.now()}`,
          priceType: 'saleCustomer',
          customer: saleCustomerForm.customer,
          product: saleCustomerForm.product,
          oldPrice,
          newPrice: parseFloat(saleCustomerForm.price),
          submitTime: new Date().toLocaleString('zh-CN', {hour12: false}),
          remark: saleCustomerForm.remark,
          status: 'pending'
      };

      setPendingApprovals(prev => [newRequest, ...prev]);
      setSaleCustomerForm({ customer: '', product: '', price: '', remark: '' });
      alert('客户专属价格调整申请已提交，等待审批。');
  };

  const handleApproval = (billNo: string, approved: boolean) => {
      const record = pendingApprovals.find(r => r.billNo === billNo);
      if (!record) return;

      const approverName = prompt("请输入审批人姓名", "Admin");
      if (!approverName) return;
      
      const remark = prompt(approved ? "请输入审批意见 (可选)" : "请输入驳回原因 (必填)", approved ? "同意" : "");
      if (!approved && !remark) return alert("驳回必须填写原因");

      const now = new Date().toLocaleString('zh-CN', {hour12: false});
      
      // Update Master Data if Approved
      if (approved) {
          if (record.priceType === 'purchase') {
              setPurchasePrices(prev => {
                  const idx = prev.findIndex(p => p.name === record.product);
                  if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = { ...updated[idx], price: record.newPrice, updateTime: now };
                      return updated;
                  }
                  return [...prev, { name: record.product, price: record.newPrice, updateTime: now }];
              });
          } else if (record.priceType === 'saleCommon') {
              setSaleCommonPrices(prev => {
                  const idx = prev.findIndex(p => p.name === record.product);
                  if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = { ...updated[idx], price: record.newPrice, updateTime: now };
                      return updated;
                  }
                  return [...prev, { name: record.product, price: record.newPrice, updateTime: now }];
              });
          } else if (record.priceType === 'saleCustomer') {
               setSaleCustomerPrices(prev => {
                  const idx = prev.findIndex(p => p.customer === record.customer && p.product === record.product);
                  if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = { ...updated[idx], price: record.newPrice, updateTime: now };
                      return updated;
                  }
                  return [...prev, { customer: record.customer, product: record.product, price: record.newPrice, updateTime: now }];
              });
          }
      }

      // Move to History
      const historyRecord: HistoryRecord = {
          ...record,
          status: 'handled',
          approvalStatus: approved ? 'approved' : 'rejected',
          approver: approverName,
          approveTime: now,
          approveRemark: remark || ''
      };

      setApprovalHistory(prev => [historyRecord, ...prev]);
      setPendingApprovals(prev => prev.filter(r => r.billNo !== billNo));
  };

  const handleExport = () => {
      alert(`正在导出价格审批记录 (Excel)...\n包含字段: 提交时间, 审批生效时间, 产品, 价格变动, 审批结果`);
  };

  // Trend Chart Data
  const trendData = useMemo(() => {
     let basePrice = 2800;
     if (trendType === 'purchase') {
        const item = purchasePrices.find(p => p.name === trendProduct);
        if (item) basePrice = item.price;
     } else {
        const item = saleCommonPrices.find(p => p.name === trendProduct);
        if (item) basePrice = item.price;
     }
     return generateTrendData(basePrice);
  }, [trendType, trendProduct, purchasePrices, saleCommonPrices]);


  // --- Helper Components ---
  const PriceInput = ({ label, value, onChange, placeholder, type="text", min, step }: any) => (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input 
          type={type} 
          min={min} 
          step={step}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
  );

  const SelectInput = ({ label, value, onChange, options }: any) => (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
           <option value="">-- 请选择 --</option>
           {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
  );

  const TextArea = ({ label, value, onChange, placeholder }: any) => (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea 
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
  );

  // Simple SVG Line Chart Component
  const SimpleLineChart = ({ data }: { data: { date: string, price: number }[] }) => {
      const height = 200;
      const width = 600;
      const padding = 30;
      
      const prices = data.map(d => d.price);
      const minPrice = Math.min(...prices) * 0.95;
      const maxPrice = Math.max(...prices) * 1.05;
      
      const getX = (index: number) => padding + (index * ((width - padding * 2) / (data.length - 1)));
      const getY = (price: number) => height - padding - ((price - minPrice) / (maxPrice - minPrice)) * (height - padding * 2);
      
      const points = data.map((d, i) => `${getX(i)},${getY(d.price)}`).join(' ');

      return (
          <div className="w-full overflow-x-auto">
              <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white border rounded">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                      const y = padding + ratio * (height - padding * 2);
                      return <line key={ratio} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
                  })}
                  
                  {/* Line */}
                  <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Dots & Labels */}
                  {data.map((d, i) => (
                      <g key={i}>
                          <circle cx={getX(i)} cy={getY(d.price)} r="4" fill="#3b82f6" className="hover:r-6 transition-all cursor-pointer">
                             <title>{d.date}: ¥{d.price}</title>
                          </circle>
                          <text x={getX(i)} y={height - 5} textAnchor="middle" fontSize="10" fill="#6b7280">{d.date}</text>
                          <text x={getX(i)} y={getY(d.price) - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1f2937">¥{d.price}</text>
                      </g>
                  ))}
              </svg>
          </div>
      );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">价格体系管理</h2>
            <p className="text-sm text-gray-500 mt-1">维护采购及销售价格主数据，管理价格变更审批流程</p>
          </div>
       </div>

       {/* Tabs */}
       <div className="bg-white rounded-t-xl shadow-sm border-b border-gray-200 px-6 pt-4 overflow-x-auto">
          <div className="flex space-x-8 min-w-max">
             <button onClick={() => setActiveTab('purchase')} className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'purchase' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <ShoppingCart size={18} /> 采购价格管理
             </button>
             <button onClick={() => setActiveTab('sale')} className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sale' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Package size={18} /> 出货价格管理
             </button>
             <button onClick={() => setActiveTab('approval')} className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'approval' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <div className="relative">
                   <Gavel size={18} />
                   {pendingApprovals.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                </div>
                价格变更审批
             </button>
             <button onClick={() => setActiveTab('trend')} className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'trend' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <TrendingUp size={18} /> 价格趋势分析
             </button>
             <button onClick={() => setActiveTab('order')} className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'order' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <FileText size={18} /> 订单价格记录
             </button>
          </div>
       </div>

       <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-6 min-h-[500px]">
          
          {/* --- TAB: PURCHASE --- */}
          {activeTab === 'purchase' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Current List */}
                <div className="lg:col-span-2 space-y-6">
                   <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                         <h3 className="font-bold text-gray-800 flex items-center gap-2"><List size={16} className="text-blue-500"/> 当前生效采购价格</h3>
                      </div>
                      <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-white">
                           <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">产品名称</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">当前价格</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">生效时间</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-200">
                            {purchasePrices.map((p, i) => (
                               <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                                  <td className="px-4 py-3 text-sm font-bold text-gray-700">¥{p.price.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-xs text-gray-500">{p.updateTime}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>

                {/* Right: Form */}
                <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 h-fit">
                   <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><Edit size={18}/> 提交调价申请</h3>
                   <SelectInput 
                      label="选择产品"
                      options={['萤石', '再生水', '水玻璃', '液碱']}
                      value={purchaseForm.product}
                      onChange={(v: string) => setPurchaseForm({...purchaseForm, product: v})}
                   />
                   <PriceInput 
                      label="新价格 (元)"
                      type="number" step="0.01" min="0"
                      value={purchaseForm.price}
                      onChange={(v: string) => setPurchaseForm({...purchaseForm, price: v})}
                      placeholder="0.00"
                   />
                   <TextArea 
                      label="调整备注"
                      placeholder="请输入调价原因，如：市场波动..."
                      value={purchaseForm.remark}
                      onChange={(v: string) => setPurchaseForm({...purchaseForm, remark: v})}
                   />
                   <button onClick={submitPurchasePrice} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                      <Send size={16} /> 提交审批
                   </button>
                </div>
             </div>
          )}

          {/* --- TAB: SALE --- */}
          {activeTab === 'sale' && (
             <div className="space-y-8">
                 {/* Common Prices */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                           <h3 className="font-bold text-gray-800 flex items-center gap-2"><Globe size={16} className="text-green-500"/> 通用出货价格</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-white">
                             <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">产品名称</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">通用单价</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">更新时间</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200">
                              {saleCommonPrices.map((p, i) => (
                                 <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-700">¥{p.price.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{p.updateTime}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                    </div>
                    <div className="bg-green-50/50 p-5 rounded-xl border border-green-100 h-fit">
                       <h4 className="font-bold text-green-900 mb-3 text-sm">调整通用价格</h4>
                       <SelectInput 
                          label="选择产品" options={['氧化铝', '湿法氟化铝', '废塑料', '废铁', '碳酸钠', '石子']}
                          value={saleCommonForm.product} onChange={(v: string) => setSaleCommonForm({...saleCommonForm, product: v})}
                       />
                       <PriceInput 
                          label="新通用价" type="number" step="0.01" value={saleCommonForm.price}
                          onChange={(v: string) => setSaleCommonForm({...saleCommonForm, price: v})}
                       />
                       <TextArea label="备注" value={saleCommonForm.remark} onChange={(v: string) => setSaleCommonForm({...saleCommonForm, remark: v})} />
                       <button onClick={submitSaleCommonPrice} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium text-sm">提交审批</button>
                    </div>
                 </div>

                 <div className="border-t border-gray-100 my-6"></div>

                 {/* Customer Prices */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                           <h3 className="font-bold text-gray-800 flex items-center gap-2"><User size={16} className="text-purple-500"/> 客户专属价格</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-white">
                             <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">客户</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">产品</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">专属单价</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">更新时间</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200">
                              {saleCustomerPrices.map((p, i) => (
                                 <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">{p.customer}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{p.product}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-purple-700">¥{p.price.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{p.updateTime}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                    </div>
                    <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100 h-fit">
                       <h4 className="font-bold text-purple-900 mb-3 text-sm">调整客户价格</h4>
                       <SelectInput 
                          label="客户" options={['A商贸有限公司', 'B新材料科技', 'C建筑工程公司']}
                          value={saleCustomerForm.customer} onChange={(v: string) => setSaleCustomerForm({...saleCustomerForm, customer: v})}
                       />
                       <SelectInput 
                          label="产品" options={['氧化铝', '湿法氟化铝', '废塑料', '废铁', '碳酸钠', '石子']}
                          value={saleCustomerForm.product} onChange={(v: string) => setSaleCustomerForm({...saleCustomerForm, product: v})}
                       />
                       <PriceInput 
                          label="专属价格" type="number" step="0.01" value={saleCustomerForm.price}
                          onChange={(v: string) => setSaleCustomerForm({...saleCustomerForm, price: v})}
                       />
                       <TextArea label="备注" value={saleCustomerForm.remark} onChange={(v: string) => setSaleCustomerForm({...saleCustomerForm, remark: v})} />
                       <button onClick={submitSaleCustomerPrice} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium text-sm">提交审批</button>
                    </div>
                 </div>
             </div>
          )}

          {/* --- TAB: APPROVAL --- */}
          {activeTab === 'approval' && (
             <div className="space-y-8">
                {/* Pending List */}
                <div>
                   <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock className="text-orange-500" /> 待审批单据</h3>
                   <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                      {pendingApprovals.length === 0 ? (
                         <div className="p-8 text-center text-gray-400">暂无待审批单据</div>
                      ) : (
                         <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-orange-50">
                                <tr>
                                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">提交时间</th>
                                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">类型 / 对象</th>
                                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">价格变动</th>
                                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">提交备注</th>
                                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">操作</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-200">
                                {pendingApprovals.map((b) => (
                                   <tr key={b.billNo} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm text-gray-500">
                                         {b.submitTime}<br/><span className="text-xs font-mono">{b.billNo}</span>
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                         <div className="flex items-center gap-2 mb-1">
                                            {b.priceType === 'purchase' && <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">采购</span>}
                                            {b.priceType === 'saleCommon' && <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs">通用</span>}
                                            {b.priceType === 'saleCustomer' && <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-xs">专属</span>}
                                            <span className="font-bold">{b.product}</span>
                                         </div>
                                         {b.customer && <div className="text-xs text-gray-500">{b.customer}</div>}
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                         <div className="flex items-center gap-1">
                                            <span className="text-gray-400 line-through">¥{b.oldPrice}</span>
                                            <TrendingUp size={14} className="text-gray-400" />
                                            <span className="font-bold text-gray-900">¥{b.newPrice}</span>
                                         </div>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{b.remark}</td>
                                      <td className="px-4 py-3 text-right">
                                         <div className="flex justify-end gap-2">
                                            <button onClick={() => handleApproval(b.billNo, true)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="通过"><CheckCircle size={18}/></button>
                                            <button onClick={() => handleApproval(b.billNo, false)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="驳回"><XCircle size={18}/></button>
                                         </div>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                         </table>
                      )}
                   </div>
                </div>

                {/* Handled List */}
                <div>
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><CheckCircle className="text-green-500" /> 已处理历史</h3>
                      <button onClick={handleExport} className="flex items-center gap-1 text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 shadow-sm">
                         <Download size={14}/> 导出记录
                      </button>
                   </div>
                   <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                                <tr>
                                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">提交时间</th>
                                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">审批/生效时间</th>
                                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">类型/对象</th>
                                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">变动</th>
                                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">结果</th>
                                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">审批人/备注</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-200">
                                {approvalHistory.map((h, i) => (
                                   <tr key={i} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-xs text-gray-500">{h.submitTime}</td>
                                      <td className="px-4 py-3 text-xs text-gray-800 font-medium bg-gray-50/50">{h.approveTime}</td>
                                      <td className="px-4 py-3 text-sm">
                                         <div className="text-xs text-gray-400">{h.priceType === 'purchase' ? '采购' : '出货'} - {h.customer || '通用'}</div>
                                         <div className="font-medium">{h.product}</div>
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                         <span className="text-gray-400">¥{h.oldPrice}</span> -> <b>¥{h.newPrice}</b>
                                      </td>
                                      <td className="px-4 py-3 text-xs">
                                         {h.approvalStatus === 'approved' ? <span className="text-green-600 font-bold">已通过</span> : <span className="text-red-600 font-bold">已驳回</span>}
                                      </td>
                                      <td className="px-4 py-3 text-xs text-gray-600">
                                         <div>{h.approver}</div>
                                         <div className="text-gray-400">{h.approveRemark}</div>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}

          {/* --- TAB: TRENDS --- */}
          {activeTab === 'trend' && (
             <div className="space-y-6">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex flex-wrap gap-6 items-end">
                   <div>
                      <label className="block text-xs font-bold text-indigo-800 mb-1">趋势类型</label>
                      <div className="flex bg-white rounded-lg p-1 border border-indigo-200">
                         <button onClick={() => { setTrendType('purchase'); setTrendProduct('萤石'); }} className={`px-4 py-1.5 rounded-md text-sm transition-all ${trendType === 'purchase' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-indigo-600'}`}>采购价格</button>
                         <button onClick={() => { setTrendType('sale'); setTrendProduct('氧化铝'); }} className={`px-4 py-1.5 rounded-md text-sm transition-all ${trendType === 'sale' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-indigo-600'}`}>出货价格</button>
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-indigo-800 mb-1">选择产品</label>
                      <select className="w-48 bg-white border border-indigo-200 rounded-lg py-1.5 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                         value={trendProduct} onChange={e => setTrendProduct(e.target.value)}>
                         {trendType === 'purchase' 
                            ? purchasePrices.map(p => <option key={p.name} value={p.name}>{p.name}</option>)
                            : saleCommonPrices.map(p => <option key={p.name} value={p.name}>{p.name}</option>)
                         }
                      </select>
                   </div>
                   <div className="flex-1 text-right text-indigo-400 text-xs self-center">
                      <Calendar size={14} className="inline mr-1"/> 最近7天价格波动趋势
                   </div>
                </div>

                <div className="bg-white border rounded-xl p-6 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                         <TrendingUp size={20} className="text-indigo-600" />
                         {trendProduct} - 价格走势图
                      </h3>
                      <div className="text-sm text-gray-500">单位: 元/吨</div>
                   </div>
                   
                   <SimpleLineChart data={trendData} />
                   
                   <div className="mt-4 text-xs text-gray-400 text-center">
                      * 数据基于系统历史审批记录及当前生效价格自动生成
                   </div>
                </div>
             </div>
          )}

          {/* --- TAB: ORDERS --- */}
          {activeTab === 'order' && (
              <div>
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileText className="text-purple-500" /> 订单价格快照记录</h3>
                     <span className="text-xs text-gray-400">仅展示，不可编辑</span>
                  </div>
                  <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                           <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">订单号</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">客户</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">产品</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">应用单价</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">总金额</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">记录时间</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                           {INITIAL_ORDER_Records.map((o, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                 <td className="px-4 py-3 text-sm font-mono text-gray-600">{o.id}</td>
                                 <td className="px-4 py-3 text-sm text-gray-800">{o.customer}</td>
                                 <td className="px-4 py-3 text-sm text-gray-800">{o.product}</td>
                                 <td className="px-4 py-3 text-sm">
                                    <span className="font-bold">¥{o.price}</span>
                                    <span className="text-xs text-gray-400 ml-1">({o.priceType})</span>
                                 </td>
                                 <td className="px-4 py-3 text-sm text-right font-bold text-green-600">¥{o.totalAmount.toLocaleString()}</td>
                                 <td className="px-4 py-3 text-xs text-right text-gray-500">{o.recordTime}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
              </div>
          )}

       </div>
    </div>
  );
};
