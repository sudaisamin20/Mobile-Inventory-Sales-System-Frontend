import { axiosInstance } from "../config";
import type { IApiResponse, ISaleInfo } from "../interfaces";

export class SalesService {
  /**
   * sold device (admin only)
   */
  static async soldDevice(
    data: Partial<ISaleInfo>,
  ): Promise<IApiResponse<ISaleInfo>> {
    const response = await axiosInstance.post<IApiResponse<ISaleInfo>>(
      `/sales/sold/device`,
      data,
    );
    return response.data as IApiResponse<ISaleInfo>;
  }

  /**
   * fetch sales devices data (admin only)
   */
  static async fetchSalesData(): Promise<IApiResponse<ISaleInfo[]>> {
    const response = await axiosInstance.get<IApiResponse<ISaleInfo[]>>(
      `/sales/fetch/sales-data`,
    );
    return response.data as IApiResponse<ISaleInfo[]>;
  }

  /**
   * Paid the remaining amount paid (admin only)
   */
  static async confirmRemainingAmountPaid(
    data: ISaleInfo,
  ): Promise<IApiResponse<ISaleInfo>> {
    const response = await axiosInstance.patch<IApiResponse<ISaleInfo>>(
      `/sales/paid/remaing-amount`,
      data,
    );
    return response.data as IApiResponse<ISaleInfo>;
  }
}
