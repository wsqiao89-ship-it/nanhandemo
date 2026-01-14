
export enum OrderStatus {
  PendingAudit = '待审核', 
  PriceApproval = '调价审批中', // Restored
  Unassigned = '未分配车辆',
  ReadyToShip = '待发货', 
  Shipping = '发货中', 
  Receiving = '收货中', 
  Completed = '已完成',
  Stored = '已入库', 
  Returning = '退货中',
  Exchanging = '换货中',
  Auditing = '审核中', // New: For By-products or general checks
  Invoiced = '已开票', // New: Final financial state
  Returned = '已退货',
  Exchanged = '已换货',
}

export enum VehicleStatus {
  PendingEntry = '待入厂',
  Entered = '已入厂',
  Loading = '装货中',
  Unloading = '卸货中',
  Exited = '已出厂',
}

export enum RecordType {
  Normal = '正常出货',
  Return = '退货',
  Exchange = '换货',
}

export enum ContractType {
  Purchase = '采购合同',
  Sales = '销售合同'
}

export enum ContractStatus {
  New = '新增',
  Shipping = '发货中',
  Completed = '已完成'
}

export enum WarehouseType {
  RawMaterial = '原料仓',
  SemiFinished = '半成品仓',
  Finished = '成品仓'
}

export interface VehicleMaster {
  id: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  emissions?: string; // New: Emission Standard (e.g. 国V, 国VI)
}

export interface VehicleRecord {
  id: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  status: VehicleStatus;
  
  // Planned/Dispatch Info
  loadWeight: number; // Planned weight
  unit?: '吨' | 'kg'; // Unit for weights
  emissions?: string; // Snapshot of emission when recorded
  
  // Source/Inventory Info (New)
  warehouseName?: string;
  zoneName?: string;
  
  // Legacy single batch field (optional now)
  batchNumber?: string; 
  
  // New: Multiple Batches Support
  batchDetails?: { 
    batchNo: string; 
    weight: number; 
  }[];

  // Tracking Info (Lifecycle Timestamps)
  entryTime?: string;     // 进场时间
  weighing1?: { time: string; weight: number }; // 皮重/第一次过磅
  weighing2?: { time: string; weight: number }; // 毛重/第二次过磅
  exitTime?: string;      // 出厂时间
  
  actualOutWeight?: number; // Net weight result
  
  // Specific fields for return/exchange
  returnReason?: string;
  returnWeight?: number;
  exchangeReason?: string;
  
  // Advanced Workflow Confirmations (Parallel Steps)
  confirmations?: {
    marketing?: boolean; // 市场部确认
    warehouse?: boolean; // 仓管员确认
    gate?: boolean;      // 门卫确认 (New)
    lab?: boolean;       // 实验室化验 (For specific flows)
  };
  labData?: string;      // 化验数据/报告链接
  
  type: RecordType;
}

export interface Order {
  id: string; // Order Number
  type: 'sales' | 'purchase'; // Sales or Purchase
  contractId: string;
  customerName: string; // Used as Supplier Name for purchase orders
  productName: string;
  category: 'main' | 'byproduct'; // Sales: Main/Byproduct
  spec: string;
  quantity: number; // Tons
  unit?: '吨' | 'kg'; // Unit for quantity
  unitPrice: number;
  shipDate: string;
  status: OrderStatus;
  vehicles: VehicleRecord[];
  history: { date: string; action: string; user: string }[];
  
  // New Fields
  remark?: string;          // 订单备注
  isPriceAdjusted?: boolean; // 是否已调价
  pendingPrice?: number;     // 待审批的新价格
  settlementWeight?: number; // 结算重量 (For Invoicing)
}

export interface Contract {
  id: string; 
  contractNumber: string; // User entered
  name: string; // Auto generated: Customer + Qty + Time
  signDate: string;
  customerName: string;
  productName: string;
  spec: string;
  quantity: number;
  unit?: '吨' | 'kg'; // Unit for quantity
  amount?: number; // Total Contract Value (Cost or Revenue)
  deliveryTime: string;
  status: ContractStatus;
  type: ContractType;
  owner: string; // Person in charge
  attachment?: string; // Mock filename
}

export interface FilterState {
  orderId: string;
  customerName: string;
  contractId: string;
  shipDate: string;
  status: OrderStatus | '';
  plateNumber: string; // New filter
  productType: string; // New filter
  isPriceAdjusted: string; // 'true' | 'false' | ''
}

// --- New Types for Modules ---

export type SegmentType = 'fixed' | 'date' | 'sequence';

export interface CodeSegment {
  id: string;
  type: SegmentType;
  value: string; // Fixed text, Date Format (e.g. YYYYMMDD), or Sequence Length (e.g. "4")
}

export interface ProductCodeRule {
  id: string;
  productName: string;
  segments: CodeSegment[];
  exampleCode: string; // Generated example
}

export interface InventoryItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  productCode: string; // Derived from rule
  barcode: string; // Same as code
  customer?: string; // Optional customer name for finished goods
}

export interface WarehouseZone {
  id: string;
  name: string;
  inventory: InventoryItem[];
}

export interface Warehouse {
  id: string;
  name: string;
  type: WarehouseType;
  createDate: string;
  zones: WarehouseZone[];
}

export interface StockRecord {
  id: string;
  date: string;
  type: 'in' | 'out' | 'transfer' | 'adjust' | 'dispatch'; // Added dispatch
  product: string;
  qty: number;
  unit?: '吨' | 'kg';
  ref: string; // Order ID or Contract ID
  plate?: string;
  materialType?: 'finished' | 'semi';
  customer?: string; // Added customer for audit view
  operator?: string;
  confirmer?: string;
}

// --- Production Coding ---
export interface CodeHistory {
  date: string;
  action: 'create' | 'in' | 'out' | 'transfer' | 'adjust';
  desc: string; // e.g. "Created by Production Line 1"
  truckPlate?: string; // If shipped
  location?: string; // e.g. "Warehouse 1 - Zone A"
  operator?: string;
}

export interface ProductionCode {
  id: string;
  code: string; // The unique barcode string
  productName: string;
  spec: string;
  type: 'finished' | 'semi'; // 成品 vs 半成品
  batchNo: string;
  createTime: string;
  
  // Current State
  status: 'in_stock' | 'shipped' | 'consumed' | 'deleted';
  currentQty: number;
  unit: string;
  location: string; // Warehouse Name + Zone Name
  
  history: CodeHistory[];
}
