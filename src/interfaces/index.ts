// Auth Related Interfaces
export interface IUser {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  updatedAt: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ISignupRequest {
  email: string;
  password: string;
  fullName: string;
  confirmPassword: string;
}

export interface IAuthResponse {
  user: IUser;
  token: string;
  refreshToken: string;
}

export interface IAuthState {
  user: IUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Product Related Interfaces
export interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IProductsState {
  products: IProduct[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
}

// API Response Interfaces
export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Common Error Response
export interface IErrorResponse {
  success: false;
  message: string;
  error: string;
  statusCode: number;
}

// Axios Error Interface
export interface IAxiosError {
  response?: {
    data: IErrorResponse;
    status: number;
  };
  message: string;
}

// Cart Related Interfaces
export interface ICartItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface ICartState {
  items: ICartItem[];
  total: number;
  loading: boolean;
}

// UI State
export interface IUiState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

// Pagination
export interface IPaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ISaleInfo {
  id: string;
  invoiceNo: string;
  customerName: string;
  phoneNo: string;
  soldPrice: number;
  soldAt: string;
  paymentType: PaymentMethod | undefined | string;
  notes: string;
  deviceId: string;
  receivedAmount: number;
  remainingAmount: number;
  paymentStatus: SaleStatus;
  createdAt?: string;
  updatedAt?: string;
  author?: IDeviceData;
  brand?: string;
  model?: string;
  imei1?: string;
  imei2?: string;
  variant?: string;
  color?: string;
  pdf?: string | undefined;
}

export type SaleStatus = "PAID" | "PENDING" | "CANCELLED" | "REFUND";

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "installment";

export interface IDeviceData {
  id: string;
  brand: string;
  model: string;
  imei1: string;
  imei2: string;
  variant: string;
  color: string;
  purchasePrice: number;
  sellingPrice: number;
  condition: string;
}

export interface IDeviceHistory {
  id: string;
  deviceId: string;
  device: {
    id: string;
    brand: string;
    model: string;
    imei1: string;
    imei2: string;
    variant: string;
    color: string;
    purchasePrice: number;
    sellingPrice: number;
    condition: string;
    supplierName: string;
  };
  type: EventType;

  oldValue?: string;
  newValue?: string;

  note?: string;

  performedBy?: string;
  createdAt?: string | undefined;
}

export type EventType =
  | "ADDED"
  | "SOLD"
  | "UPDATED"
  | "PRICE_CHANGE"
  | "STATUS_CHANGE"
  | "DELETED"
  | "STOCK_ADDED"
  | "PAYMENT_COMPLETED";
