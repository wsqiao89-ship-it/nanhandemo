
import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, FileText, Edit, Trash2, Paperclip, Calendar, User, ArrowRight, Package } from 'lucide-react';
import { Contract, ContractStatus, ContractType } from '../types';
import { MOCK_CONTRACTS } from '../constants';

interface ContractManagementProps {
  onGenerateOrder: (contract: Contract) => void;
}

export const ContractManagement: React.FC<ContractManagementProps> = ({ onGenerateOrder }) => {
  const [contracts, setContracts] = useState<Contract[]>(MOCK_CONTRACTS);
  
  // Filters State
  const [filters, setFilters] = useState({
    customerName: '',
    signDate: '',
    status: '',
    productName: '',
    type: '',
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // Form State
  const initialForm = {
    contractNumber: '',
    signDate: '',
    customerName: '',
    productName: '',
    spec: '',
    quantity: '',
    unit: '吨', // Added unit
    deliveryTime: '',
    type: ContractType.Sales,
    attachment: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // --- Helpers ---
  const generateContractName = (customer: string, quantity: string | number, unit: string, date: string) => {
    if (!customer) return '';
    return `${customer}${quantity ? ` ${quantity}${unit}` : ''}|${date ? ` ${date}` : ''}`;
  };

  const currentUser = 'Admin User'; // Mock current user

  // --- Handlers ---
  const handleOpenModal = (contract?: Contract) => {
    if (contract) {
      setEditingContract(contract);
      setFormData({
        contractNumber: contract.contractNumber,
        signDate: contract.signDate,
        customerName: contract.customerName,
        productName: contract.productName,
        spec: contract.spec,
        quantity: contract.quantity.toString(),
        unit: contract.unit || '吨',
        deliveryTime: contract.deliveryTime,
        type: contract.type,
        attachment: contract.attachment || ''
      });
    } else {
      setEditingContract(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContract(null);
  };

  const handleSave = () => {
    if (!formData.contractNumber || !formData.customerName) return alert('请填写必填项');

    const name = generateContractName(formData.customerName, formData.quantity, formData.unit, formData.signDate);
    const quantityNum = parseFloat(formData.quantity) || 0;

    if (editingContract) {
      setContracts(prev => prev.map(c => c.id === editingContract.id ? {
        ...c,
        ...formData,
        quantity: quantityNum,
        unit: formData.unit as any,
        name
      } : c));
    } else {
      const newContract: Contract = {
        id: `con-${Date.now()}`,
        ...formData,
        quantity: quantityNum,
        unit: formData.unit as any,
        status: ContractStatus.New,
        owner: currentUser,
        name
      };
      setContracts(prev => [newContract, ...prev]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此合同吗?')) {
      setContracts(prev => prev.filter(c => c.id !== id));
    }
  };

  // --- Filter Logic ---
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      return (
        c.customerName.includes(filters.customerName) &&
        (filters.signDate === '' || c.signDate === filters.signDate) &&
        (filters.status === '' || c.status === filters.status) &&
        c.productName.includes(filters.productName) &&
        (filters.type === '' || c.type === filters.type)
      );
    });
  }, [contracts, filters]);

  // --- UI Components ---
  const StatusPill = ({ status }: { status: ContractStatus }) => {
    let color = 'bg-gray-100 text-gray-600';
    if (status === ContractStatus.New) color = 'bg-blue-100 text-blue-600';
    if (status === ContractStatus.Shipping) color = 'bg-orange-100 text-orange-600';
    if (status === ContractStatus.Completed) color = 'bg-green-100 text-green-600';
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{status}</span>;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">合同管理</h2>
            <p className="text-sm text-gray-500 mt-1">全周期管理采购与销售合同，支持一键生成订单</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all text-sm font-medium"
          >
            <Plus size={18} /> 新增合同
          </button>
       </div>

       {/* Filter Bar */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
                <input type="text" placeholder="客户名称" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  value={filters.customerName} onChange={e => setFilters({...filters, customerName: e.target.value})} />
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            </div>
            <input type="text" placeholder="产品名称" className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm transition-all"
               value={filters.productName} onChange={e => setFilters({...filters, productName: e.target.value})} />
            
            <input type="date" className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm transition-all"
               title="签订日期"
               value={filters.signDate} onChange={e => setFilters({...filters, signDate: e.target.value})} />
            
            <select className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm transition-all"
               value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
              <option value="">所有类型</option>
              {Object.values(ContractType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm transition-all"
               value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="">所有状态</option>
              {Object.values(ContractStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            
            <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-all"
                onClick={() => setFilters({ customerName: '', signDate: '', status: '', productName: '', type: '' })}>
              <Filter size={16} /> 重置
            </button>
          </div>
       </div>

       {/* Contract Table */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">合同名称</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">类型 / 编号</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">产品详情</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">数量 / 交付</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">状态 / 负责人</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4">
                       <div className="text-sm font-bold text-gray-800">{c.name}</div>
                       <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Calendar size={12}/> 签: {c.signDate}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`text-[10px] px-1.5 py-0.5 rounded border ${c.type === ContractType.Purchase ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                         {c.type}
                       </span>
                       <div className="text-sm font-mono text-gray-600 mt-1">{c.contractNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="text-sm text-gray-900">{c.productName}</div>
                       <div className="text-xs text-gray-500 bg-gray-100 inline-block px-1.5 rounded mt-0.5">{c.spec}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="text-sm font-bold text-gray-900">{c.quantity} {c.unit || '吨'}</div>
                       <div className="text-xs text-gray-500">交: {c.deliveryTime}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 mb-1">
                          <StatusPill status={c.status} />
                       </div>
                       <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User size={12} /> {c.owner}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2 items-center">
                          {c.attachment && (
                            <button className="text-gray-400 hover:text-blue-600" title={`附件: ${c.attachment}`}>
                               <Paperclip size={16} />
                            </button>
                          )}
                          <div className="w-px h-4 bg-gray-200 mx-1"></div>
                          <button 
                             onClick={() => handleOpenModal(c)} 
                             className="text-gray-400 hover:text-gray-700"
                             title="编辑"
                          >
                             <Edit size={16} />
                          </button>
                          <button 
                             onClick={() => handleDelete(c.id)} 
                             disabled={c.status !== ContractStatus.New}
                             className={`text-gray-400 ${c.status === ContractStatus.New ? 'hover:text-red-600' : 'opacity-30 cursor-not-allowed'}`}
                             title="删除 (仅限新增状态)"
                          >
                             <Trash2 size={16} />
                          </button>
                          <button 
                             onClick={() => onGenerateOrder(c)}
                             className="ml-2 flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs font-medium hover:bg-indigo-100 transition-colors"
                          >
                             <Package size={14} /> 生成订单
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredContracts.length === 0 && (
               <div className="p-8 text-center text-gray-400 text-sm">暂无合同数据</div>
            )}
          </div>
       </div>

       {/* Modal */}
       {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
             <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-900 opacity-60" onClick={handleCloseModal}></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                   <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">{editingContract ? '编辑合同' : '新增合同'}</h3>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">合同类型</label>
                            <div className="mt-1 flex gap-4">
                               {Object.values(ContractType).map(t => (
                                 <label key={t} className="flex items-center">
                                    <input 
                                      type="radio" 
                                      name="type" 
                                      value={t} 
                                      checked={formData.type === t} 
                                      onChange={() => setFormData({...formData, type: t})}
                                      className="mr-2"
                                    />
                                    {t}
                                 </label>
                               ))}
                            </div>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">合同编号</label>
                            <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm" 
                               value={formData.contractNumber} onChange={e => setFormData({...formData, contractNumber: e.target.value})} placeholder="自动生成或手动输入" />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">签订日期</label>
                            <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm" 
                               value={formData.signDate} onChange={e => setFormData({...formData, signDate: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">客户名称</label>
                            <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm" 
                               value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">产品名称</label>
                            <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm" 
                               value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">产品规格</label>
                            <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm" 
                               value={formData.spec} onChange={e => setFormData({...formData, spec: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">数量</label>
                            <div className="flex mt-1">
                                <input type="number" className="block w-full border border-gray-300 rounded-l-md p-2 text-sm" 
                                value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                                <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="border border-l-0 border-gray-300 rounded-r-md bg-gray-50 px-2 text-sm text-gray-700 outline-none">
                                    <option value="吨">吨</option>
                                    <option value="kg">kg</option>
                                </select>
                            </div>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">交付时间</label>
                            <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm" 
                               value={formData.deliveryTime} onChange={e => setFormData({...formData, deliveryTime: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">附件</label>
                            <div className="mt-1 flex items-center border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                               <Paperclip size={16} className="text-gray-400 mr-2"/>
                               <span className="text-sm text-gray-500">{formData.attachment || '点击上传 (Mock)'}</span>
                            </div>
                         </div>
                      </div>
                      <div className="mt-6 flex justify-end gap-3">
                         <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">取消</button>
                         <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       )}

    </div>
  );
};
