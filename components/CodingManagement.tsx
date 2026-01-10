import React, { useState, useEffect } from 'react';
import { QrCode, Plus, Trash2, Printer, X, ArrowRight, Settings, AlignCenter } from 'lucide-react';
import { ProductCodeRule, CodeSegment, SegmentType } from '../types';
import { MOCK_PRODUCT_RULES } from '../constants';

export const CodingManagement: React.FC = () => {
  const [rules, setRules] = useState<ProductCodeRule[]>(MOCK_PRODUCT_RULES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // --- Modal Form State ---
  const [productName, setProductName] = useState('');
  const [segments, setSegments] = useState<CodeSegment[]>([]);

  // Helpers to generate preview based on segments
  const generatePreview = (segs: CodeSegment[]) => {
    if (segs.length === 0) return '---';
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = (now.getMonth() + 1).toString().padStart(2, '0');
    const DD = now.getDate().toString().padStart(2, '0');
    const YY = YYYY.toString().slice(-2);

    return segs.map(s => {
      if (s.type === 'fixed') return s.value;
      if (s.type === 'date') {
        if (s.value === 'YYYYMMDD') return `${YYYY}${MM}${DD}`;
        if (s.value === 'YYYYMM') return `${YYYY}${MM}`;
        if (s.value === 'YYMM') return `${YY}${MM}`;
        if (s.value === 'YYYY') return `${YYYY}`;
        return s.value;
      }
      if (s.type === 'sequence') {
        const len = parseInt(s.value) || 1;
        return '0'.repeat(Math.max(0, len - 1)) + '1';
      }
      return '';
    }).join('');
  };

  const handleAddRule = () => {
    setProductName('');
    setSegments([
      { id: 's1', type: 'fixed', value: '' },
      { id: 's2', type: 'date', value: 'YYYYMMDD' },
      { id: 's3', type: 'sequence', value: '4' }
    ]);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!productName) return alert('请输入产品名称');
    if (segments.length === 0) return alert('请至少定义一个编码规则段');
    if (segments.some(s => s.type === 'fixed' && !s.value)) return alert('固定字符段不能为空');

    const newRule: ProductCodeRule = {
      id: `rule-${Date.now()}`,
      productName,
      segments,
      exampleCode: generatePreview(segments)
    };

    setRules([...rules, newRule]);
    setIsModalOpen(false);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('确定删除此规则吗？')) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  const handlePrint = (rule: ProductCodeRule) => {
    alert(`正在打印条码示例: ${rule.exampleCode}\n(PDA扫码时将自动匹配产品"${rule.productName}")`);
  };

  // --- Segment Actions ---
  const addSegment = () => {
    setSegments([...segments, { id: `s-${Date.now()}`, type: 'fixed', value: '' }]);
  };

  const removeSegment = (idx: number) => {
    const newSegs = [...segments];
    newSegs.splice(idx, 1);
    setSegments(newSegs);
  };

  const updateSegment = (idx: number, field: keyof CodeSegment, val: string) => {
    const newSegs = [...segments];
    newSegs[idx] = { ...newSegs[idx], [field]: val };
    
    // Reset value if type changes to defaults
    if (field === 'type') {
      if (val === 'date') newSegs[idx].value = 'YYYYMMDD';
      if (val === 'sequence') newSegs[idx].value = '4';
      if (val === 'fixed') newSegs[idx].value = '';
    }
    setSegments(newSegs);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">编码管理</h2>
          <p className="text-sm text-gray-500 mt-1">定义产品编码规则，由多部分组成，支持自动生成条码</p>
        </div>
        <button 
          onClick={handleAddRule}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium"
        >
          <Plus size={18} /> 新增规则
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">产品名称</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">规则组成 (部分)</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">编码示例</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rules.map(rule => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{rule.productName}</td>
                <td className="px-6 py-4">
                   <div className="flex flex-wrap gap-2">
                      {rule.segments.map((s, i) => (
                        <div key={i} className={`flex items-center text-xs px-2 py-1 rounded border ${
                          s.type === 'fixed' ? 'bg-gray-100 border-gray-200 text-gray-600' :
                          s.type === 'date' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                          'bg-purple-50 border-purple-200 text-purple-600'
                        }`}>
                           {s.type === 'fixed' && `"${s.value}"`}
                           {s.type === 'date' && `日期:${s.value}`}
                           {s.type === 'sequence' && `流水:${s.value}位`}
                        </div>
                      ))}
                   </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm bg-gray-50 px-2 py-1 rounded border border-gray-200 text-gray-800">
                      {rule.exampleCode}
                    </span>
                    {/* Tiny Barcode */}
                    <div className="h-6 w-16 bg-white border border-gray-300 p-0.5 flex items-end justify-between px-1 opacity-50">
                       {[...Array(10)].map((_, i) => (
                          <div key={i} className="bg-black w-px" style={{height: `${Math.random() * 60 + 40}%`}}></div>
                       ))}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end gap-3">
                     <button onClick={() => handlePrint(rule)} className="text-gray-400 hover:text-blue-600" title="打印条码">
                        <Printer size={18} />
                     </button>
                     <button onClick={() => handleDeleteRule(rule.id)} className="text-gray-400 hover:text-red-600" title="删除">
                        <Trash2 size={18} />
                     </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rules.length === 0 && <div className="p-8 text-center text-gray-400">暂无编码规则</div>}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">配置产品编码规则</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            
            <div className="space-y-6">
               {/* Product Selection (Mock as input for now, but implies selection) */}
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">选择产品</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                      placeholder="输入或选择产品名称..." 
                      value={productName} 
                      onChange={e => setProductName(e.target.value)} 
                    />
                    <Settings className="absolute left-3 top-3 text-gray-400" size={18} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">将为该产品绑定唯一的编码生成规则和条码格式。</p>
               </div>

               {/* Rule Builder */}
               <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-center mb-4">
                     <label className="text-sm font-bold text-gray-700">规则段定义</label>
                     <button onClick={addSegment} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                        <Plus size={16}/> 添加规则段
                     </button>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                     {segments.map((seg, idx) => (
                        <div key={seg.id} className="flex items-center gap-3 bg-white p-2 rounded border border-gray-200 shadow-sm">
                           <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs text-gray-500 font-bold">{idx + 1}</div>
                           
                           {/* Type Selector */}
                           <select 
                              className="border border-gray-300 rounded p-1.5 text-sm w-32 focus:ring-2 focus:ring-blue-200 outline-none"
                              value={seg.type}
                              onChange={(e) => updateSegment(idx, 'type', e.target.value as SegmentType)}
                           >
                              <option value="fixed">固定字符</option>
                              <option value="date">日期变量</option>
                              <option value="sequence">流水号</option>
                           </select>

                           {/* Value Input based on Type */}
                           <div className="flex-1">
                              {seg.type === 'fixed' && (
                                <input 
                                  type="text" 
                                  placeholder="输入固定前缀/后缀" 
                                  className="w-full border border-gray-300 rounded p-1.5 text-sm"
                                  value={seg.value}
                                  onChange={e => updateSegment(idx, 'value', e.target.value)}
                                />
                              )}
                              {seg.type === 'date' && (
                                <select 
                                  className="w-full border border-gray-300 rounded p-1.5 text-sm"
                                  value={seg.value}
                                  onChange={e => updateSegment(idx, 'value', e.target.value)}
                                >
                                   <option value="YYYYMMDD">YYYYMMDD (e.g. 20231027)</option>
                                   <option value="YYYYMM">YYYYMM (e.g. 202310)</option>
                                   <option value="YYMM">YYMM (e.g. 2310)</option>
                                   <option value="YYYY">YYYY (e.g. 2023)</option>
                                </select>
                              )}
                              {seg.type === 'sequence' && (
                                <div className="flex items-center gap-2">
                                   <input 
                                      type="number" min="1" max="10"
                                      className="w-20 border border-gray-300 rounded p-1.5 text-sm"
                                      value={seg.value}
                                      onChange={e => updateSegment(idx, 'value', e.target.value)}
                                   />
                                   <span className="text-xs text-gray-500">位流水号</span>
                                </div>
                              )}
                           </div>

                           <button onClick={() => removeSegment(idx)} className="text-gray-400 hover:text-red-500 p-1">
                              <Trash2 size={16} />
                           </button>
                        </div>
                     ))}
                     {segments.length === 0 && <div className="text-center text-gray-400 text-sm py-4">点击上方按钮添加规则段</div>}
                  </div>
               </div>

               {/* Live Preview */}
               <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-col items-center justify-center">
                  <div className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-2">生成预览</div>
                  <div className="text-2xl font-mono font-bold text-blue-900 tracking-wide">
                     {generatePreview(segments) || '---'}
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-blue-400">
                     <AlignCenter size={12} />
                     <span>总长度: {generatePreview(segments).length} 位</span>
                  </div>
               </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">取消</button>
              <button onClick={handleSave} className="px-5 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 font-medium shadow-sm">保存配置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
