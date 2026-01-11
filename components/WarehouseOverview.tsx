
import React, { useState, useMemo, useEffect } from 'react';
import { Warehouse, StockRecord, ContractType } from '../types';
import { MOCK_WAREHOUSES, MOCK_ORDERS, MOCK_CONTRACTS } from '../constants';
import { Box, Search, Smartphone, X, ArrowUpCircle, ArrowDownCircle, RefreshCw, ClipboardCheck, ScanLine, List, Calendar, Filter, Printer, QrCode } from 'lucide-react';

interface WarehouseOverviewProps {
  extraRecords?: StockRecord[];
}

export const WarehouseOverview: React.FC<WarehouseOverviewProps> = ({ extraRecords = [] }) => {
  // --- Main View State ---
  const [warehouses, setWarehouses] = useState<Warehouse[]>(MOCK_WAREHOUSES);
  const [expandedWh, setExpandedWh] = useState<string | null>(MOCK_WAREHOUSES[0]?.id || null);
  const [detailTab, setDetailTab] = useState<'inventory' | 'records'>('inventory');
  
  // --- Filter State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // --- PDA State ---
  const [isPdaOpen, setIsPdaOpen] = useState(false);
  const [pdaTab, setPdaTab] = useState<'ops' | 'inv' | 'rec'>('ops'); // New Tab State
  const [pdaMode, setPdaMode] = useState<'gen' | 'in' | 'out' | 'transfer' | 'count' | null>(null);
  
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
      materialType: 'finished' 
  });

  // --- Data Logic ---
  const [localRecords, setLocalRecords] = useState<StockRecord[]>([]);

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
    setLocalRecords([...derivedRecords, ...extraRecords].sort((a, b) => b.date.localeCompare(a.date)));
  }, [extraRecords]);

  // Filter Logic for Main View
  const { displayedRecords, stats } = useMemo(() => {
     let recs = [...localRecords];
     
     // 1. Warehouse Filter (Implicit logic: filter records related to products in that warehouse type)
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

     // 2. Search Term
     if (searchTerm) {
        recs = recs.filter(r => r.product.includes(searchTerm) || r.plate?.includes(searchTerm) || r.ref.includes(searchTerm));
     }

     // 3. Date Range
     if (dateRange.start) {
        recs = recs.filter(r => r.date >= dateRange.start);
     }
     if (dateRange.end) {
        recs = recs.filter(r => r.date <= dateRange.end + ' 23:59:59');
     }

     const totalIn = recs.filter(r => r.type === 'in' || (r.type === 'adjust' && r.qty > 0)).reduce((acc, r) => acc + Math.abs(r.qty), 0);
     const totalOut = recs.filter(r => r.type === 'out' || (r.type === 'adjust' && r.qty < 0)).reduce((acc, r) => acc + Math.abs(r.qty), 0);

     recs.sort((a, b) => b.date.localeCompare(a.date));
     return { displayedRecords: recs, stats: { totalIn, totalOut } };
  }, [expandedWh, localRecords, warehouses, searchTerm, dateRange]);

  // --- PDA Handlers ---

  const resetPdaForm = () => {
     setPdaForm(prev => ({ 
         ...prev, 
         warehouseId: '', zoneId: '', 
         targetWarehouseId: '', targetZoneId: '', 
         weight: '', plate: '', barcode: '',
         product: '湿法氟化铝',
         materialType: 'finished'
     }));
  };

  const handleGenerateCode = () => {
      // Mock generation logic
      const pCode = pdaForm.product === '湿法氟化铝' ? 'FHL' : pdaForm.product === '氧化铝' ? 'YHL' : 'GEN';
      const dStr = pdaForm.date.replace(/-/g, '').slice(2);
      const lStr = pdaForm.line === '1号产线' ? 'L1' : 'L2';
      const tStr = pdaForm.materialType === 'finished' ? 'F' : 'S';
      const rnd = Math.floor(1000 + Math.random() * 9000);
      
      const newCode = `${pCode}-${dStr}-${lStr}${tStr}-${rnd}`;
      setPdaForm(prev => ({ ...prev, barcode: newCode }));
  };

  const handlePrintCode = () => {
      alert(`正在发送至打印机...\n\n条码: ${pdaForm.barcode}\n产品: ${pdaForm.product}\n产线: ${pdaForm.line}\n日期: ${pdaForm.date}`);
      resetPdaForm();
      setPdaMode(null);
  };

  const handlePdaSubmit = () => {
     const weightVal = parseFloat(pdaForm.weight) || 0;
     const now = new Date().toLocaleString('zh-CN', {hour12: false});
     
     if (!weightVal && pdaMode !== 'gen') return alert('请输入数量');

     let newRecord: StockRecord | null = null;

     if (pdaMode === 'in') {
         alert('PDA: 入库操作成功');
         newRecord = { id: `pda-${Date.now()}`, date: now, type: 'in', product: '扫码入库品', qty: weightVal, ref: `PDA-${pdaForm.barcode || 'SCAN'}` };
     } else if (pdaMode === 'out') {
         alert('PDA: 出库操作成功');
         newRecord = { id: `pda-${Date.now()}`, date: now, type: 'out', product: '扫码出库品', qty: weightVal, ref: `PDA-${pdaForm.barcode || 'SCAN'}` };
     } else if (pdaMode === 'transfer') {
         alert('PDA: 移库操作成功');
         newRecord = { id: `pda-${Date.now()}`, date: now, type: 'transfer', product: '扫码移库品', qty: weightVal, ref: `PDA-${pdaForm.barcode || 'SCAN'}` };
     } else if (pdaMode === 'count') {
         alert('PDA: 盘点数据提交成功');
         newRecord = { id: `pda-${Date.now()}`, date: now, type: 'adjust', product: '盘点品', qty: weightVal, ref: `PDA-COUNT` };
     }

     if (newRecord) {
         setLocalRecords(prev => [newRecord!, ...prev]);
     }
     
     resetPdaForm();
     setPdaMode(null); // Return to menu
  };

  return (
    <div>
       {/* Header */}
       <div className="flex justify-between items-end mb-6">
         <div>
            <h2 className="text-2xl font-bold text-gray-800">仓库概览</h2>
            <p className="text-sm text-gray-500 mt-1">查看实时库存分布、历史出入库记录及PDA作业模拟</p>
         </div>
         <button 
            onClick={() => setIsPdaOpen(true)} 
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm shadow-md transition-all active:scale-95"
         >
            <Smartphone size={18}/> 打开 PDA 模拟器
         </button>
       </div>

       {/* Warehouse Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {warehouses.map(wh => {
                const isExpanded = expandedWh === wh.id;
                const totalItems = wh.zones.reduce((acc, z) => acc + z.inventory.length, 0);
                const totalQty = wh.zones.reduce((acc, z) => acc + z.inventory.reduce((q, i) => q + i.quantity, 0), 0);
                return (
                <div 
                    key={wh.id} 
                    onClick={() => { setExpandedWh(wh.id); setDetailTab('inventory'); }} 
                    className={`cursor-pointer rounded-xl border p-5 transition-all relative overflow-hidden ${isExpanded ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-gray-200 hover:shadow-md'}`}
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
                    <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                        <div className="bg-white/60 p-2 rounded border border-gray-100/50">
                            <div className="text-gray-500 text-[10px]">库存批次</div>
                            <div className="font-bold text-gray-800 text-lg">{totalItems} <span className="text-xs font-normal">批</span></div>
                        </div>
                        <div className="bg-white/60 p-2 rounded border border-gray-100/50">
                            <div className="text-gray-500 text-[10px]">总数量</div>
                            <div className="font-bold text-gray-800 text-lg">{totalQty} <span className="text-xs font-normal">吨</span></div>
                        </div>
                    </div>
                    {isExpanded && <div className="absolute right-0 top-0 p-1 bg-indigo-500 text-white rounded-bl-lg"><List size={12}/></div>}
                </div>
                );
            })}
       </div>

       {/* Detail View */}
       {expandedWh && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Box className="text-indigo-500" size={20}/>
                        {warehouses.find(w => w.id === expandedWh)?.name} - 详情
                    </h3>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setDetailTab('inventory')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${detailTab === 'inventory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>区域库存</button>
                        <button onClick={() => setDetailTab('records')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${detailTab === 'records' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>出入库记录</button>
                    </div>
                </div>

                {/* Tab: Inventory */}
                {detailTab === 'inventory' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                        {warehouses.find(w => w.id === expandedWh)?.zones.map(zone => (
                            <div key={zone.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                    <span className="font-bold text-gray-700 text-sm flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-400"></div> {zone.name}
                                    </span>
                                    <span className="text-xs text-gray-400">容量利用率: --%</span>
                                </div>
                                {zone.inventory.length === 0 ? (
                                    <div className="p-6 text-center text-gray-400 text-sm bg-white">暂无库存数据</div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-white">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">产品名称</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">数量</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">条码/批次</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {zone.inventory.map(item => (
                                                <tr key={item.id} className="hover:bg-blue-50/50">
                                                    <td className="px-4 py-2 text-sm text-gray-900 font-medium">{item.productName}</td>
                                                    <td className="px-4 py-2 text-sm text-indigo-600 font-bold">{item.quantity} {item.unit}</td>
                                                    <td className="px-4 py-2 text-xs font-mono text-gray-500">{item.barcode}</td>
                                                    <td className="px-4 py-2 text-right">
                                                        <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">详情</button>
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

                {/* Tab: Records */}
                {detailTab === 'records' && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-green-50 rounded-lg p-3 border border-green-100 flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-green-600 font-bold uppercase">期间总入库</div>
                                    <div className="text-xl font-bold text-gray-800 mt-1">+{stats.totalIn.toFixed(1)} <span className="text-xs font-normal text-gray-500">吨</span></div>
                                </div>
                                <ArrowDownCircle className="text-green-300" size={32}/>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-orange-600 font-bold uppercase">期间总出库</div>
                                    <div className="text-xl font-bold text-gray-800 mt-1">-{stats.totalOut.toFixed(1)} <span className="text-xs font-normal text-gray-500">吨</span></div>
                                </div>
                                <ArrowUpCircle className="text-orange-300" size={32}/>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-blue-600 font-bold uppercase">净变动</div>
                                    <div className={`text-xl font-bold mt-1 ${(stats.totalIn - stats.totalOut) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {(stats.totalIn - stats.totalOut) > 0 ? '+' : ''}{(stats.totalIn - stats.totalOut).toFixed(1)} <span className="text-xs font-normal text-gray-500">吨</span>
                                    </div>
                                </div>
                                <RefreshCw className="text-blue-300" size={32}/>
                            </div>
                        </div>

                        {/* Filter Toolbar */}
                        <div className="flex flex-wrap justify-between items-center mb-4 gap-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center px-2 gap-2 border-r border-gray-200 pr-3">
                                    <Calendar size={14} className="text-gray-400"/>
                                    <input type="date" className="bg-transparent text-sm text-gray-600 outline-none w-28" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})}/>
                                    <span className="text-gray-400">-</span>
                                    <input type="date" className="bg-transparent text-sm text-gray-600 outline-none w-28" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})}/>
                                </div>
                                <div className="flex items-center px-2 gap-2">
                                    <Search size={14} className="text-gray-400" />
                                    <input type="text" placeholder="搜索产品、车牌、单号..." className="bg-transparent text-sm w-48 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                                </div>
                            </div>
                            <div className="flex gap-2 text-xs text-gray-500 self-center px-2">
                                <Filter size={14}/> 显示 {displayedRecords.length} 条记录
                            </div>
                        </div>

                        {/* Table */}
                        <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto custom-scrollbar">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-3 text-left text-xs font-medium text-gray-500">时间</th>
                                        <th className="p-3 text-left text-xs font-medium text-gray-500">类型</th>
                                        <th className="p-3 text-left text-xs font-medium text-gray-500">产品</th>
                                        <th className="p-3 text-left text-xs font-medium text-gray-500">数量</th>
                                        <th className="p-3 text-left text-xs font-medium text-gray-500">关联单号/摘要</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                {displayedRecords.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{r.date}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                r.type==='in'?'bg-green-100 text-green-700':
                                                r.type==='out'?'bg-orange-100 text-orange-700':
                                                r.type==='transfer'?'bg-blue-100 text-blue-700':'bg-purple-100 text-purple-700'
                                            }`}>
                                                {r.type}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm text-gray-800">{r.product}</td>
                                        <td className="p-3 text-sm font-bold text-gray-900">{r.qty}</td>
                                        <td className="p-3 text-xs text-gray-500 max-w-[200px] truncate">{r.ref} {r.plate ? `(${r.plate})` : ''}</td>
                                    </tr>
                                ))}
                                {displayedRecords.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400 text-sm">暂无符合条件的记录</td></tr>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col h-[85vh] relative">
              {/* PDA Header */}
              <div className="bg-slate-800 p-4 flex justify-between items-center text-white shadow-md z-10 shrink-0">
                 <div className="flex items-center gap-2">
                    <ScanLine size={20} />
                    <span className="font-bold text-lg">智能仓储终端</span>
                 </div>
                 <button onClick={() => setIsPdaOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                 </button>
              </div>

              {/* PDA Content Area */}
              <div className="flex-1 overflow-y-auto bg-slate-50 relative">
                 
                 {/* TAB 1: OPERATIONS (Main Menu & Sub-Forms) */}
                 {pdaTab === 'ops' && (
                    <div className="p-4 h-full">
                       {pdaMode === null ? (
                          // Main Operations Menu
                          <div className="grid grid-cols-2 gap-4">
                             <button onClick={() => { setPdaMode('in'); resetPdaForm(); }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-green-400 hover:shadow-md transition-all active:scale-95 flex flex-col items-center justify-center gap-2 h-28 group">
                                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors"><ArrowDownCircle size={24}/></div>
                                <span className="font-bold text-gray-700">扫码入库</span>
                             </button>
                             <button onClick={() => { setPdaMode('out'); resetPdaForm(); }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-orange-400 hover:shadow-md transition-all active:scale-95 flex flex-col items-center justify-center gap-2 h-28 group">
                                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors"><ArrowUpCircle size={24}/></div>
                                <span className="font-bold text-gray-700">扫码出库</span>
                             </button>
                             <button onClick={() => { setPdaMode('transfer'); resetPdaForm(); }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all active:scale-95 flex flex-col items-center justify-center gap-2 h-28 group">
                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><RefreshCw size={24}/></div>
                                <span className="font-bold text-gray-700">移库调拨</span>
                             </button>
                             <button onClick={() => { setPdaMode('count'); resetPdaForm(); }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all active:scale-95 flex flex-col items-center justify-center gap-2 h-28 group">
                                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors"><ClipboardCheck size={24}/></div>
                                <span className="font-bold text-gray-700">库存盘点</span>
                             </button>
                             <button onClick={() => { setPdaMode('gen'); resetPdaForm(); }} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-slate-400 hover:shadow-md transition-all active:scale-95 flex flex-col items-center justify-center gap-2 h-28 col-span-2 group">
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-600 group-hover:text-white transition-colors"><QrCode size={24}/></div>
                                <span className="font-bold text-gray-700">条码生成</span>
                             </button>
                          </div>
                       ) : (
                          // Active Operation Form
                          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full flex flex-col">
                             <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                                <button onClick={() => setPdaMode(null)} className="text-gray-400 hover:text-gray-600 text-sm">返回</button>
                                <h3 className="font-bold text-gray-800 flex-1 text-center">
                                   {pdaMode === 'in' ? '入库作业' : pdaMode === 'out' ? '出库作业' : pdaMode === 'transfer' ? '移库作业' : pdaMode === 'count' ? '盘点作业' : '生产赋码'}
                                </h3>
                                <div className="w-8"></div>
                             </div>
                             
                             {pdaMode === 'gen' ? (
                                // GENERATE CODE MODE UI
                                <div className="space-y-4 flex-1">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">选择产品</label>
                                        <select className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm mb-3"
                                            value={pdaForm.product} onChange={e => setPdaForm({...pdaForm, product: e.target.value})}>
                                            <option>湿法氟化铝</option>
                                            <option>氧化铝</option>
                                            <option>氢氧化铝</option>
                                            <option>萤石</option>
                                            <option>硫酸</option>
                                        </select>

                                        <label className="block text-xs font-bold text-gray-500 mb-1">产品类型</label>
                                        <div className="flex gap-4 mb-3">
                                            <label className="flex items-center gap-2">
                                                <input type="radio" checked={pdaForm.materialType === 'finished'} onChange={() => setPdaForm({...pdaForm, materialType: 'finished'})} />
                                                <span className="text-sm">成品</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input type="radio" checked={pdaForm.materialType === 'semi'} onChange={() => setPdaForm({...pdaForm, materialType: 'semi'})} />
                                                <span className="text-sm">半成品</span>
                                            </label>
                                        </div>

                                        <label className="block text-xs font-bold text-gray-500 mb-1">生产日期</label>
                                        <input type="date" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm mb-3"
                                            value={pdaForm.date} onChange={e => setPdaForm({...pdaForm, date: e.target.value})} />

                                        <label className="block text-xs font-bold text-gray-500 mb-1">生产线</label>
                                        <select className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm"
                                            value={pdaForm.line} onChange={e => setPdaForm({...pdaForm, line: e.target.value})}>
                                            <option>1号产线</option>
                                            <option>2号产线</option>
                                            <option>3号产线</option>
                                        </select>
                                    </div>

                                    {pdaForm.barcode && (
                                        <div className="bg-slate-800 p-4 rounded-xl text-white text-center shadow-lg">
                                            <div className="text-xs text-slate-400 mb-1">生成的唯一编码</div>
                                            <div className="text-xl font-mono font-bold tracking-wider">{pdaForm.barcode}</div>
                                        </div>
                                    )}

                                    <button onClick={handleGenerateCode} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md mt-2 active:scale-95 transition-transform">
                                        生成编码
                                    </button>

                                    {pdaForm.barcode && (
                                        <button onClick={handlePrintCode} className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 active:scale-95 transition-transform flex items-center justify-center gap-2">
                                            <Printer size={18}/> 确认打印
                                        </button>
                                    )}
                                </div>
                             ) : (
                                // STANDARD SCAN MODE UI
                                <div className="space-y-4 flex-1">
                                    <div>
                                    <label className="text-xs text-gray-500 font-bold mb-1 block">条码扫描</label>
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                            placeholder="请扫描或输入条码" value={pdaForm.barcode} onChange={e => setPdaForm({...pdaForm, barcode: e.target.value})} autoFocus />
                                        <button className="bg-slate-800 text-white p-2 rounded-lg"><ScanLine size={18}/></button>
                                    </div>
                                    </div>
                                    
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
                                    {pdaForm.barcode ? `已识别: ${pdaForm.product} (模拟)` : '等待扫描...'}
                                    </div>

                                    <div>
                                    <label className="text-xs text-gray-500 font-bold mb-1 block">数量/重量</label>
                                    <input type="number" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-lg font-bold outline-none focus:border-blue-500" 
                                        placeholder="0.00" value={pdaForm.weight} onChange={e => setPdaForm({...pdaForm, weight: e.target.value})} />
                                    </div>

                                    <button onClick={handlePdaSubmit} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg mt-4 active:scale-95 transition-transform">
                                        确认提交
                                    </button>
                                </div>
                             )}
                          </div>
                       )}
                    </div>
                 )}

                 {/* TAB 2: INVENTORY (Compact List) */}
                 {pdaTab === 'inv' && (
                    <div className="p-4 space-y-3">
                       <div className="bg-white p-2 rounded-lg border border-gray-200 flex items-center gap-2 sticky top-0 z-10 shadow-sm">
                          <Search size={16} className="text-gray-400 ml-2"/>
                          <input type="text" placeholder="搜索库存..." className="flex-1 text-sm outline-none" />
                       </div>
                       
                       {warehouses.map(wh => (
                          <div key={wh.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                             <div className="bg-gray-50 px-3 py-2 border-b flex justify-between items-center">
                                <span className="font-bold text-sm text-gray-700">{wh.name}</span>
                                <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-gray-500">{wh.type}</span>
                             </div>
                             <div className="divide-y">
                                {wh.zones.map(z => (
                                   <div key={z.id} className="p-3">
                                      <div className="flex justify-between items-center mb-1">
                                         <span className="text-xs font-bold text-gray-600">{z.name}</span>
                                         {z.inventory.length === 0 && <span className="text-[10px] text-gray-300">空闲</span>}
                                      </div>
                                      {z.inventory.map(i => (
                                         <div key={i.id} className="flex justify-between items-center text-sm py-1 pl-2 border-l-2 border-indigo-100">
                                            <span className="text-gray-800">{i.productName}</span>
                                            <span className="font-mono font-bold text-blue-600">{i.quantity}{i.unit}</span>
                                         </div>
                                      ))}
                                   </div>
                                ))}
                             </div>
                          </div>
                       ))}
                    </div>
                 )}

                 {/* TAB 3: RECORDS (Compact List) */}
                 {pdaTab === 'rec' && (
                    <div className="p-4 space-y-3">
                       <h3 className="text-xs font-bold text-gray-400 uppercase ml-1 mb-2">最近操作记录 (Local)</h3>
                       {localRecords.length === 0 ? (
                          <div className="text-center text-gray-400 py-10 text-sm">暂无操作记录</div>
                       ) : (
                          localRecords.slice(0, 20).map(r => (
                             <div key={r.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                                      r.type==='in'?'bg-green-500': r.type==='out'?'bg-orange-500': 'bg-blue-500'
                                   }`}>
                                      {r.type==='in'?<ArrowDownCircle size={14}/>:r.type==='out'?<ArrowUpCircle size={14}/>:<RefreshCw size={14}/>}
                                   </div>
                                   <div>
                                      <div className="text-sm font-bold text-gray-800">{r.product}</div>
                                      <div className="text-[10px] text-gray-400">{r.ref}</div>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <div className="text-sm font-bold text-gray-700">{r.qty}t</div>
                                   <div className="text-[10px] text-gray-400">{r.date.split(' ')[1] || r.date}</div>
                                </div>
                             </div>
                          ))
                       )}
                    </div>
                 )}
              </div>

              {/* PDA Bottom Navigation */}
              <div className="bg-white border-t border-gray-200 flex justify-around p-1 pb-3 shrink-0 z-20">
                 <button 
                    onClick={() => { setPdaTab('ops'); setPdaMode(null); }} 
                    className={`flex flex-col items-center justify-center p-2 rounded-lg w-full transition-colors ${pdaTab === 'ops' ? 'text-slate-800 bg-slate-50' : 'text-gray-400 hover:text-gray-600'}`}
                 >
                    <ScanLine size={22} className={pdaTab === 'ops' ? 'fill-current opacity-20' : ''}/>
                    <span className="text-[10px] font-bold mt-1">作业</span>
                 </button>
                 <button 
                    onClick={() => setPdaTab('inv')} 
                    className={`flex flex-col items-center justify-center p-2 rounded-lg w-full transition-colors ${pdaTab === 'inv' ? 'text-slate-800 bg-slate-50' : 'text-gray-400 hover:text-gray-600'}`}
                 >
                    <Box size={22} className={pdaTab === 'inv' ? 'fill-current opacity-20' : ''}/>
                    <span className="text-[10px] font-bold mt-1">库存</span>
                 </button>
                 <button 
                    onClick={() => setPdaTab('rec')} 
                    className={`flex flex-col items-center justify-center p-2 rounded-lg w-full transition-colors ${pdaTab === 'rec' ? 'text-slate-800 bg-slate-50' : 'text-gray-400 hover:text-gray-600'}`}
                 >
                    <List size={22} className={pdaTab === 'rec' ? 'fill-current opacity-20' : ''}/>
                    <span className="text-[10px] font-bold mt-1">记录</span>
                 </button>
              </div>
           </div>
        </div>
       )}
    </div>
  );
};
