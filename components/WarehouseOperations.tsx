
import React, { useState, useMemo } from 'react';
import { Warehouse, StockRecord, WarehouseType } from '../types';
import { MOCK_WAREHOUSES, MOCK_VEHICLE_POOL } from '../constants';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, ClipboardCheck, Save, Box, Search, Truck, Layers } from 'lucide-react';

interface WarehouseOperationsProps {
  onSaveRecord?: (record: StockRecord) => void;
}

export const WarehouseOperations: React.FC<WarehouseOperationsProps> = ({ onSaveRecord }) => {
  const [activeTab, setActiveTab] = useState<'in' | 'out' | 'transfer' | 'count'>('in');
  const [warehouses, setWarehouses] = useState<Warehouse[]>(MOCK_WAREHOUSES);

  // Form State
  const [formData, setFormData] = useState({
    product: '湿法氟化铝',
    batchNo: '',
    warehouseId: '',
    zoneId: '',
    targetWarehouseId: '',
    targetZoneId: '',
    weight: '',
    plate: '', 
    outType: 'finished' as 'finished' | 'semi', // finished | semi
    adjType: 'add',
    reason: ''
  });

  // Helpers to get available items for dropdowns
  const availableInventory = useMemo(() => {
    const items: Array<{
      whId: string; whName: string;
      zoneId: string; zoneName: string;
      product: string; qty: number; barcode: string;
      label: string;
    }> = [];

    warehouses.forEach(w => {
      w.zones.forEach(z => {
        z.inventory.forEach(i => {
          items.push({
            whId: w.id, whName: w.name,
            zoneId: z.id, zoneName: z.name,
            product: i.productName,
            qty: i.quantity,
            barcode: i.barcode,
            label: `${w.name}-${z.name} | ${i.productName} (${i.quantity}T) [${i.barcode}]`
          });
        });
      });
    });
    return items;
  }, [warehouses]);

  // Reset form when tab changes
  const handleTabChange = (tab: 'in' | 'out' | 'transfer' | 'count') => {
    setActiveTab(tab);
    setFormData({
      product: '湿法氟化铝',
      batchNo: '',
      warehouseId: '',
      zoneId: '',
      targetWarehouseId: '',
      targetZoneId: '',
      weight: '',
      plate: '', 
      outType: 'finished',
      adjType: 'add',
      reason: ''
    });
  };

  const handleSubmit = () => {
    const qty = parseFloat(formData.weight);
    if (!qty || qty <= 0) return alert('请输入有效的数量/重量');
    const now = new Date().toLocaleString('zh-CN', { hour12: false });

    // --- INBOUND ---
    if (activeTab === 'in') {
        if (!formData.warehouseId || !formData.zoneId) return alert('请选择目标仓库和库区');
        
        // Mock Update
        alert(`入库成功！\n产品: ${formData.product}\n位置: ${formData.warehouseId}-${formData.zoneId}\n数量: ${qty}吨`);
        if(onSaveRecord) onSaveRecord({
            id: `op-${Date.now()}`, date: now, type: 'in', product: formData.product, qty, ref: 'PC入库作业'
        });
    }

    // --- OUTBOUND ---
    if (activeTab === 'out') {
        if (!formData.batchNo) return alert('请选择出库货物');
        
        const selectedItem = availableInventory.find(i => i.barcode === formData.batchNo);
        if (!selectedItem) return alert('库存不存在');
        if (qty > selectedItem.qty) return alert('库存不足');

        const typeLabel = formData.outType === 'finished' ? '成品出库' : '半成品出库';
        alert(`${typeLabel}成功！\n产品: ${selectedItem.product}\n扣减库存: ${qty}吨`);
        
        if(onSaveRecord) onSaveRecord({
            id: `op-${Date.now()}`, date: now, type: 'out', product: selectedItem.product, qty, ref: `PC${typeLabel}`, plate: formData.plate, materialType: formData.outType
        });
    }

    // --- TRANSFER ---
    if (activeTab === 'transfer') {
        if (!formData.batchNo) return alert('请选择源库存');
        if (!formData.targetWarehouseId || !formData.targetZoneId) return alert('请选择移入位置');

        const selectedItem = availableInventory.find(i => i.barcode === formData.batchNo);
        if (!selectedItem) return alert('库存不存在');
        if (qty > selectedItem.qty) return alert('移库数量超过当前库存');

        alert(`移库成功！\n从: ${selectedItem.whName}-${selectedItem.zoneName}\n到: ${formData.targetWarehouseId}库-${formData.targetZoneId}区\n数量: ${qty}吨`);
        
        if(onSaveRecord) onSaveRecord({
            id: `op-${Date.now()}`, date: now, type: 'transfer', product: selectedItem.product, qty, ref: 'PC移库作业'
        });
    }

    // --- COUNT ---
    if (activeTab === 'count') {
        if (!formData.batchNo) return alert('请选择盘点对象');
        const selectedItem = availableInventory.find(i => i.barcode === formData.batchNo);
        
        alert(`盘点录入成功！\n对象: ${selectedItem?.product}\n调整: ${formData.adjType === 'add' ? '盘盈' : '盘亏'} ${qty}吨`);
        
        if(onSaveRecord) onSaveRecord({
            id: `op-${Date.now()}`, date: now, type: 'adjust', product: selectedItem?.product || '未知', qty, ref: 'PC盘点作业'
        });
    }

    // Clear key fields
    setFormData(prev => ({ ...prev, weight: '', batchNo: '' }));
  };

  const InputSection = ({ title, children }: any) => (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b">{title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children}
          </div>
      </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-6">
            <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">库存作业 (PC端)</h2>
            <p className="text-sm text-gray-500 mt-1">无需扫码枪，直接选择产品或批次进行出入库及调拨操作</p>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex mb-6">
            <button onClick={() => handleTabChange('in')} className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'in' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <ArrowDownCircle size={18}/> 入库作业
            </button>
            <button onClick={() => handleTabChange('out')} className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'out' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <ArrowUpCircle size={18}/> 出库作业
            </button>
            <button onClick={() => handleTabChange('transfer')} className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'transfer' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <RefreshCw size={18}/> 移库调拨
            </button>
            <button onClick={() => handleTabChange('count')} className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'count' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <ClipboardCheck size={18}/> 库存盘点
            </button>
        </div>

        {/* --- INBOUND FORM --- */}
        {activeTab === 'in' && (
            <InputSection title="入库信息录入">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">入库产品</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        value={formData.product} onChange={e => setFormData({...formData, product: e.target.value})}>
                        <option>湿法氟化铝</option><option>氧化铝</option><option>萤石</option><option>硫酸</option><option>氢氧化铝</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">目标仓库</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        value={formData.warehouseId} onChange={e => setFormData({...formData, warehouseId: e.target.value, zoneId: ''})}>
                        <option value="">-- 选择仓库 --</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">目标库区</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        value={formData.zoneId} onChange={e => setFormData({...formData, zoneId: e.target.value})}>
                        <option value="">-- 先选仓库 --</option>
                        {warehouses.find(w => w.id === formData.warehouseId)?.zones.map(z => 
                            <option key={z.id} value={z.id}>{z.name}</option>
                        )}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">入库数量 (吨)</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none font-bold"
                        placeholder="0.00" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-4 flex justify-end">
                    <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2">
                        <Save size={18}/> 确认入库
                    </button>
                </div>
            </InputSection>
        )}

        {/* --- OUTBOUND FORM --- */}
        {activeTab === 'out' && (
            <InputSection title="出库信息录入">
                <div className="col-span-full mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">出库类型</label>
                    <div className="flex gap-4">
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${formData.outType === 'finished' ? 'bg-orange-50 border-orange-200 text-orange-700 ring-1 ring-orange-500' : 'bg-gray-50 border-gray-200'}`}>
                            <input type="radio" name="outType" checked={formData.outType === 'finished'} onChange={() => setFormData({...formData, outType: 'finished'})} className="hidden" />
                            <Box size={16}/> 成品出库
                        </label>
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${formData.outType === 'semi' ? 'bg-orange-50 border-orange-200 text-orange-700 ring-1 ring-orange-500' : 'bg-gray-50 border-gray-200'}`}>
                            <input type="radio" name="outType" checked={formData.outType === 'semi'} onChange={() => setFormData({...formData, outType: 'semi'})} className="hidden" />
                            <Layers size={16}/> 半成品出库
                        </label>
                    </div>
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择出库货物 (批次/产品)</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        value={formData.batchNo} onChange={e => setFormData({...formData, batchNo: e.target.value})}>
                        <option value="">-- 请选择库存记录 --</option>
                        {availableInventory.map((item, idx) => (
                            <option key={idx} value={item.barcode}>{item.label}</option>
                        ))}
                    </select>
                </div>

                {formData.outType === 'finished' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">绑定车辆 (车牌)</label>
                        <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                            value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})}>
                            <option value="">-- 选择车辆 --</option>
                            {MOCK_VEHICLE_POOL.map(v => <option key={v.id} value={v.plateNumber}>{v.plateNumber} ({v.driverName})</option>)}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">出库数量 (吨)</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                        placeholder="0.00" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                </div>

                <div className="col-span-full mt-4 flex justify-end">
                    <button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2">
                        <Save size={18}/> 确认出库
                    </button>
                </div>
            </InputSection>
        )}

        {/* --- TRANSFER FORM --- */}
        {activeTab === 'transfer' && (
            <InputSection title="移库调拨操作">
                <div className="col-span-full bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                    <label className="block text-sm font-bold text-blue-800 mb-2">第一步：选择源库存</label>
                    <select className="w-full border border-blue-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={formData.batchNo} onChange={e => setFormData({...formData, batchNo: e.target.value})}>
                        <option value="">-- 请选择要移动的库存记录 --</option>
                        {availableInventory.map((item, idx) => (
                            <option key={idx} value={item.barcode}>{item.label}</option>
                        ))}
                    </select>
                </div>

                {formData.batchNo && (
                    <>
                        <div className="col-span-full my-2 border-t border-gray-100"></div>
                        <div className="col-span-full">
                             <label className="block text-sm font-bold text-gray-800 mb-2">第二步：设置移入位置</label>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">移入仓库</label>
                            <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.targetWarehouseId} onChange={e => setFormData({...formData, targetWarehouseId: e.target.value, targetZoneId: ''})}>
                                <option value="">-- 选择仓库 --</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">移入库区</label>
                            <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.targetZoneId} onChange={e => setFormData({...formData, targetZoneId: e.target.value})}>
                                <option value="">-- 先选仓库 --</option>
                                {warehouses.find(w => w.id === formData.targetWarehouseId)?.zones.map(z => 
                                    <option key={z.id} value={z.id}>{z.name}</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">移库数量 (吨)</label>
                            <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                placeholder="0.00" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                        </div>

                        <div className="col-span-full mt-4 flex justify-end">
                            <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2">
                                <RefreshCw size={18}/> 执行移库
                            </button>
                        </div>
                    </>
                )}
            </InputSection>
        )}

        {/* --- COUNT FORM --- */}
        {activeTab === 'count' && (
            <InputSection title="库存盘点调整">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择盘点对象 (产品号/批次)</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        value={formData.batchNo} onChange={e => setFormData({...formData, batchNo: e.target.value})}>
                        <option value="">-- 请选择库存记录 --</option>
                        {availableInventory.map((item, idx) => (
                            <option key={idx} value={item.barcode}>{item.label}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">调整类型</label>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setFormData({...formData, adjType: 'add'})} className={`flex-1 py-1.5 rounded text-sm transition-all ${formData.adjType === 'add' ? 'bg-white text-green-600 shadow font-bold' : 'text-gray-500'}`}>盘盈 (+)</button>
                        <button onClick={() => setFormData({...formData, adjType: 'sub'})} className={`flex-1 py-1.5 rounded text-sm transition-all ${formData.adjType === 'sub' ? 'bg-white text-red-600 shadow font-bold' : 'text-gray-500'}`}>盘亏 (-)</button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">差异数量 (吨)</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                        placeholder="0.00" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                </div>

                <div className="col-span-full mt-4 flex justify-end">
                    <button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2">
                        <Save size={18}/> 提交盘点
                    </button>
                </div>
            </InputSection>
        )}

    </div>
  );
};
