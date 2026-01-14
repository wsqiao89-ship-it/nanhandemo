
import React, { useState, useMemo } from 'react';
import { X, Save, Trash2, Edit2, Activity, Truck, FileText, DollarSign, Database, User, Scale, Box, Receipt } from 'lucide-react';
import { Order, OrderStatus, VehicleRecord, RecordType, VehicleStatus, WarehouseType } from '../types';
import { StatusBadge } from './StatusBadge';
import { MOCK_WAREHOUSES } from '../constants';

interface OrderDetailsProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'vehicles' | 'process'>('details');

  // --- Metrics Calculations ---
  const metrics = useMemo(() => {
    if (!order) return { totalFinished: 0, customerStock: 0, planned: 0, actual: 0, invoiced: 0 };

    // 1. Total Finished Goods Inventory (All Warehouses)
    const totalFinished = MOCK_WAREHOUSES
        .filter(w => w.type === WarehouseType.Finished)
        .reduce((acc, w) => acc + w.zones.reduce((zAcc, z) => zAcc + z.inventory.reduce((iAcc, i) => iAcc + (i.productName === order.productName ? i.quantity : 0), 0), 0), 0);

    // 2. Customer Inventory (Mocked Logic: Quantity * 0.2 remaining)
    const customerStock = order.quantity * 0.15; // Mock data

    // 3. Order Metrics
    const planned = order.quantity;
    const actual = order.vehicles.reduce((acc, v) => acc + (v.actualOutWeight || 0), 0);
    const invoiced = order.settlementWeight || 0;

    return { totalFinished, customerStock, planned, actual, invoiced };
  }, [order]);

  if (!isOpen || !order) return null;

  // Render Logic for Vehicle Tables with Batches
  const renderVehicleTable = (type: RecordType) => {
    const filteredVehicles = order.vehicles.filter(v => v.type === type);
    if (filteredVehicles.length === 0) return <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed text-sm">暂无{type}记录</div>;

    return (
      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">车牌号 / 司机</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联批次号/详情</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间节点</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">磅单重量</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">实际/结算</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVehicles.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={v.status} type="vehicle" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{v.plateNumber}</div>
                  <div className="text-xs text-gray-500">{v.driverName}</div>
                  <div className="text-xs text-gray-400">{v.driverPhone}</div>
                </td>
                
                {/* Batches Column */}
                <td className="px-4 py-3">
                   {v.batchDetails && v.batchDetails.length > 0 ? (
                     <div className="space-y-1">
                        {v.batchDetails.map((b, idx) => (
                           <div key={idx} className="text-xs flex items-center justify-between bg-blue-50 px-2 py-1 rounded border border-blue-100">
                              <span className="font-mono text-blue-700">{b.batchNo}</span>
                              <span className="font-bold text-blue-900 ml-2">{b.weight} {order.unit || '吨'}</span>
                           </div>
                        ))}
                        <div className="text-[10px] text-gray-400 text-right mt-1">计划总重: {v.loadWeight} {order.unit}</div>
                     </div>
                   ) : (
                     <div className="text-xs text-gray-500">
                        {v.warehouseName && <div className="font-bold text-indigo-700">{v.warehouseName}</div>}
                        <div className="font-mono">{v.batchNumber || '-'}</div>
                     </div>
                   )}
                </td>

                {/* Time Nodes */}
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 space-y-1">
                   {v.entryTime && <div>进: {v.entryTime.split(' ')[1]}</div>}
                   {v.exitTime && <div>出: {v.exitTime.split(' ')[1]}</div>}
                   {!v.entryTime && !v.exitTime && '-'}
                </td>

                {/* Weights */}
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 space-y-1">
                  {v.weighing1 && <div>一磅: <span className="font-mono font-medium">{v.weighing1.weight}</span></div>}
                  {v.weighing2 && <div>二磅: <span className="font-mono font-medium">{v.weighing2.weight}</span></div>}
                  {!v.weighing1 && !v.weighing2 && '-'}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-bold text-blue-600">
                    {v.actualOutWeight ? `${v.actualOutWeight} ${v.unit || '吨'}` : '-'}
                  </div>
                  {type !== RecordType.Normal && (
                     <div className="text-[10px] text-red-500 bg-red-50 px-1 rounded mt-1 border border-red-100 max-w-[100px] truncate">
                        {v.returnReason || v.exchangeReason}
                     </div>
                  )}
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const InfoCard = ({ label, value, sub, color }: any) => (
      <div className={`p-3 rounded-lg border ${color} bg-opacity-10 flex flex-col items-center justify-center flex-1`}>
          <div className="text-xs text-gray-500 mb-1">{label}</div>
          <div className="text-xl font-bold text-gray-800">{value}</div>
          {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
      </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 opacity-60" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">

          {/* Header & Metrics */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        订单详情: {order.id}
                        <StatusBadge status={order.status} />
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                       <FileText size={14}/> 合同: {order.contractId} 
                       <span className="text-gray-300">|</span> 
                       <User size={14}/> 客户: {order.customerName}
                    </p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500 bg-white p-1 rounded-full shadow-sm"><X size={20}/></button>
            </div>

            {/* Top Metrics Dashboard */}
            <div className="flex gap-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200 flex-1 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>客户当前库存</span>
                        <Database size={14} className="text-blue-400"/>
                    </div>
                    <div className="text-lg font-bold text-gray-800">{metrics.customerStock.toFixed(1)} <span className="text-xs font-normal">吨</span></div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 flex-1 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>成品总库存</span>
                        <Box size={14} className="text-indigo-400"/>
                    </div>
                    <div className="text-lg font-bold text-gray-800">{metrics.totalFinished.toFixed(1)} <span className="text-xs font-normal">吨</span></div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 flex-1 shadow-sm border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>计划重量</span>
                        <FileText size={14} className="text-blue-500"/>
                    </div>
                    <div className="text-lg font-bold text-blue-600">{metrics.planned} <span className="text-xs font-normal">吨</span></div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 flex-1 shadow-sm border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>实际出库</span>
                        <Scale size={14} className="text-green-500"/>
                    </div>
                    <div className="text-lg font-bold text-green-600">{metrics.actual.toFixed(2)} <span className="text-xs font-normal">吨</span></div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 flex-1 shadow-sm border-l-4 border-l-teal-500">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>已开票</span>
                        <Receipt size={14} className="text-teal-500"/>
                    </div>
                    <div className="text-lg font-bold text-teal-600">{metrics.invoiced.toFixed(2)} <span className="text-xs font-normal">吨</span></div>
                </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white">
            <nav className="-mb-px flex px-6" aria-label="Tabs">
              {[
                { id: 'details', name: '详细信息 & 财务' },
                { id: 'vehicles', name: `车辆调度 (${order.vehicles.length})` },
                { id: 'process', name: '全流程追踪' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 min-h-[400px] max-h-[60vh] overflow-y-auto custom-scrollbar bg-gray-50/30">
            {activeTab === 'details' && (
              <div className="space-y-6">
                 {/* 1. Basic & Cargo */}
                 <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Box size={16} className="text-blue-500"/> 货物与基本信息</h4>
                    <div className="grid grid-cols-4 gap-6 text-sm">
                       <div><label className="text-gray-500 text-xs block mb-1">产品名称</label><div className="font-medium">{order.productName}</div></div>
                       <div><label className="text-gray-500 text-xs block mb-1">规格型号</label><div className="font-medium">{order.spec}</div></div>
                       <div><label className="text-gray-500 text-xs block mb-1">计划发货日期</label><div className="font-medium">{order.shipDate}</div></div>
                       <div><label className="text-gray-500 text-xs block mb-1">计量单位</label><div className="font-medium">{order.unit || '吨'}</div></div>
                       <div className="col-span-4"><label className="text-gray-500 text-xs block mb-1">订单备注</label><div className="bg-gray-50 p-2 rounded text-gray-700 text-xs">{order.remark || '无备注'}</div></div>
                    </div>
                 </div>

                 {/* 2. Financial & Invoicing */}
                 <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><DollarSign size={16} className="text-green-500"/> 价格与开票信息</h4>
                    <div className="grid grid-cols-4 gap-6 text-sm">
                       <div>
                          <label className="text-gray-500 text-xs block mb-1">执行单价</label>
                          <div className="font-bold text-gray-900">¥{order.unitPrice} <span className="text-xs font-normal text-gray-400">/{order.unit}</span></div>
                          {order.isPriceAdjusted && <span className="text-[10px] text-yellow-600 bg-yellow-50 px-1 rounded">已调价</span>}
                       </div>
                       <div>
                          <label className="text-gray-500 text-xs block mb-1">预估总金额</label>
                          <div className="font-bold text-gray-900">¥{(order.unitPrice * order.quantity).toLocaleString()}</div>
                       </div>
                       <div>
                          <label className="text-gray-500 text-xs block mb-1">实际结算重量</label>
                          <div className="font-bold text-teal-600">{metrics.invoiced > 0 ? metrics.invoiced : '-'} <span className="text-xs font-normal text-gray-400">{metrics.invoiced > 0 ? order.unit : ''}</span></div>
                       </div>
                       <div>
                          <label className="text-gray-500 text-xs block mb-1">实际结算金额</label>
                          <div className="font-bold text-teal-600">{metrics.invoiced > 0 ? `¥${(metrics.invoiced * order.unitPrice).toLocaleString()}` : '-'}</div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'vehicles' && (
              <div className="space-y-8">
                 <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-blue-500 pl-3 flex items-center justify-between">
                      正常出货记录
                    </h4>
                    {renderVehicleTable(RecordType.Normal)}
                 </div>
                 
                 {(order.status === OrderStatus.Returning || order.vehicles.some(v => v.type === RecordType.Return)) && (
                   <div>
                      <h4 className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-red-500 pl-3">退货车辆记录</h4>
                      {renderVehicleTable(RecordType.Return)}
                   </div>
                 )}
                 
                 {(order.status === OrderStatus.Exchanging || order.vehicles.some(v => v.type === RecordType.Exchange)) && (
                   <div>
                      <h4 className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-orange-500 pl-3">换货车辆记录</h4>
                      {renderVehicleTable(RecordType.Exchange)}
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'process' && (
              <div className="space-y-8">
                {/* Visual Timeline */}
                <div className="relative">
                   <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>
                   {order.history.map((h, idx) => (
                     <div key={idx} className="relative pl-10 mb-6 last:mb-0 group">
                        <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                          <Activity size={12} className="text-blue-600"/>
                        </div>
                        <div className="bg-white p-3 border rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                           <div className="flex justify-between">
                              <span className="font-bold text-gray-800 text-sm">{h.action}</span>
                              <span className="text-xs text-gray-500 font-mono">{h.date}</span>
                           </div>
                           <div className="text-xs text-gray-600 mt-1 flex items-center gap-1"><User size={10}/> {h.user}</div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
