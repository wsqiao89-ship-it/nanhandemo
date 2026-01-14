
import React, { useState, useMemo } from 'react';
import { Search, Plus, Truck, RotateCcw, RefreshCw, DollarSign, Edit, Filter, FileCheck, LayoutDashboard, ClipboardList, Menu, CheckCircle, XCircle, Clock, ChevronRight, FileText, Banknote, ScrollText, QrCode, Archive, Box, Home, TrendingUp, Download, RefreshCcw, Layers, ShoppingBag, Smartphone, Clipboard, Barcode, Receipt, AlertCircle, Edit2, LogOut, PackageCheck, User } from 'lucide-react';
import { MOCK_ORDERS, MOCK_CONTRACTS, MOCK_WAREHOUSES } from './constants';
import { Order, OrderStatus, FilterState, Contract, RecordType, VehicleStatus, StockRecord } from './types';
import { StatusBadge } from './components/StatusBadge';
import { NewOrderModal, PriceModal, ActionModal, AuditModal, InvoiceModal } from './components/Modals';
import { OrderDetails } from './components/OrderDetails';
import { PriceManagement } from './components/PriceManagement';
import { ContractManagement } from './components/ContractManagement';
import { CodingManagement } from './components/CodingManagement';
import { ProductionCodeManagement } from './components/ProductionCodeManagement';
import { WarehouseManagement } from './components/WarehouseManagement';
import { WarehouseOverview } from './components/WarehouseOverview';
import { WarehouseOperations } from './components/WarehouseOperations';
import { Dashboard } from './components/Dashboard';
import { StatisticsAnalysis } from './components/StatisticsAnalysis';
import { AppSimulation } from './components/AppSimulation';

export default function App() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [currentView, setCurrentView] = useState<'dashboard' | 'orders' | 'purchase_orders' | 'approvals' | 'prices' | 'contracts' | 'coding' | 'production_codes' | 'warehouse_mgt' | 'warehouse_view' | 'warehouse_ops' | 'statistics' | 'app_simulation'>('dashboard');
  
  const [productionRecords, setProductionRecords] = useState<StockRecord[]>([
      { id: 'rec-mock-001', date: '2023-10-30 08:00:00', type: 'in', product: '萤石', qty: 32.5, unit: '吨', ref: 'PUR-20231030-001', plate: '蒙K88776', materialType: 'semi', customer: '金石资源', operator: '张三' },
      { id: 'rec-mock-002', date: '2023-10-30 09:30:00', type: 'dispatch', product: '湿法氟化铝', qty: 30.0, unit: '吨', ref: 'ORD-20231029-008', plate: '冀B99999', materialType: 'finished', customer: '建设路桥', operator: '李四' }
  ]);

  // Approval Center State
  const [approvalTab, setApprovalTab] = useState<'todo' | 'done'>('todo');
  const [approvalHistory, setApprovalHistory] = useState<any[]>([
      { id: 'hist-1', type: 'financial', title: '订单财务审核', subTitle: '历史订单-001', status: 'approved', time: '2023-10-28 10:00:00', operator: 'Admin User' }
  ]);
  const [gateApprovedIds, setGateApprovedIds] = useState<Set<string>>(new Set()); // To track released vehicles locally

  const [orderTab, setOrderTab] = useState<'main' | 'byproduct'>('main');
  const [filters, setFilters] = useState<FilterState>({ orderId: '', customerName: '', contractId: '', shipDate: '', status: '', plateNumber: '', productType: '', isPriceAdjusted: '' });
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (currentView === 'orders' && (order.type !== 'sales' || order.category !== orderTab)) return false;
      if (currentView === 'purchase_orders' && order.type !== 'purchase') return false;
      const matchesSearch = order.id.toLowerCase().includes(filters.orderId.toLowerCase()) && order.customerName.includes(filters.customerName) && order.contractId.toLowerCase().includes(filters.contractId.toLowerCase()) && (filters.shipDate === '' || order.shipDate === filters.shipDate) && (filters.status === '' || order.status === filters.status) && (filters.productType === '' || order.productName.includes(filters.productType));
      const matchesPriceAdj = filters.isPriceAdjusted === '' || (filters.isPriceAdjusted === 'true' ? order.isPriceAdjusted === true : order.isPriceAdjusted !== true);
      const matchesPlate = filters.plateNumber === '' || (order.vehicles || []).some(v => v.plateNumber.includes(filters.plateNumber));
      return matchesSearch && matchesPlate && matchesPriceAdj;
    });
  }, [orders, filters, orderTab, currentView]);

  const byProductStats = useMemo(() => {
     if (orderTab !== 'byproduct') return { trucks: 0, tons: 0, breakdown: { '氟石膏': 0, '废料': 0 } };
     const relevantOrders = orders.filter(o => o.type === 'sales' && o.category === 'byproduct');
     const activeVehicles = relevantOrders.flatMap(o => (o.vehicles || []).filter(v => v.actualOutWeight && v.actualOutWeight > 0));
     const totalTons = activeVehicles.reduce((sum, v) => sum + (v.actualOutWeight || 0), 0);
     const breakdown = {
       '氟石膏': activeVehicles.filter(v => { const ord = orders.find(o => o.vehicles.some(x => x.id === v.id)); return ord?.productName.includes('氟石膏'); }).reduce((sum, v) => sum + (v.actualOutWeight || 0), 0),
       '废料': activeVehicles.filter(v => { const ord = orders.find(o => o.vehicles.some(x => x.id === v.id)); return ord?.productName.includes('废料'); }).reduce((sum, v) => sum + (v.actualOutWeight || 0), 0),
     };
     return { trucks: activeVehicles.length, tons: totalTons.toFixed(2), breakdown };
  }, [orders, orderTab]);

  const purchaseStats = useMemo(() => {
     const purchaseOrders = orders.filter(o => o.type === 'purchase');
     const activeVehicles = purchaseOrders.flatMap(o => (o.vehicles || []).filter(v => v.status !== VehicleStatus.PendingEntry));
     const sumWeight = (vehs: any[]) => vehs.reduce((sum, v) => sum + (v.actualOutWeight || v.loadWeight || 0), 0);
     return {
        vehicles: activeVehicles.length,
        fluorite: sumWeight(activeVehicles.filter(v => orders.find(o => o.vehicles.includes(v))?.productName.includes('萤石'))),
        sulfuric: sumWeight(activeVehicles.filter(v => orders.find(o => o.vehicles.includes(v))?.productName.includes('硫酸'))),
        hydroxide: sumWeight(activeVehicles.filter(v => orders.find(o => o.vehicles.includes(v))?.productName.includes('氢氧化铝'))),
     };
  }, [orders]);

  const pendingTasks = useMemo(() => {
    return orders.filter(o => o.status === OrderStatus.PendingAudit || o.status === OrderStatus.PriceApproval);
  }, [orders]);

  // Gate Pass Records (View: approvals -> gate)
  const gatePassRecords = useMemo(() => {
      const records: any[] = [];
      orders.forEach(o => {
          (o.vehicles || []).forEach(v => {
              if (v.status === VehicleStatus.Exited && !gateApprovedIds.has(v.id)) {
                  records.push({
                      id: v.id,
                      orderId: o.id,
                      customerName: o.customerName,
                      exitTime: v.exitTime,
                      batchNo: v.batchNumber || (v.batchDetails?.[0]?.batchNo || '-'),
                      materialType: o.productName.includes('半成品') ? '半成品' : '成品', // Logic guess
                      weighing1: v.weighing1?.weight,
                      weighing2: v.weighing2?.weight,
                      actualWeight: v.actualOutWeight,
                      plate: v.plateNumber,
                      driver: v.driverName
                  });
              }
          });
      });
      return records.sort((a,b) => (b.exitTime || '').localeCompare(a.exitTime || ''));
  }, [orders, gateApprovedIds]);

  // --- Unified Approval Items ---
  const todoItems = useMemo(() => {
    const items: any[] = [];

    // 1. Order Approvals
    pendingTasks.forEach(task => {
        items.push({
            id: task.id,
            type: task.status === OrderStatus.PriceApproval ? 'price' : 'financial',
            title: task.status === OrderStatus.PriceApproval ? '价格调整审批' : '订单财务审核',
            subTitle: `${task.customerName} - ${task.productName}`,
            time: task.history[0]?.date,
            data: task,
            details: {
                qty: `${task.quantity} ${task.unit||'吨'}`,
                amount: `¥${(task.quantity * task.unitPrice).toLocaleString()}`,
                priceChange: task.pendingPrice ? `¥${task.unitPrice} -> ¥${task.pendingPrice}` : null
            }
        });
    });

    // 2. Stock Approvals
    productionRecords.forEach(rec => {
        items.push({
            id: rec.id,
            type: 'stock',
            title: '出入库审批',
            subTitle: `${rec.type === 'in' ? '入库' : '出库'}申请 - ${rec.product}`,
            time: rec.date,
            data: rec,
            details: {
                qty: `${rec.type === 'in' ? '+' : '-'}${rec.qty} ${rec.unit||'吨'}`,
                ref: rec.ref,
                operator: rec.operator
            }
        });
    });

    // 3. Gate Approvals
    gatePassRecords.forEach(gate => {
        items.push({
            id: `gate-${gate.id}`,
            type: 'gate',
            title: '货物出厂放行',
            subTitle: `${gate.plate} - ${gate.customerName}`,
            time: gate.exitTime,
            data: gate,
            details: {
                weight: `净重: ${gate.actualWeight} 吨`,
                driver: gate.driver,
                batch: gate.batchNo
            }
        });
    });

    return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [pendingTasks, productionRecords, gatePassRecords]);


  const handleOpenModal = (type: string, order?: Order) => {
    if (order) setSelectedOrder(order); else setSelectedOrder(null);
    setActiveModal(type);
  };
  const handleCloseModal = () => { setActiveModal(null); setSelectedOrder(null); };
  
  const handleSaveOrder = (updatedOrder: Order) => {
    setOrders(prevOrders => {
       const exists = prevOrders.find(o => o.id === updatedOrder.id);
       if (exists) return prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
       else return [updatedOrder, ...prevOrders];
    });
    handleCloseModal();
  };
  const handleInvoice = (weight: number) => {
     if (selectedOrder) {
        const updatedOrder = { ...selectedOrder, status: OrderStatus.Invoiced, settlementWeight: weight, history: [{ date: new Date().toLocaleString('zh-CN', { hour12: false }), action: `开票完成: ${weight}${selectedOrder.unit}`, user: '当前用户' }, ...selectedOrder.history] };
        handleSaveOrder(updatedOrder);
     }
  };
  const handleExport = (order?: Order) => { alert(`正在导出数据...`); };
  const handleSaveProduction = (records: StockRecord[]) => { setProductionRecords(prev => [...records, ...prev]); };
  const handleGenerateOrder = (contract: Contract) => {
    if (confirm(`确认根据合同 ${contract.contractNumber} 生成订单吗？`)) {
        const newOrder: Order = { id: `ORD-${Date.now()}`, type: contract.type === '采购合同' ? 'purchase' : 'sales', contractId: contract.contractNumber, customerName: contract.customerName, productName: contract.productName, category: 'main', spec: contract.spec, quantity: contract.quantity, unitPrice: 0, shipDate: contract.deliveryTime, status: contract.type === '采购合同' ? OrderStatus.Receiving : OrderStatus.PendingAudit, vehicles: [], history: [{ date: new Date().toLocaleString('zh-CN', { hour12: false }), action: '从合同生成订单', user: '系统' }] };
        setOrders(prev => [newOrder, ...prev]); setCurrentView(contract.type === '采购合同' ? 'purchase_orders' : 'orders'); alert('订单已生成，请在订单列表查看。');
    }
  };
  const handleApplyPrice = (order: Order, newPrice: number, reason: string) => {
      const updatedOrder: Order = { ...order, status: OrderStatus.PriceApproval, pendingPrice: newPrice, history: [{ date: new Date().toLocaleString('zh-CN', { hour12: false }), action: `申请调价: ¥${order.unitPrice} -> ¥${newPrice} (${reason})`, user: '当前用户' }, ...order.history] };
      handleSaveOrder(updatedOrder); alert('调价申请已提交，等待审批。');
  };
  
  // Unified Approval Handlers
  const addToHistory = (item: any, status: 'approved' | 'rejected', remark: string = '') => {
      const historyItem = {
          id: `hist-${Date.now()}`,
          type: item.type,
          title: item.title,
          subTitle: item.subTitle,
          status,
          time: new Date().toLocaleString('zh-CN', { hour12: false }),
          operator: 'Admin User',
          remark
      };
      setApprovalHistory(prev => [historyItem, ...prev]);
  };

  const handleApprove = (order: Order) => {
      let actionText = ''; let confirmText = ''; let changes = {};
      const isPrice = order.status === OrderStatus.PriceApproval;
      
      if (order.status === OrderStatus.PendingAudit) { confirmText = `确认通过订单 ${order.id} 的财务审核吗？`; actionText = '财务审核通过'; changes = { status: OrderStatus.Unassigned }; }
      else if (order.status === OrderStatus.PriceApproval) { confirmText = `确认通过订单 ${order.id} 的调价审批吗？`; actionText = `调价审批通过: 价格更新为 ¥${order.pendingPrice}`; changes = { status: OrderStatus.Unassigned, unitPrice: order.pendingPrice, pendingPrice: undefined, isPriceAdjusted: true }; }
      
      if (confirm(confirmText)) {
        const updatedOrder: Order = { ...order, ...changes, history: [{ date: new Date().toLocaleString('zh-CN', { hour12: false }), action: actionText, user: '当前用户' }, ...order.history] };
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        
        // Add to history
        addToHistory({
            type: isPrice ? 'price' : 'financial',
            title: isPrice ? '价格调整审批' : '订单财务审核',
            subTitle: `${order.customerName} - ${order.productName}`
        }, 'approved');

        if(activeModal === 'price') handleCloseModal();
      }
  };
  
  const handleReject = (order: Order) => {
    const reason = prompt("请输入驳回原因:");
    if (reason) { 
        alert("已驳回 (Demo)");
        // Add to history
        addToHistory({
            type: order.status === OrderStatus.PriceApproval ? 'price' : 'financial',
            title: order.status === OrderStatus.PriceApproval ? '价格调整审批' : '订单财务审核',
            subTitle: `${order.customerName} - ${order.productName}`
        }, 'rejected', reason);
        if(activeModal === 'price') handleCloseModal(); 
    }
  };

  const handleStockApprove = (recordId: string, record: StockRecord) => {
      if(confirm('确认通过此出入库申请？')) {
          setProductionRecords(prev => prev.filter(r => r.id !== recordId));
          addToHistory({
              type: 'stock',
              title: '出入库审批',
              subTitle: `${record.type === 'in' ? '入库' : '出库'}申请 - ${record.product}`
          }, 'approved');
      }
  };
  const handleStockReject = (recordId: string, record: StockRecord) => {
      if(confirm('确认驳回此出入库申请？')) {
          setProductionRecords(prev => prev.filter(r => r.id !== recordId));
          addToHistory({
              type: 'stock',
              title: '出入库审批',
              subTitle: `${record.type === 'in' ? '入库' : '出库'}申请 - ${record.product}`
          }, 'rejected', '驳回');
      }
  };

  const handleGateApprove = (gate: any) => {
      if(confirm(`确认放行车辆 ${gate.plate} ?`)) {
          setGateApprovedIds(prev => new Set(prev).add(gate.id));
          addToHistory({
              type: 'gate',
              title: '货物出厂放行',
              subTitle: `${gate.plate} - ${gate.customerName}`
          }, 'approved');
      }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col shadow-xl z-20 overflow-y-auto">
         <div className="h-16 flex items-center gap-3 px-6 bg-slate-950 shadow-sm flex-shrink-0 sticky top-0 z-10"><div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-900/50"><Truck size={20} /></div><h1 className="text-lg font-bold tracking-wide text-gray-100">南韩化工厂</h1></div>
         <nav className="flex-1 py-6 px-3 space-y-1.5">
            <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}> <Home size={20} className={currentView === 'dashboard' ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> 工作台 </button>
            <button onClick={() => setCurrentView('statistics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'statistics' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}> <TrendingUp size={20} className={currentView === 'statistics' ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> 统计分析 </button>
            <button onClick={() => setCurrentView('app_simulation')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'app_simulation' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}> <Smartphone size={20} className={currentView === 'app_simulation' ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> APP 模拟页面 </button>
            <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">业务管理</div>
            <button onClick={() => setCurrentView('contracts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'contracts' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}> <ScrollText size={20} className={currentView === 'contracts' ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> 合同管理 </button>
            <button onClick={() => setCurrentView('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}> <LayoutDashboard size={20} className={currentView === 'orders' ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> 销售订单 </button>
            <button onClick={() => setCurrentView('purchase_orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'purchase_orders' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}> <ShoppingBag size={20} className={currentView === 'purchase_orders' ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> 采购订单 </button>
            <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">仓储与产品</div>
            <button onClick={() => setCurrentView('warehouse_view')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'warehouse_view' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}> <Box size={20} className={currentView === 'warehouse_view' ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> 仓库概览 </button>
            <button onClick={() => setCurrentView('warehouse_ops')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'warehouse_ops' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}> <ClipboardList size={20} className={currentView === 'warehouse_ops' ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> 库存作业 </button>
            <button onClick={() => setCurrentView('warehouse_mgt')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'warehouse_mgt' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}> <Archive size={20} className={currentView === 'warehouse_mgt' ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> 仓库管理 </button>
            <button onClick={() => setCurrentView('production_codes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'production_codes' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}> <Barcode size={20} className={currentView === 'production_codes' ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> 生产编码 </button>
            <button onClick={() => setCurrentView('coding')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'coding' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}> <QrCode size={20} className={currentView === 'coding' ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> 编码规则 </button>
            <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">财务与审批</div>
            <button onClick={() => setCurrentView('approvals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'approvals' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}> <div className="relative"> <FileCheck size={20} className={currentView === 'approvals' ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> {todoItems.length > 0 && ( <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3"> <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span> <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-slate-900"></span> </span> )} </div> 审批中心 {todoItems.length > 0 && ( <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{todoItems.length}</span> )} </button>
            <button onClick={() => setCurrentView('prices')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${currentView === 'prices' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}> <Banknote size={20} className={currentView === 'prices' ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> 价格管理 </button>
         </nav>
         <div className="p-4 border-t border-slate-800 bg-slate-950/30 sticky bottom-0"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold shadow-lg">JD</div><div className="text-sm"><div className="font-medium text-gray-200">Admin User</div><div className="text-xs text-slate-500">物流主管</div></div></div></div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200 md:hidden h-16 flex items-center px-4 justify-between sticky top-0 z-20"><div className="flex items-center gap-2"><Truck className="text-blue-600" /><span className="font-bold">南韩化工厂</span></div><Menu className="text-gray-500" /></header>
        <main className="flex-1 overflow-auto p-4 sm:p-8">
           {currentView === 'dashboard' && <Dashboard orders={orders} contracts={MOCK_CONTRACTS} warehouses={MOCK_WAREHOUSES} onNavigate={(view) => setCurrentView(view as any)} onOpenModal={handleOpenModal}/>}
           {currentView === 'statistics' && <StatisticsAnalysis />}
           {currentView === 'contracts' && <ContractManagement onGenerateOrder={handleGenerateOrder} />}
           {currentView === 'coding' && <CodingManagement />}
           {currentView === 'production_codes' && <ProductionCodeManagement />}
           {currentView === 'warehouse_mgt' && <WarehouseManagement />}
           {currentView === 'warehouse_view' && <WarehouseOverview extraRecords={productionRecords} />}
           {currentView === 'warehouse_ops' && <WarehouseOperations onSaveRecord={handleSaveProduction} />}
           {/* Fix: Pass production records and gate records to AppSimulation for consistent approval view */}
           {currentView === 'app_simulation' && (
             <AppSimulation 
                onSaveProduction={handleSaveProduction} 
                pendingTasks={pendingTasks}
                stockRecords={productionRecords}
                gateRecords={gatePassRecords}
                onApprove={handleApprove} 
                onReject={handleReject}
             />
           )}
           {currentView === 'prices' && <PriceManagement />}

           {/* VIEW: ORDER MANAGEMENT */}
           {currentView === 'orders' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* ... (Orders View Code - Unchanged) ... */}
               <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">销售订单管理</h2>
                    <div className="flex space-x-1 mt-2 bg-gray-200 p-1 rounded-lg inline-flex">
                       <button onClick={() => setOrderTab('main')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${orderTab === 'main' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}> 主产品订单 (氟化铝) </button>
                       <button onClick={() => setOrderTab('byproduct')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${orderTab === 'byproduct' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}> 副产品订单 </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     {orderTab === 'main' && <button onClick={() => handleOpenModal('new')} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium hover:shadow-md"> <Plus size={18} /> 新增订单 </button>}
                     <button onClick={() => handleExport()} className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium"> <Download size={18} /> 批量导出 </button>
                  </div>
               </div>
               {orderTab === 'main' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                     {[{ label: '待审核', count: orders.filter(o => o.type === 'sales' && o.category === 'main' && o.status === OrderStatus.PendingAudit).length, color: 'text-purple-600', border: 'border-l-4 border-purple-500' },
                       { label: '待发货', count: orders.filter(o => o.type === 'sales' && o.category === 'main' && o.status === OrderStatus.ReadyToShip).length, color: 'text-blue-600', border: 'border-l-4 border-blue-500' },
                       { label: '进行中', count: orders.filter(o => o.type === 'sales' && o.category === 'main' && o.status === OrderStatus.Shipping).length, color: 'text-indigo-600', border: 'border-l-4 border-indigo-500' },
                       { label: '异常/退换', count: orders.filter(o => o.type === 'sales' && o.category === 'main' && (o.status === OrderStatus.Returning || o.status === OrderStatus.Exchanging)).length, color: 'text-red-600', border: 'border-l-4 border-red-500' },
                     ].map((stat, i) => (<div key={i} className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 ${stat.border}`}><span className="text-gray-400 text-xs uppercase font-bold tracking-wider">{stat.label}</span><span className={`block text-3xl font-bold ${stat.color} mt-1`}>{stat.count}</span></div>))}
                  </div>
               )}
               {orderTab === 'byproduct' && (
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
                     <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-blue-500"><span className="text-gray-400 text-xs uppercase font-bold tracking-wider">发货车辆 (辆数)</span><div className="flex items-end gap-2 mt-1"><span className="text-3xl font-bold text-blue-600">{byProductStats.trucks}</span><span className="text-sm text-gray-500 mb-1">车次</span></div></div>
                     <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-green-500"><span className="text-gray-400 text-xs uppercase font-bold tracking-wider">产品重量 (吨数)</span><div className="flex items-end gap-2 mt-1"><span className="text-3xl font-bold text-green-600">{byProductStats.tons}</span><span className="text-sm text-gray-500 mb-1">吨</span></div><div className="mt-2 text-xs text-gray-500 flex gap-2"><span className="bg-gray-100 px-1 rounded">氟石膏: {byProductStats.breakdown['氟石膏'].toFixed(1)}T</span><span className="bg-gray-100 px-1 rounded">废料: {byProductStats.breakdown['废料'].toFixed(1)}T</span></div></div>
                  </div>
               )}
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <input type="text" placeholder="客户名称" className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={filters.customerName} onChange={e => setFilters({...filters, customerName: e.target.value})} />
                    <input type="text" placeholder="车牌号检索" className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={filters.plateNumber} onChange={e => setFilters({...filters, plateNumber: e.target.value})} />
                    <input type="text" placeholder="产品类型" className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={filters.productType} onChange={e => setFilters({...filters, productType: e.target.value})} />
                    <select className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={filters.isPriceAdjusted} onChange={e => setFilters({...filters, isPriceAdjusted: e.target.value})}>
                        <option value="">是否调价 (全部)</option>
                        <option value="true">是 (已调价)</option>
                        <option value="false">否 (正常)</option>
                    </select>
                    {orderTab === 'main' && (<div className="relative"><input type="text" placeholder="订单编号" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={filters.orderId} onChange={e => setFilters({...filters, orderId: e.target.value})} /><Search size={16} className="absolute left-3 top-3 text-gray-400" /></div>)}
                    <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-all" onClick={() => setFilters({ orderId: '', customerName: '', contractId: '', shipDate: '', status: '', plateNumber: '', productType: '', isPriceAdjusted: '' })}> <Filter size={16} /> 重置筛选 </button>
                  </div>
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">订单编号</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">客户信息</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">货物详情</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">重量规格 / 单价</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">备注</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map((order) => (
                            <tr key={order.id} className={`hover:bg-blue-50/30 transition-colors group ${order.isPriceAdjusted ? 'bg-yellow-50/30' : ''}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{order.id} {order.isPriceAdjusted && <div className="text-[10px] text-yellow-600 mt-0.5 font-normal">已调价</div>}</td>
                              <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={order.status} /></td>
                              <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 font-medium">{order.customerName}</div>{order.category === 'main' && <div className="text-xs text-gray-400">{order.contractId}</div>}</td>
                              <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{order.productName}</div><div className="text-xs text-gray-500 bg-gray-100 inline-block px-1.5 rounded mt-0.5">{order.spec}</div></td>
                              <td className="px-6 py-4 whitespace-nowrap text-right"><div className="text-sm font-bold text-gray-900">{order.quantity} T</div><div className={`text-xs ${order.isPriceAdjusted ? 'text-yellow-600 font-bold' : 'text-gray-500'}`}>¥{order.unitPrice}/T</div></td>
                              <td className="px-6 py-4 text-xs text-gray-500 max-w-[150px] truncate" title={order.remark}>{order.remark || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                   {(order.category === 'main') && (<button onClick={() => handleOpenModal('ship', order)} title="出货/查看车辆流程" disabled={order.status === OrderStatus.PendingAudit || order.status === OrderStatus.Invoiced || order.status === OrderStatus.PriceApproval} className={`p-1.5 rounded-md transition-colors ${order.status === OrderStatus.PendingAudit || order.status === OrderStatus.PriceApproval ? 'text-gray-200' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}><Truck size={18} /></button>)}
                                   <button onClick={() => handleOpenModal('return', order)} title="退货登记" className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"><RotateCcw size={18} /></button>
                                   <button onClick={() => handleOpenModal('exchange', order)} title="换货登记" className="p-1.5 rounded-md text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"><RefreshCw size={18} /></button>
                                   <button onClick={() => handleOpenModal('price', order)} title="申请调价/详情" className={`p-1.5 rounded-md transition-colors ${order.isPriceAdjusted ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50'}`}><DollarSign size={18} /></button>
                                   <button onClick={() => handleOpenModal('invoice', order)} title="开票" className="p-1.5 rounded-md text-gray-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"><Receipt size={18} /></button>
                                   <div className="w-px h-5 bg-gray-200 mx-1 self-center"></div>
                                   {order.category === 'main' && (<button onClick={() => handleOpenModal('edit_order', order)} title="编辑订单" className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 size={18} /></button>)}
                                   <button onClick={() => handleOpenModal('detail', order)} title="查看详情" className="p-1.5 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"><FileText size={18} /></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">未找到符合条件的订单</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
             </div>
           )}

           {/* Purchase Orders View - RESTORED */}
           {currentView === 'purchase_orders' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <div><h2 className="text-2xl font-bold text-gray-800 tracking-tight">采购订单管理</h2><p className="text-sm text-gray-500 mt-1">管理萤石、硫酸等原料的采购入库及车辆调度</p></div>
                  <button onClick={() => handleExport()} className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium"> <Download size={18} /> 批量导出 </button>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                   <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-blue-500">
                      <div className="text-gray-400 text-xs uppercase font-bold tracking-wider">发货车辆 (辆)</div>
                      <div className="text-3xl font-bold text-blue-600 mt-1">{purchaseStats.vehicles}</div>
                   </div>
                   <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-indigo-500"> <div className="text-gray-400 text-xs uppercase font-bold tracking-wider">萤石 (吨)</div> <div className="text-3xl font-bold text-indigo-600 mt-1">{purchaseStats.fluorite.toFixed(1)}</div> </div>
                   <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-orange-500"> <div className="text-gray-400 text-xs uppercase font-bold tracking-wider">硫酸 (吨)</div> <div className="text-3xl font-bold text-orange-600 mt-1">{purchaseStats.sulfuric.toFixed(1)}</div> </div>
                   <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-teal-500"> <div className="text-gray-400 text-xs uppercase font-bold tracking-wider">氢氧化铝 (吨)</div> <div className="text-3xl font-bold text-teal-600 mt-1">{purchaseStats.hydroxide.toFixed(1)}</div> </div>
                </div>
                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">订单编号</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">供应商</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">货物详情</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">重量规格</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{order.id}</td>
                              <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={order.status} /></td>
                              <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 font-medium">{order.customerName}</div></td>
                              <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{order.productName}</div><div className="text-xs text-gray-500 bg-gray-100 inline-block px-1.5 rounded mt-0.5">{order.spec}</div></td>
                              <td className="px-6 py-4 whitespace-nowrap text-right"><div className="text-sm font-bold text-gray-900">{order.quantity} {order.unit||'吨'}</div></td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => handleOpenModal('detail', order)} title="查看详情" className="flex items-center gap-1 p-1.5 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"><FileText size={16} /> <span className="text-xs font-bold">查看详情</span></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">未找到符合条件的采购订单</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
             </div>
           )}

           {/* UNIFIED APPROVAL CENTER */}
           {currentView === 'approvals' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center mb-4">
                   <div>
                     <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">审批中心 {todoItems.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{todoItems.length}</span>}</h2>
                     <p className="text-sm text-gray-500 mt-1">集中处理财务、库存及门岗相关的所有待办审批事项。</p>
                   </div>
                </div>

                {/* Main Tabs */}
                <div className="flex bg-white rounded-xl shadow-sm p-1 w-fit mb-4">
                    <button onClick={() => setApprovalTab('todo')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${approvalTab === 'todo' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
                        我的待办 ({todoItems.length})
                    </button>
                    <button onClick={() => setApprovalTab('done')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${approvalTab === 'done' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
                        我的已办
                    </button>
                </div>

                <div className="space-y-4">
                    {approvalTab === 'todo' ? (
                        todoItems.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                                <CheckCircle className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                                <h3 className="text-lg font-medium text-gray-500">暂无待办事项</h3>
                                <p className="text-sm text-gray-400">所有审批任务已处理完毕</p>
                            </div>
                        ) : (
                            todoItems.map((item: any) => (
                                <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow">
                                    {/* Icon Column */}
                                    <div className="flex-shrink-0">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            item.type === 'price' ? 'bg-yellow-100 text-yellow-600' :
                                            item.type === 'financial' ? 'bg-purple-100 text-purple-600' :
                                            item.type === 'gate' ? 'bg-green-100 text-green-600' :
                                            'bg-orange-100 text-orange-600' // stock
                                        }`}>
                                            {item.type === 'price' ? <DollarSign size={24}/> :
                                             item.type === 'financial' ? <FileText size={24}/> :
                                             item.type === 'gate' ? <LogOut size={24}/> :
                                             <Archive size={24}/>}
                                        </div>
                                    </div>

                                    {/* Content Column */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-base font-bold text-gray-800">{item.title}</h4>
                                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded flex items-center gap-1">
                                                <Clock size={12}/> {item.time}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium text-gray-600 mb-3">{item.subTitle}</div>
                                        
                                        {/* Dynamic Details based on Type */}
                                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 grid grid-cols-2 gap-y-2 gap-x-4">
                                            {item.type === 'stock' && (
                                                <>
                                                    <div><span className="text-gray-400">操作类型:</span> {item.data.type === 'in' ? '入库' : '出库'}</div>
                                                    <div><span className="text-gray-400">数量:</span> <span className="font-bold text-gray-800">{item.details.qty}</span></div>
                                                    <div><span className="text-gray-400">关联单据:</span> {item.details.ref}</div>
                                                    <div><span className="text-gray-400">申请人:</span> {item.details.operator}</div>
                                                </>
                                            )}
                                            {item.type === 'gate' && (
                                                <>
                                                    <div><span className="text-gray-400">车辆:</span> {item.data.plate}</div>
                                                    <div><span className="text-gray-400">司机:</span> {item.details.driver}</div>
                                                    <div><span className="text-gray-400">批次:</span> {item.details.batch}</div>
                                                    <div><span className="text-gray-400">实重:</span> <span className="font-bold text-gray-800">{item.details.weight}</span></div>
                                                </>
                                            )}
                                            {(item.type === 'price' || item.type === 'financial') && (
                                                <>
                                                    <div><span className="text-gray-400">订单量:</span> {item.details.qty}</div>
                                                    <div><span className="text-gray-400">总金额:</span> {item.details.amount}</div>
                                                    {item.details.priceChange && (
                                                        <div className="col-span-2 text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                                            <span className="font-bold">价格变更申请:</span> {item.details.priceChange}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Column */}
                                    <div className="flex md:flex-col justify-center gap-2 md:w-32 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
                                        {item.type === 'gate' ? (
                                            <button onClick={() => handleGateApprove(item.data)} className="w-full py-2 bg-green-600 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
                                                <LogOut size={16}/> 放行
                                            </button>
                                        ) : (
                                            <>
                                                <button onClick={() => item.type === 'stock' ? handleStockApprove(item.id, item.data) : handleApprove(item.data)} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-blue-700 transition-colors">
                                                    通过
                                                </button>
                                                <button onClick={() => item.type === 'stock' ? handleStockReject(item.id, item.data) : handleReject(item.data)} className="w-full py-2 bg-white border border-red-200 text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors">
                                                    驳回
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        // DONE TAB
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {approvalHistory.length === 0 ? <div className="p-12 text-center text-gray-400">暂无历史记录</div> : (
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">审批类型</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">摘要</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">结果</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">时间</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">备注</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {approvalHistory.map((hist, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-3 text-sm font-bold text-gray-700">{hist.title}</td>
                                                <td className="px-6 py-3 text-sm text-gray-600">{hist.subTitle}</td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${hist.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {hist.status === 'approved' ? '已通过' : '已驳回'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-xs text-gray-500">{hist.time}</td>
                                                <td className="px-6 py-3 text-right text-xs text-gray-400">{hist.remark || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
             </div>
           )}

           <NewOrderModal isOpen={activeModal === 'new' || activeModal === 'edit_order'} onClose={handleCloseModal} onSave={handleSaveOrder} order={activeModal === 'edit_order' ? selectedOrder : null} />
           <PriceModal isOpen={activeModal === 'price'} onClose={handleCloseModal} order={selectedOrder} onApprove={handleApprove} onReject={handleReject} onApply={handleApplyPrice} />
           <ActionModal isOpen={activeModal === 'ship' || activeModal === 'return' || activeModal === 'exchange'} onClose={handleCloseModal} onSave={handleSaveOrder} type={activeModal === 'ship' ? 'ship' : activeModal === 'return' ? 'return' : 'exchange'} order={selectedOrder} />
           <AuditModal isOpen={activeModal === 'audit'} onClose={handleCloseModal} onApprove={() => selectedOrder && handleApprove(selectedOrder)} order={selectedOrder} />
           <InvoiceModal isOpen={activeModal === 'invoice'} onClose={handleCloseModal} onSave={handleInvoice} order={selectedOrder} />
           <OrderDetails order={selectedOrder} isOpen={activeModal === 'detail'} onClose={handleCloseModal} />
        </main>
      </div>
    </div>
  );
}
