
import React, { useState, useMemo } from 'react';
import { Contract, Order, ContractType } from '../types';
import { MOCK_CONTRACTS, MOCK_ORDERS } from '../constants';
import { Filter, DollarSign, TrendingUp, TrendingDown, Calendar, PieChart, BarChart2, Activity, ShoppingBag } from 'lucide-react';

export const StatisticsAnalysis: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '2023-10-01', end: '2023-10-31' }); // Default to mock data range
  const [trendMode, setTrendMode] = useState<'daily' | 'monthly'>('daily');

  // --- Data Processing ---
  
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

  // --- Trend Data Generation ---
  const trendData = useMemo(() => {
      const data: Record<string, number> = {};
      
      // Aggregate based on mode
      filteredData.sales.forEach(o => {
          let key = o.shipDate; // Default daily: YYYY-MM-DD
          if (trendMode === 'monthly') {
              key = o.shipDate.substring(0, 7); // YYYY-MM
          }
          const amount = o.quantity * o.unitPrice;
          data[key] = (data[key] || 0) + amount;
      });

      // Convert to array and sort
      const sortedKeys = Object.keys(data).sort();
      
      // Fill gaps for better visuals (Optional simplified version)
      return sortedKeys.map(date => ({
          label: date,
          value: data[date]
      }));
  }, [filteredData.sales, trendMode]);

  // --- Comparison Generators (Mock Logic for Demo) ---
  const getComparison = (baseValue: number) => {
      // Simulate comparison data to show UI capabilities
      const randomChange = (Math.random() * 20) - 5; // -5% to +15%
      const isPositive = randomChange >= 0;
      return {
          percent: Math.abs(randomChange).toFixed(1),
          isPositive
      };
  };

  // --- Sub-Components ---

  const KPICard = ({ title, amount, icon: Icon, color, subText }: any) => {
      const mom = getComparison(amount);
      const yoy = getComparison(amount);
      
      return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <span className="text-gray-500 text-sm font-medium">{title}</span>
                <div className={`p-2 rounded-lg ${color.bg}`}>
                    <Icon size={20} className={color.text} />
                </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-4">
                {amount}
            </div>
            <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <span className="text-gray-400">环比</span>
                    <span className={`font-bold flex items-center ${mom.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {mom.isPositive ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {mom.percent}%
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-gray-400">同比</span>
                    <span className={`font-bold flex items-center ${yoy.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {yoy.isPositive ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {yoy.percent}%
                    </span>
                </div>
            </div>
        </div>
      );
  };

  const SimpleLineChart = ({ data, color = "#3b82f6" }: { data: { label: string, value: number }[], color?: string }) => {
      if (data.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">暂无趋势数据</div>;

      const height = 250;
      const width = 800; // SVG internal width
      const padding = 40;
      
      const values = data.map(d => d.value);
      const maxVal = Math.max(...values, 10000) * 1.1; // Add 10% headroom
      const minVal = 0;

      const getX = (index: number) => padding + (index * ((width - padding * 2) / (data.length > 1 ? data.length - 1 : 1)));
      const getY = (val: number) => height - padding - ((val - minVal) / (maxVal - minVal)) * (height - padding * 2);

      const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

      return (
          <div className="w-full overflow-x-auto custom-scrollbar">
              <div className="min-w-[600px]">
                <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                        const y = padding + ratio * (height - padding * 2);
                        return (
                            <g key={ratio}>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                                <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
                                    {((maxVal * (1 - ratio))/10000).toFixed(1)}w
                                </text>
                            </g>
                        );
                    })}

                    {/* Area Fill */}
                    <path 
                        d={`${points} L ${getX(data.length - 1)},${height - padding} L ${padding},${height - padding} Z`} 
                        fill={color} 
                        fillOpacity="0.1" 
                    />

                    {/* Line */}
                    <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Data Points */}
                    {data.map((d, i) => (
                        <g key={i} className="group">
                            <circle cx={getX(i)} cy={getY(d.value)} r="4" fill="white" stroke={color} strokeWidth="2" className="group-hover:r-6 transition-all" />
                            {/* Tooltip-ish text */}
                            <text x={getX(i)} y={getY(d.value) - 15} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151" className="opacity-0 group-hover:opacity-100 transition-opacity bg-white">
                                ¥{(d.value/10000).toFixed(2)}w
                            </text>
                            {/* X Axis Labels */}
                            <text x={getX(i)} y={height - 15} textAnchor="middle" fontSize="10" fill="#6b7280">
                                {d.label.slice(5)} {/* Show MM-DD */}
                            </text>
                        </g>
                    ))}
                </svg>
              </div>
          </div>
      );
  };

  const BarChartItem = ({ label, value, max, color }: any) => (
     <div className="mb-4 group">
        <div className="flex justify-between text-sm mb-1">
           <span className="text-gray-600 font-medium group-hover:text-blue-600 transition-colors">{label}</span>
           <span className="text-gray-900 font-bold">¥{(value/10000).toFixed(1)}万</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
           <div className={`h-2.5 rounded-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${Math.min((value/max)*100, 100)}%` }}></div>
        </div>
     </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
       <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">统计分析</h2>
          <p className="text-sm text-gray-500 mt-1">企业经营数据驾驶舱，提供同比、环比及趋势多维分析</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 sticky top-0 z-20 backdrop-blur-md bg-white/90">
         <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
                    <span className="text-sm text-gray-500 px-2 flex items-center gap-1"><Calendar size={14}/> 统计周期:</span>
                    <input type="date" className="bg-transparent text-sm font-medium text-gray-700 outline-none" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                    <span className="text-gray-400">-</span>
                    <input type="date" className="bg-transparent text-sm font-medium text-gray-700 outline-none" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>
                <button 
                   onClick={() => setDateRange({start: '2023-10-01', end: '2023-10-31'})}
                   className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                   本月
                </button>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setTrendMode('daily')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${trendMode === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>日趋势</button>
                <button onClick={() => setTrendMode('monthly')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${trendMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>月趋势</button>
            </div>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <KPICard 
            title="总销售收入 (Revenue)" 
            amount={`¥${(filteredData.totalRevenue / 10000).toFixed(2)}w`}
            icon={DollarSign} 
            color={{bg: 'bg-blue-50', text: 'text-blue-600'}}
         />
         <KPICard 
            title="总采购成本 (Cost)" 
            amount={`¥${(filteredData.totalCost / 10000).toFixed(2)}w`}
            icon={ShoppingBag} 
            color={{bg: 'bg-red-50', text: 'text-red-500'}} // Using ShoppingBag as proxy for Cost/Cart
         />
         <KPICard 
            title="毛利润 (Gross Profit)" 
            amount={`${filteredData.grossProfit >= 0 ? '+' : ''}¥${(filteredData.grossProfit / 10000).toFixed(2)}w`}
            icon={BarChart2} 
            color={{bg: 'bg-green-50', text: 'text-green-600'}}
         />
         <KPICard 
            title="毛利率 (Margin)" 
            amount={`${filteredData.margin.toFixed(2)}%`}
            icon={PieChart} 
            color={{bg: 'bg-purple-50', text: 'text-purple-600'}}
         />
      </div>

      {/* Trend Analysis Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Activity className="text-blue-500" size={18} /> 
                  销售{trendMode === 'daily' ? '日' : '月'}走势分析
              </h3>
              <div className="flex gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> 销售额</div>
                  {/* Future: Add more lines like Cost */}
              </div>
          </div>
          <SimpleLineChart data={trendData} color="#3b82f6" />
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Product Sales Analysis */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500" /> 产品销售收入排行</h3>
            {(() => {
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
         <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-800">收支明细记录</h3>
            <button className="text-xs text-blue-600 font-medium hover:underline">导出报表</button>
         </div>
         <div className="overflow-x-auto max-h-[400px]">
            <table className="min-w-full divide-y divide-gray-100">
               <thead className="bg-white sticky top-0 z-10 shadow-sm">
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
