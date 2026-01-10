import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight, 
  FileText, 
  Truck, 
  Database,
  Activity,
  ShoppingBag,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { Order, OrderStatus, Contract, Warehouse, ContractType, VehicleStatus, RecordType } from '../types';

interface DashboardProps {
  orders: Order[];
  contracts: Contract[];
  warehouses: Warehouse[];
  onNavigate: (view: string) => void;
  onOpenModal: (type: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  orders, 
  contracts, 
  warehouses, 
  onNavigate,
}) => {

  // --- Calculations ---

  // 1. Personal Tasks (To-Do)
  const pendingAudits = orders.filter(o => o.status === OrderStatus.PendingAudit);
  const pendingPrices = orders.filter(o => o.status === OrderStatus.PriceApproval);
  const tasksCount = pendingAudits.length + pendingPrices.length;

  // 2. Shipping Logistics Stats (Sales Orders)
  const shippingStats = useMemo(() => {
     // Get all vehicle records from active sales orders that are actually shipping
     const activeVehicleRecords = orders.flatMap(o => o.vehicles.filter(v => 
        (v.status === VehicleStatus.Loading || v.status === VehicleStatus.Unloading || v.status === VehicleStatus.Exited) &&
        v.type === RecordType.Normal
     ));
     
     const totalTrucks = activeVehicleRecords.length;
     const totalTons = activeVehicleRecords.reduce((acc, v) => acc + (v.actualOutWeight || v.loadWeight), 0);
     
     // Group by product
     const productBreakdown = activeVehicleRecords.reduce((acc, v) => {
        const order = orders.find(o => o.vehicles.some(vr => vr.id === v.id));
        if (order) {
           acc[order.productName] = (acc[order.productName] || 0) + (v.actualOutWeight || v.loadWeight);
        }
        return acc;
     }, {} as Record<string, number>);

     return { totalTrucks, totalTons, productBreakdown };
  }, [orders]);

  // 3. Purchasing Stats (Contracts) - REMOVED AMOUNT
  const purchasingStats = useMemo(() => {
     const purchaseContracts = contracts.filter(c => c.type === ContractType.Purchase);
     const totalTons = purchaseContracts.reduce((acc, c) => acc + c.quantity, 0);
     
     return { totalTons, count: purchaseContracts.length };
  }, [contracts]);

  // 4. Inventory
  const totalInventory = useMemo(() => {
    return warehouses.reduce((acc, wh) => {
      return acc + wh.zones.reduce((zAcc, z) => zAcc + z.inventory.reduce((iAcc, i) => iAcc + i.quantity, 0), 0);
    }, 0);
  }, [warehouses]);

  // 5. Recent Activity
  const recentActivities = useMemo(() => {
    const allHistory = orders.flatMap(o => o.history.map(h => ({ ...h, orderId: o.id, customer: o.customerName })));
    return allHistory.slice(0, 5); 
  }, [orders]);

  // --- Components ---

  const StatCard = ({ title, value, subValue, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${bgClass}`}>
          <Icon className={colorClass} size={24} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs">
        {subValue}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">工作台</h1>
          <p className="text-gray-500 text-sm mt-1">欢迎回来，Admin User。今日共有 <span className="text-blue-600 font-bold">{tasksCount}</span> 项待办事项需处理。</p>
        </div>
      </div>

      {/* 1. Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="待处理事项" 
          value={tasksCount} 
          subValue={<span className="text-red-500 font-medium flex items-center gap-1"><AlertCircle size={12}/> 需要立即关注</span>}
          icon={FileText} 
          colorClass="text-orange-600" 
          bgClass="bg-orange-50"
        />
        <StatCard 
          title="发货车辆 (今日)" 
          value={shippingStats.totalTrucks} 
          subValue={<span className="text-blue-600 font-medium flex items-center gap-1"><Truck size={12}/> 正在作业或已完成</span>}
          icon={Truck} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50"
        />
        <StatCard 
          title="当前总库存" 
          value={`${totalInventory} 吨`} 
          subValue={<span className="text-gray-500">分布于 {warehouses.length} 个仓库</span>}
          icon={Database} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Main Column */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* Detailed Logistics & Purchase Info */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping Logistics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <Truck className="text-blue-500" size={18} /> 发货信息概览
                 </h3>
                 <div className="flex items-center justify-between mb-6">
                    <div>
                       <div className="text-sm text-gray-500">累计发货吨数</div>
                       <div className="text-2xl font-bold text-gray-900">{shippingStats.totalTons.toFixed(1)} <span className="text-sm font-normal text-gray-400">吨</span></div>
                    </div>
                    <div className="text-right">
                       <div className="text-sm text-gray-500">总车次</div>
                       <div className="text-2xl font-bold text-gray-900">{shippingStats.totalTrucks} <span className="text-sm font-normal text-gray-400">车</span></div>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <div className="text-xs font-semibold text-gray-400 uppercase">产品分布</div>
                    {Object.entries(shippingStats.productBreakdown).map(([name, weight]: [string, number]) => (
                       <div key={name} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{name}</span>
                          <span className="font-medium">{weight.toFixed(1)} 吨</span>
                       </div>
                    ))}
                    {Object.keys(shippingStats.productBreakdown).length === 0 && <div className="text-sm text-gray-400 text-center py-2">今日暂无发货数据</div>}
                 </div>
              </div>

              {/* Purchasing Info - MODIFIED: Removed Amount */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <ShoppingBag className="text-green-500" size={18} /> 采购信息概览
                 </h3>
                 <div className="flex items-center justify-between mb-6">
                    <div>
                       <div className="text-sm text-gray-500">本月采购总量</div>
                       <div className="text-2xl font-bold text-gray-900">{purchasingStats.totalTons} <span className="text-sm font-normal text-gray-400">吨</span></div>
                    </div>
                    <div className="text-right">
                       <div className="text-sm text-gray-500">采购合同数</div>
                       <div className="text-2xl font-bold text-gray-900">{purchasingStats.count} <span className="text-sm font-normal text-gray-400">份</span></div>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <div className="text-xs font-semibold text-gray-400 uppercase">近期采购</div>
                    {contracts.filter(c => c.type === ContractType.Purchase).slice(0, 3).map(c => (
                       <div key={c.id} className="flex items-center justify-between text-sm">
                          <div className="flex flex-col">
                             <span className="text-gray-700 font-medium">{c.productName}</span>
                             <span className="text-[10px] text-gray-400">{c.customerName}</span>
                          </div>
                          <div className="text-right">
                             <div className="font-medium">{c.quantity} 吨</div>
                             <div className="text-[10px] text-gray-400">{c.signDate}</div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* To-Do List */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                   <CheckCircle className="text-orange-500" size={18} /> 我的待办
                 </h3>
                 <button onClick={() => onNavigate('approvals')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                   进入审批中心 <ArrowRight size={12} />
                 </button>
              </div>
              <div className="divide-y divide-gray-100">
                 {tasksCount === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">暂无待办事项，一切正常</div>
                 ) : (
                    <>
                      {pendingAudits.map(task => (
                        <div key={task.id} className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                                 <FileText size={18} />
                              </div>
                              <div>
                                 <h4 className="text-sm font-bold text-gray-800">订单财务审核</h4>
                                 <p className="text-xs text-gray-500 mt-0.5">{task.customerName} - {task.productName} {task.quantity}吨</p>
                              </div>
                           </div>
                           <button onClick={() => onNavigate('approvals')} className="px-3 py-1.5 border border-purple-200 text-purple-600 text-xs rounded hover:bg-purple-50">
                              去审核
                           </button>
                        </div>
                      ))}
                      {pendingPrices.map(task => (
                        <div key={task.id} className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center flex-shrink-0">
                                 <DollarSign size={18} />
                              </div>
                              <div>
                                 <h4 className="text-sm font-bold text-gray-800">特殊价格审批</h4>
                                 <p className="text-xs text-gray-500 mt-0.5">{task.customerName} - 申请调价</p>
                              </div>
                           </div>
                           <button onClick={() => onNavigate('approvals')} className="px-3 py-1.5 border border-yellow-200 text-yellow-600 text-xs rounded hover:bg-yellow-50">
                              去批准
                           </button>
                        </div>
                      ))}
                    </>
                 )}
              </div>
           </div>
        </div>

        {/* 3. Right Column */}
        <div className="space-y-8">
           
           {/* Recent Activity */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                 <Activity className="text-indigo-500" size={18} /> 系统最新动态
              </h3>
              <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                 {recentActivities.map((act, idx) => (
                    <div key={idx} className="relative pl-6">
                       <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-200 box-content"></div>
                       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                          <div>
                             <p className="text-sm font-medium text-gray-800">{act.action}</p>
                             <p className="text-xs text-gray-500 mt-0.5">订单: {act.orderId} | 客户: {act.customer}</p>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded">{act.date}</span>
                       </div>
                       <p className="text-xs text-gray-400 mt-1">操作人: {act.user}</p>
                    </div>
                 ))}
              </div>
           </div>

           {/* Quick Actions */}
           <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white">
              <h3 className="font-bold text-lg mb-4">快捷入口</h3>
              <div className="space-y-3">
                 <button 
                   onClick={() => onNavigate('contracts')}
                   className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-lg text-sm text-left flex items-center justify-between transition-colors"
                 >
                    <span className="flex items-center gap-2"><FileText size={16}/> 查阅合同</span>
                    <ChevronRight size={14} className="opacity-50" />
                 </button>
                 <button 
                   onClick={() => onNavigate('warehouse_mgt')}
                   className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-lg text-sm text-left flex items-center justify-between transition-colors"
                 >
                    <span className="flex items-center gap-2"><Database size={16}/> 盘点库存</span>
                    <ChevronRight size={14} className="opacity-50" />
                 </button>
                 <button 
                    onClick={() => onNavigate('statistics')}
                    className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-lg text-sm text-left flex items-center justify-between transition-colors"
                 >
                    <span className="flex items-center gap-2"><TrendingUp size={16}/> 统计分析</span>
                    <ChevronRight size={14} className="opacity-50" />
                 </button>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};