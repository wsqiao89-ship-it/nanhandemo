import React, { useState, useEffect, useMemo } from 'react';
import { X, Truck, User, Plus, Search, Trash2, Edit2, CheckCircle, Save, AlertCircle, Clock, FileCheck, ChevronDown, ChevronUp, Scale, LogIn, LogOut, PackageCheck, Box } from 'lucide-react';
import { MOCK_VEHICLE_POOL, MOCK_WAREHOUSES } from '../constants';
import { Order, OrderStatus, VehicleMaster, RecordType, VehicleRecord, VehicleStatus, Warehouse, WarehouseZone } from '../types';
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

// 1. New Order Modal
export const NewOrderModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增订单">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">客户名称</label>
          <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="输入客户名称" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">合同编号</label>
          <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="CON-XXX" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">产品名称</label>
          <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">规格型号</label>
          <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">数量 (吨)</label>
          <input type="number" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">发货日期</label>
          <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">取消</button>
        <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">提交订单</button>
      </div>
    </Modal>
  );
};

// 2. Price Adjustment Modal
export const PriceModal: React.FC<{ isOpen: boolean; onClose: () => void; order: Order | null }> = ({ isOpen, onClose, order }) => {
  if (!order) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="价格申请">
      <div className="space-y-4">
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-600">订单编号: <span className="font-medium text-gray-900">{order.id}</span></p>
          <p className="text-sm text-gray-600">客户: <span className="font-medium text-gray-900">{order.customerName}</span></p>
          <p className="text-sm text-gray-600">产品: <span className="font-medium text-gray-900">{order.productName} ({order.spec})</span></p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium text-gray-700">当前单价 (RMB/吨)</label>
             <input disabled value={order.unitPrice} className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-gray-500" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">申请价格 (RMB/吨)</label>
             <input type="number" className="mt-1 block w-full border border-blue-500 rounded-md p-2" placeholder="50" autoFocus />
          </div>
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700">申请原因</label>
           <textarea className="mt-1 block w-full border border-gray-300 rounded-md p-2" rows={3} placeholder="请输入调价原因..."></textarea>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">取消</button>
        <button onClick={onClose} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">提交申请</button>
      </div>
    </Modal>
  );
};

// 3. Audit Modal
export const AuditModal: React.FC<{ isOpen: boolean; onClose: () => void; onApprove: () => void; order: Order | null }> = ({ isOpen, onClose, onApprove, order }) => {
  if (!order) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="财务审核">
      <div className="max-w-md mx-auto">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-start gap-3 mb-4">
           <FileCheck className="text-purple-600 mt-1" size={24} />
           <div>
              <h4 className="font-bold text-purple-900">需财务审核</h4>
              <p className="text-sm text-purple-700 mt-1">此订单当前处于"待审核"状态。必须通过财务审核后，才能进行车辆调度和发货。</p>
           </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">取消</button>
           <button onClick={onApprove} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2">
             <CheckCircle size={16} /> 通过审核
           </button>
        </div>
      </div>
    </Modal>
  );
};

// 4. Action Modal (Comprehensive Console)

// --- Sub-component: Visual Timeline ---
const VehicleTimeline: React.FC<{ v: VehicleRecord }> = ({ v }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2 mb-4">
       <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
         <Clock size={14} /> 全流程节点追踪
       </h4>
       
       <div className="relative flex items-center justify-between text-xs">
          {/* Connecting Line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0"></div>

          {/* Step 1: Entry */}
          <div className="relative z-10 flex flex-col items-center gap-2 group">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${v.entryTime ? 'bg-blue-100 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-300'}`}>
                <LogIn size={14} />
             </div>
             <div className="text-center">
                <div className="font-bold text-gray-700">车辆进场</div>
                {v.entryTime ? <div className="text-gray-500 font-mono mt-0.5">{v.entryTime.split(' ')[1]}</div> : <div className="text-gray-300">-</div>}
             </div>
          </div>

          {/* Step 2: Weigh 1 */}
          <div className="relative z-10 flex flex-col items-center gap-2">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${v.weighing1 ? 'bg-blue-100 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-300'}`}>
                <Scale size={14} />
             </div>
             <div className="text-center">
                <div className="font-bold text-gray-700">一次过磅</div>
                {v.weighing1 ? (
                   <>
                      <div className="text-blue-600 font-bold">{v.weighing1.weight}T</div>
                      <div className="text-gray-500 font-mono scale-90">{v.weighing1.time}</div>
                   </>
                ) : <div className="text-gray-300">-</div>}
             </div>
          </div>

          {/* Step 3: Action (Load/Unload) */}
          <div className="relative z-10 flex flex-col items-center gap-2">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${v.status === VehicleStatus.Loading || v.status === VehicleStatus.Unloading || v.weighing2 ? 'bg-indigo-100 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-300'}`}>
                <PackageCheck size={14} />
             </div>
             <div className="text-center">
                <div className="font-bold text-gray-700">{v.type === RecordType.Normal ? '装货作业' : '卸货作业'}</div>
                <div className="text-gray-400 scale-90">作业区</div>
                {/* Source Info for Timeline */}
                {v.warehouseName && (
                   <div className="text-[10px] text-indigo-600 bg-indigo-50 px-1 rounded mt-0.5">{v.warehouseName}</div>
                )}
             </div>
          </div>

          {/* Step 4: Weigh 2 */}
          <div className="relative z-10 flex flex-col items-center gap-2">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${v.weighing2 ? 'bg-blue-100 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-300'}`}>
                <Scale size={14} />
             </div>
             <div className="text-center">
                <div className="font-bold text-gray-700">二次过磅</div>
                {v.weighing2 ? (
                   <>
                      <div className="text-blue-600 font-bold">{v.weighing2.weight}T</div>
                      <div className="text-gray-500 font-mono scale-90">{v.weighing2.time}</div>
                   </>
                ) : <div className="text-gray-300">-</div>}
             </div>
          </div>

          {/* Step 5: Exit */}
          <div className="relative z-10 flex flex-col items-center gap-2">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${v.exitTime ? 'bg-green-100 border-green-500 text-green-600' : 'bg-white border-gray-300 text-gray-300'}`}>
                <LogOut size={14} />
             </div>
             <div className="text-center">
                <div className="font-bold text-gray-700">车辆出厂</div>
                {v.exitTime ? <div className="text-gray-500 font-mono mt-0.5">{v.exitTime.split(' ')[1]}</div> : <div className="text-gray-300">-</div>}
             </div>
          </div>

       </div>
    </div>
  );
};

// --- Sub-component: Expandable Row ---
const VehicleRow: React.FC<{ 
  v: VehicleRecord, 
  onEdit: (v: VehicleRecord) => void, 
  onDelete: (id: string) => void, 
  theme: string, 
  type: string, 
  commonReason: string 
}> = ({ v, onEdit, onDelete, theme, type, commonReason }) => {
  const [expanded, setExpanded] = useState(false);

  // Helper to format timestamps (just time)
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
             <span className="text-xs text-gray-400">{v.driverPhone}</span>
          </div>
        </td>
        
        {/* Source / Batch Info Column */}
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
            {v.warehouseName ? (
                <div className="flex flex-col">
                    <span className="font-bold text-indigo-700 text-xs flex items-center gap-1"><Box size={10}/> {v.warehouseName}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{v.batchNumber || '无批号'}</span>
                </div>
            ) : <span className="text-gray-300 text-xs">-</span>}
        </td>

        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
            {v.entryTime ? <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-600">{formatTime(v.entryTime)}</span> : <span className="text-gray-300">-</span>}
        </td>
        
         <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
            {v.weighing2 ? (
               <div className="flex flex-col">
                  <span className="font-bold text-blue-700">{v.weighing2.weight}T</span>
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
                 <span className="font-medium text-gray-700">{type === 'ship' ? v.loadWeight : v.returnWeight}T</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-xs text-gray-500">实际</span>
                 <span className={`font-bold ${v.actualOutWeight ? 'text-blue-600' : 'text-gray-300'}`}>
                   {v.actualOutWeight ? `${v.actualOutWeight}T` : '-'}
                 </span>
              </div>
           </div>
        </td>
        <td className="px-4 py-3 text-right">
           <div className="flex justify-end gap-2">
             <button 
               onClick={() => onEdit(v)}
               disabled={v.status !== VehicleStatus.PendingEntry} 
               className={`p-1 text-gray-400 hover:text-${theme}-600 disabled:opacity-30`}
               title="编辑"
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
                
                {/* Reason Display if applicable */}
                {(type === 'return' || type === 'exchange') && (
                  <div className="mb-2 mt-2 text-sm">
                    <span className="font-bold text-gray-700">原因: </span>
                    <span className="text-gray-600">{type === 'return' ? (v.returnReason || commonReason) : (v.exchangeReason || commonReason)}</span>
                  </div>
                )}
                
                {/* Visual Timeline */}
                <VehicleTimeline v={v} />
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
  const [weight, setWeight] = useState('');
  const [commonReason, setCommonReason] = useState('');
  
  const currentRecordType = type === 'ship' ? RecordType.Normal 
                          : type === 'return' ? RecordType.Return 
                          : RecordType.Exchange;

  const totalPlannedWeight = useMemo(() => {
     return vehicleList.reduce((acc, v) => acc + (type === 'ship' ? v.loadWeight : (v.returnWeight || 0)), 0);
  }, [vehicleList, type]);

  const totalActualWeight = useMemo(() => {
     return vehicleList.reduce((acc, v) => acc + (v.actualOutWeight || 0), 0);
  }, [vehicleList]);

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
    setWeight('');
  };

  const handlePlateChange = (plate: string) => {
    setSelectedPlate(plate);
    const vehicle = MOCK_VEHICLE_POOL.find(v => v.plateNumber === plate);
    if (vehicle) {
      setDriverName(vehicle.driverName);
      setDriverPhone(vehicle.driverPhone);
    } else {
      setDriverName('');
      setDriverPhone('');
    }
  };

  const handleEdit = (v: VehicleRecord) => {
    setEditingId(v.id);
    setSelectedPlate(v.plateNumber);
    setDriverName(v.driverName);
    setDriverPhone(v.driverPhone);
    setWeight(v.type === RecordType.Normal ? v.loadWeight.toString() : (v.returnWeight || '').toString());
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此车辆记录吗?')) {
      setVehicleList(prev => prev.filter(v => v.id !== id));
      if (editingId === id) resetForm();
    }
  };

  const handleAddOrUpdate = () => {
    if (!driverName || !weight) return;
    if (!selectedPlate) return;
    const numWeight = parseFloat(weight);

    if (editingId) {
      setVehicleList(prev => prev.map(v => {
        if (v.id === editingId) {
          return {
            ...v,
            plateNumber: selectedPlate,
            driverName,
            driverPhone,
            loadWeight: type === 'ship' ? numWeight : v.loadWeight,
            returnWeight: type !== 'ship' ? numWeight : v.returnWeight,
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
        loadWeight: type === 'ship' ? numWeight : 0,
        returnWeight: type !== 'ship' ? numWeight : 0,
        type: currentRecordType,
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
       <div className="flex flex-col gap-6 h-[80vh]">
        
        {/* TOP: Info & Inputs */}
        <div className="flex-shrink-0 space-y-4">
           {/* Info Bar */}
           <div className="bg-gray-50 p-4 rounded border border-gray-200 shadow-sm text-sm">
             <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
               <div>订单: <span className="font-bold text-gray-900">{order.id}</span></div>
               <div className="col-span-2">客户: <span className="font-bold text-indigo-700 text-lg">{order.customerName}</span></div>
               <div>产品: <span className="font-bold text-gray-900">{order.productName}</span></div>
               <div>规格: <span className="font-bold text-gray-900">{order.spec}</span></div>
               <div>剩余: <span className={`font-bold text-${theme}-600`}>{order.quantity} T</span></div>
               <div>预计: <span className="font-bold text-gray-900">{totalPlannedWeight} T</span></div>
               <div>实际: <span className="font-bold text-gray-900">{totalActualWeight} T</span></div>
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

           {/* ADD FORM */}
           <div className="border rounded-lg p-3 bg-white shadow-sm">
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                <span>{editingId ? '编辑车辆' : '新增调度车辆'}</span>
                {editingId && <button onClick={resetForm} className="text-xs text-blue-500">取消</button>}
              </h4>
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-3">
                  <label className="text-xs text-gray-500">车牌</label>
                  <select className="w-full border rounded p-2 text-sm" value={selectedPlate} onChange={(e) => handlePlateChange(e.target.value)}>
                      <option value="">选择车辆</option>
                      {MOCK_VEHICLE_POOL.map(v => <option key={v.id} value={v.plateNumber}>{v.plateNumber}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-gray-500">司机</label>
                  <input className="w-full bg-gray-50 border rounded p-2 text-sm" value={driverName} readOnly />
                </div>
                <div className="col-span-3">
                   <label className="text-xs text-gray-500">计划重量(T)</label>
                   <input type="number" className="w-full border rounded p-2 text-sm text-center font-bold" value={weight} onChange={e => setWeight(e.target.value)} />
                </div>
                <div className="col-span-3">
                   <button 
                     onClick={handleAddOrUpdate}
                     disabled={!selectedPlate || !driverName || !weight}
                     className={`w-full p-2 bg-${theme}-600 text-white rounded hover:bg-${theme}-700 flex justify-center disabled:opacity-50`}
                   >
                     {editingId ? <CheckCircle size={18} /> : <Plus size={18} />} {editingId ? '保存修改' : '添加车辆'}
                   </button>
                </div>
              </div>
           </div>
        </div>

        {/* MIDDLE: Accordion List */}
        <div className="flex-1 overflow-auto border rounded-lg bg-white">
           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50 sticky top-0 z-10">
               <tr>
                 <th className="w-8 px-4 py-3"></th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">状态</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">车牌</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">司机</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">货源/批次</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">进厂时间</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">二次过磅</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">出厂时间</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">重量(吨)</th>
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
             <Save size={18} /> 保存
           </button>
        </div>

       </div>
    </Modal>
  );
};