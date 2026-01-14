
import React, { useState, useMemo } from 'react';
import { Warehouse, StockRecord, WarehouseType } from '../types';
import { MOCK_WAREHOUSES, MOCK_VEHICLE_POOL } from '../constants';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, ClipboardCheck, Save, Box, Search, Truck, Layers, QrCode, Send } from 'lucide-react';

interface WarehouseOperationsProps {
  onSaveRecord?: (record: StockRecord) => void;
}

export const WarehouseOperations: React.FC<WarehouseOperationsProps> = ({ onSaveRecord }) => {
  const [activeTab, setActiveTab] = useState<'gen' | 'in' | 'out' | 'dispatch' | 'transfer' | 'count'>('in');
  const [warehouses, setWarehouses] = useState<Warehouse[]>(MOCK_WAREHOUSES);

  // Form State
  const [formData, setFormData] = useState({
    // Common
    product: '湿法氟化铝',
    batchNo: '',
    weight: '',
    unit: '吨', // Unit selector
    // Gen Code
    line: '1号产线',
    date: new Date().toISOString().split('T')[0],
    materialType: 'finished' as 'finished' | 'semi',
    customerName: '', // For finished goods generation
    // Locations
    warehouseId: '',
    zoneId: '',
    targetWarehouseId: '',
    targetZoneId: '',
    // Transfer
    inWeight: '', // Separate weight for transfer in
    // Dispatch
    plate: '', 
    // Count
    adjType: 'add',
    reason: '',
    // Record
    operator: 'Admin', // Default operator
    confirmer: '系统自动' // Default confirmer
  });

  // Helpers to get available items for dropdowns
  const availableInventory = useMemo(() => {
    const items: Array<{
      whId: string; whName: string;
      zoneId: string; zoneName: string;
      product: string; qty: number; barcode: string;
      customer?: string;
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
            customer: i.customer || '通用库存',
            label: `${w.name}-${z.name} | ${i.productName} (${i.quantity}${i.unit}) [${i.barcode}] ${i.customer ? `(${i.customer})` : ''}`
          });
        });
      });
    });
    return items;
  }, [warehouses]);

  // Selected item detail helper
  const selectedItemDetail = useMemo(() => {
      if (!formData.batchNo) return null;
      return availableInventory.find(i => i.barcode === formData.batchNo);
  }, [formData.batchNo, availableInventory]);

  // Reset form when tab changes
  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setFormData(prev => ({
      ...prev,
      batchNo: '',
      weight: '',
      inWeight: '',
      plate: '',
      customerName: '',
      warehouseId: '', zoneId: '', targetWarehouseId: '', targetZoneId: ''
    }));
  };

  const handleSubmit = () => {
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const qty = parseFloat(formData.weight);

    // --- GENERATE CODE ---
    if (activeTab === 'gen') {
        const code = `CODE-${formData.date.replace(/-/g, '')}-${formData.line}-${Math.floor(Math.random()*1000)}`;
        alert(`条码生成成功！\n条码: ${code}\n产品: ${formData.product}\n类型: ${formData.materialType === 'finished' ? '成品' : '半成品'}\n${formData.materialType === 'finished' && formData.customerName ? `客户: ${formData.customerName}` : ''}`);
        return;
    }

    if (!qty || qty <= 0) return alert('请输入有效的数量/重量');

    // --- INBOUND ---
    if (activeTab === 'in') {
        if (!formData.warehouseId || !formData.zoneId) return alert('请选择目标仓库和库区');
        
        // Mock Inbound Logic
        const refInfo = formData.batchNo ? `批号:${formData.batchNo}` : '直接入库';
        const custInfo = formData.customerName ? `[${formData.customerName}]` : '';
        
        alert(`入库成功！\n产品: ${formData.product} ${custInfo}\n位置: ${formData.warehouseId}-${formData.zoneId}\n数量: ${qty}${formData.unit}`);
        
        if(onSaveRecord) onSaveRecord({
            id: `op-${Date.now()}`, date: now, type: 'in', 
            product: formData.product, qty, unit: formData.unit as any, 
            ref: `${refInfo} ${custInfo}`, 
            operator: formData.operator, confirmer: formData.confirmer
        });
    }

    // --- OUTBOUND (General) ---
    if (activeTab === 'out') {
        if (!formData.batchNo) return alert('请选择出库货物');
        if (!selectedItemDetail) return alert('库存不存在');
        
        alert(`出库成功！\n产品: ${selectedItemDetail.product}\n扣减库存: ${qty}${formData.unit}`);
        
        if(onSaveRecord) onSaveRecord({
            id: `op-${Date.now()}`, date: now, type: 'out', 
            product: selectedItemDetail.product, qty, unit: formData.unit as any, 
            ref: `常规出库 - ${selectedItemDetail.barcode}`,
            operator: formData.operator, confirmer: formData.confirmer
        });
    }

    // --- DISPATCH (Shipping) ---
    if (activeTab === 'dispatch') {
        if (!formData.batchNo) return alert('请选择发货货物');
        if (!selectedItemDetail) return alert('库存不存在');
        if (!formData.plate) return alert('发货操作必须填写车牌号！');

        alert(`发货成功！\n产品: ${selectedItemDetail.product}\n客户: ${selectedItemDetail.customer}\n车辆: ${formData.plate}\n数量: ${qty}${formData.unit}`);
        
        if(onSaveRecord) onSaveRecord({
            id: `op-${Date.now()}`, date: now, type: 'dispatch', 
            product: selectedItemDetail.product, qty, unit: formData.unit as any, 
            ref: `销售发货 - ${selectedItemDetail.customer || '通用'}`,
            plate: formData.plate,
            operator: formData.operator, confirmer: formData.confirmer
        });
    }

    // --- TRANSFER ---
    if (activeTab === 'transfer') {
        if (!formData.batchNo) return alert('请选择源库存');
        if (!formData.targetWarehouseId || !formData.targetZoneId) return alert('请选择移入位置');
        
        const inQty = parseFloat(formData.inWeight) || qty; // Default to out weight if not set

        alert(`移库成功！\n从: ${selectedItemDetail?.whName}\n到: ${formData.targetWarehouseId}\n出库: ${qty}${formData.unit}, 入库: ${inQty}${formData.unit}`);
        
        if(onSaveRecord) onSaveRecord({
            id: `op-${Date.now()}`, date: now, type: 'transfer', 
            product: selectedItemDetail?.product || '', qty, unit: formData.unit as any, 
            ref: `移库 (入库量:${inQty})`,
            operator: formData.operator, confirmer: formData.confirmer
        });
    }

    // --- COUNT ---
    if (activeTab === 'count') {
        if (!formData.batchNo) return alert('请选择盘点对象');
        
        alert(`盘点录入成功！\n对象: ${selectedItemDetail?.product}\n调整: ${formData.adjType === 'add' ? '盘盈' : '盘亏'} ${qty}${formData.unit}`);
        
        if(onSaveRecord) onSaveRecord({
            id: `op-${Date.now()}`, date: now, type: 'adjust', 
            product: selectedItemDetail?.product || '未知', qty, unit: formData.unit as any, 
            ref: '库存盘点',
            operator: formData.operator, confirmer: formData.confirmer
        });
    }

    // Clear key fields but keep context
    setFormData(prev => ({ ...prev, weight: '', batchNo: '', inWeight: '' }));
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
            <p className="text-sm text-gray-500 mt-1">集成了条码生成、出入库、发货、调仓及盘点功能</p>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex flex-wrap mb-6">
            <button onClick={() => handleTabChange('gen')} className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'gen' ? 'bg-slate-100 text-slate-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <QrCode size={18}/> 条码生成
            </button>
            <button onClick={() => handleTabChange('in')} className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'in' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <ArrowDownCircle size={18}/> 入库作业
            </button>
            <button onClick={() => handleTabChange('out')} className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'out' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <ArrowUpCircle size={18}/> 普通出库
            </button>
            <button onClick={() => handleTabChange('dispatch')} className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'dispatch' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Send size={18}/> 销售发货
            </button>
            <button onClick={() => handleTabChange('transfer')} className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'transfer' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <RefreshCw size={18}/> 移库调拨
            </button>
            <button onClick={() => handleTabChange('count')} className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'count' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                <ClipboardCheck size={18}/> 库存盘点
            </button>
        </div>

        {/* --- GEN CODE FORM --- */}
        {activeTab === 'gen' && (
            <InputSection title="条码生成">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产线</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none" value={formData.line} onChange={e => setFormData({...formData, line: e.target.value})}>
                     <option>1号产线</option><option>2号产线</option><option>3号产线</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">品名</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none" value={formData.product} onChange={e => setFormData({...formData, product: e.target.value})}>
                     <option>湿法氟化铝</option><option>氧化铝</option><option>氢氧化铝</option><option>萤石</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">生产日期</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                  <div className="flex gap-4">
                     <label className="flex items-center gap-2"><input type="radio" checked={formData.materialType === 'finished'} onChange={() => setFormData({...formData, materialType: 'finished'})} /> 成品</label>
                     <label className="flex items-center gap-2"><input type="radio" checked={formData.materialType === 'semi'} onChange={() => setFormData({...formData, materialType: 'semi'})} /> 半成品</label>
                  </div>
               </div>
               {formData.materialType === 'finished' && (
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">客户名称 (可选)</label>
                      <input type="text" placeholder="输入客户名称" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                   </div>
               )}
               <div className="col-span-full flex justify-end mt-2">
                  <button onClick={handleSubmit} className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800">生成并打印条码</button>
               </div>
            </InputSection>
        )}

        {/* --- INBOUND FORM --- */}
        {activeTab === 'in' && (
            <InputSection title="入库信息录入">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">入库批号 (扫码/输入)</label>
                    <div className="flex gap-2">
                        <input type="text" placeholder="扫描条码" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none" value={formData.batchNo} onChange={e => setFormData({...formData, batchNo: e.target.value})} />
                        {/* Mock Scan */}
                        <button onClick={() => setFormData({...formData, batchNo: 'MOCK-SCAN-001', product: '湿法氟化铝', customerName: '申鼎商贸'})} className="bg-gray-200 px-3 rounded-lg text-xs">模拟扫码</button>
                    </div>
                </div>
                {/* Auto-fill Info Area */}
                <div className="col-span-2 bg-gray-50 rounded-lg p-3 border border-gray-100 flex gap-4 text-sm items-center">
                    <div className="font-bold text-gray-700">产品: {formData.product}</div>
                    {/* Show customer only if we pretend it's a finished good scan */}
                    {formData.customerName && <div className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">客户: {formData.customerName}</div>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">目标仓库</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                        value={formData.warehouseId} onChange={e => setFormData({...formData, warehouseId: e.target.value, zoneId: ''})}>
                        <option value="">-- 选择仓库 --</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">目标库区</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                        value={formData.zoneId} onChange={e => setFormData({...formData, zoneId: e.target.value})}>
                        <option value="">-- 先选仓库 --</option>
                        {warehouses.find(w => w.id === formData.warehouseId)?.zones.map(z => 
                            <option key={z.id} value={z.id}>{z.name}</option>
                        )}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">入库重量</label>
                    <div className="flex">
                        <input type="number" className="w-full border border-gray-300 rounded-l-lg p-2.5 outline-none font-bold"
                            placeholder="0.00" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                        <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 px-2 text-sm text-gray-700 outline-none">
                            <option value="吨">吨</option>
                            <option value="kg">kg</option>
                        </select>
                    </div>
                </div>
                <div className="col-span-full mt-4 flex justify-end items-center gap-4">
                    <div className="text-xs text-gray-400">操作人: {formData.operator} | 确认人: {formData.confirmer}</div>
                    <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2">
                        <Save size={18}/> 确认入库
                    </button>
                </div>
            </InputSection>
        )}

        {/* --- OUTBOUND & DISPATCH FORMS --- */}
        {(activeTab === 'out' || activeTab === 'dispatch') && (
            <InputSection title={activeTab === 'out' ? "普通出库 (领用/消耗)" : "销售发货 (装车)"}>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择批次/库存 (扫码或选择)</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                        value={formData.batchNo} onChange={e => setFormData({...formData, batchNo: e.target.value})}>
                        <option value="">-- 请选择库存 --</option>
                        {availableInventory.map((item, idx) => (
                            <option key={idx} value={item.barcode}>{item.label}</option>
                        ))}
                    </select>
                </div>

                {/* Info Display */}
                {selectedItemDetail && (
                    <div className="col-span-full bg-orange-50 p-3 rounded-lg border border-orange-100 flex flex-wrap gap-4 text-sm items-center">
                        <div>产品: <b>{selectedItemDetail.product}</b></div>
                        <div>位置: {selectedItemDetail.whName}/{selectedItemDetail.zoneName}</div>
                        {selectedItemDetail.customer && <div>客户: <span className="text-indigo-600 font-bold">{selectedItemDetail.customer}</span></div>}
                    </div>
                )}

                {/* Dispatch Specific: Plate */}
                {activeTab === 'dispatch' && (
                    <div className="col-span-1">
                        <label className="block text-sm font-bold text-indigo-700 mb-1">车牌号 (必填)</label>
                        <select className="w-full border border-indigo-300 rounded-lg p-2.5 outline-none bg-indigo-50"
                            value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})}>
                            <option value="">-- 选择车辆 --</option>
                            {MOCK_VEHICLE_POOL.map(v => <option key={v.id} value={v.plateNumber}>{v.plateNumber} ({v.driverName})</option>)}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">出库重量</label>
                    <div className="flex">
                        <input type="number" className="w-full border border-gray-300 rounded-l-lg p-2.5 outline-none font-bold"
                            placeholder="0.00" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                        <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 px-2 text-sm text-gray-700 outline-none">
                            <option value="吨">吨</option>
                            <option value="kg">kg</option>
                        </select>
                    </div>
                </div>

                <div className="col-span-full mt-4 flex justify-end items-center gap-4">
                    <div className="text-xs text-gray-400">操作人: {formData.operator} | 确认人: {formData.confirmer}</div>
                    <button onClick={handleSubmit} className={`${activeTab === 'dispatch' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-600 hover:bg-orange-700'} text-white px-8 py-2.5 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2`}>
                        <Save size={18}/> {activeTab === 'dispatch' ? '确认发货' : '确认出库'}
                    </button>
                </div>
            </InputSection>
        )}

        {/* --- TRANSFER FORM --- */}
        {activeTab === 'transfer' && (
            <InputSection title="移库调拨操作">
                <div className="col-span-full bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                    <label className="block text-sm font-bold text-blue-800 mb-2">第一步：选择源库存</label>
                    <select className="w-full border border-blue-200 rounded-lg p-2.5 outline-none"
                        value={formData.batchNo} onChange={e => setFormData({...formData, batchNo: e.target.value})}>
                        <option value="">-- 请选择要移动的库存记录 --</option>
                        {availableInventory.map((item, idx) => (
                            <option key={idx} value={item.barcode}>{item.label}</option>
                        ))}
                    </select>
                </div>

                {formData.batchNo && (
                    <>
                        <div className="col-span-full">
                             {selectedItemDetail && <div className="text-xs text-gray-500 mb-2">当前位置: {selectedItemDetail.whName} - {selectedItemDetail.zoneName}</div>}
                             <label className="block text-sm font-medium text-gray-700 mb-1">出库重量</label>
                             <div className="flex w-1/2">
                                <input type="number" className="w-full border border-gray-300 rounded-l-lg p-2.5 outline-none"
                                    placeholder="0.00" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value, inWeight: e.target.value})} />
                                <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 px-2 text-sm text-gray-700 outline-none">
                                    <option value="吨">吨</option>
                                    <option value="kg">kg</option>
                                </select>
                             </div>
                        </div>

                        <div className="col-span-full my-2 border-t border-gray-100"></div>
                        <div className="col-span-full">
                             <label className="block text-sm font-bold text-gray-800 mb-2">第二步：设置移入位置</label>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">移入仓库</label>
                            <select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                                value={formData.targetWarehouseId} onChange={e => setFormData({...formData, targetWarehouseId: e.target.value, targetZoneId: ''})}>
                                <option value="">-- 选择仓库 --</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">移入库区</label>
                            <select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                                value={formData.targetZoneId} onChange={e => setFormData({...formData, targetZoneId: e.target.value})}>
                                <option value="">-- 先选仓库 --</option>
                                {warehouses.find(w => w.id === formData.targetWarehouseId)?.zones.map(z => 
                                    <option key={z.id} value={z.id}>{z.name}</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">入库重量 (通常等于出库)</label>
                            <div className="flex">
                                <input type="number" className="w-full border border-gray-300 rounded-l-lg p-2.5 outline-none font-bold"
                                    placeholder="0.00" value={formData.inWeight} onChange={e => setFormData({...formData, inWeight: e.target.value})} />
                                <span className="border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">{formData.unit}</span>
                            </div>
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
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                        value={formData.batchNo} onChange={e => setFormData({...formData, batchNo: e.target.value})}>
                        <option value="">-- 请选择库存记录 --</option>
                        {availableInventory.map((item, idx) => (
                            <option key={idx} value={item.barcode}>{item.label}</option>
                        ))}
                    </select>
                </div>
                {/* Info Display for Count */}
                {selectedItemDetail && (
                    <div className="col-span-full bg-purple-50 p-2 rounded text-sm text-purple-800 mb-2">
                        {selectedItemDetail.product} | {selectedItemDetail.whName}-{selectedItemDetail.zoneName} | 账面: {selectedItemDetail.qty}{formData.unit}
                        {selectedItemDetail.customer && ` | 客户: ${selectedItemDetail.customer}`}
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">调整类型</label>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setFormData({...formData, adjType: 'add'})} className={`flex-1 py-1.5 rounded text-sm transition-all ${formData.adjType === 'add' ? 'bg-white text-green-600 shadow font-bold' : 'text-gray-500'}`}>盘盈 (+)</button>
                        <button onClick={() => setFormData({...formData, adjType: 'sub'})} className={`flex-1 py-1.5 rounded text-sm transition-all ${formData.adjType === 'sub' ? 'bg-white text-red-600 shadow font-bold' : 'text-gray-500'}`}>盘亏 (-)</button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">差异数量</label>
                    <div className="flex">
                        <input type="number" className="w-full border border-gray-300 rounded-l-lg p-2.5 outline-none font-bold"
                            placeholder="0.00" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                        <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 px-2 text-sm text-gray-700 outline-none">
                            <option value="吨">吨</option>
                            <option value="kg">kg</option>
                        </select>
                    </div>
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
