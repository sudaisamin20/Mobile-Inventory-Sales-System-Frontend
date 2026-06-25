// Products API Service
// Centralized product-related API calls

import type {
  IProduct,
  IPaginatedResponse,
  IPaginationParams,
  IApiResponse,
} from "../interfaces";
import { axiosInstance } from "../config";
import type { ICreateDeviceRequest, IDevice } from "../interfaces/inventory";

export class DeviceService {
  /**
   * Get all devices with pagination
   */
  static async getDevices(): Promise<IApiResponse<IDevice[]>> {
    const response = await axiosInstance.get<IApiResponse<IDevice[]>>(
      "/devices/get-all-devices",
    );
    return response.data as IApiResponse<IDevice[]>;
  }

  /**
   * Get all devices with pagination
   */
  static async getDevicesByModelUnits(): Promise<IApiResponse<IDevice[]>> {
    const response = await axiosInstance.get<IApiResponse<IDevice[]>>(
      "/devices/get-all-devices/model-units",
    );
    return response.data as IApiResponse<IDevice[]>;
  }

  /**
   * Get device by ID
   */
  static async getDeviceById(id: string): Promise<IProduct> {
    const response = await axiosInstance.get<IApiResponse<IProduct>>(
      `/devices/${id}`,
    );
    return response.data.data as IProduct;
  }

  /**
   * Search devices
   */
  static async searchDevices(query: string, params?: IPaginationParams) {
    const response = await axiosInstance.get<
      IApiResponse<IPaginatedResponse<IProduct>>
    >("/devices/search", {
      params: {
        q: query,
        ...params,
      },
    });
    return response.data.data as IPaginatedResponse<IProduct>;
  }

  /**
   * Get devices by category
   */
  static async getDeviceByCategory(
    category: string,
    params?: IPaginationParams,
  ) {
    const response = await axiosInstance.get<
      IApiResponse<IPaginatedResponse<IProduct>>
    >(`/devices/get-device/category/${category}`, { params });
    return response.data.data as IPaginatedResponse<IProduct>;
  }

  /**
   * Create device (admin only)
   */
  static async addDevices(
    data: Partial<ICreateDeviceRequest>,
  ): Promise<IApiResponse<ICreateDeviceRequest>> {
    const response = await axiosInstance.post<
      IApiResponse<ICreateDeviceRequest>
    >("/devices/add", data);
    return response.data as IApiResponse<ICreateDeviceRequest>;
  }

  /**
   * Update device (admin only)
   */
  static async updateDevice(
    id: string | undefined,
    data: Partial<ICreateDeviceRequest>,
  ): Promise<IApiResponse<ICreateDeviceRequest>> {
    const response = await axiosInstance.patch<
      IApiResponse<ICreateDeviceRequest>
    >(`/devices/update/${id}`, data);
    return response.data as IApiResponse<ICreateDeviceRequest>;
  }

  /**
   * Sold device (admin only)
   */
  static async soldDevice(
    id: string | undefined,
    data: Partial<ICreateDeviceRequest>,
  ): Promise<IApiResponse<ICreateDeviceRequest>> {
    const response = await axiosInstance.patch<
      IApiResponse<ICreateDeviceRequest>
    >(`/devices/sold-device`, {
      ...data,
      id,
    });
    return response.data as IApiResponse<ICreateDeviceRequest>;
  }

  /**
   * Delete device (admin only)
   */
  static async deleteDevice(
    id: string | undefined,
  ): Promise<IApiResponse<void>> {
    const response = await axiosInstance.delete<IApiResponse<void>>(
      `/devices/delete-device/${id}`,
    );
    return response.data as IApiResponse<void>;
  }
}

export default DeviceService;
