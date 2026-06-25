import { useState, useCallback, useMemo } from "react";
import type {
  IDevice,
  ICreateDeviceRequest,
  IInventoryFilters,
  IPaginationState,
  ISortState,
  IDashboardStats,
  IInventorySummary,
} from "../interfaces/inventory";

const STORAGE_KEY = "bmz_inventory_devices";

export function useInventory() {
  const [devices, setDevices] = useState<IDevice[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [filters, setFilters] = useState<IInventoryFilters>({
    search: "",
    brand: [],
    model: [],
    variant: [],
    color: [],
    priceSort: "",
  });

  const [pagination, setPagination] = useState<IPaginationState>({
    page: 1,
    limit: 10,
    total: 0,
  });

  const [sort, setSort] = useState<ISortState>({
    field: "createdAt",
    order: "desc",
  });

  // ── Save to localStorage on device change ──
  const saveToStorage = useCallback((updatedDevices: IDevice[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDevices));
  }, []);

  // ── Add Device ────────────────────────────
  const addDevice = useCallback(
    (deviceData: ICreateDeviceRequest): IDevice => {
      const newDevice: IDevice = {
        ...deviceData,
        id: `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // lastModified: new Date().toLocaleString("en-PK"),
      };

      const updated = [newDevice, ...devices];
      setDevices(updated);
      saveToStorage(updated);
      return newDevice;
    },
    [devices, saveToStorage],
  );

  // ── Update Device ─────────────────────────
  const updateDevice = useCallback(
    (id: string, updates: Partial<IDevice>): IDevice | null => {
      const updated = devices.map((d) =>
        d.id === id
          ? {
              ...d,
              ...updates,
              updatedAt: new Date().toISOString(),
              lastModified: new Date().toLocaleString("en-PK"),
            }
          : d,
      );

      const device = updated.find((d) => d.id === id);
      setDevices(updated);
      saveToStorage(updated);
      return device || null;
    },
    [devices, saveToStorage],
  );

  // ── Delete Device ─────────────────────────
  const deleteDevice = useCallback(
    (id: string): boolean => {
      const updated = devices.filter((d) => d.id !== id);
      setDevices(updated);
      saveToStorage(updated);
      return updated.length < devices.length;
    },
    [devices, saveToStorage],
  );

  // ── Get Device by ID ──────────────────────
  const getDevice = useCallback(
    (id: string): IDevice | undefined => devices.find((d) => d.id === id),
    [devices],
  );

  // ── Filter Devices ────────────────────────
  const filteredDevices = useMemo(() => {
    let result = [...devices];

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (d) =>
          d.brand.toLowerCase().includes(q) ||
          d.model.toLowerCase().includes(q) ||
          d.imei1.includes(q) ||
          (d.imei2 && d.imei2.includes(q)),
      );
    }

    // Condition filter
    if (filters.condition && filters.condition.length > 0) {
      result = result.filter((d) => filters.condition!.includes(d.condition));
    }

    // Stock status filter
    // if (filters.stockStatus && filters.stockStatus.length > 0) {
    //   result = result.filter((d) =>
    //     filters.stockStatus!.includes(d.stockStatus),
    //   );
    // }

    // PTA status filter
    if (filters.ptaStatus && filters.ptaStatus.length > 0) {
      result = result.filter((d) => filters.ptaStatus!.includes(d.ptaStatus));
    }

    // Price range filter
    if (filters.priceRange) {
      result = result.filter(
        (d) =>
          d.sellingPrice >= filters.priceRange!.min &&
          d.sellingPrice <= filters.priceRange!.max,
      );
    }

    // Brand filter
    if (filters.brand && filters.brand.length > 0) {
      result = result.filter((d) => filters.brand!.includes(d.brand));
    }

    return result;
  }, [devices, filters]);

  // ── Sort Devices ──────────────────────────
  const sortedDevices = useMemo(() => {
    const sorted = [...filteredDevices].sort((a, b) => {
      let aVal: any = a[sort.field as keyof IDevice];
      let bVal: any = b[sort.field as keyof IDevice];

      if (aVal < bVal) return sort.order === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.order === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredDevices, sort]);

  // ── Paginate Devices ──────────────────────
  const paginatedDevices = useMemo(() => {
    const total = sortedDevices.length;
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;

    setPagination((prev) => ({ ...prev, total }));

    return sortedDevices.slice(start, end);
  }, [sortedDevices, pagination.page, pagination.limit]);

  // ── Calculate Statistics ──────────────────
  const stats: IDashboardStats = useMemo((): IDashboardStats => {
    const totalDevices = devices.length;
    // const availableDevices = devices.filter(
    //   (d) => d.stockStatus === "available",
    // ).length;
    // const lowStockAlerts = devices.filter(
    //   (d) => d.stockStatus === "low",
    // ).length;

    const totalPurchaseValue = devices.reduce(
      (sum, d) => sum + d.purchasePrice * d.quantity,
      0,
    );
    const totalSellingValue = devices.reduce(
      (sum, d) => sum + d.sellingPrice * d.quantity,
      0,
    );
    const totalProfit: number = totalSellingValue - totalPurchaseValue;

    const avgMargin: number =
      totalPurchaseValue > 0 ? (totalProfit / totalPurchaseValue) * 100 : 0;

    return {
      totalDevices,
      soldDevices: 0, // Would come from transactions
      totalPurchaseValue,
      totalSellingValue,
      totalProfit,
      averageMargin: typeof avgMargin === "string" ? parseFloat(avgMargin) : 0,
    };
  }, [devices]);

  // ── Get Inventory Summary ─────────────────
  const summary: IInventorySummary = useMemo((): IInventorySummary => {
    const byCondition: Record<string, number> = {};
    const byBrand: Record<string, number> = {};
    const byStockStatus: Record<string, number> = {};
    const byPtaStatus: Record<string, number> = {};

    devices.forEach((d) => {
      byCondition[d.condition] = (byCondition[d.condition] || 0) + 1;
      byBrand[d.brand] = (byBrand[d.brand] || 0) + 1;
      // byStockStatus[d.stockStatus] = (byStockStatus[d.stockStatus] || 0) + 1;
      byPtaStatus[d.ptaStatus] = (byPtaStatus[d.ptaStatus] || 0) + 1;
    });

    const topBrands = Object.entries(byBrand)
      .map(([brand, count]) => {
        const brandDevices = devices.filter((d) => d.brand === brand);
        const profit = brandDevices.reduce(
          (sum, d) => sum + (d.sellingPrice - d.purchasePrice) * d.quantity,
          0,
        );
        return { brand, count, profit };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // const lowStockItems = devices.filter((d) => d.stockStatus === "low");

    return {
      byCondition: byCondition as Record<string, number>,
      byBrand,
      byStockStatus: byStockStatus as Record<string, number>,
      byPtaStatus: byPtaStatus as Record<string, number>,
      topBrands,
    };
  }, [devices]);

  return {
    // State
    devices,
    filters,
    pagination,
    sort,

    // Data
    paginatedDevices,
    filteredDevices,
    stats,
    summary,

    // Methods
    addDevice,
    updateDevice,
    deleteDevice,
    getDevice,
    setFilters,
    setPagination,
    setSort,
    setDevices,
  };
}
