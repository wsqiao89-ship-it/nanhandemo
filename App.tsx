import React, { useState, useMemo } from 'react';
import { Search, Plus, Truck, RotateCcw, RefreshCw, DollarSign, Edit, Filter, FileCheck, LayoutDashboard, ClipboardList, Menu, CheckCircle, XCircle, Clock, ChevronRight, FileText, Banknote, ScrollText, QrCode, Archive, Box, Home, TrendingUp } from 'lucide-react';
import { MOCK_ORDERS, MOCK_CONTRACTS, MOCK_WAREHOUSES } from './constants';
import { Order, OrderStatus, FilterState, Contract } from './types';
import { StatusBadge } from './components/StatusBadge';
import { NewOrderModal, PriceModal, ActionModal, AuditModal } from './components/Modals';
import { OrderDetails } from './components/OrderDetails';
import { PriceManagement } from './components/PriceManagement';
import { ContractManagement } from './components/ContractManagement';
import { CodingManagement } from './components/CodingManagement';
import { WarehouseManagement } from './components/WarehouseManagement';
import { WarehouseOverview } from './components/WarehouseOverview';
import { Dashboard } from './components/Dashboard';
import { StatisticsAnalysis } from './components/StatisticsAnalysis';

export default function App() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [currentView, setCurrentView] = useState<'dashboard' | 'orders' | 'approvals' | 'prices' | 'contracts' | 'coding' | 'warehouse_mgt' | 'warehouse_view' | 'statistics'>('dashboard');
  
  // Approval Center State
  const [approvalTab, setApprovalTab] = useState<'todo' | 'done'>('todo');

  // Order List Filters
  const [filters, setFilters] = useState<FilterState>({
    orderId: '',
    customerName: '',
    contractId: '',
    shipDate: '',
    status: '',
  });

  // Modal State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // --- Computed Data ---

  // 1. Main Order List (View: orders)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Basic Search Filters
      const matchesSearch = 
        order.id.toLowerCase().includes(filters.orderId.toLowerCase()) &&
        order.customerName.includes(filters.customerName) &&
        order.contractId.toLowerCase().includes(filters.contractId.toLowerCase()) &&
        (filters.shipDate === '' || order.shipDate === filters.shipDate) &&
        (filters.status === '' || order.status === filters.status);
      
      // In Order Management view, usually show everything
      return matchesSearch;
    });
  }, [orders, filters]);

  // 2. Approval Tasks (View: approvals -> todo)
  const pendingTasks = useMemo(() => {
    return orders.filter(o => 
      o.status === OrderStatus.PendingAudit || 
      o.status === OrderStatus.PriceApproval
    );
  }, [orders]);

  // 3. Processed Tasks (View: approvals -> done)
  // Mocking this by checking history for specific action keywords
  const processedTasks = useMemo(() => {
    return orders.filter(o => 
      o.history.some(h => h.action.includes('审核通过') || h.action.includes('批准')) &&
      o.status !== OrderStatus.PendingAudit &&
      o.status !== OrderStatus.PriceApproval
    );
  }, [orders]);

  // --- Handlers ---

  const handleOpenModal = (type: string, order?: Order) => {
    if (order) setSelectedOrder(order);
    else setSelectedOrder(null);
    setActiveModal(type);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedOrder(null);
  };

  const handleSaveOrder = (updatedOrder: Order) => {
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    );
    handleCloseModal();
  };

  // Logic for Contract -> Order Generation
  const handleGenerateOrder = (contract: Contract) => {
    if (confirm(`确认根据合同 ${contract.contractNumber} 生成订单吗？`)) {
        // Create a new order based on contract
        const newOrder: Order = {
            id: `ORD-${Date.now()}`,
            contractId: contract.contractNumber,
            customerName: contract.customerName,
            productName: contract.productName,
            spec: contract.spec,
            quantity: contract.quantity,
            unitPrice: 0, // Needs manual entry later usually, or fetch price
            shipDate: contract.deliveryTime,
            status: OrderStatus.PendingAudit, // New orders need audit
            vehicles: [],
            history: [{ date: new Date().toLocaleString('zh-CN', { hour12: false }), action: '从合同生成订单', user: '系统' }]
        };
        
        setOrders(prev => [newOrder, ...prev]);
        setCurrentView('orders'); // Switch to Order View
        alert('订单已生成，请在订单列表查看。');
    }
  };

  // Logic for Approvals (Financial & Price)
  const handleApprove = (order: Order) => {
      let actionText = '';
      let confirmText = '';

      if (order.status === OrderStatus.PendingAudit) {
        confirmText = `确认通过订单 ${order.id} 的财务审核吗？`;
        actionText = '财务审核通过';
      } else if (order.status === OrderStatus.PriceApproval) {
        confirmText = `确认批准订单 ${order.id} 的价格调整申请吗？`;
        actionText = '价格调整已批准';
      }

      if (confirm(confirmText)) {
        const updatedOrder: Order = {
            ...order,
            status: OrderStatus.Unassigned, // Reset to 'Unassigned' to allow dispatch
            history: [
               { date: new Date().toLocaleString('zh-CN', { hour12: false }), action: actionText, user: '当前用户' },
               ...order.history
            ]
          };
          setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      }
  };

  const handleReject = (order: Order) => {
    const reason = prompt("请输入驳回原因:");
    if (reason) {
       // Logic to reject (maybe set to a 'Rejected' status or back to draft)
       // For demo, we just log it
       alert("已驳回 (Demo)");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col shadow-xl z-20 overflow-y-auto">
         <div className="h-16 flex items-center gap-3 px-6 bg-slate-950 shadow-sm flex-shrink-0 sticky top-0 z-10">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-900/50">
              <Truck size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-wide text-gray-100">OrderFlow</h1>
         </div>
         
         <nav className="flex-1 py-6 px-3 space-y-1.5">
            
            {/* Dashboard */}
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
               <Home size={20} className={currentView === 'dashboard' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
               工作台
            </button>

            {/* Statistics */}
             <button 
              onClick={() => setCurrentView('statistics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'statistics' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
               <TrendingUp size={20} className={currentView === 'statistics' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
               统计分析
            </button>

            {/* Core Business */}
            <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">业务管理</div>
            
            <button 
              onClick={() => setCurrentView('contracts')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'contracts' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
               <ScrollText size={20} className={currentView === 'contracts' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
               合同管理
            </button>

            <button 
              onClick={() => setCurrentView('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
               <LayoutDashboard size={20} className={currentView === 'orders' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
               销售订单
            </button>

            {/* Warehouse & Products */}
            <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">仓储与产品</div>

            <button 
              onClick={() => setCurrentView('warehouse_view')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'warehouse_view' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
               <Box size={20} className={currentView === 'warehouse_view' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
               仓库概览
            </button>

            <button 
              onClick={() => setCurrentView('warehouse_mgt')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'warehouse_mgt' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
               <Archive size={20} className={currentView === 'warehouse_mgt' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
               仓库管理
            </button>

            <button 
              onClick={() => setCurrentView('coding')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'coding' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
               <QrCode size={20} className={currentView === 'coding' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
               编码管理
            </button>

            {/* Finance & Audit */}
            <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">财务与审批</div>

            <button 
              onClick={() => setCurrentView('approvals')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'approvals' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
               <div className="relative">
                 <FileCheck size={20} className={currentView === 'approvals' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
                 {pendingTasks.length > 0 && (
                   <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-slate-900"></span>
                   </span>
                 )}
               </div>
               审批中心
               {pendingTasks.length > 0 && (
                 <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingTasks.length}</span>
               )}
            </button>

            <button 
              onClick={() => setCurrentView('prices')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'prices' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
               <Banknote size={20} className={currentView === 'prices' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
               价格管理
            </button>
            
            <div className="mt-8"></div>
         </nav>

         <div className="p-4 border-t border-slate-800 bg-slate-950/30 sticky bottom-0">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold shadow-lg">JD</div>
               <div className="text-sm">
                  <div className="font-medium text-gray-200">Admin User</div>
                  <div className="text-xs text-slate-500">物流主管</div>
               </div>
            </div>
         </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        
        {/* Mobile Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 md:hidden h-16 flex items-center px-4 justify-between sticky top-0 z-20">
           <div className="flex items-center gap-2">
              <Truck className="text-blue-600" />
              <span className="font-bold">OrderFlow OMS</span>
           </div>
           <Menu className="text-gray-500" />
        </header>

        {/* Dynamic Main Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-8">
           
           {/* VIEW: DASHBOARD */}
           {currentView === 'dashboard' && (
             <Dashboard 
               orders={orders} 
               contracts={MOCK_CONTRACTS} 
               warehouses={MOCK_WAREHOUSES} 
               onNavigate={(view) => setCurrentView(view as any)} 
               onOpenModal={handleOpenModal}
             />
           )}
           
           {/* VIEW: STATISTICS */}
           {currentView === 'statistics' && (
              <StatisticsAnalysis />
           )}

           {/* VIEW: CONTRACT MANAGEMENT */}
           {currentView === 'contracts' && (
             <ContractManagement onGenerateOrder={handleGenerateOrder} />
           )}

            {/* VIEW: CODING MANAGEMENT */}
            {currentView === 'coding' && (
             <CodingManagement />
           )}

           {/* VIEW: WAREHOUSE MANAGEMENT */}
           {currentView === 'warehouse_mgt' && (
             <WarehouseManagement />
           )}

            {/* VIEW: WAREHOUSE OVERVIEW */}
            {currentView === 'warehouse_view' && (
             <WarehouseOverview />
           )}

           {/* VIEW: ORDER MANAGEMENT */}
           {currentView === 'orders' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">销售订单管理</h2>
                    <p className="text-sm text-gray-500 mt-1">全流程跟踪订单状态、车辆调度及异常处理</p>
                  </div>
                  <button 
                    onClick={() => handleOpenModal('new')}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium hover:shadow-md"
                  >
                    <Plus size={18} /> 新增订单
                  </button>
               </div>

               {/* Stats Overview */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: '待审核', count: orders.filter(o => o.status === OrderStatus.PendingAudit).length, color: 'text-purple-600', border: 'border-l-4 border-purple-500' },
                    { label: '待发货', count: orders.filter(o => o.status === OrderStatus.ReadyToShip).length, color: 'text-blue-600', border: 'border-l-4 border-blue-500' },
                    { label: '进行中', count: orders.filter(o => o.status === OrderStatus.Shipping).length, color: 'text-indigo-600', border: 'border-l-4 border-indigo-500' },
                    { label: '异常/退换', count: orders.filter(o => o.status === OrderStatus.Returning || o.status === OrderStatus.Exchanging).length, color: 'text-red-600', border: 'border-l-4 border-red-500' },
                  ].map((stat, i) => (
                    <div key={i} className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 ${stat.border}`}>
                        <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">{stat.label}</span>
                        <span className={`block text-3xl font-bold ${stat.color} mt-1`}>{stat.count}</span>
                    </div>
                  ))}
               </div>

               {/* Filter Bar */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="relative">
                        <input type="text" placeholder="订单编号" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                          value={filters.orderId} onChange={e => setFilters({...filters, orderId: e.target.value})} />
                        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    </div>
                    <input type="text" placeholder="客户名称" className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                       value={filters.customerName} onChange={e => setFilters({...filters, customerName: e.target.value})} />
                    <input type="text" placeholder="合同编号" className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                       value={filters.contractId} onChange={e => setFilters({...filters, contractId: e.target.value})} />
                    <input type="date" className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                       value={filters.shipDate} onChange={e => setFilters({...filters, shipDate: e.target.value})} />
                    <select className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                       value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as OrderStatus})}>
                      <option value="">所有状态</option>
                      {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-lg text-sm font-medium transition-all"
                        onClick={() => setFilters({ orderId: '', customerName: '', contractId: '', shipDate: '', status: '' })}>
                      <Filter size={16} /> 重置筛选
                    </button>
                  </div>
               </div>

               {/* Orders Table */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">订单编号</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">客户信息</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">货物详情</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">重量(T) / 单价</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">调度操作</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{order.id}</td>
                              <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={order.status} /></td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 font-medium">{order.customerName}</div>
                                <div className="text-xs text-gray-400">{order.contractId}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{order.productName}</div>
                                <div className="text-xs text-gray-500 bg-gray-100 inline-block px-1.5 rounded mt-0.5">{order.spec}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm font-bold text-gray-900">{order.quantity} T</div>
                                <div className="text-xs text-gray-500">¥{order.unitPrice}/T</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                   {/* Contextual Actions */}
                                   <button onClick={() => handleOpenModal('ship', order)} title="出货调度" 
                                      disabled={order.status === OrderStatus.PendingAudit}
                                      className={`p-1.5 rounded-md transition-colors ${order.status === OrderStatus.PendingAudit ? 'text-gray-200' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}>
                                      <Truck size={18} />
                                   </button>
                                   <button onClick={() => handleOpenModal('return', order)} title="退货登记" className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                                      <RotateCcw size={18} />
                                   </button>
                                   <button onClick={() => handleOpenModal('exchange', order)} title="换货登记" className="p-1.5 rounded-md text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors">
                                      <RefreshCw size={18} />
                                   </button>
                                   <button onClick={() => handleOpenModal('price', order)} title="申请调价" className="p-1.5 rounded-md text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 transition-colors">
                                      <DollarSign size={18} />
                                   </button>
                                   <div className="w-px h-5 bg-gray-200 mx-1 self-center"></div>
                                   <button onClick={() => handleOpenModal('detail', order)} title="查看详情" className="p-1.5 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                                      <Edit size={18} />
                                   </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">未找到符合条件的订单</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
             </div>
           )}


           {/* VIEW: APPROVAL CENTER */}
           {currentView === 'approvals' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                   <div>
                     <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                       审批中心
                       {pendingTasks.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingTasks.length}</span>}
                     </h2>
                     <p className="text-sm text-gray-500 mt-1">处理财务审核、价格变更审批及其他待办事项。</p>
                   </div>
                   
                   {/* Tabs */}
                   <div className="flex p-1 bg-gray-200 rounded-lg self-start">
                      <button 
                        onClick={() => setApprovalTab('todo')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${approvalTab === 'todo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        我的待办 ({pendingTasks.length})
                      </button>
                      <button 
                        onClick={() => setApprovalTab('done')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${approvalTab === 'done' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        我的已办
                      </button>
                   </div>
                </div>

                {/* To Do List */}
                {approvalTab === 'todo' && (
                  <div className="space-y-4">
                     {pendingTasks.length === 0 ? (
                       <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                          <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                             <CheckCircle className="text-green-500" size={32} />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900">暂无待办事项</h3>
                          <p className="text-gray-500 mt-1">您已完成所有审批任务，去喝杯咖啡吧 ☕</p>
                       </div>
                     ) : (
                       pendingTasks.map(task => (
                         <div key={task.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-start md:items-center">
                            {/* Status Indicator */}
                            <div className="flex-shrink-0">
                               {task.status === OrderStatus.PendingAudit ? (
                                 <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 border border-purple-200">
                                    <FileCheck size={24} />
                                 </div>
                               ) : (
                                 <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 border border-yellow-200">
                                    <DollarSign size={24} />
                                 </div>
                               )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${task.status === OrderStatus.PendingAudit ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                     {task.status === OrderStatus.PendingAudit ? '订单审核' : '价格审批'}
                                  </span>
                                  <span className="text-gray-400 text-xs flex items-center gap-1"><Clock size={12}/> {task.history[0]?.date}</span>
                               </div>
                               <h3 className="text-base font-bold text-gray-900 truncate">
                                 {task.customerName} <span className="text-gray-400 font-normal mx-1">/</span> {task.productName}
                               </h3>
                               <p className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                                  <span>订单号: {task.id}</span>
                                  <span>金额: <b className="text-gray-800">¥{(task.quantity * task.unitPrice).toLocaleString()}</b></span>
                                  {task.status === OrderStatus.PriceApproval && <span className="text-yellow-600">申请调价</span>}
                               </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-shrink-0 items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                               <button 
                                 onClick={() => handleReject(task)}
                                 className="flex-1 md:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                               >
                                 驳回
                               </button>
                               <button 
                                 onClick={() => handleApprove(task)}
                                 className="flex-1 md:flex-none px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                               >
                                 <CheckCircle size={16} /> 
                                 {task.status === OrderStatus.PendingAudit ? '通过审核' : '批准价格'}
                               </button>
                            </div>
                         </div>
                       ))
                     )}
                  </div>
                )}

                {/* Done List */}
                {approvalTab === 'done' && (
                   <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                           <tr>
                             <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">任务类型</th>
                             <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">相关订单</th>
                             <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">处理结果</th>
                             <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">处理时间</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {processedTasks.length > 0 ? (
                             processedTasks.map(task => (
                               <tr key={task.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">
                                     <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-gray-100 rounded text-gray-500"><FileText size={14}/></div>
                                        <span className="text-sm font-medium text-gray-700">审批任务</span>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4">
                                     <div className="text-sm font-bold text-gray-900">{task.customerName}</div>
                                     <div className="text-xs text-gray-500">{task.id}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                     <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                       <CheckCircle size={12} /> 已批准
                                     </span>
                                  </td>
                                  <td className="px-6 py-4 text-right text-sm text-gray-500 font-mono">
                                     {task.history.find(h => h.action.includes('通过') || h.action.includes('批准'))?.date || '-'}
                                  </td>
                               </tr>
                             ))
                           ) : (
                             <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">暂无已处理记录</td></tr>
                           )}
                        </tbody>
                      </table>
                   </div>
                )}
             </div>
           )}

           {/* VIEW: PRICE MANAGEMENT */}
           {currentView === 'prices' && (
              <PriceManagement />
           )}

        </main>
      </div>

      {/* --- Modals --- */}
      <NewOrderModal isOpen={activeModal === 'new'} onClose={handleCloseModal} />
      <PriceModal isOpen={activeModal === 'price'} onClose={handleCloseModal} order={selectedOrder} />
      
      {/* Kept for reference, but main approval logic is now inline in Approval Center */}
      <AuditModal 
        isOpen={activeModal === 'audit'} 
        onClose={handleCloseModal} 
        onApprove={() => selectedOrder && handleApprove(selectedOrder)}
        order={selectedOrder} 
      />
      
      <ActionModal isOpen={activeModal === 'ship'} onClose={handleCloseModal} onSave={handleSaveOrder} type="ship" order={selectedOrder} />
      <ActionModal isOpen={activeModal === 'return'} onClose={handleCloseModal} onSave={handleSaveOrder} type="return" order={selectedOrder} />
      <ActionModal isOpen={activeModal === 'exchange'} onClose={handleCloseModal} onSave={handleSaveOrder} type="exchange" order={selectedOrder} />
      
      <OrderDetails isOpen={activeModal === 'detail'} onClose={handleCloseModal} order={selectedOrder} />

    </div>
  );
}
