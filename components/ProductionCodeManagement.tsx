
import React, { useState, useMemo } from 'react';
import { ProductionCode, CodeHistory } from '../types';
import { MOCK_PRODUCTION_CODES } from '../constants';
import { Search, Printer, Trash2, Filter, Eye, Truck, Box, Layers, Calendar, QrCode, Clock, ArrowRight, X } from 'lucide-react';

export const ProductionCodeManagement: React.FC = () => {
  const [codes, setCodes] = useState<ProductionCode[]>(MOCK_PRODUCTION_CODES);
  
  // Filter States
  const [filters, setFilters] = useState({
    keyword: '', // Product Name or Code
    date: '',
    type: 'all' as 'all' | 'finished' | 'semi',
  });

  // Modal State
  const [detailCode, setDetailCode] = useState<ProductionCode | null>(null);

  // --- Actions ---

  const handlePrint = (code: ProductionCode) => {
    alert(`正在打印编码标签...\n\n产品: ${code.productName}\n编码: ${code.code}\n批次: ${code.batchNo}`);
  };

  const handleDelete = (id: string) => {
    const target = codes.find(c => c.id === id);
    if (!target) return;

    // Safety check: if shipped or consumed, warn strongly
    if (target.status === 'shipped' || target.status === 'consumed') {
        if (!confirm(`警告：该编码关联的产品状态为 "${target.status === 'shipped' ? '已发货' : '已消耗'}"，删除可能会导致数据不一致。确定要强制删除吗？`)) {
            return;
        }
    } else {
        if (!confirm(`确定要删除编码 "${target.code}" 吗？此操作通常用于误生成的编码。`)) return;
    }

    setCodes(prev => prev.filter(c => c.id !== id));
  };

  // Mock Generation
  const handleGenerateMock = () => {
      const newCode: ProductionCode = {
          id: `gen-${Date.now()}`,
          code: `NEW-${Date.now()}`,
          productName: '新生成产品',
          spec: '通用规格',
          type: 'finished',
          batchNo: `BATCH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`,
          createTime: new Date().toLocaleString('zh-CN', {hour12: false}),
          status: 'in_stock',
          currentQty: 10,
          unit: '吨',
          location: '待入库区',
          history: [
              { date: new Date().toLocaleString('zh-CN', {hour12: false}), action: 'create', desc: '手动生成', operator: '当前用户' }
          ]
      };
      setCodes([newCode, ...codes]);
      alert('已模拟生成新编码');
  };

  // --- Filter Logic ---
  const filteredCodes = useMemo(() => {
    return codes.filter(c => {
        const matchKeyword = c.code.toLowerCase().includes(filters.keyword.toLowerCase()) || 
                             c.productName.includes(filters.keyword);
        const matchDate = filters.date ? c.createTime.startsWith(filters.date) : true;
        const matchType = filters.type === 'all' ? true : c.type === filters.type;
        return matchKeyword && matchDate && matchType;
    });
  }, [codes, filters]);

  // --- Sub-components ---

  const StatusTag = ({ status }: { status: string }) => {
      const config = {
          in_stock: { color: 'bg-green-100 text-green-700', label: '在库' },
          shipped: { color: 'bg-blue-100 text-blue-700', label: '已发货' },
          consumed: { color: 'bg-gray-100 text-gray-700', label: '已消耗' },
          deleted: { color: 'bg-red-100 text-red-700', label: '已删除' },
      };
      const conf = config[status as keyof typeof config] || { color: 'bg-gray-100', label: status };
      return <span className={`px-2 py-0.5 rounded text-xs font-bold ${conf.color}`}>{conf.label}</span>;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">生产编码管理</h2>
          <p className="text-sm text-gray-500 mt-1">管理成品与半成品的唯一标识，追踪出入库流向</p>
        </div>
        <button 
          onClick={handleGenerateMock}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium"
        >
          <QrCode size={18} /> 模拟生成编码
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
                <button onClick={() => setFilters({...filters, type: 'all'})} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filters.type === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>全部</button>
                <button onClick={() => setFilters({...filters, type: 'finished'})} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filters.type === 'finished' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>成品</button>
                <button onClick={() => setFilters({...filters, type: 'semi'})} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filters.type === 'semi' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>半成品</button>
             </div>

             <div className="h-8 w-px bg-gray-200 mx-2"></div>

             <div className="relative">
                <input type="text" placeholder="搜索编码或产品名称..." className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-100 outline-none"
                   value={filters.keyword} onChange={e => setFilters({...filters, keyword: e.target.value})} />
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
             </div>

             <input type="date" className="py-2 px-3 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none"
                value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} />

             <button onClick={() => setFilters({keyword: '', date: '', type: 'all'})} className="text-gray-400 hover:text-gray-600 p-2" title="重置">
                <Filter size={18} />
             </button>
          </div>
      </div>

      {/* Code List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
               <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">产品编码 / 批次</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">产品名称</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">类型</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">生成时间</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">当前状态 / 位置</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">存量</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {filteredCodes.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400 text-sm">暂无编码记录</td></tr>
               ) : (
                  filteredCodes.map(code => (
                     <tr key={code.id} className="hover:bg-gray-50 group">
                        <td className="px-6 py-4">
                           <div className="font-mono text-sm font-bold text-gray-800">{code.code}</div>
                           <div className="text-xs text-gray-400 mt-0.5">{code.batchNo}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-sm font-medium text-gray-900">{code.productName}</div>
                           <div className="text-xs text-gray-500">{code.spec}</div>
                        </td>
                        <td className="px-6 py-4">
                           {code.type === 'finished' ? (
                              <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 w-fit"><Box size={12}/> 成品</span>
                           ) : (
                              <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 w-fit"><Layers size={12}/> 半成品</span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                           {code.createTime}
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 mb-1"><StatusTag status={code.status} /></div>
                           <div className="text-xs text-gray-500 truncate max-w-[150px]" title={code.location}>{code.location}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="font-bold text-gray-800">{code.currentQty}</span> <span className="text-xs text-gray-500">{code.unit}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setDetailCode(code)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="查看详情/追溯">
                                 <Eye size={16}/>
                              </button>
                              <button onClick={() => handlePrint(code)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="打印标签">
                                 <Printer size={16}/>
                              </button>
                              <button onClick={() => handleDelete(code.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="删除">
                                 <Trash2 size={16}/>
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>

      {/* Detail Modal */}
      {detailCode && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
               {/* Header */}
               <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                  <div>
                     <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <QrCode size={18} className="text-indigo-600"/> 编码详情追溯
                     </h3>
                     <p className="text-xs text-gray-500 font-mono mt-1">{detailCode.code}</p>
                  </div>
                  <button onClick={() => setDetailCode(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
               </div>

               <div className="p-6 overflow-y-auto custom-scrollbar">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6 p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                     <div><span className="text-xs text-gray-400 block">产品名称</span><span className="font-medium text-gray-800">{detailCode.productName}</span></div>
                     <div><span className="text-xs text-gray-400 block">规格型号</span><span className="font-medium text-gray-800">{detailCode.spec}</span></div>
                     <div><span className="text-xs text-gray-400 block">生产批次</span><span className="font-medium text-gray-800">{detailCode.batchNo}</span></div>
                     <div><span className="text-xs text-gray-400 block">生成时间</span><span className="font-medium text-gray-800">{detailCode.createTime}</span></div>
                  </div>

                  {/* Current Status */}
                  <div className="mb-8">
                     <h4 className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-indigo-500 pl-2">当前状态</h4>
                     <div className="flex items-center gap-6">
                        <div className="text-center p-3 bg-indigo-50 rounded-lg min-w-[100px]">
                           <div className="text-xs text-indigo-400 mb-1">剩余存量</div>
                           <div className="text-xl font-bold text-indigo-700">{detailCode.currentQty} <span className="text-xs font-normal">{detailCode.unit}</span></div>
                        </div>
                        <div className="text-center p-3 bg-gray-100 rounded-lg min-w-[100px]">
                           <div className="text-xs text-gray-400 mb-1">所在位置</div>
                           <div className="text-sm font-bold text-gray-700">{detailCode.location}</div>
                        </div>
                        <div>
                           <StatusTag status={detailCode.status} />
                        </div>
                     </div>
                  </div>

                  {/* Timeline History */}
                  <div>
                     <h4 className="text-sm font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-2">流转记录</h4>
                     <div className="relative pl-4 border-l-2 border-gray-100 space-y-6 ml-2">
                        {detailCode.history.map((h, idx) => (
                           <div key={idx} className="relative pl-6">
                              <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full border-2 bg-white ${
                                 h.action === 'create' ? 'border-green-500' :
                                 h.action === 'out' ? 'border-orange-500' :
                                 'border-blue-500'
                              }`}></div>
                              
                              <div className="flex justify-between items-start">
                                 <div>
                                    <div className="font-bold text-gray-800 text-sm">{h.desc}</div>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                       <Clock size={12}/> {h.date} 
                                       <span className="text-gray-300">|</span> 
                                       <span>操作人: {h.operator}</span>
                                    </div>
                                    {h.location && <div className="text-xs text-gray-600 mt-1 bg-gray-100 px-2 py-0.5 rounded w-fit">位置: {h.location}</div>}
                                 </div>
                                 
                                 {/* Truck Info Highlight */}
                                 {h.truckPlate && (
                                    <div className="bg-orange-50 border border-orange-100 px-3 py-2 rounded-lg text-right">
                                       <div className="text-[10px] text-orange-400 uppercase font-bold flex items-center justify-end gap-1"><Truck size={12}/> 运输车辆</div>
                                       <div className="text-lg font-bold text-orange-700">{h.truckPlate}</div>
                                    </div>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
