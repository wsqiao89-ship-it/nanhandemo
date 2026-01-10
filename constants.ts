import { Order, OrderStatus, VehicleStatus, RecordType, VehicleMaster, Contract, ContractStatus, ContractType, Warehouse, WarehouseType, ProductCodeRule } from './types';

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
    productName: '湿法氟化铝',
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
    productName: '硫酸',
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
  // 0. 新增: 待审核 (Financial Audit Required)
  {
    id: 'ORD-20231029-000',
    contractId: 'CON-NEW-000',
    customerName: '新希望集团',
    productName: '饲料添加剂',
    spec: '25kg/袋',
    quantity: 150,
    unitPrice: 3200,
    shipDate: '2023-10-29',
    status: OrderStatus.PendingAudit, // 待审核
    vehicles: [],
    history: [
      { date: '2023-10-29 08:30', action: '创建订单', user: '销售部-赵云' }
    ],
  },
  
  // 1. 正常出货 - 待发货 (Editable Vehicles)
  {
    id: 'ORD-20231027-001',
    contractId: 'CON-SD-001',
    customerName: '申鼎商贸',
    productName: '湿法氟化铝',
    spec: 'GB/T4292-2017 AF-1',
    quantity: 500,
    unitPrice: 6500,
    shipDate: '2023-10-27',
    status: OrderStatus.ReadyToShip,
    vehicles: [
      {
        id: 'rec-1',
        plateNumber: '鲁C88888',
        driverName: '张建国',
        driverPhone: '13800138000',
        loadWeight: 32,
        status: VehicleStatus.PendingEntry, // 待入厂 -> Can Edit/Delete
        type: RecordType.Normal
      },
      {
        id: 'rec-2',
        plateNumber: '鲁C66666',
        driverName: '李富贵',
        driverPhone: '13900139000',
        loadWeight: 33,
        status: VehicleStatus.PendingEntry, // 待入厂 -> Can Edit/Delete
        type: RecordType.Normal
      }
    ],
    history: generateHistory(OrderStatus.ReadyToShip),
  },
  
  // 2. 正常出货 - 发货中 (One loading, one waiting)
  {
    id: 'ORD-20231027-002',
    contractId: 'CON-AP-002',
    customerName: '奥鹏',
    productName: '硫酸',
    spec: '98% / 罐车',
    quantity: 200,
    unitPrice: 450,
    shipDate: '2023-10-27',
    status: OrderStatus.Shipping,
    vehicles: [
      {
        id: 'rec-3-finished',
        plateNumber: '苏G55555',
        driverName: '周发财',
        driverPhone: '15200000000',
        loadWeight: 32,
        status: VehicleStatus.Exited,
        entryTime: '2023-10-27 07:00',
        weighing1: { time: '07:10', weight: 15.2 },
        weighing2: { time: '08:40', weight: 47.2 },
        exitTime: '2023-10-27 08:50',
        actualOutWeight: 32.0,
        type: RecordType.Normal
      },
      {
        id: 'rec-3',
        plateNumber: '鲁Q12345',
        driverName: '王铁柱',
        driverPhone: '13700137000',
        loadWeight: 30,
        status: VehicleStatus.Loading, // 装货中
        entryTime: '2023-10-27 08:05',
        weighing1: { time: '08:15', weight: 15.5 }, // 皮重
        type: RecordType.Normal
      },
      {
        id: 'rec-4',
        plateNumber: '冀B99999',
        driverName: '赵大力',
        driverPhone: '15000000000',
        loadWeight: 30,
        status: VehicleStatus.PendingEntry, // 待入厂
        type: RecordType.Normal
      }
    ],
    history: generateHistory(OrderStatus.Shipping),
  },

  // 3. 退货处理 - (Mixed: One completed return, one ongoing)
  {
    id: 'ORD-20231026-003',
    contractId: 'CON-JHY-003',
    customerName: '聚合优',
    productName: '氢氧化铝',
    spec: '吨包',
    quantity: 1000,
    unitPrice: 2100,
    shipDate: '2023-10-26',
    status: OrderStatus.Returning,
    vehicles: [
      // Completed Normal shipments for context (optional, usually filtered out or kept)
      {
        id: 'rec-5-normal',
        plateNumber: '豫K56789',
        driverName: '孙保国',
        driverPhone: '15100000000',
        loadWeight: 35,
        status: VehicleStatus.Exited,
        entryTime: '2023-10-26 08:45',
        weighing1: { time: '09:00', weight: 16.0 },
        weighing2: { time: '10:30', weight: 51.0 },
        exitTime: '2023-10-26 10:45',
        actualOutWeight: 35.0,
        type: RecordType.Normal
      },
      // Return Record 1
      {
        id: 'rec-5-return',
        plateNumber: '豫K56789',
        driverName: '孙保国',
        driverPhone: '15100000000',
        loadWeight: 35,
        status: VehicleStatus.Unloading, // 卸货中 (Returning)
        returnReason: '受潮结块',
        returnWeight: 35,
        type: RecordType.Return,
        entryTime: '2023-10-27 13:50',
        weighing1: { time: '14:00', weight: 51.0 }, // 重车进厂
      }
    ],
    history: generateHistory(OrderStatus.Returning),
  },

  // 4. 换货处理
  {
    id: 'ORD-20231025-004',
    contractId: 'CON-ZBGX-004',
    customerName: '淄博冠新',
    productName: '氟石膏',
    spec: '散装',
    quantity: 3000,
    unitPrice: 120,
    shipDate: '2023-10-25',
    status: OrderStatus.Exchanging,
    vehicles: [
       {
        id: 'rec-6-exchange',
        plateNumber: '苏G55555',
        driverName: '周发财',
        driverPhone: '15200000000',
        loadWeight: 40,
        status: VehicleStatus.Entered, // 已入厂
        exchangeReason: '发错货，更换为湿石膏',
        returnWeight: 40,
        type: RecordType.Exchange,
        entryTime: '2023-10-25 10:15',
        weighing1: { time: '10:30', weight: 56.0 } // 重车进
      }
    ],
    history: generateHistory(OrderStatus.Exchanging),
  },

  // 5. 已完成订单
  {
    id: 'ORD-20231024-005',
    contractId: 'CON-DHGX-005',
    customerName: '东珩国纤',
    productName: '萤石',
    spec: '98%',
    quantity: 200,
    unitPrice: 2800,
    shipDate: '2023-10-24',
    status: OrderStatus.Completed,
    vehicles: [
      {
        id: 'rec-7',
        plateNumber: '鲁C88888',
        driverName: '张建国',
        driverPhone: '13800138000',
        loadWeight: 32,
        status: VehicleStatus.Exited,
        entryTime: '2023-10-24 07:50',
        weighing1: { time: '08:00', weight: 15.0 },
        weighing2: { time: '09:30', weight: 47.0 },
        exitTime: '2023-10-24 09:45',
        actualOutWeight: 32.0,
        type: RecordType.Normal
      },
      {
        id: 'rec-8',
        plateNumber: '鲁C66666',
        driverName: '李富贵',
        driverPhone: '13900139000',
        loadWeight: 32,
        status: VehicleStatus.Exited,
        entryTime: '2023-10-24 09:50',
        weighing1: { time: '10:00', weight: 15.2 },
        weighing2: { time: '11:30', weight: 47.2 },
        exitTime: '2023-10-24 11:45',
        actualOutWeight: 32.0,
        type: RecordType.Normal
      }
    ],
    history: generateHistory(OrderStatus.Completed),
  },

  // 6. 价格审批中
  {
    id: 'ORD-20231028-006',
    contractId: 'CON-ZBGX-006',
    customerName: '淄博冠新',
    productName: '冰晶石',
    spec: 'YS/T691-2009 MF-2',
    quantity: 100,
    unitPrice: 5800,
    shipDate: '2023-10-28',
    status: OrderStatus.PriceApproval,
    vehicles: [],
    history: generateHistory(OrderStatus.PriceApproval),
  },

  // 7. 未分配车辆
  {
    id: 'ORD-20231028-007',
    contractId: 'CON-SD-007',
    customerName: '申鼎商贸',
    productName: '干法氟化铝',
    spec: '吨包',
    quantity: 200,
    unitPrice: 6600,
    shipDate: '2023-10-28',
    status: OrderStatus.Unassigned,
    vehicles: [],
    history: generateHistory(OrderStatus.Unassigned),
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
