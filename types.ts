
export enum OrderStatus {
  PendingAudit = '待审核', // New: Requires financial audit
  PriceApproval = '调价审批中',
  Unassigned = '未分配车辆',
  ReadyToShip = '待发货', // Assigned vehicles
  Shipping = '发货中', // Vehicle entered
  Completed = '已完成',
  Returning = '退货中',
  Exchanging = '换货中',
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
}

export interface VehicleRecord {
  id: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  status: VehicleStatus;
  
  // Planned/Dispatch Info
  loadWeight: number; // Planned weight
  
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
  
  type: RecordType;
}

export interface Order {
  id: string; // Order Number
  contractId: string;
  customerName: string;
  productName: string;
  spec: string;
  quantity: number; // Tons
  unitPrice: number;
  shipDate: string;
  status: OrderStatus;
  vehicles: VehicleRecord[];
  history: { date: string; action: string; user: string }[];
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
