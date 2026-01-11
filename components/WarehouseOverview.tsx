
import React, { useState, useMemo, useEffect } from 'react';
import { Warehouse, WarehouseZone, ContractType, StockRecord } from '../types';
import { MOCK_WAREHOUSES, MOCK_ORDERS, MOCK_CONTRACTS, MOCK_VEHICLE_POOL } from '../constants';
import { Package, QrCode, Box, ChevronRight, ChevronDown, List, ArrowUpCircle, ArrowDownCircle, Search, Smartphone, Printer, RefreshCw, ClipboardCheck, ScanLine, Truck, Layers, ArrowRight, X, CheckCircle, AlertTriangle, Calendar, Filter } from 'lucide-react';

interface WarehouseOverviewProps {
  extraRecords?: StockRecord[];
}

export const WarehouseOverview: React.FC<WarehouseOverviewProps> = ({ extraRecords = [] }) => {
  // Initialize State with Mocks
  const [warehouses, setWarehouses] = useState<Warehouse[]>(MOCK_WAREHOUSES);
  const [expandedWh, setExpandedWh] = useState<string | null>(MOCK_WAREHOUSES[0]?.id || null);
  const [detailTab, setDetailTab] = useState<'inventory' | 'records'>('inventory');
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // PDA State
  const [isPdaOpen, setIsPdaOpen] = useState(false);
  const [pdaMode, setPdaMode] = useState<'gen' | 'in' | 'out' | 'transfer' | 'count'>('gen');
  
  // Local Records State (Initialized with Mock derived data, but allows adding new PDA records)
  const [localRecords, setLocalRecords] = useState<StockRecord[]>([]);

  // Transfer State
  const [transferStep, setTransferStep] = useState<'scan' | 'confirm'>('scan');
  const [scannedSource, setScannedSource] = useState<{
     warehouseId: string;
     warehouseName: string;
     zoneId: string;
     zoneName: string;
     product: string;
     currentQty: number;
     barcode: string;
  } | null>(null);

  // Initialize records once on mount + merge with extraRecords
  useEffect(() => {
    const derivedRecords: StockRecord[] = [];
    // 1. Outbound (Orders)
    MOCK_ORDERS.forEach(o => {
        o.vehicles.forEach((v, idx) => {
           if (v.actualOutWeight || v.loadWeight) {
              derivedRecords.push({
                 id: `${o.id}-v${idx}`,
                 date: v.exitTime || o.shipDate + ' 12:00',
                 type: 'out',
                 product: o.productName,
                 qty: v.actualOutWeight || v.loadWeight,
                 ref: o.id,
                 plate: v.plateNumber,
                 materialType: 'finished'
              });
           }
        });
    });
    // 2. Inbound (Contracts)
    MOCK_CONTRACTS.filter(c => c.type === ContractType.Purchase).forEach((c) => {
         derivedRecords.push({
             id: `in-${c.id}`,
             date: c.signDate + ' 09:30',
             type: 'in',
             product: c.productName,
             qty: 35,
             ref: c.contractNumber,
             plate: '-', 
             materialType: 'semi' 
         });
    });
    
    // Merge existing local (PDA) + derived + extra (Production)
    setLocalRecords(prev => {
       // Filter out previous derived to avoid duplicates if re-running
       const pdaOnly = prev.filter(r => r.id.startsWith('pda-'));
       return [...pdaOnly, ...derivedRecords, ...extraRecords].sort((a, b) => b.date.localeCompare(a.date));
    });
  }, [extraRecords]); // Re-run when extraRecords changes

  // Filter records & Stats
  const { displayedRecords, stats } = useMemo(() => {
     let recs = [...localRecords];
     
     // 1. Filter by Warehouse context (if expanded)
     if (expandedWh) {
        const wh = warehouses.find(w => w.id === expandedWh);
        if (wh) {
            recs = recs.filter(r => {
                if (wh.type === '原料仓') return ['萤石', '煤炭', '原矿', '硫酸'].some(p => r.product.includes(p));
                if (wh.type === '成品仓') return ['氟化铝', '氧化铝'].some(p => r.product.includes(p));
                if (wh.type === '半成品仓') return ['氢氧化铝', '半成品'].some(p => r.product.includes(p));
                return true; 
            });
        }
     }

     // 2. Filter by Search
     if (searchTerm) {
        recs = recs.filter(r => r.product.includes(searchTerm) || r.plate?.includes(searchTerm));
     }

     // 3. Filter by Date Range
     if (dateRange.start) {
        recs = recs.filter(r => r.date >= dateRange.start);
     }
     if (dateRange.end) {
        // Add time to end date to include the whole day
        recs = recs.filter(r => r.date <= dateRange.end + ' 23:59:59');
     }

     // Calculate Stats
     const totalIn = recs.filter(r => r.type === 'in' || (r.type === 'adjust' && r.qty > 0)).reduce((acc, r) => acc + Math.abs(r.qty), 0);
     const totalOut = recs.filter(r => r.type === 'out' || (r.type === 'adjust' && r.qty < 0)).reduce((acc, r) => acc + Math.abs(r.qty), 0);

     recs.sort((a, b) => b.date.localeCompare(a.date));
     
     return { displayedRecords: recs, stats: { totalIn, totalOut } };
  }, [expandedWh, localRecords, warehouses, searchTerm, dateRange]);


  // --- PDA Handlers ---
  const [pdaForm, setPdaForm] = useState({
     product: '湿法氟化铝',
     date: new Date().toISOString().split('T')[0],
     line: '1号产线',
     warehouseId: '',
     zoneId: '',
     targetWarehouseId: '',
     targetZoneId: '',
     weight: '',
     plate: '', 
     barcode: '',
     batchNo: '',
     adjType: 'add',
     materialType: 'finished' as 'finished' | 'semi'
  });

  const resetPdaForm = () => {
     setPdaForm(prev => ({
        ...prev,
        warehouseId: '', zoneId: '', targetWarehouseId: '', targetZoneId: '',
        weight: '', plate: '', barcode: '',
     }));
     setTransferStep('scan');
     setScannedSource(null);
  };

  const generateCode = () => {
     const code = `${pdaForm.product}-${pdaForm.date.replace(/-/g,'')}-${pdaForm.line}-${Math.floor(Math.random()*1000)}`;
     setPdaForm({...pdaForm, barcode: code});
  };

  // Transfer Step 1: Scan
  const handleTransferScan = () => {
     if (!pdaForm.barcode) return alert('请输入或扫描条码');
     
     // Mock Search
     let found: any = null;
     for (const w of warehouses) {
        for (const z of w.zones) {
           const item = z.inventory.find(i => i.barcode === pdaForm.barcode || i.productCode === pdaForm.barcode);
           if (item) {
              found = {
                 warehouseId: w.id, warehouseName: w.name,
                 zoneId: z.id, zoneName: z.name,
                 product: item.productName,
                 currentQty: item.quantity,
                 barcode: item.barcode
              };
              break;
           }
        }
        if (found) break;
     }

     if (found) {
        setScannedSource(found);
        setPdaForm(prev => ({ ...prev, product: found.product, warehouseId: found.warehouseId, zoneId: found.zoneId }));
        setTransferStep('confirm');
     } else {
        alert('未找到该条码对应的库存记录');
     }
  };

  const handlePdaSubmit = () => {
     const weightVal = parseFloat(pdaForm.weight) || 0;
     const now = new Date().toLocaleString('zh-CN', {hour12: false});
     
     if (pdaMode === 'in') {
        if (!pdaForm.warehouseId || !pdaForm.zoneId || !weightVal) return alert('请完善入库信息');
        
        // Update Inventory
        setWarehouses(prev => prev.map(w => {
           if (w.id === pdaForm.warehouseId) {
              return {
                 ...w,
                 zones: w.zones.map(z => {
                    if (z.id === pdaForm.zoneId) {
                       return {
                          ...z,
                          inventory: [...z.inventory, {
                             id: `inv-${Date.now()}`,
                             productName: pdaForm.product,
                             quantity: weightVal,
                             unit: '吨',
                             productCode: pdaForm.barcode || `AUTO-${Date.now()}`,
                             barcode: pdaForm.barcode || `AUTO-${Date.now()}`
                          }]
                       };
                    }
                    return z;
                 })
              };
           }
           return w;
        }));

        setLocalRecords(prev => [{
           id: `pda-${Date.now()}`,
           date: now,
           type: 'in',
           product: pdaForm.product,
           qty: weightVal,
           ref: 'PDA成品入库',
           plate: '-', 
           materialType: 'finished'
        }, ...prev]);
        
        alert('入库成功');
        resetPdaForm();
     }

     if (pdaMode === 'out') {
        if (!pdaForm.barcode || !weightVal) return alert('请完善出库信息');
        if (pdaForm.materialType === 'finished' && !pdaForm.plate) return alert('成品出库必须选择车牌号');
        
        // Find and Reduce Inventory
        let found = false;
        setWarehouses(prev => prev.map(w => ({
           ...w,
           zones: w.zones.map(z => ({
              ...z,
              inventory: z.inventory.map(i => {
                 if (!found && (i.barcode === pdaForm.barcode || i.productName === pdaForm.product)) {
                    if (i.quantity >= weightVal) {
                       found = true;
                       return { ...i, quantity: i.quantity - weightVal };
                    }
                 }
                 return i;
              }).filter(i => i.quantity > 0)
           }))
        })));

        if (found) {
            setLocalRecords(prev => [{
               id: `pda-${Date.now()}`,
               date: now,
               type: 'out',
               product: pdaForm.product,
               qty: weightVal,
               ref: 'PDA扫码出库',
               plate: pdaForm.materialType === 'finished' ? pdaForm.plate : '-',
               materialType: pdaForm.materialType
            }, ...prev]);
            alert('出库成功');
            resetPdaForm();
        } else {
            alert('库存不足或未找到对应产品');
        }
     }

     if (pdaMode === 'transfer') {
        if (!scannedSource || !pdaForm.targetWarehouseId || !pdaForm.targetZoneId || !weightVal) return alert('请完善调拨信息(目标仓库/库区/重量)');
        if (weightVal > scannedSource.currentQty) return alert('调拨数量超过当前库存');

        // Logic to move stock
        let transferItem: any = null;
        setWarehouses(prev => {
            const temp = JSON.parse(JSON.stringify(prev));
            // 1. Remove from Source
            const sourceWh = temp.find((w: Warehouse) => w.id === scannedSource.warehouseId);
            const sourceZone = sourceWh?.zones.find((z: WarehouseZone) => z.id === scannedSource.zoneId);
            
            if (sourceZone) {
               const itemIdx = sourceZone.inventory.findIndex((i: any) => i.barcode === scannedSource.barcode);
               if (itemIdx > -1) {
                  const item = sourceZone.inventory[itemIdx];
                  item.quantity -= weightVal;
                  transferItem = { ...item, quantity: weightVal };
                  if (item.quantity <= 0) sourceZone.inventory.splice(itemIdx, 1);
               }
            }
            
            // 2. Add to Target
            if (transferItem) {
               const targetWh = temp.find((w: Warehouse) => w.id === pdaForm.targetWarehouseId);
               const targetZone = targetWh?.zones.find((z: WarehouseZone) => z.id === pdaForm.targetZoneId);
               if (targetZone) {
                  targetZone.inventory.push(transferItem);
               }
            }
            return temp;
        });

        if (transferItem) {
            setLocalRecords(prev => [{
               id: `pda-${Date.now()}`,
               date: now,
               type: 'transfer',
               product: pdaForm.product,
               qty: weightVal,
               ref: 'PDA移库调拨',
               plate: '-'
            }, ...prev]);
            alert('调拨成功');
            resetPdaForm();
        }
     }

     if (pdaMode === 'count') {
         if (!pdaForm.warehouseId || !pdaForm.zoneId || !weightVal) return alert('请完善盘点信息');
         setLocalRecords(prev => [{
            id: `pda-${Date.now()}`,
            date: now,
            type: 'adjust',
            product: pdaForm.product,
            qty: weightVal,
            ref: `PDA盘点${pdaForm.adjType === 'add' ? '盈' : '亏'}`,
            plate: '-'
         }, ...prev]);
         alert('盘点数据已更新');
         resetPdaForm();
     }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">仓库概览</h2>
          <p className="text-sm text-gray-500 mt-1">实时查看各仓库、区域库存分布及出入库流水</p>
        </div>
        <button 
           onClick={() => setIsPdaOpen(true)}
           className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg shadow-sm transition-all text-sm font-medium"
        >
           <Smartphone size={18} /> PDA作业 / 扫码操作
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
         {warehouses.map(wh => {
            const totalItems = wh.zones.reduce((acc, z) => acc + z.inventory.length, 0);
            const totalQty = wh.zones.reduce((acc, z) => acc + z.inventory.reduce((q, i) => q + i.quantity, 0), 0);
            const isExpanded = expandedWh === wh.id;

            return (
               <div 
                  key={wh.id} 
                  onClick={() => { setExpandedWh(wh.id); setDetailTab('inventory'); }}
                  className={`cursor-pointer rounded-xl border p-5 transition-all ${isExpanded ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-gray-200 hover:shadow-md'}`}
               >
                  <div className="flex items-center gap-3 mb-3">
                     <div className={`p-2 rounded-lg ${isExpanded ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                        <Box size={24} />
                     </div>
                     <div>
                        <h3 className={`font-bold text-lg ${isExpanded ? 'text-indigo-900' : 'text-gray-800'}`}>{wh.name}</h3>
                        <div className="text-xs text-gray-500">{wh.type}</div>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                     <div className="bg-white/50 p-2 rounded">
                        <div className="text-gray-500 text-xs">库存批次</div>
                        <div className="font-bold text-gray-800">{totalItems} 批</div>
                     </div>
                     <div className="bg-white/50 p-2 rounded">
                        <div className="text-gray-500 text-xs">总数量</div>
                        <div className="font-bold text-gray-800">{totalQty} 吨</div>
                     </div>
                  </div>
               </div>
            );
         })}
      </div>

      {/* Detail View */}
      {expandedWh && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
               <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <Box className="text-indigo-500"/>
                  {warehouses.find(w => w.id === expandedWh)?.name}
               </h3>
               
               {/* Tabs */}
               <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setDetailTab('inventory')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${detailTab === 'inventory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                     区域库存
                  </button>
                  <button 
                    onClick={() => setDetailTab('records')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${detailTab === 'records' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                     出入库记录
                  </button>
               </div>
            </div>
            
            {/* INVENTORY TAB */}
            {detailTab === 'inventory' && (
               <div className="space-y-6 animate-in fade-in">
                  {warehouses.find(w => w.id === expandedWh)?.zones.map(zone => (
                     <div key={zone.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                           <span className="font-bold text-gray-700">{zone.name}</span>
                           <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                              {zone.inventory.length} 批次
                           </span>
                        </div>
                        {zone.inventory.length === 0 ? (
                           <div className="p-4 text-center text-gray-400 text-sm">暂无库存</div>
                        ) : (
                           <table className="min-w-full divide-y divide-gray-100">
                              <thead className="bg-white">
                                 <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">产品名称</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">数量</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">编码 / 条码</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                 {zone.inventory.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                       <td className="px-4 py-2 text-sm text-gray-900 font-medium">{item.productName}</td>
                                       <td className="px-4 py-2 text-sm text-indigo-600 font-bold">{item.quantity} {item.unit}</td>
                                       <td className="px-4 py-2">
                                          <div className="flex items-center gap-2 text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded w-fit">
                                             <QrCode size={14}/> {item.barcode}
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        )}
                     </div>
                  ))}
               </div>
            )}

            {/* RECORDS TAB */}
            {detailTab === 'records' && (
               <div className="animate-in fade-in">
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                     <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                        <div className="text-xs text-green-600 font-bold uppercase">期间总入库</div>
                        <div className="text-xl font-bold text-gray-800 mt-1">+{stats.totalIn.toFixed(1)} <span className="text-xs font-normal text-gray-500">吨</span></div>
                     </div>
                     <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                        <div className="text-xs text-orange-600 font-bold uppercase">期间总出库</div>
                        <div className="text-xl font-bold text-gray-800 mt-1">-{stats.totalOut.toFixed(1)} <span className="text-xs font-normal text-gray-500">吨</span></div>
                     </div>
                     <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="text-xs text-blue-600 font-bold uppercase">净变动</div>
                        <div className={`text-xl font-bold mt-1 ${(stats.totalIn - stats.totalOut) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                           {(stats.totalIn - stats.totalOut) > 0 ? '+' : ''}{(stats.totalIn - stats.totalOut).toFixed(1)} <span className="text-xs font-normal text-gray-500">吨</span>
                        </div>
                     </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                      <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border">
                         <div className="flex items-center px-2 gap-2 border-r border-gray-200 pr-3">
                            <Calendar size={14} className="text-gray-500"/>
                            <input type="date" className="bg-transparent text-sm text-gray-600 outline-none" 
                               value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} title="开始日期"/>
                            <span className="text-gray-400">-</span>
                            <input type="date" className="bg-transparent text-sm text-gray-600 outline-none" 
                               value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} title="结束日期"/>
                         </div>
                         <div className="flex items-center px-2 gap-2">
                            <Search size={14} className="text-gray-400" />
                            <input 
                              type="text" placeholder="搜索产品/车牌..." 
                              className="bg-transparent text-sm w-40 outline-none"
                              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            />
                         </div>
                      </div>
                      
                      <div className="flex gap-2">
                         <button onClick={() => { setDateRange({start: '', end: ''}); setSearchTerm(''); }} className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1">
                            <Filter size={12}/> 重置筛选
                         </button>
                         <div className="text-xs text-gray-500 self-center">
                            显示 {displayedRecords.length} 条记录
                         </div>
                      </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                     <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                           <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">时间</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">类型</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">产品</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">数量</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">属性</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">车牌/摘要</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {displayedRecords.length === 0 ? (
                              <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">暂无出入库记录</td></tr>
                           ) : (
                              displayedRecords.map(r => (
                                 <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{r.date}</td>
                                    <td className="px-4 py-3">
                                       <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                           r.type === 'in' ? 'bg-green-100 text-green-700' : 
                                           r.type === 'out' ? 'bg-orange-100 text-orange-700' :
                                           r.type === 'transfer' ? 'bg-blue-100 text-blue-700' :
                                           'bg-purple-100 text-purple-700'
                                       }`}>
                                          {r.type === 'in' ? <ArrowDownCircle size={12} /> : 
                                           r.type === 'out' ? <ArrowUpCircle size={12} /> :
                                           r.type === 'transfer' ? <RefreshCw size={12} /> :
                                           <ClipboardCheck size={12} />}
                                          {r.type === 'in' ? '入库' : r.type === 'out' ? '出库' : r.type === 'transfer' ? '调拨' : '盘点'}
                                       </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{r.product}</td>
                                    <td className="px-4 py-3 text-sm font-bold">
                                       {r.type === 'in' || r.type === 'adjust' ? '+' : '-'}{r.qty} 吨
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">
                                       {r.materialType === 'semi' ? <span className="bg-gray-100 text-gray-600 px-1 rounded">半成品/原料</span> : <span className="bg-blue-50 text-blue-600 px-1 rounded">成品</span>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                       {r.ref?.includes('生产') ? <span className="text-purple-600">{r.ref}</span> : (r.plate || '-')}
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}
         </div>
      )}

      {/* PDA Modal */}
      {isPdaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col h-[85vh] animate-in zoom-in-95 duration-200 font-sans">
              {/* Header */}
              <div className="bg-white p-4 flex justify-between items-center border-b border-gray-100 shrink-0">
                 <div className="flex items-center gap-2 text-gray-800">
                    <ScanLine className="text-blue-600" />
                    <span className="font-bold tracking-tight">PDA 移动作业终端</span>
                 </div>
                 <button onClick={() => { setIsPdaOpen(false); resetPdaForm(); }} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                    <X size={18} />
                 </button>
              </div>

              {/* Mode Switcher */}
              <div className="p-2 grid grid-cols-5 gap-1 bg-gray-50 border-b border-gray-200 shrink-0 overflow-x-auto">
                 {['gen', 'in', 'out', 'transfer', 'count'].map((m: any) => (
                    <button 
                       key={m}
                       onClick={() => { setPdaMode(m); resetPdaForm(); }}
                       className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-all ${
                          pdaMode === m ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-white hover:text-gray-800 hover:shadow-sm'
                       }`}
                    >
                       {m === 'gen' && <QrCode size={18} className="mb-1"/>}
                       {m === 'in' && <ArrowDownCircle size={18} className="mb-1"/>}
                       {m === 'out' && <ArrowUpCircle size={18} className="mb-1"/>}
                       {m === 'transfer' && <RefreshCw size={18} className="mb-1"/>}
                       {m === 'count' && <ClipboardCheck size={18} className="mb-1"/>}
                       <span>{m === 'gen' ? '生成' : m === 'in' ? '入库' : m === 'out' ? '出库' : m === 'transfer' ? '移库' : '盘点'}</span>
                    </button>
                 ))}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 text-gray-800 space-y-5 bg-white">
                 
                 {/* 1. Generate Mode */}
                 {pdaMode === 'gen' && (
                    <div className="space-y-4">
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">产品条码生成</h4>
                          <div className="space-y-4">
                             <div>
                                <label className="text-xs text-gray-500 mb-1 block">产品名称</label>
                                <select className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                   value={pdaForm.product} onChange={e => setPdaForm({...pdaForm, product: e.target.value})}>
                                   <option>湿法氟化铝</option><option>氧化铝</option><option>萤石</option><option>硫酸</option>
                                </select>
                             </div>
                             <div>
                                <label className="text-xs text-gray-500 mb-1 block">生产产线</label>
                                <select className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                   value={pdaForm.line} onChange={e => setPdaForm({...pdaForm, line: e.target.value})}>
                                   <option>1号产线</option><option>2号产线</option>
                                </select>
                             </div>
                             <div>
                                <label className="text-xs text-gray-500 mb-1 block">生产日期</label>
                                <input type="date" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                                   value={pdaForm.date} onChange={e => setPdaForm({...pdaForm, date: e.target.value})} />
                             </div>
                             <button onClick={generateCode} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md transition-colors flex items-center justify-center gap-2 active:scale-95">
                                <QrCode size={18}/> 生成条码
                             </button>
                          </div>
                       </div>
                       {pdaForm.barcode && (
                          <div className="bg-white border-2 border-gray-100 p-4 rounded-xl flex flex-col items-center justify-center animate-in zoom-in duration-300 shadow-sm">
                             <QrCode size={120} className="text-gray-900" />
                             <div className="font-mono font-bold mt-3 text-lg text-gray-800">{pdaForm.barcode}</div>
                             <div className="text-xs text-gray-400 mt-1">已准备打印或扫码</div>
                          </div>
                       )}
                    </div>
                 )}

                 {/* 2. Inbound Mode */}
                 {pdaMode === 'in' && (
                    <div className="space-y-4">
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                          <h4 className="text-green-600 text-xs font-bold uppercase mb-2 flex items-center gap-2"><ArrowDownCircle size={14}/> 入库作业</h4>
                          <div>
                             <label className="text-xs text-gray-500 mb-1 block">扫描/输入条码</label>
                             <div className="flex gap-2">
                                <input type="text" className="flex-1 bg-white border border-gray-300 rounded-lg p-2.5 text-sm text-green-700 font-mono focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                   value={pdaForm.barcode} onChange={e => setPdaForm({...pdaForm, barcode: e.target.value})} placeholder="SCAN-CODE" />
                                <button className="bg-gray-200 px-3 rounded-lg hover:bg-gray-300 text-gray-600"><ScanLine size={18}/></button>
                             </div>
                          </div>
                          <div>
                             <label className="text-xs text-gray-500 mb-1 block">入库产品</label>
                             <input type="text" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800"
                                value={pdaForm.product} onChange={e => setPdaForm({...pdaForm, product: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs text-gray-500 mb-1 block">目标仓库</label>
                                <select className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                   value={pdaForm.warehouseId} onChange={e => setPdaForm({...pdaForm, warehouseId: e.target.value})}>
                                   <option value="">选择仓库</option>
                                   {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                             </div>
                             <div>
                                <label className="text-xs text-gray-500 mb-1 block">目标库区</label>
                                <select className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                   value={pdaForm.zoneId} onChange={e => setPdaForm({...pdaForm, zoneId: e.target.value})}>
                                   <option value="">选择库区</option>
                                   {warehouses.find(w => w.id === pdaForm.warehouseId)?.zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                </select>
                             </div>
                          </div>
                          <div>
                             <label className="text-xs text-gray-500 mb-1 block">重量 (吨)</label>
                             <input type="number" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-lg font-bold text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                value={pdaForm.weight} onChange={e => setPdaForm({...pdaForm, weight: e.target.value})} placeholder="0.00" />
                          </div>
                       </div>
                    </div>
                 )}

                 {/* 3. Outbound Mode */}
                 {pdaMode === 'out' && (
                    <div className="space-y-4">
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                          <h4 className="text-orange-600 text-xs font-bold uppercase mb-2 flex items-center gap-2"><ArrowUpCircle size={14}/> 出库作业</h4>
                          
                          {/* Type Toggle */}
                          <div className="flex bg-gray-200 p-1 rounded-lg">
                             <button onClick={() => setPdaForm({...pdaForm, materialType: 'finished'})} className={`flex-1 text-xs py-1.5 rounded-md transition-all shadow-sm ${pdaForm.materialType === 'finished' ? 'bg-white text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}>成品出货</button>
                             <button onClick={() => setPdaForm({...pdaForm, materialType: 'semi'})} className={`flex-1 text-xs py-1.5 rounded-md transition-all shadow-sm ${pdaForm.materialType === 'semi' ? 'bg-white text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}>原料领用</button>
                          </div>

                          <div>
                             <label className="text-xs text-gray-500 mb-1 block">扫描条码</label>
                             <div className="flex gap-2">
                                <input type="text" className="flex-1 bg-white border border-gray-300 rounded-lg p-2.5 text-sm text-orange-600 font-mono focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                   value={pdaForm.barcode} onChange={e => setPdaForm({...pdaForm, barcode: e.target.value})} placeholder="SCAN-CODE" />
                                <button className="bg-gray-200 px-3 rounded-lg hover:bg-gray-300 text-gray-600"><ScanLine size={18}/></button>
                             </div>
                          </div>
                          
                          {pdaForm.materialType === 'finished' && (
                             <div>
                                <label className="text-xs text-gray-500 mb-1 block">绑定车辆</label>
                                <select className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                   value={pdaForm.plate} onChange={e => setPdaForm({...pdaForm, plate: e.target.value})}>
                                   <option value="">选择车牌</option>
                                   {MOCK_VEHICLE_POOL.map(v => <option key={v.id} value={v.plateNumber}>{v.plateNumber}</option>)}
                                </select>
                             </div>
                          )}

                          <div>
                             <label className="text-xs text-gray-500 mb-1 block">出库重量 (吨)</label>
                             <input type="number" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-lg font-bold text-gray-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                value={pdaForm.weight} onChange={e => setPdaForm({...pdaForm, weight: e.target.value})} placeholder="0.00" />
                          </div>
                       </div>
                    </div>
                 )}

                 {/* 4. Transfer Mode */}
                 {pdaMode === 'transfer' && (
                    <div className="space-y-4">
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                          <h4 className="text-blue-600 text-xs font-bold uppercase mb-2 flex items-center gap-2"><RefreshCw size={14}/> 移库调拨</h4>
                          
                          {transferStep === 'scan' ? (
                             <div className="space-y-4 py-8 text-center">
                                <div className="w-20 h-20 bg-white border-2 border-dashed border-blue-200 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                   <ScanLine size={40} className="text-blue-400"/>
                                </div>
                                <p className="text-gray-500 text-sm">请扫描源库存条码</p>
                                <input type="text" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-center text-blue-600 font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                   value={pdaForm.barcode} onChange={e => setPdaForm({...pdaForm, barcode: e.target.value})} placeholder="Barcode" autoFocus />
                                <button onClick={handleTransferScan} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold shadow-md transition-colors">确认扫描</button>
                             </div>
                          ) : (
                             <div className="space-y-4">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
                                   <div className="text-gray-500 text-xs">当前源库存</div>
                                   <div className="font-bold text-blue-900">{scannedSource?.product}</div>
                                   <div className="flex justify-between text-xs text-blue-600 mt-1">
                                      <span>{scannedSource?.warehouseName} - {scannedSource?.zoneName}</span>
                                      <span>现有: {scannedSource?.currentQty}T</span>
                                   </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                      <label className="text-xs text-gray-500 mb-1 block">移入仓库</label>
                                      <select className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                                         value={pdaForm.targetWarehouseId} onChange={e => setPdaForm({...pdaForm, targetWarehouseId: e.target.value})}>
                                         <option value="">选择仓库</option>
                                         {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                      </select>
                                   </div>
                                   <div>
                                      <label className="text-xs text-gray-500 mb-1 block">移入库区</label>
                                      <select className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                                         value={pdaForm.targetZoneId} onChange={e => setPdaForm({...pdaForm, targetZoneId: e.target.value})}>
                                         <option value="">选择库区</option>
                                         {warehouses.find(w => w.id === pdaForm.targetWarehouseId)?.zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                      </select>
                                   </div>
                                </div>
                                <div>
                                   <label className="text-xs text-gray-500 mb-1 block">移库数量 (吨)</label>
                                   <input type="number" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-lg font-bold text-gray-800 focus:border-blue-500 outline-none"
                                      value={pdaForm.weight} onChange={e => setPdaForm({...pdaForm, weight: e.target.value})} placeholder="0.00" />
                                </div>
                                <button onClick={() => setTransferStep('scan')} className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200 py-2 rounded-lg text-sm transition-colors">重新扫描</button>
                             </div>
                          )}
                       </div>
                    </div>
                 )}

                 {/* 5. Count Mode */}
                 {pdaMode === 'count' && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                           <h4 className="text-purple-600 text-xs font-bold uppercase mb-2 flex items-center gap-2"><ClipboardCheck size={14}/> 库存盘点</h4>
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs text-gray-500 mb-1 block">盘点仓库</label>
                                <select className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none"
                                   value={pdaForm.warehouseId} onChange={e => setPdaForm({...pdaForm, warehouseId: e.target.value})}>
                                   <option value="">选择仓库</option>
                                   {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                             </div>
                             <div>
                                <label className="text-xs text-gray-500 mb-1 block">盘点库区</label>
                                <select className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:border-purple-500 outline-none"
                                   value={pdaForm.zoneId} onChange={e => setPdaForm({...pdaForm, zoneId: e.target.value})}>
                                   <option value="">选择库区</option>
                                   {warehouses.find(w => w.id === pdaForm.warehouseId)?.zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                </select>
                             </div>
                          </div>
                          <div>
                             <label className="text-xs text-gray-500 mb-1 block">盘点产品</label>
                             <input type="text" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm"
                                value={pdaForm.product} onChange={e => setPdaForm({...pdaForm, product: e.target.value})} placeholder="产品名称" />
                          </div>
                          <div>
                             <label className="text-xs text-gray-500 mb-1 block">调整类型</label>
                             <div className="flex bg-gray-200 p-1 rounded-lg">
                                <button onClick={() => setPdaForm({...pdaForm, adjType: 'add'})} className={`flex-1 py-1.5 rounded-md text-xs transition-all shadow-sm ${pdaForm.adjType === 'add' ? 'bg-white text-green-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}>盘盈 (+)</button>
                                <button onClick={() => setPdaForm({...pdaForm, adjType: 'sub'})} className={`flex-1 py-1.5 rounded-md text-xs transition-all shadow-sm ${pdaForm.adjType === 'sub' ? 'bg-white text-red-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}>盘亏 (-)</button>
                             </div>
                          </div>
                          <div>
                             <label className="text-xs text-gray-500 mb-1 block">调整数量 (吨)</label>
                             <input type="number" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-lg font-bold text-gray-800 focus:border-purple-500 outline-none"
                                value={pdaForm.weight} onChange={e => setPdaForm({...pdaForm, weight: e.target.value})} placeholder="0.00" />
                          </div>
                        </div>
                    </div>
                 )}

              </div>

              {/* Footer Action */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
                 {pdaMode !== 'gen' && !(pdaMode === 'transfer' && transferStep === 'scan') && (
                    <button onClick={handlePdaSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors active:scale-95">
                       确认提交
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
