
import React, { useState, useEffect, useMemo } from 'react';
import { X, Truck, User, Plus, Search, Trash2, Edit2, CheckCircle, Save, AlertCircle, Clock, FileCheck, ChevronDown, ChevronUp, Scale, LogIn, LogOut, PackageCheck, Box, FlaskConical, Users, UserCheck, CheckSquare, Beaker, ArrowDownCircle, ArrowUpCircle, Receipt, ShieldCheck, RefreshCw, Database, Leaf, XCircle, DollarSign, Send } from 'lucide-react';
import { MOCK_VEHICLE_POOL, MOCK_WAREHOUSES, MOCK_ORDERS } from '../constants';
import { Order, OrderStatus, VehicleMaster, RecordType, VehicleRecord, VehicleStatus, Warehouse, WarehouseZone, WarehouseType, ContractType } from '../types';
import { StatusBadge } from './StatusBadge';

// --- Types ---
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// --- Components ---
const Modal: React.FC<BaseModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-900 opacity-60" onClick={onClose}></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        {/* Increased width to max-w-7xl to fit the very detailed table */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// 1. New/Edit Order Modal
interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
  onSave: (order: Order) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, order, onSave }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    contractId: '',
    productName: '',
    spec: '',
    quantity: '',
    unit: '吨',
    shipDate: '',
    unitPrice: '',
    remark: ''
  });

  useEffect(() => {
    if (isOpen && order) {
      setFormData({
        customerName: order.customerName,
        contractId: order.contractId,
        productName: order.productName,
        spec: order.spec,
        quantity: order.quantity.toString(),
        unit: order.unit || '吨',
        shipDate: order.shipDate,
        unitPrice: order.unitPrice.toString(),
        remark: order.remark || ''
      });
    } else if (isOpen) {
      setFormData({
        customerName: '', contractId: '', productName: '', spec: '', 
        quantity: '', unit: '吨', shipDate: '', unitPrice: '', remark: ''
      });
    }
  }, [isOpen, order]);

  const handleSubmit = () => {
    if (!formData.customerName || !formData.productName || !formData.quantity) {
      return alert('请填写必填信息');
    }

    const newOrder: Order = order ? {
      ...order,
      ...formData,
      quantity: parseFloat(formData.quantity) || 0,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      unit: formData.unit as any
    } : {
      id: `ORD-${Date.now()}`,
      type: 'sales',
      status: OrderStatus.PendingAudit,
      vehicles: [],
      history: [{ date: new Date().toLocaleString('zh-CN', { hour12: false }), action: '创建订单', user: '当前用户' }],
      ...formData,
      category: 'main', // Default
      quantity: parseFloat(formData.quantity) || 0,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      unit: formData.unit as any
    };

    onSave(newOrder);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={order ? "编辑订单" : "新增订单"}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">客户名称</label>
          <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
            value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="输入客户名称" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">合同编号</label>
          <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
            value={formData.contractId} onChange={e => setFormData({...formData, contractId: e.target.value})} placeholder="CON-XXX" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">产品名称</label>
          <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
            value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">规格型号</label>
          <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
            value={formData.spec} onChange={e => setFormData({...formData, spec: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">数量</label>
          <div className="flex mt-1">
            <input type="number" className="block w-full border border-gray-300 rounded-l-md shadow-sm p-2" 
              value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="border border-l-0 border-gray-300 rounded-r-md bg-gray-50 px-2 text-sm text-gray-700 outline-none">
                <option value="吨">吨</option>
                <option value="kg">kg</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">单价 (元)</label>
          <input type="number" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
            value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">发货日期</label>
          <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
            value={formData.shipDate} onChange={e => setFormData({...formData, shipDate: e.target.value})} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">订单备注</label>
          <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
            value={formData.remark} onChange={e => setFormData({...formData, remark: e.target.value})} placeholder="可选填..." />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">取消</button>
        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{order ? '保存修改' : '提交订单'}</button>
      </div>
    </Modal>
  );
};

// 2. Price Modal (Approvals & Application & History)
interface PriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onApprove?: (order: Order) => void;
  onReject?: (order: Order) => void;
  onApply?: (order: Order, newPrice: number, reason: string) => void;
}

export const PriceModal: React.FC<PriceModalProps> = ({ isOpen, onClose, order, onApprove, onReject, onApply }) => {
  const [applyPrice, setApplyPrice] = useState('');
  const [applyReason, setApplyReason] = useState('');

  useEffect(() => {
      if (isOpen) {
          setApplyPrice('');
          setApplyReason('');
      }
  }, [isOpen]);

  if (!order) return null;
  const isApprovalNeeded = order.status === OrderStatus.PriceApproval;

  const handleApplyClick = () => {
      const p = parseFloat(applyPrice);
      if (!p || p <= 0) return alert('请输入有效的新价格');
      if (!applyReason) return alert('请输入调价原因');
      if (onApply) onApply(order, p, applyReason);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="价格管理与审批">
      <div className="space-y-6">
        {/* Top: Current Status */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">当前执行单价</div>
                <div className="text-2xl font-bold text-gray-900">¥{order.unitPrice} <span className="text-sm font-normal">/ {order.unit || '吨'}</span></div>
                {order.isPriceAdjusted && <div className="text-xs text-green-600 mt-1 font-bold flex items-center gap-1"><CheckCircle size={12}/> 已调价生效</div>}
            </div>
            
            {/* Conditional Right Side: Approval Action OR Application Form */}
            {isApprovalNeeded ? (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm">
                    <div className="text-sm text-yellow-800 font-bold mb-2 flex items-center gap-2">
                        <AlertCircle size={16}/> 待审批: 价格调整
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                        申请价格: <span className="font-bold text-lg">¥{order.pendingPrice || '???'}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button onClick={() => onReject && onReject(order)} className="flex-1 py-1.5 bg-white border border-yellow-300 text-yellow-700 rounded text-xs hover:bg-yellow-100 font-medium">驳回申请</button>
                        <button onClick={() => onApprove && onApprove(order)} className="flex-1 py-1.5 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 shadow-sm font-medium">批准调价</button>
                    </div>
                </div>
            ) : (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                    <div className="text-sm text-blue-800 font-bold mb-2 flex items-center gap-2">
                        <Edit2 size={16}/> 申请调价
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-12">新价格:</span>
                            <input type="number" className="flex-1 border border-blue-200 rounded px-2 py-1 text-sm outline-none focus:border-blue-400" 
                                placeholder="0.00" value={applyPrice} onChange={e => setApplyPrice(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-12">原因:</span>
                            <input type="text" className="flex-1 border border-blue-200 rounded px-2 py-1 text-sm outline-none focus:border-blue-400" 
                                placeholder="输入原因" value={applyReason} onChange={e => setApplyReason(e.target.value)} />
                        </div>
                        <button onClick={handleApplyClick} className="w-full mt-2 bg-blue-600 text-white py-1.5 rounded text-xs font-medium hover:bg-blue-700 flex items-center justify-center gap-1">
                            <Send size={12}/> 提交申请
                        </button>
                    </div>
                </div>
            )}
        </div>
        
        {/* Bottom: History */}
        <div>
           <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Clock size={16}/> 审批历史记录</h4>
           <div className="border rounded-lg overflow-hidden text-sm bg-white max-h-[300px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">时间</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">操作/说明</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">操作人</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {order.history.map((h, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-xs text-gray-500">{h.date}</td>
                              <td className="px-4 py-2 text-xs text-gray-800">{h.action}</td>
                              <td className="px-4 py-2 text-xs text-gray-500">{h.user}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
           </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">关闭</button>
      </div>
    </Modal>
  );
};

// 3. Invoice Modal
interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSave: (weight: number) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, order, onSave }) => {
  const [weight, setWeight] = useState('');
  
  useEffect(() => {
      if (isOpen && order) {
          const actualTotal = order.vehicles.reduce((acc, v) => acc + (v.actualOutWeight || 0), 0);
          setWeight(actualTotal > 0 ? actualTotal.toString() : order.quantity.toString());
      }
  }, [isOpen, order]);

  if (!order) return null;
  
  const handleConfirm = () => {
      const val = parseFloat(weight);
      if (val > 0) onSave(val);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="开具发票 / 结算">
       <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
             请确认最终结算重量。系统将根据单价 <b>¥{order.unitPrice}</b> 自动计算发票金额。
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">结算重量 ({order.unit || '吨'})</label>
             <input 
               type="number" 
               className="w-full border border-gray-300 rounded-md p-2 text-lg font-bold"
               value={weight}
               onChange={e => setWeight(e.target.value)}
             />
          </div>
          <div className="flex justify-between items-center pt-2">
             <span className="text-sm text-gray-500">预计金额:</span>
             <span className="text-xl font-bold text-gray-900">¥{((parseFloat(weight)||0) * order.unitPrice).toLocaleString()}</span>
          </div>
       </div>
       <div className="mt-6 flex justify-end gap-2">
         <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">取消</button>
         <button onClick={handleConfirm} className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">确认开票</button>
       </div>
    </Modal>
  );
};

// 4. Audit Modal
interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  order: Order | null;
}

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose, onApprove, order }) => {
  if (!order) return null;

  return (
     <Modal isOpen={isOpen} onClose={onClose} title="订单审核">
        <div className="space-y-4">
           <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">客户:</span> <span className="font-medium">{order.customerName}</span></div>
              <div><span className="text-gray-500">产品:</span> <span className="font-medium">{order.productName}</span></div>
              <div><span className="text-gray-500">数量:</span> <span className="font-medium">{order.quantity} {order.unit || '吨'}</span></div>
              <div><span className="text-gray-500">金额:</span> <span className="font-bold">¥{(order.quantity * order.unitPrice).toLocaleString()}</span></div>
           </div>
           
           <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0"/>
              <div>
                 <p className="font-bold">审核提示</p>
                 <p>请核对客户信用额度及产品当前库存情况。确认无误后通过审核。</p>
              </div>
           </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">暂不处理</button>
          <button onClick={() => { onApprove(); onClose(); }} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">通过审核</button>
        </div>
     </Modal>
  );
};

// 5. Action Modal (Comprehensive Console)

// --- Sub-component: Visual Timeline Nodes ---
const TimelineNode = ({ icon: Icon, title, value, sub, active, color = "blue" }: any) => (
  <div className="relative z-10 flex flex-col items-center gap-2 group min-w-[70px]">
     <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${active ? `bg-${color}-100 border-${color}-500 text-${color}-600 shadow-sm` : 'bg-white border-gray-300 text-gray-300'}`}>
        <Icon size={14} />
     </div>
     <div className="text-center">
        <div className={`font-bold text-xs ${active ? 'text-gray-800' : 'text-gray-400'}`}>{title}</div>
        {value ? (
           <>
              <div className={`text-${color}-600 font-bold text-xs mt-0.5`}>{value}</div>
              {sub && <div className="text-gray-400 text-[10px] scale-90">{sub}</div>}
           </>
        ) : <div className="text-gray-300 text-xs">-</div>}
     </div>
  </div>
);

const VehicleTimeline: React.FC<{ v: VehicleRecord; category: 'main' | 'byproduct' }> = ({ v, category }) => {
  const ParallelConfirmations = () => (
    <div className="flex flex-col gap-1 items-start bg-gray-50 border border-gray-200 rounded p-2 text-[10px] min-w-[120px]">
       {category === 'main' && (
         <div className="flex items-center gap-1">
            <CheckSquare size={12} className={v.confirmations?.marketing ? "text-green-500" : "text-gray-300"} />
            <span className={v.confirmations?.marketing ? "text-gray-700 font-bold" : "text-gray-400"}>市场部确认</span>
         </div>
       )}
       <div className="flex items-center gap-1">
          <UserCheck size={12} className={v.confirmations?.warehouse ? "text-green-500" : "text-gray-300"} />
          <span className={v.confirmations?.warehouse ? "text-gray-700 font-bold" : "text-gray-400"}>仓管员确认</span>
       </div>
       <div className="flex items-center gap-1">
          <ShieldCheck size={12} className={v.confirmations?.gate ? "text-green-500" : "text-gray-300"} />
          <span className={v.confirmations?.gate ? "text-gray-700 font-bold" : "text-gray-400"}>门卫确认</span>
       </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mt-2 mb-4 shadow-sm overflow-x-auto">
       <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
         <Clock size={14} /> 全流程节点追踪 ({v.type})
       </h4>
       
       <div className="relative flex items-start justify-between text-xs min-w-[600px] pb-2">
          {/* Connecting Line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0 mx-8"></div>

          {/* Nodes Implementation */}
          <TimelineNode icon={Truck} title="车辆已到达" active={true} />
          <TimelineNode icon={Scale} title="第一次过磅" active={!!v.weighing1} value={v.weighing1 ? `${v.weighing1.weight} ${v.unit||'吨'}` : ''} sub={v.weighing1?.time} />
          <TimelineNode icon={LogIn} title="车辆进场" active={!!v.entryTime} sub={v.entryTime ? v.entryTime.split(' ')[1] : ''} />
          {v.type === RecordType.Normal && <TimelineNode icon={PackageCheck} title="发货中" active={v.status === VehicleStatus.Loading || v.status === VehicleStatus.Exited} sub={v.warehouseName} color="indigo" />}
          {v.type === RecordType.Return && <TimelineNode icon={PackageCheck} title="发货中(卸)" active={v.status === VehicleStatus.Unloading || v.status === VehicleStatus.Exited} sub="退货区" color="orange" />}
          {v.type === RecordType.Exchange && <TimelineNode icon={RefreshCw} title="换货作业" active={v.status === VehicleStatus.Unloading || v.status === VehicleStatus.Loading || v.status === VehicleStatus.Exited} sub="卸货 -> 装货" color="orange" />}
          <TimelineNode icon={LogOut} title="车辆出厂" active={!!v.exitTime} sub={v.exitTime ? v.exitTime.split(' ')[1] : ''} color="green" />
          <TimelineNode icon={Scale} title="第二次过磅" active={!!v.weighing2} value={v.weighing2 ? `${v.weighing2.weight} ${v.unit||'吨'}` : ''} sub={v.weighing2?.time} />
          <div className="relative z-10 flex flex-col items-center gap-1 group">
             <div className="mb-1 text-xs font-bold text-gray-500">并行确认</div>
             <ParallelConfirmations />
          </div>
          <TimelineNode icon={CheckCircle} title="已完成" active={v.status === VehicleStatus.Exited && !!v.weighing2} color="green" />
       </div>
    </div>
  );
};

const VehicleRow: React.FC<{ 
  v: VehicleRecord, 
  category: 'main' | 'byproduct',
  onEdit: (v: VehicleRecord) => void, 
  onDelete: (id: string) => void, 
  theme: string, 
  type: string, 
  commonReason: string 
}> = ({ v, category, onEdit, onDelete, theme, type, commonReason }) => {
  const [expanded, setExpanded] = useState(false);
  const formatTime = (full?: string) => full ? full.split(' ')[1] : '-';

  return (
    <React.Fragment>
      <tr className={`hover:bg-gray-50 border-b last:border-0 ${expanded ? 'bg-gray-50' : ''}`}>
        <td className="px-4 py-3 whitespace-nowrap">
           <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
             {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
           </button>
        </td>
        <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={v.status} type="vehicle" /></td>
        <td className="px-4 py-3 font-bold text-gray-900">{v.plateNumber}</td>
        <td className="px-4 py-3 text-gray-600">
          <div className="flex flex-col text-sm">
             <span>{v.driverName}</span>
             {/* Phone hidden as requested */}
          </div>
        </td>
        
        {/* Display Batch Info Summary in Row (Simplified View) */}
        <td className="px-4 py-3 text-sm text-gray-600">
            {v.batchDetails && v.batchDetails.length > 0 ? (
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {v.batchDetails.map((b, idx) => (
                       <span key={idx} className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">{b.batchNo}</span>
                    ))}
                </div>
            ) : (
                v.warehouseName ? (
                    <div className="flex flex-col">
                        <span className="font-bold text-indigo-700 text-xs flex items-center gap-1"><Box size={10}/> {v.warehouseName}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{v.batchNumber || '无批号'}</span>
                    </div>
                ) : <span className="text-gray-300 text-xs">-</span>
            )}
        </td>

        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
            {v.entryTime ? <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-600">{formatTime(v.entryTime)}</span> : <span className="text-gray-300">-</span>}
        </td>
        
         <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
            {v.weighing2 ? (
               <div className="flex flex-col">
                  <span className="font-bold text-blue-700">{v.weighing2.weight} {v.unit || '吨'}</span>
               </div>
            ) : <span className="text-gray-300">-</span>}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
             {v.exitTime ? <span className="font-mono text-xs bg-green-50 px-1 py-0.5 rounded text-green-700">{formatTime(v.exitTime)}</span> : <span className="text-gray-300">-</span>}
        </td>

        <td className="px-4 py-3 text-sm">
           <div className="flex gap-4">
              <div className="flex flex-col">
                 <span className="text-xs text-gray-500">计划</span>
                 <span className="font-medium text-gray-700">{type === 'ship' ? v.loadWeight : v.returnWeight} {v.unit || '吨'}</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-xs text-gray-500">实际</span>
                 <span className={`font-bold ${v.actualOutWeight ? 'text-blue-600' : 'text-gray-300'}`}>
                   {v.actualOutWeight ? `${v.actualOutWeight} ${v.unit || '吨'}` : '-'}
                 </span>
              </div>
           </div>
        </td>
        <td className="px-4 py-3 text-right">
           <div className="flex justify-end gap-2">
             <button 
               onClick={() => onEdit(v)}
               className={`p-1 text-gray-400 hover:text-${theme}-600`}
               title="编辑/更新状态"
             >
               <Edit2 size={16} />
             </button>
             <button 
               onClick={() => onDelete(v.id)}
               disabled={v.status !== VehicleStatus.PendingEntry}
               className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
               title="删除"
             >
               <Trash2 size={16} />
             </button>
           </div>
        </td>
      </tr>
      
      {/* Expanded Detail View */}
      {expanded && (
        <tr>
          <td colSpan={10} className="px-4 pb-4 pt-0 bg-gray-50 border-b">
             <div className="pl-8 pr-2">
                {(type === 'return' || type === 'exchange') && (
                  <div className="mb-2 mt-2 text-sm">
                    <span className="font-bold text-gray-700">原因: </span>
                    <span className="text-gray-600">{type === 'return' ? (v.returnReason || commonReason) : (v.exchangeReason || commonReason)}</span>
                  </div>
                )}
                {/* Visual Timeline */}
                <VehicleTimeline v={v} category={category} />
             </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};


interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOrder: Order) => void;
  type: 'ship' | 'return' | 'exchange';
  order: Order | null;
}

export const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, onSave, type, order }) => {
  const [vehicleList, setVehicleList] = useState<VehicleRecord[]>([]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPlate, setSelectedPlate] = useState<string>('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [emission, setEmission] = useState('');
  const [loadWeight, setLoadWeight] = useState('');
  
  const [unit, setUnit] = useState<'吨' | 'kg'>('吨');
  const [commonReason, setCommonReason] = useState('');
  
  // Extended States for Editing
  const [confirmMkt, setConfirmMkt] = useState(false);
  const [confirmWh, setConfirmWh] = useState(false);
  const [confirmGate, setConfirmGate] = useState(false);
  
  const currentRecordType = type === 'ship' ? RecordType.Normal 
                          : type === 'return' ? RecordType.Return 
                          : RecordType.Exchange;

  // Compute stats for Context Header
  const metrics = useMemo(() => {
    if (!order) return { totalFinished: 0, customerStock: 0, planned: 0, actual: 0, invoiced: 0 };
    // 1. Total Finished Goods Inventory
    const totalFinished = MOCK_WAREHOUSES
        .filter(w => w.type === WarehouseType.Finished)
        .reduce((acc, w) => acc + w.zones.reduce((zAcc, z) => zAcc + z.inventory.reduce((iAcc, i) => iAcc + (i.productName === order.productName ? i.quantity : 0), 0), 0), 0);
    
    const customerStock = order.quantity * 0.15; // Mock logic
    const planned = order.quantity;
    const actual = order.vehicles.reduce((acc, v) => acc + (v.actualOutWeight || 0), 0);
    const invoiced = order.settlementWeight || 0;

    return { totalFinished, customerStock, planned, actual, invoiced };
  }, [order]);

  useEffect(() => {
    if (isOpen && order) {
      const existing = order.vehicles.filter(v => v.type === currentRecordType);
      setVehicleList(existing);
      
      if (existing.length > 0) {
        if (type === 'return' && existing[0].returnReason) setCommonReason(existing[0].returnReason);
        if (type === 'exchange' && existing[0].exchangeReason) setCommonReason(existing[0].exchangeReason);
      } else {
        setCommonReason('');
      }
      resetForm();
    }
  }, [isOpen, order, type]);

  const resetForm = () => {
    setEditingId(null);
    setSelectedPlate('');
    setDriverName('');
    setDriverPhone('');
    setEmission('');
    setLoadWeight('');
    setUnit('吨');
    setConfirmMkt(false);
    setConfirmWh(false);
    setConfirmGate(false);
  };

  const handlePlateChange = (plate: string) => {
    setSelectedPlate(plate);
    const vehicle = MOCK_VEHICLE_POOL.find(v => v.plateNumber === plate);
    if (vehicle) {
      setDriverName(vehicle.driverName);
      setDriverPhone(vehicle.driverPhone);
      setEmission(vehicle.emissions || '国V'); // Auto-fetch emission
    } else {
      setDriverName('');
      setDriverPhone('');
      setEmission('');
    }
  };

  const handleEdit = (v: VehicleRecord) => {
    setEditingId(v.id);
    setSelectedPlate(v.plateNumber);
    setDriverName(v.driverName);
    setDriverPhone(v.driverPhone);
    setEmission(v.emissions || '');
    setLoadWeight(v.loadWeight ? v.loadWeight.toString() : '');
    setUnit(v.unit || '吨');
    
    // Load Confirmations
    setConfirmMkt(v.confirmations?.marketing || false);
    setConfirmWh(v.confirmations?.warehouse || false);
    setConfirmGate(v.confirmations?.gate || false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此车辆记录吗?')) {
      setVehicleList(prev => prev.filter(v => v.id !== id));
      if (editingId === id) resetForm();
    }
  };

  const handleAddOrUpdate = () => {
    if (!driverName) return;
    if (!selectedPlate) return;
    const weightVal = parseFloat(loadWeight);
    if (!weightVal || weightVal <= 0) return alert('请输入有效的计划重量');

    if (editingId) {
      setVehicleList(prev => prev.map(v => {
        if (v.id === editingId) {
          return {
            ...v,
            plateNumber: selectedPlate,
            driverName,
            driverPhone,
            loadWeight: weightVal,
            returnWeight: type !== 'ship' ? weightVal : v.returnWeight,
            unit,
            emissions: emission,
            confirmations: {
                marketing: confirmMkt,
                warehouse: confirmWh,
                gate: confirmGate
            },
          };
        }
        return v;
      }));
    } else {
      const newRecord: VehicleRecord = {
        id: `temp-${Date.now()}`,
        plateNumber: selectedPlate,
        driverName,
        driverPhone,
        status: VehicleStatus.PendingEntry,
        loadWeight: type === 'ship' ? weightVal : 0,
        returnWeight: type !== 'ship' ? weightVal : 0,
        type: currentRecordType,
        unit,
        emissions: emission,
        warehouseName: '成品发货仓',
        confirmations: { marketing: false, warehouse: false, gate: false },
      };
      setVehicleList(prev => [...prev, newRecord]);
    }
    resetForm();
  };

  const handleConfirm = () => {
    if (!order) return;
    const finalVehicleList = vehicleList.map(v => ({
      ...v,
      returnReason: type === 'return' ? commonReason : v.returnReason,
      exchangeReason: type === 'exchange' ? commonReason : v.exchangeReason
    }));

    const otherVehicles = order.vehicles.filter(v => v.type !== currentRecordType);
    const updatedVehicles = [...otherVehicles, ...finalVehicleList];

    let newStatus = order.status;
    if (type === 'ship' && finalVehicleList.length > 0 && order.status === OrderStatus.Unassigned) {
      newStatus = OrderStatus.ReadyToShip;
    }
    if (type === 'return') newStatus = OrderStatus.Returning;
    if (type === 'exchange') newStatus = OrderStatus.Exchanging;

    const newHistoryItem = {
      date: new Date().toLocaleString('zh-CN', { hour12: false }),
      action: type === 'ship' ? '更新车辆调度' : (type === 'return' ? '登记退货车辆' : '登记换货车辆'),
      user: '当前用户'
    };

    const updatedOrder: Order = {
      ...order,
      vehicles: updatedVehicles,
      status: newStatus,
      history: [newHistoryItem, ...order.history]
    };
    onSave(updatedOrder);
  };

  const titles = { ship: '出货调度管理', return: '退货登记管理', exchange: '换货登记管理' };
  const colors = { ship: 'blue', return: 'red', exchange: 'orange' };
  const theme = colors[type];

  if (!order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titles[type]}>
       <div className="flex flex-col gap-6 h-[85vh]">
        
        {/* TOP: Context Metrics */}
        <div className="flex-shrink-0 space-y-4">
           {/* New Info Bar with Stats */}
           <div className="bg-gray-50 p-3 rounded border border-gray-200 shadow-sm text-xs grid grid-cols-5 gap-2">
               <div className="bg-white p-2 rounded border border-gray-100">
                   <div className="text-gray-400 mb-1">客户库存</div>
                   <div className="font-bold text-gray-800 text-lg">{metrics.customerStock.toFixed(1)}</div>
               </div>
               <div className="bg-white p-2 rounded border border-gray-100">
                   <div className="text-gray-400 mb-1">成品总库存</div>
                   <div className="font-bold text-gray-800 text-lg">{metrics.totalFinished.toFixed(1)}</div>
               </div>
               <div className="bg-white p-2 rounded border border-gray-100 border-l-2 border-l-blue-400">
                   <div className="text-gray-400 mb-1">计划吨数</div>
                   <div className="font-bold text-blue-600 text-lg">{metrics.planned}</div>
               </div>
               <div className="bg-white p-2 rounded border border-gray-100 border-l-2 border-l-green-400">
                   <div className="text-gray-400 mb-1">实际吨数</div>
                   <div className="font-bold text-green-600 text-lg">{metrics.actual.toFixed(2)}</div>
               </div>
               <div className="bg-white p-2 rounded border border-gray-100 border-l-2 border-l-teal-400">
                   <div className="text-gray-400 mb-1">开票吨数</div>
                   <div className="font-bold text-teal-600 text-lg">{metrics.invoiced.toFixed(2)}</div>
               </div>
           </div>

           {(type === 'return' || type === 'exchange') && (
             <div className={`bg-${theme}-50 p-3 rounded border border-${theme}-200`}>
                <label className={`block text-xs font-bold text-${theme}-800 mb-1`}>{type === 'return' ? '退货' : '换货'}原因</label>
                <textarea 
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  rows={1}
                  placeholder="统一原因..."
                  value={commonReason}
                  onChange={(e) => setCommonReason(e.target.value)}
                />
             </div>
           )}

           {/* ADD/EDIT FORM */}
           <div className="border rounded-lg p-3 bg-white shadow-sm flex flex-col gap-4">
              <h4 className="text-sm font-bold text-gray-700 flex items-center justify-between border-b pb-2">
                <span>{editingId ? '编辑车辆 / 更新状态' : '新增调度车辆'}</span>
                {editingId && <button onClick={resetForm} className="text-xs text-blue-500">取消编辑</button>}
              </h4>
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-3">
                  <label className="text-xs text-gray-500 block mb-1">车牌</label>
                  <select className="w-full border rounded p-2 text-sm" value={selectedPlate} onChange={(e) => handlePlateChange(e.target.value)}>
                      <option value="">选择车辆</option>
                      {MOCK_VEHICLE_POOL.map(v => <option key={v.id} value={v.plateNumber}>{v.plateNumber}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                   <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded flex flex-col gap-1 h-[42px] justify-center">
                      <div>司机: {driverName || '-'}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                         <Leaf size={10} className="text-green-500"/>
                         排放: <span className="font-bold text-green-700 text-xs">{emission || '-'}</span>
                      </div>
                  </div>
                </div>

                <div className="col-span-3">
                   <label className="text-xs text-gray-500 block mb-1">计划重量</label>
                   <div className="flex">
                       <input 
                          type="number"
                          placeholder="0.00" 
                          className="w-full border rounded-l p-2 text-sm font-bold" 
                          value={loadWeight} 
                          onChange={e => setLoadWeight(e.target.value)}
                       />
                       <select value={unit} onChange={e => setUnit(e.target.value as any)} className="border border-l-0 rounded-r bg-gray-100 p-2 text-xs text-gray-600 outline-none">
                           <option value="吨">吨</option>
                           <option value="kg">kg</option>
                       </select>
                   </div>
                </div>

                <div className="col-span-3">
                  <button 
                    onClick={handleAddOrUpdate}
                    disabled={!selectedPlate || !driverName || !loadWeight}
                    className={`w-full py-2 bg-${theme}-600 text-white rounded hover:bg-${theme}-700 flex justify-center items-center gap-1 disabled:opacity-50 text-sm font-medium`}
                  >
                    {editingId ? <CheckCircle size={16} /> : <Plus size={16} />} {editingId ? '保存' : '添加'}
                  </button>
                </div>
              </div>

              {/* Row 2: Approvals (Only when editing) */}
              {editingId && (
                  <div className="border-t pt-2 mt-1">
                      <label className="text-xs font-bold text-gray-700 block mb-2">流程节点确认</label>
                      <div className="flex flex-wrap gap-4 items-center">
                          {order.category === 'main' && (
                            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded border hover:bg-gray-100">
                                <input type="checkbox" checked={confirmMkt} onChange={e => setConfirmMkt(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500"/>
                                <span className="text-sm">市场部确认</span>
                            </label>
                          )}
                          <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded border hover:bg-gray-100">
                              <input type="checkbox" checked={confirmWh} onChange={e => setConfirmWh(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500"/>
                              <span className="text-sm">仓管员确认</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded border hover:bg-gray-100">
                              <input type="checkbox" checked={confirmGate} onChange={e => setConfirmGate(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500"/>
                              <span className="text-sm">门卫确认</span>
                          </label>
                      </div>
                  </div>
              )}
           </div>
        </div>

        {/* MIDDLE: Accordion List */}
        <div className="flex-1 overflow-auto border rounded-lg bg-white">
           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50 sticky top-0 z-10">
               <tr>
                 <th className="w-8 px-4 py-3"></th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">状态</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">车牌/司机</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">关联批次号</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">进/出时间</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">过磅重量</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">计划/实际</th>
                 <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">操作</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-200 bg-white">
               {vehicleList.length === 0 ? (
                 <tr><td colSpan={10} className="py-8 text-center text-gray-400">暂无车辆</td></tr>
               ) : (
                 vehicleList.map((v) => (
                   <VehicleRow 
                     key={v.id} 
                     v={v}
                     category={order.category}
                     onEdit={handleEdit} 
                     onDelete={handleDelete} 
                     theme={theme}
                     type={type}
                     commonReason={commonReason}
                   />
                 ))
               )}
             </tbody>
           </table>
        </div>

        {/* BOTTOM: Save */}
        <div className="flex-shrink-0 flex justify-end gap-2 pt-2 border-t">
           <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded">取消</button>
           <button onClick={handleConfirm} className={`px-6 py-2 bg-${theme}-600 text-white rounded flex items-center gap-2`}>
             <Save size={18} /> 保存整体
           </button>
        </div>

       </div>
    </Modal>
  );
};
