import React, { useState, useMemo, useEffect } from 'react';
import { Warehouse, WarehouseZone, ContractType } from '../types';
import { MOCK_WAREHOUSES, MOCK_ORDERS, MOCK_CONTRACTS } from '../constants';
import { Package, QrCode, Box, ChevronRight, ChevronDown, List, ArrowUpCircle, ArrowDownCircle, Search, Smartphone, Printer, RefreshCw, ClipboardCheck, ScanLine, Truck } from 'lucide-react';

interface StockRecord {
  id: string;
  date: string;
  type: 'in' | 'out' | 'transfer' | 'adjust';
  product: string;
  qty: number;
  ref: string; // Order ID or Contract ID
  plate?: string;
}

export const WarehouseOverview: React.FC = () => {
  // Initialize State with Mocks
  const [warehouses, setWarehouses] = useState<Warehouse[]>(MOCK_WAREHOUSES);
  const [expandedWh, setExpandedWh] = useState<string | null>(MOCK_WAREHOUSES[0]?.id || null);
  const [detailTab, setDetailTab] = useState<'inventory' | 'records'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  
  // PDA State
  const [isPdaOpen, setIsPdaOpen] = useState(false);
  const [pdaMode, setPdaMode] = useState<'gen' | 'in' | 'out' | 'transfer' | 'count'>('gen');
  
  // Local Records State (Initialized with Mock derived data, but allows adding new PDA records)
  const [localRecords, setLocalRecords] = useState<StockRecord[]>([]);

  // Initialize records once on mount
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
                 plate: v.plateNumber
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
             plate: '豫A' + Math.floor(10000 + Math.random() * 90000)
         });
    });
    setLocalRecords(derivedRecords.sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  // Filter records
  const displayedRecords = useMemo(() => {
     let recs = [...localRecords];
     
     if (expandedWh) {
        const wh = warehouses.find(w => w.id === expandedWh);
        if (wh) {
            // Simple filtering: show records relevant to warehouse type products
            // In a real app, records would have a warehouseId field. 
            // Here we loosely match based on product type for the demo.
            recs = recs.filter(r => {
                if (wh.type === '原料仓') return ['萤石', '煤炭', '原矿'].some(p => r.product.includes(p));
                if (wh.type === '成品仓') return ['氟化铝', '氧化铝', '硫酸'].some(p => r.product.includes(p));
                if (wh.type === '半成品仓') return ['氢氧化铝', '半成品'].some(p => r.product.includes(p));
                return true; // Show all if unsure
            });
        }
     }

     if (searchTerm) {
        recs = recs.filter(r => r.product.includes(searchTerm) || r.plate?.includes(searchTerm));
     }

     return recs.sort((a, b) => b.date.localeCompare(a.date));
  }, [expandedWh, localRecords, warehouses, searchTerm]);


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
     plate: '', // Kept in state structure but ignored in UI/Logic for in/out
     barcode: '',
     batchNo: '',
     adjType: 'add'
  });

  const generateCode = () => {
     const code = `${pdaForm.product}-${pdaForm.date.replace(/-/g,'')}-${pdaForm.line}-${Math.floor(Math.random()*1000)}`;
     setPdaForm({...pdaForm, barcode: code});
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

        // Add Record
        setLocalRecords(prev => [{
           id: `pda-${Date.now()}`,
           date: now,
           type: 'in',
           product: pdaForm.product,
           qty: weightVal,
           ref: 'PDA直接入库',
           plate: '-' // No plate association
        }, ...prev]);
        
        alert('入库成功');
     }

     if (pdaMode === 'out') {
        if (!pdaForm.barcode || !weightVal) return alert('请完善出库信息');
        
        // Find and Reduce Inventory (Mock Logic: Just find first matching product)
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
               plate: '-' // No plate association
            }, ...prev]);
            alert('出库成功');
        } else {
            alert('库存不足或未找到对应产品');
        }
     }

     if (pdaMode === 'transfer') {
        if (!pdaForm.warehouseId || !pdaForm.targetWarehouseId || !weightVal) return alert('请完善调拨信息');
        
        // 1. Remove from Source
        let transferItem: any = null;
        setWarehouses(prev => {
            const temp = JSON.parse(JSON.stringify(prev)); // Deep clone for complex logic
            const sourceWh = temp.find((w: Warehouse) => w.id === pdaForm.warehouseId);
            const sourceZone = sourceWh?.zones.find((z: WarehouseZone) => z.id === pdaForm.zoneId);
            
            if (sourceZone) {
               const itemIdx = sourceZone.inventory.findIndex((i: any) => i.productName === pdaForm.product);
               if (itemIdx > -1) {
                  const item = sourceZone.inventory[itemIdx];
                  if (item.quantity >= weightVal) {
                     item.quantity -= weightVal;
                     transferItem = { ...item, quantity: weightVal };
                     if (item.quantity === 0) sourceZone.inventory.splice(itemIdx, 1);
                  }
               }
            }
            
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
        } else {
            alert('调出失败，检查库存');
        }
     }

     if (pdaMode === 'count') {
         if (!pdaForm.warehouseId || !pdaForm.zoneId || !weightVal) return alert('请完善盘点信息');
         
         setWarehouses(prev => prev.map(w => {
            if (w.id === pdaForm.warehouseId) {
               return {
                  ...w,
                  zones: w.zones.map(z => {
                     if (z.id === pdaForm.zoneId) {
                        return {
                           ...z,
                           inventory: z.inventory.map(i => {
                              if (i.barcode === pdaForm.barcode || i.productName === pdaForm.product) {
                                 return {
                                    ...i,
                                    quantity: pdaForm.adjType === 'add' ? i.quantity + weightVal : Math.max(0, i.quantity - weightVal)
                                 };
                              }
                              return i;
                           })
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
            type: 'adjust',
            product: pdaForm.product,
            qty: weightVal,
            ref: `PDA盘点${pdaForm.adjType === 'add' ? '盈' : '亏'}`,
            plate: '-'
         }, ...prev]);
         alert('盘点数据已更新');
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
                  <div className="flex justify-between items-center mb-4">
                      <div className="relative w-64">
                         <input 
                           type="text" placeholder="搜索产品..." 
                           className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-indigo-500"
                           value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                         />
                         <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-500">
                         显示最近 {displayedRecords.length} 条记录
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
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">关联单据</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">车牌</th>
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
                                    <td className="px-4 py-3 text-xs text-gray-500">{r.ref}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{r.plate || '-'}</td>
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

      {/* PDA Operation Modal */}
      {isPdaOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden">
               
               {/* Sidebar */}
               <div className="w-64 bg-gray-100 border-r flex flex-col">
                  <div className="p-4 bg-gray-900 text-white flex items-center gap-2">
                     <Smartphone size={20} />
                     <span className="font-bold">PDA 模拟终端</span>
                  </div>
                  <nav className="flex-1 p-2 space-y-1">
                     <button onClick={() => setPdaMode('gen')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${pdaMode === 'gen' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}>
                        <Printer size={18} /> 条码生成 / 贴码
                     </button>
                     <button onClick={() => setPdaMode('in')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${pdaMode === 'in' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:bg-gray-200'}`}>
                        <ArrowDownCircle size={18} /> 成品/原料入库
                     </button>
                     <button onClick={() => setPdaMode('out')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${pdaMode === 'out' ? 'bg-white shadow text-orange-600' : 'text-gray-600 hover:bg-gray-200'}`}>
                        <ArrowUpCircle size={18} /> 扫码出库
                     </button>
                     <button onClick={() => setPdaMode('transfer')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${pdaMode === 'transfer' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}>
                        <RefreshCw size={18} /> 移库 / 调拨
                     </button>
                     <button onClick={() => setPdaMode('count')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${pdaMode === 'count' ? 'bg-white shadow text-purple-600' : 'text-gray-600 hover:bg-gray-200'}`}>
                        <ClipboardCheck size={18} /> 盘点作业
                     </button>
                  </nav>
                  <div className="p-4 border-t">
                     <button onClick={() => setIsPdaOpen(false)} className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium">退出系统</button>
                  </div>
               </div>

               {/* Content */}
               <div className="flex-1 p-8 overflow-y-auto">
                  {pdaMode === 'gen' && (
                     <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-800">生成贴码</h3>
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">选择产品</label>
                              <select className="w-full border rounded-lg p-2.5" value={pdaForm.product} onChange={e => setPdaForm({...pdaForm, product: e.target.value})}>
                                 <option>湿法氟化铝</option>
                                 <option>氧化铝</option>
                                 <option>萤石</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">生产日期</label>
                              <input type="date" className="w-full border rounded-lg p-2.5" value={pdaForm.date} onChange={e => setPdaForm({...pdaForm, date: e.target.value})} />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">生产线/班组</label>
                              <input type="text" className="w-full border rounded-lg p-2.5" value={pdaForm.line} onChange={e => setPdaForm({...pdaForm, line: e.target.value})} />
                           </div>
                        </div>
                        <button onClick={generateCode} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700">生成条码</button>
                        
                        {pdaForm.barcode && (
                           <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-xl text-center">
                              <div className="text-sm text-gray-500 mb-2">生成的条码内容</div>
                              <div className="text-3xl font-mono font-bold text-gray-900 tracking-wider">{pdaForm.barcode}</div>
                              <div className="mt-4 flex justify-center">
                                 {/* Simple CSS Barcode representation */}
                                 <div className="h-16 w-64 flex items-end gap-0.5 justify-center opacity-80">
                                    {[...Array(40)].map((_, i) => <div key={i} className="bg-black w-1" style={{height: `${30 + Math.random()*70}%`}}></div>)}
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  )}

                  {pdaMode === 'in' && (
                     <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-800">入库作业</h3>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">扫描/输入产品条码</label>
                              <div className="relative">
                                 <input type="text" className="w-full border rounded-lg p-2.5 pl-10" placeholder="扫描条码..." value={pdaForm.barcode} onChange={e => setPdaForm({...pdaForm, barcode: e.target.value})} />
                                 <ScanLine size={18} className="absolute left-3 top-3 text-gray-400" />
                              </div>
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
                              <input type="text" className="w-full border rounded-lg p-2.5 bg-gray-50" value={pdaForm.product} onChange={e => setPdaForm({...pdaForm, product: e.target.value})} />
                           </div>
                           {/* Plate Input Removed */}
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">入库仓库</label>
                              <select className="w-full border rounded-lg p-2.5" value={pdaForm.warehouseId} onChange={e => setPdaForm({...pdaForm, warehouseId: e.target.value, zoneId: ''})}>
                                 <option value="">选择仓库</option>
                                 {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">库区</label>
                              <select className="w-full border rounded-lg p-2.5" value={pdaForm.zoneId} onChange={e => setPdaForm({...pdaForm, zoneId: e.target.value})}>
                                 <option value="">选择区域</option>
                                 {warehouses.find(w => w.id === pdaForm.warehouseId)?.zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                              </select>
                           </div>
                           <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">入库重量 (吨)</label>
                              <input type="number" className="w-full border rounded-lg p-2.5 font-bold text-lg" placeholder="0.00" value={pdaForm.weight} onChange={e => setPdaForm({...pdaForm, weight: e.target.value})} />
                           </div>
                        </div>
                        <button onClick={handlePdaSubmit} className="w-full py-3 bg-green-600 text-white rounded-lg font-medium shadow-sm hover:bg-green-700">确认入库</button>
                     </div>
                  )}

                  {pdaMode === 'out' && (
                     <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-800">出库作业</h3>
                        <div className="space-y-4">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">扫描/输入产品条码</label>
                              <div className="relative">
                                 <input type="text" className="w-full border rounded-lg p-2.5 pl-10" placeholder="扫描条码..." value={pdaForm.barcode} onChange={e => setPdaForm({...pdaForm, barcode: e.target.value})} />
                                 <ScanLine size={18} className="absolute left-3 top-3 text-gray-400" />
                              </div>
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">产品名称 (确认)</label>
                              <input type="text" className="w-full border rounded-lg p-2.5 bg-gray-50" value={pdaForm.product} onChange={e => setPdaForm({...pdaForm, product: e.target.value})} />
                           </div>
                           {/* Plate Input Removed */}
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">出库重量 (吨)</label>
                              <input type="number" className="w-full border rounded-lg p-2.5 font-bold text-lg" placeholder="0.00" value={pdaForm.weight} onChange={e => setPdaForm({...pdaForm, weight: e.target.value})} />
                           </div>
                        </div>
                        <button onClick={handlePdaSubmit} className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium shadow-sm hover:bg-orange-700">确认出库</button>
                     </div>
                  )}

                  {pdaMode === 'transfer' && (
                     <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-800">移库调拨</h3>
                        <div className="space-y-4">
                           <div className="p-3 bg-blue-50 rounded border border-blue-100 mb-4">
                              <div className="text-sm font-bold text-blue-800 mb-2">源位置 (调出)</div>
                              <div className="grid grid-cols-2 gap-2">
                                 <select className="border rounded p-1.5 text-sm" value={pdaForm.warehouseId} onChange={e => setPdaForm({...pdaForm, warehouseId: e.target.value, zoneId: ''})}>
                                    <option value="">源仓库</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                 </select>
                                 <select className="border rounded p-1.5 text-sm" value={pdaForm.zoneId} onChange={e => setPdaForm({...pdaForm, zoneId: e.target.value})}>
                                    <option value="">源库区</option>
                                    {warehouses.find(w => w.id === pdaForm.warehouseId)?.zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                 </select>
                              </div>
                           </div>

                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
                              <input type="text" className="w-full border rounded-lg p-2.5" value={pdaForm.product} onChange={e => setPdaForm({...pdaForm, product: e.target.value})} />
                           </div>

                           <div className="p-3 bg-green-50 rounded border border-green-100">
                              <div className="text-sm font-bold text-green-800 mb-2">目标位置 (调入)</div>
                              <div className="grid grid-cols-2 gap-2">
                                 <select className="border rounded p-1.5 text-sm" value={pdaForm.targetWarehouseId} onChange={e => setPdaForm({...pdaForm, targetWarehouseId: e.target.value, targetZoneId: ''})}>
                                    <option value="">目标仓库</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                 </select>
                                 <select className="border rounded p-1.5 text-sm" value={pdaForm.targetZoneId} onChange={e => setPdaForm({...pdaForm, targetZoneId: e.target.value})}>
                                    <option value="">目标库区</option>
                                    {warehouses.find(w => w.id === pdaForm.targetWarehouseId)?.zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                 </select>
                              </div>
                           </div>
                           
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">调拨重量 (吨)</label>
                              <input type="number" className="w-full border rounded-lg p-2.5" placeholder="0.00" value={pdaForm.weight} onChange={e => setPdaForm({...pdaForm, weight: e.target.value})} />
                           </div>
                        </div>
                        <button onClick={handlePdaSubmit} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700">执行调拨</button>
                     </div>
                  )}

                  {pdaMode === 'count' && (
                     <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-800">库存盘点</h3>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">盘点仓库</label>
                                 <select className="w-full border rounded-lg p-2.5" value={pdaForm.warehouseId} onChange={e => setPdaForm({...pdaForm, warehouseId: e.target.value, zoneId: ''})}>
                                    <option value="">选择仓库</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                 </select>
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">盘点库区</label>
                                 <select className="w-full border rounded-lg p-2.5" value={pdaForm.zoneId} onChange={e => setPdaForm({...pdaForm, zoneId: e.target.value})}>
                                    <option value="">选择区域</option>
                                    {warehouses.find(w => w.id === pdaForm.warehouseId)?.zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                 </select>
                              </div>
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">扫描/输入批次条码</label>
                              <div className="relative">
                                 <input type="text" className="w-full border rounded-lg p-2.5 pl-10" placeholder="扫描..." value={pdaForm.barcode} onChange={e => setPdaForm({...pdaForm, barcode: e.target.value})} />
                                 <ScanLine size={18} className="absolute left-3 top-3 text-gray-400" />
                              </div>
                           </div>
                           
                           <div className="flex gap-4">
                              <label className="flex items-center gap-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-gray-50">
                                 <input type="radio" name="adjType" value="add" checked={pdaForm.adjType === 'add'} onChange={() => setPdaForm({...pdaForm, adjType: 'add'})} />
                                 <span className="text-green-700 font-bold">盘盈 (增加)</span>
                              </label>
                              <label className="flex items-center gap-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-gray-50">
                                 <input type="radio" name="adjType" value="sub" checked={pdaForm.adjType === 'sub'} onChange={() => setPdaForm({...pdaForm, adjType: 'sub'})} />
                                 <span className="text-red-700 font-bold">盘亏 (减少)</span>
                              </label>
                           </div>

                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">调整数量 (吨)</label>
                              <input type="number" className="w-full border rounded-lg p-2.5" placeholder="0.00" value={pdaForm.weight} onChange={e => setPdaForm({...pdaForm, weight: e.target.value})} />
                           </div>
                        </div>
                        <button onClick={handlePdaSubmit} className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium shadow-sm hover:bg-purple-700">提交盘点数据</button>
                     </div>
                  )}

               </div>
            </div>
         </div>
      )}
    </div>
  );
};