import { axiosInstance } from "../config";
import type { IApiResponse, IDeviceHistory } from "../interfaces";

export class DeviceHistoryService {
   /**
   * get history of all devices actions (admin only)
   */
  static async fetchDevicesHistory(): Promise<IApiResponse<IDeviceHistory[]>> {
    const response = await axiosInstance.get<IApiResponse<IDeviceHistory[]>>(
      `/history/get-all/device-history`,
    );
    return response.data as IApiResponse<IDeviceHistory[]>;
  }
}
