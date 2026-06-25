/**
 * Inventory Management - TypeScript Interfaces
 * Types for device, inventory, and transaction management
 */

// ── Device Condition Types ────────────────

export type DeviceCondition = "new" | "used" | "open-box" | "refurbished";
export type PTAStatus = "approved" | "pending" | "blocked" | "unknown";
export type NetworkLockStatus = "unlocked" | "locked" | "unknown";
export type StockStatus = "available" | "low" | "out-of-stock" | "reserved";

// ── Device Interface ──────────────────────

export interface IDevice {
  id: string | undefined;
  createdAt?: string;
  updatedAt?: string;

  // IMEI Information
  imei1: string;
  imei2?: string;
  tacCode: string;
  serialNumber: string;

  // Basic Information
  brand: string;
  model: string;
  variant: string; // e.g., "6GB/128GB", "8GB/256GB"
  color: string;
  countryVersion: string;
  ptaStatus: PTAStatus;
  networkLockStatus: NetworkLockStatus;

  // Device Condition
  condition: DeviceCondition;
  batteryHealth: number; // 0-100
  screenCondition: "perfect" | "minor-scratches" | "major-damage" | "broken";
  cameraCondition: "perfect" | "minor-scratches" | "major-damage" | "broken";
  speakerCondition: "working" | "partial" | "not-working";
  chargingCondition: "working" | "partial" | "not-working";
  faceIdStatus: "working" | "not-available" | "not-working";
  fingerprintStatus: "working" | "not-available" | "not-working";
  waterpakStatus: "present" | "absent" | "damaged";

  // Pricing
  purchasePrice: number;
  sellingPrice: number;
  supplierName: string;
  purchaseDate: string;
  invoiceNumber: string;
  warrantyDays: number;
  quantity: number;

  colors?: number;
  units?: number;
  variants?: number;

  // Media
  images: {
    front?: string; // base64 or URL
    back?: string;
    invoice?: string;
  }
}

// ── Create Device Request (Form) ──────────

export interface ICreateDeviceRequest
  extends Omit<IDevice, "id" | "createdAt" | "updatedAt" | "lastModified"> {}

// ── Inventory Filter Options ──────────────

export interface IInventoryFilters {
  search: string; // Search by brand, model, IMEI
  brand?: string[];
  model: string[];
  variant: string[];
  color: string[];
  priceSort: string;
}

// ── Inventory Pagination ──────────────────

export interface IPaginationState {
  page: number;
  limit: number;
  total: number;
}

// ── Inventory Sort ────────────────────────

export type SortField = "createdAt" | "sellingPrice" | "purchasePrice" | "brand";
export type SortOrder = "asc" | "desc";

export interface ISortState {
  field: SortField;
  order: SortOrder;
}

// ── Inventory State ──────────────────────

export interface IInventoryState {
  devices: IDevice[];
  filters: IInventoryFilters;
  pagination: IPaginationState;
  sort: ISortState;
  loading: boolean;
  error: string | null;
}

// ── Dashboard Statistics ──────────────────

export interface IDashboardStats {
  totalDevices: number;
  soldDevices: number;
  // availableDevices: number;
  totalPurchaseValue: number;
  totalSellingValue: number;
  totalProfit: number;
  // lowStockAlerts: number;
  averageMargin: number; // percentage
}

// ── Scan Result ───────────────────────────

export interface IScanResult {
  imei: string;
  valid: boolean;
  brand: string;
  tacCode: string;
  serialNumber: string;
  scannedAt: string;
  method: "camera" | "manual";
}

// ── Device with Statistics ────────────────

export interface IDeviceWithStats extends IDevice {
  profit: number; // sellingPrice - purchasePrice
  margin: number; // (profit / purchasePrice) * 100
  daysInStock: number;
}

// ── Inventory Summary ──────────────────────

export interface IInventorySummary {
  byCondition: Record<DeviceCondition, number>;
  byBrand: Record<string, number>;
  byStockStatus: Record<StockStatus, number>;
  byPtaStatus: Record<PTAStatus, number>;
  topBrands: Array<{ brand: string; count: number; profit: number }>;
}
