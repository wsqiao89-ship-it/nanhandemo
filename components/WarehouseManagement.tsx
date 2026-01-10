import React, { useState } from 'react';
import { Warehouse, WarehouseType, WarehouseZone } from '../types';
import { MOCK_WAREHOUSES } from '../constants';
import { Plus, Trash2, Edit2, Archive, LayoutGrid, Info, X, Save } from 'lucide-react';

export const WarehouseManagement: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(MOCK_WAREHOUSES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const initialForm = { name: '', type: WarehouseType.RawMaterial, zoneNames: '' };
  const [form, setForm] = useState(initialForm);

  const handleOpenModal = (wh?: Warehouse) => {
    if (wh) {
       // Check if editable
       const hasInventory = wh.zones.some(z => z.inventory.length > 0);
       if (hasInventory) return alert('该仓库内已有库存数据，无法编辑结构');

       setEditingId(wh.id);
       setForm({
         name: wh.name,
         type: wh.type,
         zoneNames: wh.zones.map(z => z.name).join('\n')
       });
    } else {
       setEditingId(null);
       setForm(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    
    // Parse Zones
    const zones: WarehouseZone[] = form.zoneNames.split('\n').filter(n => n.trim()).map((name, idx) => ({
      id: `z-${Date.now()}-${idx}`,
      name: name.trim(),
      inventory: []
    }));

    if (editingId) {
      setWarehouses(prev => prev.map(w => w.id === editingId ? {
        ...w,
        name: form.name,
        type: form.type,
        zones: zones.length > 0 ? zones : w.zones // Keep old zones if input empty? Or replace? Assuming replace for structure editing
      } : w));
    } else {
      const newWh: Warehouse = {
        id: `wh-${Date.now()}`,
        name: form.name,
        type: form.type,
        createDate: new Date().toISOString().split('T')[0],
        zones
      };
      setWarehouses([...warehouses, newWh]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const wh = warehouses.find(w => w.id === id);
    if (!wh) return;
    const hasInventory = wh.zones.some(z => z.inventory.length > 0);
    if (hasInventory) return alert('该仓库内已有库存数据，无法删除');

    if (confirm('确定删除此仓库吗？')) {
      setWarehouses(prev => prev.filter(w => w.id !== id));
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">仓库管理</h2>
          <p className="text-sm text-gray-500 mt-1">创建与维护仓库基础信息，批量划分库区</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium"
        >
          <Plus size={18} /> 新增仓库
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">仓库名称</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">类型</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">区域数量</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">区域详情</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">新建日期</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {warehouses.map(wh => {
              const hasInventory = wh.zones.some(z => z.inventory.length > 0);
              return (
                <tr key={wh.id} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    <Archive size={16} className="text-indigo-500"/> {wh.name}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded text-xs border ${
                        wh.type === WarehouseType.RawMaterial ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        wh.type === WarehouseType.Finished ? 'bg-green-50 text-green-600 border-green-100' :
                        'bg-orange-50 text-orange-600 border-orange-100'
                     }`}>
                       {wh.type}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{wh.zones.length} 个区域</td>
                  <td className="px-6 py-4">
                     <div className="flex flex-wrap gap-1 max-w-xs">
                        {wh.zones.map(z => (
                           <span key={z.id} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{z.name}</span>
                        ))}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{wh.createDate}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                          onClick={() => handleOpenModal(wh)}
                          className={`p-1 ${hasInventory ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-indigo-600'}`}
                          title={hasInventory ? "已有库存，不可编辑" : "编辑"}
                       >
                         <Edit2 size={16} />
                       </button>
                       <button 
                          onClick={() => handleDelete(wh.id)}
                          className={`p-1 ${hasInventory ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600'}`}
                          title={hasInventory ? "已有库存，不可删除" : "删除"}
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? '编辑仓库' : '新增仓库'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">仓库名称</label>
                  <input type="text" className="w-full border rounded-md p-2" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">仓库类型</label>
                  <select className="w-full border rounded-md p-2" value={form.type} onChange={e => setForm({...form, type: e.target.value as WarehouseType})}>
                     {Object.values(WarehouseType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                     <span>区域划分 (批量)</span>
                     <span className="text-xs text-gray-400 font-normal">每行一个区域名称</span>
                  </label>
                  <textarea 
                     className="w-full border rounded-md p-2 h-32" 
                     placeholder="A区&#10;B区&#10;C区" 
                     value={form.zoneNames} 
                     onChange={e => setForm({...form, zoneNames: e.target.value})} 
                  />
               </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded text-gray-700">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 rounded text-white">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
