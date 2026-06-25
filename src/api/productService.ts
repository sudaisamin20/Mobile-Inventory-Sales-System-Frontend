// Products API Service
// Centralized product-related API calls

import type { IProduct, IPaginatedResponse, IPaginationParams, IApiResponse } from '../interfaces';
import { axiosInstance } from '../config';
import type { ICreateDeviceRequest } from '../interfaces/inventory';

export class ProductService {
  /**
   * Get all products with pagination
   */
  static async getProducts(
    params: IPaginationParams
  ): Promise<IPaginatedResponse<IProduct>> {
    const response = await axiosInstance.get<IApiResponse<IPaginatedResponse<IProduct>>>(
      '/products',
      { params }
    );
    return response.data.data as IPaginatedResponse<IProduct>;
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string): Promise<IProduct> {
    const response = await axiosInstance.get<IApiResponse<IProduct>>(
      `/products/${id}`
    );
    return response.data.data as IProduct;
  }

  /**
   * Search products
   */
  static async searchProducts(query: string, params?: IPaginationParams) {
    const response = await axiosInstance.get<IApiResponse<IPaginatedResponse<IProduct>>>(
      '/products/search',
      {
        params: {
          q: query,
          ...params,
        },
      }
    );
    return response.data.data as IPaginatedResponse<IProduct>;
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(category: string, params?: IPaginationParams) {
    const response = await axiosInstance.get<IApiResponse<IPaginatedResponse<IProduct>>>(
      `/products/category/${category}`,
      { params }
    );
    return response.data.data as IPaginatedResponse<IProduct>;
  }

  /**
   * Create product (admin only)
   */
  static async addProduct(data: Partial<ICreateDeviceRequest>): Promise<ICreateDeviceRequest> {
    const response = await axiosInstance.post<IApiResponse<ICreateDeviceRequest>>(
      '/product/',
      data
    );
    return response.data.data as ICreateDeviceRequest;
  }

  /**
   * Update product (admin only)
   */
  static async updateProduct(id: string, data: Partial<IProduct>): Promise<IProduct> {
    const response = await axiosInstance.put<IApiResponse<IProduct>>(
      `/products/${id}`,
      data
    );
    return response.data.data as IProduct;
  }

  /**
   * Delete product (admin only)
   */
  static async deleteProduct(id: string): Promise<void> {
    await axiosInstance.delete(`/products/${id}`);
  }
}

export default ProductService;
