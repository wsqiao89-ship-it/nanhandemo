import React, { useState } from 'react';
import { X, Save, Trash2, Edit2, Activity, Truck } from 'lucide-react';
import { Order, OrderStatus, VehicleRecord, RecordType, VehicleStatus } from '../types';
import { StatusBadge } from './StatusBadge';

interface OrderDetailsProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'vehicles' | 'process'>('basic');

  if (!isOpen || !order) return null;

  // Render Logic for Vehicle Tables
  const renderVehicleTable = (type: RecordType) => {
    const filteredVehicles = order.vehicles.filter(v => v.type === type);
    if (filteredVehicles.length === 0) return <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed">暂无{type}记录</div>;

    return (
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">车牌号 / 司机</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">进场时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">第一次过磅</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">第二次过磅</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">出厂时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">实际重</th>
              {type !== RecordType.Normal && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原因</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVehicles.map(v => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={v.status} type="vehicle" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{v.plateNumber}</div>
                  <div className="text-xs text-gray-500">{v.driverName} <span className="text-gray-300">|</span> {v.driverPhone}</div>
                </td>
                
                {/* Entry Time */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                   {v.entryTime ? <span className="font-mono text-xs">{v.entryTime.split(' ')[1]}</span> : '-'}
                </td>

                {/* Weighing 1 */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {v.weighing1 ? (
                    <div>
                      <div className="font-mono text-gray-900">{v.weighing1.weight} T</div>
                      <div className="text-xs text-gray-400 transform scale-90 origin-left">{v.weighing1.time}</div>
                    </div>
                  ) : <span className="text-gray-300">-</span>}
                </td>

                {/* Weighing 2 */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {v.weighing2 ? (
                    <div>
                      <div className="font-mono text-gray-900">{v.weighing2.weight} T</div>
                      <div className="text-xs text-gray-400 transform scale-90 origin-left">{v.weighing2.time}</div>
                    </div>
                  ) : <span className="text-gray-300">-</span>}
                </td>

                {/* Exit Time */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                   {v.exitTime ? <span className="font-mono text-xs">{v.exitTime.split(' ')[1]}</span> : '-'}
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-600">
                  {v.actualOutWeight ? `${v.actualOutWeight} T` : '-'}
                </td>
                
                {type !== RecordType.Normal && (
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500 max-w-xs truncate" title={v.returnReason || v.exchangeReason}>
                    {v.returnReason || v.exchangeReason}
                  </td>
                )}
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 opacity-60" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">

          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {order.id}
                <StatusBadge status={order.status} />
              </h2>
              <p className="text-sm text-gray-500 mt-1">合同: {order.contractId} | 发货日期: {order.shipDate}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500"><X /></button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex px-6" aria-label="Tabs">
              {[
                { id: 'basic', name: '基本信息 & 编辑' },
                { id: 'vehicles', name: '车辆跟踪记录' },
                { id: 'process', name: '订单流程追踪' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 min-h-[500px] max-h-[70vh] overflow-y-auto custom-scrollbar">
            {activeTab === 'basic' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">客户名称</label>
                  <input defaultValue={order.customerName} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">产品 + 规格</label>
                  <div className="flex gap-2">
                    <input defaultValue={order.productName} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    <input defaultValue={order.spec} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">数量 (吨)</label>
                  <input type="number" defaultValue={order.quantity} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">发货日期</label>
                  <input type="date" defaultValue={order.shipDate} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">合同编号</label>
                  <input type="text" defaultValue={order.contractId} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div className="col-span-2 mt-4 flex justify-end">
                   <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                     <Save size={16} /> 保存修改
                   </button>
                </div>
              </div>
            )}

            {activeTab === 'vehicles' && (
              <div className="space-y-8">
                 <div>
                    <h4 className="text-md font-bold text-gray-800 mb-3 border-l-4 border-blue-500 pl-3 flex items-center justify-between">
                      正常出货记录
                    </h4>
                    {renderVehicleTable(RecordType.Normal)}
                 </div>
                 
                 {(order.status === OrderStatus.Returning || order.vehicles.some(v => v.type === RecordType.Return)) && (
                   <div>
                      <h4 className="text-md font-bold text-gray-800 mb-3 border-l-4 border-red-500 pl-3">退货车辆记录</h4>
                      {renderVehicleTable(RecordType.Return)}
                   </div>
                 )}
                 
                 {(order.status === OrderStatus.Exchanging || order.vehicles.some(v => v.type === RecordType.Exchange)) && (
                   <div>
                      <h4 className="text-md font-bold text-gray-800 mb-3 border-l-4 border-orange-500 pl-3">换货车辆记录</h4>
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
                     <div key={idx} className="relative pl-10 mb-6 last:mb-0">
                        <div className="absolute left-1 top-1 w-6 h-6 bg-blue-100 rounded-full border-2 border-blue-500 flex items-center justify-center">
                          <Activity size={12} className="text-blue-600"/>
                        </div>
                        <div className="bg-white p-3 border rounded shadow-sm">
                           <div className="flex justify-between">
                              <span className="font-bold text-gray-800">{h.action}</span>
                              <span className="text-xs text-gray-500">{h.date}</span>
                           </div>
                           <div className="text-sm text-gray-600 mt-1">操作人: {h.user}</div>
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