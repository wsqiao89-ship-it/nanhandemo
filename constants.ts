
import { Order, OrderStatus, VehicleStatus, RecordType, VehicleMaster, Contract, ContractStatus, ContractType, Warehouse, WarehouseType, ProductCodeRule, ProductionCode } from './types';

const generateHistory = (status: string) => [
  { date: '2023-10-20 09:00', action: '创建订单', user: '销售部-李经理' },
  { date: '2023-10-20 10:30', action: `状态更新: ${status}`, user: '物流部-王调度' },
];

// Master List of Vehicles (Vehicle Pool)
export const MOCK_VEHICLE_POOL: VehicleMaster[] = [
  { id: 'v1', plateNumber: '鲁C88888', driverName: '张建国', driverPhone: '13800138000' },
  { id: 'v2', plateNumber: '鲁C66666', driverName: '李富贵', driverPhone: '13900139000' },
  { id: 'v3', plateNumber: '鲁Q12345', driverName: '王铁柱', driverPhone: '13700137000' },
  { id: 'v4', plateNumber: '冀B99999', driverName: '赵大力', driverPhone: '15000000000' },
  { id: 'v5', plateNumber: '豫K56789', driverName: '孙保国', driverPhone: '15100000000' },
  { id: 'v6', plateNumber: '苏G55555', driverName: '周发财', driverPhone: '15200000000' },
];

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'c1',
    contractNumber: 'CON-2023-001',
    name: '申鼎商贸500吨|2023-10-20',
    signDate: '2023-10-20',
    customerName: '申鼎商贸',
    productName: '氟化铝',
    spec: 'GB/T4292-2017 AF-1',
    quantity: 500,
    amount: 3250000,
    deliveryTime: '2023-11-20',
    status: ContractStatus.Shipping,
    type: ContractType.Sales,
    owner: 'Admin User',
    attachment: '销售合同_001.pdf'
  },
  {
    id: 'c2',
    contractNumber: 'CON-2023-002',
    name: '奥鹏200吨|2023-10-22',
    signDate: '2023-10-22',
    customerName: '奥鹏',
    productName: '氟化铝',
    spec: '98% / 罐车',
    quantity: 200,
    amount: 90000,
    deliveryTime: '2023-11-22',
    status: ContractStatus.Shipping,
    type: ContractType.Sales,
    owner: 'Admin User',
    attachment: '销售合同_002.pdf'
  },
  {
    id: 'c3',
    contractNumber: 'PUR-2023-088',
    name: '原料采购-萤石1000吨|2023-10-25',
    signDate: '2023-10-25',
    customerName: '西部矿业',
    productName: '萤石',
    spec: '原矿',
    quantity: 1000,
    amount: 2800000,
    deliveryTime: '2023-12-01',
    status: ContractStatus.New,
    type: ContractType.Purchase,
    owner: 'Admin User'
  },
  {
    id: 'c4',
    contractNumber: 'PUR-2023-090',
    name: '原料采购-煤炭500吨|2023-10-28',
    signDate: '2023-10-28',
    customerName: '山西能源',
    productName: '无烟煤',
    spec: '块煤',
    quantity: 500,
    amount: 600000,
    deliveryTime: '2023-11-15',
    status: ContractStatus.Shipping,
    type: ContractType.Purchase,
    owner: 'Admin User'
  }
];

export const MOCK_ORDERS: Order[] = [
  // --- SALES ORDERS ---
  {
    id: 'ORD-20231029-000',
    type: 'sales',
    contractId: 'CON-NEW-000',
    customerName: '新希望集团',
    productName: '氟化铝',
    category: 'main',
    spec: '25kg/袋',
    quantity: 150,
    unitPrice: 3200,
    shipDate: '2023-10-29',
    status: OrderStatus.PendingAudit,
    vehicles: [],
    history: [{ date: '2023-10-29 08:30', action: '创建订单', user: '销售部-赵云' }],
  },
  {
    id: 'ORD-20231027-001',
    type: 'sales',
    contractId: 'CON-SD-001',
    customerName: '申鼎商贸',
    productName: '氟化铝',
    category: 'main',
    spec: 'GB/T4292-2017 AF-1',
    quantity: 500,
    unitPrice: 6500,
    shipDate: '2023-10-27',
    status: OrderStatus.ReadyToShip,
    vehicles: [
      { id: 'rec-1', plateNumber: '鲁C88888', driverName: '张建国', driverPhone: '13800138000', loadWeight: 32, status: VehicleStatus.PendingEntry, type: RecordType.Normal },
      { id: 'rec-2', plateNumber: '鲁C66666', driverName: '李富贵', driverPhone: '13900139000', loadWeight: 33, status: VehicleStatus.PendingEntry, type: RecordType.Normal }
    ],
    history: generateHistory(OrderStatus.ReadyToShip),
  },
  {
    id: 'ORD-20231027-002',
    type: 'sales',
    contractId: 'CON-AP-002',
    customerName: '奥鹏',
    productName: '氟化铝',
    category: 'main',
    spec: '98% / 罐车',
    quantity: 200,
    unitPrice: 450,
    shipDate: '2023-10-27',
    status: OrderStatus.Shipping,
    vehicles: [
      { id: 'rec-3-finished', plateNumber: '苏G55555', driverName: '周发财', driverPhone: '15200000000', loadWeight: 32, status: VehicleStatus.Exited, entryTime: '2023-10-27 07:00', weighing1: { time: '07:10', weight: 15.2 }, weighing2: { time: '08:40', weight: 47.2 }, exitTime: '2023-10-27 08:50', actualOutWeight: 32.0, type: RecordType.Normal },
      { id: 'rec-3', plateNumber: '鲁Q12345', driverName: '王铁柱', driverPhone: '13700137000', loadWeight: 30, status: VehicleStatus.Loading, entryTime: '2023-10-27 08:05', weighing1: { time: '08:15', weight: 15.5 }, type: RecordType.Normal },
      { id: 'rec-4', plateNumber: '冀B99999', driverName: '赵大力', driverPhone: '15000000000', loadWeight: 30, status: VehicleStatus.PendingEntry, type: RecordType.Normal }
    ],
    history: generateHistory(OrderStatus.Shipping),
  },
  {
    id: 'ORD-20231026-003',
    type: 'sales',
    contractId: 'CON-JHY-003',
    customerName: '聚合优',
    productName: '氟化铝',
    category: 'main',
    spec: '吨包',
    quantity: 1000,
    unitPrice: 2100,
    shipDate: '2023-10-26',
    status: OrderStatus.Returning,
    vehicles: [
      { id: 'rec-5-normal', plateNumber: '豫K56789', driverName: '孙保国', driverPhone: '15100000000', loadWeight: 35, status: VehicleStatus.Exited, entryTime: '2023-10-26 08:45', weighing1: { time: '09:00', weight: 16.0 }, weighing2: { time: '10:30', weight: 51.0 }, exitTime: '2023-10-26 10:45', actualOutWeight: 35.0, type: RecordType.Normal },
      { id: 'rec-5-return', plateNumber: '豫K56789', driverName: '孙保国', driverPhone: '15100000000', loadWeight: 35, status: VehicleStatus.Unloading, returnReason: '受潮结块', returnWeight: 35, type: RecordType.Return, entryTime: '2023-10-27 13:50', weighing1: { time: '14:00', weight: 51.0 } }
    ],
    history: generateHistory(OrderStatus.Returning),
  },
  {
    id: 'ORD-20231025-004',
    type: 'sales',
    contractId: 'CON-ZBGX-004',
    customerName: '淄博冠新',
    productName: '氟石膏',
    category: 'byproduct',
    spec: '散装',
    quantity: 3000,
    unitPrice: 120,
    shipDate: '2023-10-25',
    status: OrderStatus.Exchanging,
    vehicles: [
       { id: 'rec-6-exchange', plateNumber: '苏G55555', driverName: '周发财', driverPhone: '15200000000', loadWeight: 40, status: VehicleStatus.Entered, exchangeReason: '发错货，更换为湿石膏', returnWeight: 40, type: RecordType.Exchange, entryTime: '2023-10-25 10:15', weighing1: { time: '10:30', weight: 56.0 } }
    ],
    history: generateHistory(OrderStatus.Exchanging),
  },
  {
    id: 'ORD-20231024-005',
    type: 'sales',
    contractId: 'CON-DHGX-005',
    customerName: '东珩国纤',
    productName: '萤石',
    category: 'main',
    spec: '98%',
    quantity: 200,
    unitPrice: 2800,
    shipDate: '2023-10-24',
    status: OrderStatus.Completed,
    vehicles: [
      { id: 'rec-7', plateNumber: '鲁C88888', driverName: '张建国', driverPhone: '13800138000', loadWeight: 32, status: VehicleStatus.Exited, entryTime: '2023-10-24 07:50', weighing1: { time: '08:00', weight: 15.0 }, weighing2: { time: '09:30', weight: 47.0 }, exitTime: '2023-10-24 09:45', actualOutWeight: 32.0, type: RecordType.Normal, warehouseName: '1号原料库' },
      { id: 'rec-8', plateNumber: '鲁C66666', driverName: '李富贵', driverPhone: '13900139000', loadWeight: 32, status: VehicleStatus.Exited, entryTime: '2023-10-24 09:50', weighing1: { time: '10:00', weight: 15.2 }, weighing2: { time: '11:30', weight: 47.2 }, exitTime: '2023-10-24 11:45', actualOutWeight: 32.0, type: RecordType.Normal, warehouseName: '1号原料库' }
    ],
    history: generateHistory(OrderStatus.Completed),
  },
  {
    id: 'ORD-20231028-006',
    type: 'sales',
    contractId: 'CON-ZBGX-006',
    customerName: '淄博冠新',
    productName: '氟化铝',
    category: 'main',
    spec: 'YS/T691-2009 MF-2',
    quantity: 100,
    unitPrice: 5800,
    shipDate: '2023-10-28',
    status: OrderStatus.PriceApproval,
    vehicles: [],
    history: generateHistory(OrderStatus.PriceApproval),
  },
  {
    id: 'ORD-20231028-007',
    type: 'sales',
    contractId: 'CON-SD-007',
    customerName: '申鼎商贸',
    productName: '氟化铝',
    category: 'main',
    spec: '吨包',
    quantity: 200,
    unitPrice: 6600,
    shipDate: '2023-10-28',
    status: OrderStatus.Unassigned,
    vehicles: [],
    history: generateHistory(OrderStatus.Unassigned),
  },
  {
    id: 'ORD-20231029-008',
    type: 'sales',
    contractId: 'CON-SYNC-001',
    customerName: '建设路桥工程',
    productName: '氟石膏',
    category: 'byproduct',
    spec: '散装',
    quantity: 800,
    unitPrice: 50,
    shipDate: '2023-10-29',
    status: OrderStatus.Shipping,
    vehicles: [
       { id: 'rec-sync-1', plateNumber: '冀B99999', driverName: '赵大力', driverPhone: '15000000000', loadWeight: 30, status: VehicleStatus.Exited, actualOutWeight: 31.5, type: RecordType.Normal, entryTime: '2023-10-29 08:00', exitTime: '2023-10-29 09:30' }
    ],
    history: generateHistory(OrderStatus.Shipping),
  },
  {
    id: 'ORD-20231029-009',
    type: 'sales',
    contractId: 'CON-SYNC-002',
    customerName: '环保科技',
    productName: '废料',
    category: 'byproduct',
    spec: '吨包',
    quantity: 200,
    unitPrice: 20,
    shipDate: '2023-10-29',
    status: OrderStatus.Completed,
    vehicles: [
       { id: 'rec-sync-2', plateNumber: '豫K56789', driverName: '孙保国', driverPhone: '15100000000', loadWeight: 20, status: VehicleStatus.Exited, actualOutWeight: 19.8, type: RecordType.Normal, entryTime: '2023-10-29 10:00', exitTime: '2023-10-29 11:30' }
    ],
    history: generateHistory(OrderStatus.Completed),
  },

  // --- PURCHASE ORDERS ---
  {
    id: 'PUR-20231030-001',
    type: 'purchase',
    contractId: 'CON-SUP-001',
    customerName: '金石资源集团', // Supplier
    productName: '萤石',
    category: 'main',
    spec: 'CaF2≥97%',
    quantity: 2000,
    unitPrice: 2800,
    shipDate: '2023-10-30',
    status: OrderStatus.Receiving,
    vehicles: [
       { id: 'pv-1', plateNumber: '蒙K88776', driverName: '王大雷', driverPhone: '13900001111', loadWeight: 33, status: VehicleStatus.Unloading, type: RecordType.Normal, entryTime: '2023-10-30 08:15', weighing1: { time: '08:25', weight: 48.5 } },
       { id: 'pv-2', plateNumber: '蒙K99887', driverName: '李二牛', driverPhone: '13900002222', loadWeight: 33, status: VehicleStatus.Entered, type: RecordType.Normal, entryTime: '2023-10-30 08:40' }
    ],
    history: generateHistory(OrderStatus.Receiving),
  },
  {
    id: 'PUR-20231030-002',
    type: 'purchase',
    contractId: 'CON-SUP-002',
    customerName: '鲁西化工', // Supplier
    productName: '硫酸',
    category: 'main',
    spec: '98% 工业级',
    quantity: 500,
    unitPrice: 400,
    shipDate: '2023-10-30',
    status: OrderStatus.Stored,
    vehicles: [
       { id: 'pv-3', plateNumber: '鲁H12345', driverName: '赵铁柱', driverPhone: '13900003333', loadWeight: 30, status: VehicleStatus.Exited, actualOutWeight: 30.2, type: RecordType.Normal, entryTime: '2023-10-30 07:00', weighing1: {time: '07:10', weight: 45.2}, weighing2: {time: '08:00', weight: 15.0}, exitTime: '2023-10-30 08:10' }
    ],
    history: generateHistory(OrderStatus.Stored),
  },
  {
    id: 'PUR-20231029-003',
    type: 'purchase',
    contractId: 'CON-SUP-003',
    customerName: '中铝山东', // Supplier
    productName: '氢氧化铝',
    category: 'main',
    spec: '干粉',
    quantity: 1000,
    unitPrice: 1800,
    shipDate: '2023-10-29',
    status: OrderStatus.Stored,
    vehicles: [
       { id: 'pv-4', plateNumber: '鲁C55667', driverName: '孙悟空', driverPhone: '13900004444', loadWeight: 35, status: VehicleStatus.Exited, actualOutWeight: 34.8, type: RecordType.Normal, entryTime: '2023-10-29 09:00', weighing1: {time: '09:15', weight: 50.8}, weighing2: {time: '10:30', weight: 16.0}, exitTime: '2023-10-29 10:45' }
    ],
    history: generateHistory(OrderStatus.Stored),
  },
  {
    id: 'PUR-20231030-004',
    type: 'purchase',
    contractId: 'CON-SUP-002',
    customerName: '鲁西化工', // Supplier
    productName: '硫酸',
    category: 'main',
    spec: '105% 发烟',
    quantity: 200,
    unitPrice: 650,
    shipDate: '2023-10-30',
    status: OrderStatus.Receiving,
    vehicles: [],
    history: generateHistory(OrderStatus.Receiving),
  }
];

export const MOCK_PRODUCT_RULES: ProductCodeRule[] = [
  { 
    id: 'r1', 
    productName: '湿法氟化铝', 
    exampleCode: 'FHL-20231027-0001',
    segments: [
      { id: 's1', type: 'fixed', value: 'FHL-' },
      { id: 's2', type: 'date', value: 'YYYYMMDD' },
      { id: 's3', type: 'fixed', value: '-' },
      { id: 's4', type: 'sequence', value: '4' }
    ]
  },
  { 
    id: 'r2', 
    productName: '氧化铝', 
    exampleCode: 'YHL-2310-00001',
    segments: [
      { id: 's1', type: 'fixed', value: 'YHL-' },
      { id: 's2', type: 'date', value: 'YYMM' },
      { id: 's3', type: 'fixed', value: '-' },
      { id: 's4', type: 'sequence', value: '5' }
    ]
  },
];

export const MOCK_WAREHOUSES: Warehouse[] = [
  {
    id: 'w1',
    name: '1号原料库',
    type: WarehouseType.RawMaterial,
    createDate: '2023-01-10',
    zones: [
      { 
        id: 'z1-1', 
        name: 'A区', 
        inventory: [
          { id: 'i1', productName: '萤石', quantity: 500, unit: '吨', productCode: 'FLU20231027001', barcode: 'FLU20231027001' }
        ] 
      },
      { id: 'z1-2', name: 'B区', inventory: [] }
    ]
  },
  {
    id: 'w2',
    name: '半成品暂存库',
    type: WarehouseType.SemiFinished,
    createDate: '2023-02-20',
    zones: [
      { id: 'z2-1', name: 'S-01', inventory: [] },
      { id: 'z2-2', name: 'S-02', inventory: [] }
    ]
  },
  {
    id: 'w3',
    name: '成品发货仓',
    type: WarehouseType.Finished,
    createDate: '2023-03-15',
    zones: [
      { 
        id: 'z3-1', 
        name: 'F-01', 
        inventory: [
           { id: 'i2', productName: '湿法氟化铝', quantity: 1200, unit: '吨', productCode: 'FHL-20231027-0001', barcode: 'FHL-20231027-0001' },
           { id: 'i3', productName: '氧化铝', quantity: 300, unit: '吨', productCode: 'YHL-2310-00001', barcode: 'YHL-2310-00001' }
        ] 
      },
      { id: 'z3-2', name: 'F-02', inventory: [] },
      { id: 'z3-3', name: 'F-03', inventory: [] }
    ]
  }
];

export const MOCK_PRODUCTION_CODES: ProductionCode[] = [
  {
    id: 'pc-1',
    code: 'FHL-20231027-0001',
    productName: '湿法氟化铝',
    spec: 'AF-1',
    type: 'finished',
    batchNo: 'BATCH-20231027',
    createTime: '2023-10-27 08:30',
    status: 'in_stock',
    currentQty: 1200,
    unit: '吨',
    location: '成品发货仓 - F-01',
    history: [
      { date: '2023-10-27 08:30', action: 'create', desc: '产线生产下线', operator: '班组A' },
      { date: '2023-10-27 09:00', action: 'in', desc: '入库至 F-01', location: '成品发货仓 - F-01', operator: '仓管员' }
    ]
  },
  {
    id: 'pc-2',
    code: 'FHL-20231027-0002',
    productName: '湿法氟化铝',
    spec: 'AF-1',
    type: 'finished',
    batchNo: 'BATCH-20231027',
    createTime: '2023-10-27 10:30',
    status: 'shipped',
    currentQty: 0,
    unit: '吨',
    location: '-',
    history: [
      { date: '2023-10-27 10:30', action: 'create', desc: '产线生产下线', operator: '班组A' },
      { date: '2023-10-27 11:00', action: 'in', desc: '入库至 F-01', location: '成品发货仓 - F-01', operator: '仓管员' },
      { date: '2023-10-27 14:00', action: 'out', desc: '销售出库', truckPlate: '鲁C88888', operator: '发货员' }
    ]
  },
  {
    id: 'pc-3',
    code: 'SEMI-20231028-005',
    productName: '氢氧化铝半成品',
    spec: '原料级',
    type: 'semi',
    batchNo: 'BATCH-SEMI-005',
    createTime: '2023-10-28 09:00',
    status: 'in_stock',
    currentQty: 50,
    unit: '吨',
    location: '半成品暂存库 - S-01',
    history: [
      { date: '2023-10-28 09:00', action: 'create', desc: '原料加工完成', operator: '车间B' },
      { date: '2023-10-28 09:15', action: 'in', desc: '入库暂存', location: '半成品暂存库 - S-01', operator: '仓管员' }
    ]
  },
  {
    id: 'pc-4',
    code: 'FHL-20231026-9999',
    productName: '湿法氟化铝',
    spec: 'AF-1',
    type: 'finished',
    batchNo: 'BATCH-20231026',
    createTime: '2023-10-26 16:00',
    status: 'consumed',
    currentQty: 0,
    unit: '吨',
    location: '-',
    history: [
      { date: '2023-10-26 16:00', action: 'create', desc: '产线生产下线', operator: '班组C' },
      { date: '2023-10-26 16:30', action: 'out', desc: '内部领用消耗', operator: '领料员' }
    ]
  }
];
