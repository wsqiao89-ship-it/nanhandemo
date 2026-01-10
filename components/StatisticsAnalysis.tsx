import React, { useState, useMemo } from 'react';
import { Contract, Order, ContractType } from '../types';
import { MOCK_CONTRACTS, MOCK_ORDERS } from '../constants';
import { Filter, DollarSign, TrendingUp, TrendingDown, Calendar, PieChart } from 'lucide-react';

export const StatisticsAnalysis: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Mock Data Integration
  // Sales Revenue: From Orders (Quantity * UnitPrice)
  // Procurement Cost: From Contracts (Purchase type)
  
  const filteredData = useMemo(() => {
    // 1. Sales Data (Orders)
    const sales = MOCK_ORDERS.filter(o => {
       if (dateRange.start && o.shipDate < dateRange.start) return false;
       if (dateRange.end && o.shipDate > dateRange.end) return false;
       return true;
    });

    // 2. Purchase Data (Contracts)
    const purchases = MOCK_CONTRACTS.filter(c => {
       if (c.type !== ContractType.Purchase) return false;
       if (dateRange.start && c.signDate < dateRange.start) return false;
       if (dateRange.end && c.signDate > dateRange.end) return false;
       return true;
    });

    const totalRevenue = sales.reduce((acc, o) => acc + (o.quantity * o.unitPrice), 0);
    const totalCost = purchases.reduce((acc, c) => acc + (c.amount || 0), 0);
    const grossProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCost, grossProfit, margin, sales, purchases };
  }, [dateRange]);

  // Visual Components (CSS Bars)
  const BarChartItem = ({ label, value, max, color }: any) => (
     <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
           <span className="text-gray-600 font-medium">{label}</span>
           <span className="text-gray-900 font-bold">¥{(value/10000).toFixed(1)}万</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
           <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min((value/max)*100, 100)}%` }}></div>
        </div>
     </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">统计分析</h2>
          <p className="text-sm text-gray-500 mt-1">企业经营数据驾驶舱，收入、成本与利润多维分析</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
         <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-400" />
            <div className="flex items-center gap-2">
               <span className="text-sm text-gray-600">日期范围:</span>
               <input type="date" className="border rounded-md px-3 py-1.5 text-sm" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
               <span className="text-gray-400">-</span>
               <input type="date" className="border rounded-md px-3 py-1.5 text-sm" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
            </div>
            <button 
               onClick={() => setDateRange({start: '', end: ''})}
               className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-4"
            >
               重置筛选
            </button>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start opacity-90 mb-4">
               <span className="text-sm font-medium">总收入 (Revenue)</span>
               <DollarSign size={20} />
            </div>
            <div className="text-3xl font-bold">¥{(filteredData.totalRevenue / 10000).toFixed(2)}w</div>
            <div className="mt-2 text-xs bg-white/20 px-2 py-1 rounded inline-block">
               {filteredData.sales.length} 笔销售订单
            </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start text-gray-500 mb-4">
               <span className="text-sm font-medium">总成本 (Cost)</span>
               <TrendingDown size={20} className="text-red-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">¥{(filteredData.totalCost / 10000).toFixed(2)}w</div>
            <div className="mt-2 text-xs text-gray-500">
               {filteredData.purchases.length} 笔采购合同
            </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start text-gray-500 mb-4">
               <span className="text-sm font-medium">毛利润 (Gross Profit)</span>
               <TrendingUp size={20} className="text-green-500" />
            </div>
            <div className={`text-3xl font-bold ${filteredData.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
               {filteredData.grossProfit >= 0 ? '+' : ''}¥{(filteredData.grossProfit / 10000).toFixed(2)}w
            </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start text-gray-500 mb-4">
               <span className="text-sm font-medium">毛利率 (Margin)</span>
               <PieChart size={20} className="text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-purple-600">{filteredData.margin.toFixed(1)}%</div>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
               <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${Math.max(0, Math.min(filteredData.margin, 100))}%` }}></div>
            </div>
         </div>
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         
         {/* Product Sales Analysis */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500" /> 产品销售收入排行</h3>
            
            {(() => {
               // Group sales by product
               const productSales = filteredData.sales.reduce((acc, o) => {
                  acc[o.productName] = (acc[o.productName] || 0) + (o.quantity * o.unitPrice);
                  return acc;
               }, {} as Record<string, number>);
               const sortedProducts = (Object.entries(productSales) as [string, number][]).sort((a, b) => b[1] - a[1]);
               const maxVal = sortedProducts[0]?.[1] || 1;

               return (
                  <div className="space-y-2">
                     {sortedProducts.length > 0 ? sortedProducts.map(([name, val]) => (
                        <BarChartItem key={name} label={name} value={val} max={maxVal} color="bg-blue-500" />
                     )) : <div className="text-center text-gray-400 py-10">暂无销售数据</div>}
                  </div>
               );
            })()}
         </div>

         {/* Purchase Cost Analysis */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><TrendingDown size={18} className="text-red-500" /> 原料采购成本排行</h3>
            
             {(() => {
               // Group purchases by product
               const productCosts = filteredData.purchases.reduce((acc, c) => {
                  acc[c.productName] = (acc[c.productName] || 0) + (c.amount || 0);
                  return acc;
               }, {} as Record<string, number>);
               const sortedCosts = (Object.entries(productCosts) as [string, number][]).sort((a, b) => b[1] - a[1]);
               const maxVal = sortedCosts[0]?.[1] || 1;

               return (
                  <div className="space-y-2">
                     {sortedCosts.length > 0 ? sortedCosts.map(([name, val]) => (
                        <BarChartItem key={name} label={name} value={val} max={maxVal} color="bg-red-500" />
                     )) : <div className="text-center text-gray-400 py-10">暂无采购数据</div>}
                  </div>
               );
            })()}
         </div>

      </div>

      {/* Detailed Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="font-bold text-gray-800">收支明细记录</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
               <thead className="bg-white">
                  <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">日期</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">类型</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">摘要 (客户/供应商 - 产品)</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">数量</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">金额</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {/* Sales Rows */}
                  {filteredData.sales.map(o => (
                     <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-500">{o.shipDate}</td>
                        <td className="px-6 py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">收入</span></td>
                        <td className="px-6 py-3 text-sm text-gray-900">{o.customerName} - {o.productName}</td>
                        <td className="px-6 py-3 text-sm text-right">{o.quantity} 吨</td>
                        <td className="px-6 py-3 text-sm text-right font-medium text-green-600">+¥{(o.quantity * o.unitPrice).toLocaleString()}</td>
                     </tr>
                  ))}
                  {/* Purchase Rows */}
                  {filteredData.purchases.map(c => (
                     <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-500">{c.signDate}</td>
                        <td className="px-6 py-3"><span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">支出</span></td>
                        <td className="px-6 py-3 text-sm text-gray-900">{c.customerName} - {c.productName}</td>
                        <td className="px-6 py-3 text-sm text-right">{c.quantity} 吨</td>
                        <td className="px-6 py-3 text-sm text-right font-medium text-red-600">-¥{(c.amount || 0).toLocaleString()}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};