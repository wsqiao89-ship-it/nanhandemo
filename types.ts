
export enum OrderStatus {
  PendingAudit = '待审核', 
  PriceApproval = '调价审批中', // 确保此状态存在，否则会导致白屏
  Unassigned = '未分配车辆',
  ReadyToShip = '待发货', 
  Shipping = '发货中', 
  Receiving = '收货中', 
  Completed = '已完成',
  Stored = '已入库', 
  Returning = '退货中',
  Exchanging = '换货中',
  Auditing = '审核中', 
  Invoiced = '已开票', 
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
  emissions?: string; 
}

export interface VehicleRecord {
  id: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  status: VehicleStatus;
  
  loadWeight: number; 
  unit?: '吨' | 'kg'; 
  emissions?: string; 
  
  warehouseName?: string;
  zoneName?: string;
  
  batchNumber?: string; 
  
  batchDetails?: { 
    batchNo: string; 
    weight: number; 
  }[];

  entryTime?: string;     
  weighing1?: { time: string; weight: number }; 
  weighing2?: { time: string; weight: number }; 
  exitTime?: string;      
  
  actualOutWeight?: number; 
  
  returnReason?: string;
  returnWeight?: number;
  exchangeReason?: string;
  
  confirmations?: {
    marketing?: boolean; 
    warehouse?: boolean; 
    gate?: boolean;      
    lab?: boolean;       
  };
  labData?: string;      
  
  type: RecordType;
}

export interface Order {
  id: string; 
  type: 'sales' | 'purchase'; 
  contractId: string;
  customerName: string; 
  productName: string;
  category: 'main' | 'byproduct'; 
  spec: string;
  quantity: number; 
  unit?: '吨' | 'kg'; 
  unitPrice: number;
  shipDate: string;
  status: OrderStatus;
  vehicles: VehicleRecord[];
  history: { date: string; action: string; user: string }[];
  
  remark?: string;          
  isPriceAdjusted?: boolean; 
  pendingPrice?: number;     // 待审批的新价格
  settlementWeight?: number; 
}

export interface Contract {
  id: string; 
  contractNumber: string; 
  name: string; 
  signDate: string;
  customerName: string;
  productName: string;
  spec: string;
  quantity: number;
  unit?: '吨' | 'kg'; 
  amount?: number; 
  deliveryTime: string;
  status: ContractStatus;
  type: ContractType;
  owner: string; 
  attachment?: string; 
}

export interface FilterState {
  orderId: string;
  customerName: string;
  contractId: string;
  shipDate: string;
  status: OrderStatus | '';
  plateNumber: string; 
  productType: string; 
  isPriceAdjusted: string; 
}

export type SegmentType = 'fixed' | 'date' | 'sequence';

export interface CodeSegment {
  id: string;
  type: SegmentType;
  value: string; 
}

export interface ProductCodeRule {
  id: string;
  productName: string;
  segments: CodeSegment[];
  exampleCode: string; 
}

export interface InventoryItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  productCode: string; 
  barcode: string; 
  customer?: string; 
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
  type: 'in' | 'out' | 'transfer' | 'adjust' | 'dispatch'; 
  product: string;
  qty: number;
  unit?: '吨' | 'kg';
  ref: string; 
  plate?: string;
  materialType?: 'finished' | 'semi';
  customer?: string; 
  operator?: string;
  confirmer?: string;
}

export interface CodeHistory {
  date: string;
  action: 'create' | 'in' | 'out' | 'transfer' | 'adjust';
  desc: string; 
  truckPlate?: string; 
  location?: string; 
  operator?: string;
}

export interface ProductionCode {
  id: string;
  code: string; 
  productName: string;
  spec: string;
  type: 'finished' | 'semi'; 
  batchNo: string;
  createTime: string;
  status: 'in_stock' | 'shipped' | 'consumed' | 'deleted';
  currentQty: number;
  unit: string;
  location: string; 
  history: CodeHistory[];
}
