// InventoryDashboard.tsx — Single file, all modals correct
import { useEffect, useState } from "react";
import {
  Package,
  TrendingUp,
  DollarSign,
  Plus,
  Smartphone,
  ScanBarcode,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Pencil,
} from "lucide-react";
import { Layout } from "../../layout";
import {
  Button,
  Card,
  StatsCard,
  PageBackground,
  AnimateIn,
  useToast,
  ToastContainer,
  Modal,
  Badge,
} from "../../components/ui";
import { DeviceDetailsModal } from "../../components/inventory";
import { useInventory } from "../../hooks/useInventory";
import type { IDevice, ICreateDeviceRequest } from "../../interfaces/inventory";
// import type { ScannedIMEI } from "../../components/inventory/AddStockModal";
import DeviceService from "../../api/deviceService";
import { formatPrice, conditionBadge, ptaBadge } from "../../utils";

// ── View Device Modal ─────────────────────────

function ViewDeviceModal({
  device,
  onClose,
  onEdit,
}: {
  device: IDevice;
  onClose: () => void;
  onEdit: () => void;
}) {
  const profit = device.sellingPrice - device.purchasePrice;
  const margin =
    device.purchasePrice > 0
      ? (
          ((device.sellingPrice - device.purchasePrice) /
            device.purchasePrice) *
          100
        ).toFixed(1)
      : "0";

  const rows = [
    { label: "Brand", value: device.brand },
    { label: "Model", value: device.model },
    { label: "Variant", value: device.variant || "—" },
    { label: "Color", value: device.color || "—" },
    { label: "IMEI 1", value: device.imei1, mono: true },
    { label: "IMEI 2", value: device.imei2 || "—", mono: true },
    {
      label: "TAC Code",
      value: device.tacCode || device.imei1?.slice(0, 8),
      mono: true,
    },
    { label: "Country", value: device.countryVersion || "—" },
    { label: "PTA Status", value: device.ptaStatus },
    { label: "Network Lock", value: device.networkLockStatus },
    { label: "Battery", value: `${device.batteryHealth}%` },
    { label: "Screen", value: device.screenCondition },
    { label: "Purchase Price", value: formatPrice(device.purchasePrice) },
    { label: "Selling Price", value: formatPrice(device.sellingPrice) },
    { label: "Supplier", value: device.supplierName || "—" },
    { label: "Invoice", value: device.invoiceNumber || "—" },
    { label: "Warranty", value: `${device.warrantyDays} days` },
  ];

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`${device.brand} ${device.model}`}
      subtitle={device.variant || "Device details"}
      size="lg"
    >
      {device.images?.front && (
        <img
          src={device.images.front}
          alt="Device"
          className="w-full h-48 object-cover rounded-2xl mb-4"
        />
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {conditionBadge(device.condition)}
        {ptaBadge(device.ptaStatus)}
        <Badge variant="blue" size="sm">
          Battery {device.batteryHealth}%
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-x-6 mb-4">
        {rows.map(({ label, value, mono }) => (
          <div
            key={label}
            className="flex justify-between items-center py-2 border-b border-white/5"
          >
            <span className="text-gray-400 text-xs">{label}</span>
            <span
              className={`text-white text-xs font-medium text-right max-w-[55%] truncate ${mono ? "font-mono tracking-wider" : ""}`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-green-600/8 border border-green-500/20 mb-4">
        <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-3">
          Profit Summary
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-gray-400 text-xs">Profit</p>
            <p
              className={`font-black text-base ${profit >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {formatPrice(profit)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Margin</p>
            <p className="text-yellow-400 font-black text-base">{margin}%</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Warranty</p>
            <p className="text-white font-black text-base">
              {device.warrantyDays}d
            </p>
          </div>
        </div>
      </div>

      {/* {device.accessories && (
        <div className="mb-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
            Accessories
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(device.accessories).map(([key, val]) => (
              <div
                key={key}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                  ${
                    val
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-white/4 text-gray-600 border border-white/8"
                  }`}
              >
                {val ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* {device.notes && (
        <div className="p-3 rounded-xl bg-white/4 border border-white/8 mb-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
            Notes
          </p>
          <p className="text-white text-sm">{device.notes}</p>
        </div>
      )} */}

      <Modal.Footer align="end">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="primary"
          size="sm"
          iconLeft={<Pencil size={13} />}
          onClick={onEdit}
        >
          Edit Device
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ── Delete Confirm Modal ──────────────────────

function DeleteConfirmModal({
  device,
  onClose,
  onConfirm,
  loading,
}: {
  device: IDevice;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Delete Device"
      subtitle="This action cannot be undone"
      size="sm"
      disableBackdropClose={loading}
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
          <Trash2 size={28} className="text-red-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-base">
            Delete {device.brand} {device.model}?
          </p>
          <p className="text-gray-400 text-sm mt-1">
            IMEI: <span className="font-mono text-white">{device.imei1}</span>
          </p>
        </div>
        <div className="w-full p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-left">
          <p className="text-red-300 text-xs leading-relaxed">
            This will permanently remove this device from your inventory. All
            associated data will be deleted.
          </p>
        </div>
      </div>
      <Modal.Footer>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          loading={loading}
          onClick={onConfirm}
        >
          Yes, Delete Device
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ── Inventory Table (inline) ──────────────────

function InventoryTable({
  devices,
  loading,
  filters,
  onFilterChange,
  onView,
  onEdit,
  onDelete,
  currentPage,
  itemsPerPage,
  total,
  onPageChange,
}: {
  devices: IDevice[] | undefined;
  loading: boolean;
  filters: any;
  onFilterChange: (f: any) => void;
  onView: (d: IDevice) => void;
  onEdit: (d: IDevice) => void;
  onDelete: (d: IDevice) => void;
  currentPage: number;
  itemsPerPage: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const [showFilters, setShowFilters] = useState(false);
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-56 relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search brand, model, IMEI..."
            value={filters.search ?? ""}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/4 border border-white/10 text-white text-sm outline-none focus:border-yellow-400/50 transition-colors"
          />
        </div>
        <Button
          variant={showFilters ? "primary" : "dark"}
          size="sm"
          iconLeft={<Filter size={14} />}
          onClick={() => setShowFilters((f) => !f)}
        >
          Filters
        </Button>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="p-4 rounded-2xl bg-white/4 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Condition",
              key: "condition",
              opts: [
                ["new", "New"],
                ["used", "Used"],
                ["open-box", "Open Box"],
                ["refurbished", "Refurbished"],
              ],
            },
            {
              label: "Stock Status",
              key: "stockStatus",
              opts: [
                ["available", "Available"],
                ["low", "Low"],
                ["out-of-stock", "Out of Stock"],
                ["reserved", "Reserved"],
              ],
            },
            {
              label: "PTA Status",
              key: "ptaStatus",
              opts: [
                ["approved", "Approved"],
                ["pending", "Pending"],
                ["blocked", "Blocked"],
                ["unknown", "Unknown"],
              ],
            },
            {
              label: "Brand",
              key: "brand",
              opts: [
                ["Apple", "Apple"],
                ["Samsung", "Samsung"],
                ["Xiaomi", "Xiaomi"],
                ["OnePlus", "OnePlus"],
              ],
            },
          ].map(({ label, key, opts }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {label}
              </label>
              <select
                multiple
                value={filters[key] || []}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    [key]: Array.from(e.target.selectedOptions).map(
                      (o) => o.value,
                    ),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-white/4 border border-white/10 text-white text-xs outline-none focus:border-yellow-400/50"
              >
                {opts.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-4">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onFilterChange({ search: filters.search })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/8">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-white/4 animate-pulse"
              />
            ))}
          </div>
        ) : devices?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Smartphone size={36} className="text-gray-700" />
            <p className="text-gray-500 text-sm">No devices found</p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                {["Device", "IMEI", "Status", "Price", "Color", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider
                    ${h === "Actions" ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {devices?.map((device) => (
                <tr
                  key={device.id}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors group"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {device.images?.front ? (
                        <img
                          src={device.images.front}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                          <Smartphone size={16} className="text-gray-600" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">
                          {device.brand} {device.model}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {device.variant || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-white font-mono text-xs tracking-wider">
                      {device.imei1}
                    </p>
                    {device.imei2 && (
                      <p className="text-gray-600 font-mono text-[10px]">
                        {device.imei2}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      {conditionBadge(device.condition)}
                      {ptaBadge(device.ptaStatus)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-green-400 font-semibold text-sm">
                      {formatPrice(device.sellingPrice)}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Cost: {formatPrice(device.purchasePrice)}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-white font-medium text-sm">
                      {device.color || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onView(device)}
                        title="View"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-400/10 transition-all cursor-pointer"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => onEdit(device)}
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-yellow-400 hover:bg-yellow-400/10 transition-all cursor-pointer"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => onDelete(device)}
                        title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/4 border border-white/10">
          <p className="text-sm text-gray-400">
            Showing {(currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, total)} of {total}
          </p>
          <div className="flex gap-2 items-center">
            <Button
              variant="dark"
              size="sm"
              iconLeft={<ChevronLeft size={14} />}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </Button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all cursor-pointer
                    ${p === currentPage ? "bg-yellow-400 text-yellow-900" : "bg-white/4 text-gray-300 hover:bg-white/8"}`}
                >
                  {p}
                </button>
              );
            })}
            <Button
              variant="dark"
              size="sm"
              icon={<ChevronRight size={14} />}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────

export function InventoryDashboard() {
  const {
    filters,
    pagination,
    stats,
    summary,
    addDevice,
    deleteDevice,
    setFilters,
    setPagination,
  } = useInventory();

  // Modal state — one per modal type, mutually exclusive
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [templateDevice, setTemplateDevice] = useState<IDevice | null>(null);
  const [viewingDevice, setViewingDevice] = useState<IDevice | null>(null);
  const [editingDevice, setEditingDevice] = useState<IDevice | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<IDevice | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  console.log(showAddStockModal)

  // API data
  const [fetchedDevices, setFetchedDevices] = useState<IDevice[] | undefined>([]);
  const [tableLoading, setTableLoading] = useState(false);

  const { addToast } = useToast();

  // ── Fetch ─────────────────────────────────

  const fetchAllDevices = async () => {
    setTableLoading(true);
    try {
      const response = await DeviceService.getDevices();
      if (response.success) setFetchedDevices(response.data);
    } catch (error: any) {
      addToast({
        message: error?.response?.data?.message || "Failed to fetch inventory",
        type: "error",
      });
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDevices();
  }, []);

  // ── Profit trend ──────────────────────────

  const yesterdayProfit = stats.totalProfit * 0.85;
  const profitTrend = stats.totalProfit > yesterdayProfit;
  const profitChange = Math.abs(
    ((stats.totalProfit - yesterdayProfit) / (yesterdayProfit || 1)) * 100,
  );

  // ── Handlers ─────────────────────────────

  // Called when DeviceDetailsModal "Save" is pressed — receives the form data directly
  const handleAddDevice = (deviceData: ICreateDeviceRequest) => {
    const newDevice = addDevice(deviceData);
    setTemplateDevice(newDevice);
    setShowAddDeviceModal(false);
    setShowAddStockModal(true); // open IMEI scanner next
  };

  // const handleAddStock = (scannedIMEIs: ScannedIMEI[]) => {
  //   if (!templateDevice) return;
  //   scannedIMEIs.forEach((scan) => {
  //     addDevice({
  //       ...templateDevice,
  //       imei1: scan.imei,
  //       imei2: undefined,
  //       tacCode: scan.imei.slice(0, 8),
  //       serialNumber: scan.imei.slice(8, 14),
  //       quantity: 1,
  //     } as ICreateDeviceRequest);
  //   });
  //   addToast({
  //     message: `${scannedIMEIs.length} unit(s) added to inventory`,
  //     type: "success",
  //   });
  //   setShowAddStockModal(false);
  //   setTemplateDevice(null);
  //   fetchAllDevices();
  // };

  const handleEditDevice = async (updatedData: IDevice) => {
    console.log("Updating device with data:", updatedData);
    try {
      const response = await DeviceService.updateDevice(editingDevice?.id, updatedData);
      if (response.success) {
        addToast({ message: "Device updated successfully", type: "success" });
      } else {
        addToast({ message: response.message || "Failed to update device", type: "error" });
      }
    } catch (error) {
      console.error("Failed to update device:", error);
      addToast({ message: "Failed to update device", type: "error" });
    } finally {
      setEditingDevice(null);
      fetchAllDevices();
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingDevice) return;
    setDeleteLoading(true);
    try {
      await deleteDevice(deletingDevice.id);
      addToast({
        message: `${deletingDevice.brand} ${deletingDevice.model} deleted`,
        type: "success",
      });
      fetchAllDevices();
    } catch {
      addToast({ message: "Failed to delete device", type: "error" });
    } finally {
      setDeleteLoading(false);
      setDeletingDevice(null);
    }
  };

  return (
    <PageBackground>
      <Layout title="Inventory Dashboard - Basit Mobile Zone">
        <div className="flex h-screen overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <AnimateIn>
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-black text-white mb-1">
                        Inventory
                      </h1>
                      <p className="text-gray-400">
                        {stats.totalDevices} devices in stock
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {templateDevice && (
                        <Button
                          variant="secondary"
                          size="md"
                          iconLeft={<ScanBarcode size={16} />}
                          onClick={() => setShowAddStockModal(true)}
                        >
                          Add Stock Units
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="md"
                        iconLeft={<Plus size={16} />}
                        onClick={() => setShowAddDeviceModal(true)}
                      >
                        Add Device
                      </Button>
                    </div>
                  </div>
                </AnimateIn>

                {/* Stats */}
                <AnimateIn delay={80}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                      label="Total Devices"
                      value={stats.totalDevices}
                      icon={<Package size={24} />}
                      variant="primary"
                    />
                    {/* <StatsCard
                      label="Available Now"
                      value={stats.availableDevices}
                      icon={<Smartphone size={24} />}
                      variant="success"
                      trend={{
                        value: 12,
                        isPositive: true,
                        label: "vs last week",
                      }}
                    /> */}
                    <StatsCard
                      label="Total Profit"
                      value={`₨${(stats.totalProfit / 1000).toFixed(1)}K`}
                      icon={<DollarSign size={24} />}
                      variant="success"
                      trend={{
                        value: parseFloat(profitChange.toFixed(1)),
                        isPositive: profitTrend,
                        label: "vs yesterday",
                      }}
                    />
                    {/* <StatsCard
                      label="Low Stock Alerts"
                      value={stats.lowStockAlerts}
                      icon={<AlertTriangle size={24} />}
                      variant={stats.lowStockAlerts > 0 ? "warning" : "info"}
                    /> */}
                  </div>
                </AnimateIn>

                {/* Financial summary */}
                <AnimateIn delay={120}>
                  <Card padding="lg">
                    <Card.Header>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={18} className="text-yellow-400" />
                        <h2 className="text-white font-black text-lg">
                          Financial Summary
                        </h2>
                      </div>
                    </Card.Header>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Total Purchase Value",
                          value: `₨${(stats.totalPurchaseValue / 1000).toFixed(1)}K`,
                          color: "text-white",
                        },
                        {
                          label: "Stock Selling Value",
                          value: `₨${(stats.totalSellingValue / 1000).toFixed(1)}K`,
                          color: "text-white",
                        },
                        {
                          label: "Total Profit",
                          value: `+₨${(stats.totalProfit / 1000).toFixed(1)}K`,
                          color: "text-green-400",
                        },
                        {
                          label: "Average Margin",
                          value: `${stats.averageMargin.toFixed(1)}%`,
                          color: "text-yellow-400",
                        },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <p className="text-gray-400 text-sm mb-1">{label}</p>
                          <p className={`${color} font-black text-2xl`}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </AnimateIn>

                {/* Top Brands */}
                {summary.topBrands.length > 0 && (
                  <AnimateIn delay={160}>
                    <Card padding="lg">
                      <Card.Header>
                        <h2 className="text-white font-black text-lg">
                          Top Brands by Inventory
                        </h2>
                      </Card.Header>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {summary.topBrands.map((brand) => (
                          <div
                            key={brand.brand}
                            className="p-4 rounded-2xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-500/20"
                          >
                            <h3 className="text-white font-bold mb-2">
                              {brand.brand}
                            </h3>
                            <p className="text-gray-400 text-xs">
                              <span className="text-white font-semibold">
                                {brand.count}
                              </span>{" "}
                              devices
                            </p>
                            <p className="text-green-400 text-xs font-semibold">
                              ₨{(brand.profit / 1000).toFixed(1)}K profit
                            </p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </AnimateIn>
                )}

                {/* Inventory Table */}
                <AnimateIn delay={200}>
                  <Card padding="lg">
                    <Card.Header>
                      <h2 className="text-white font-black text-lg">
                        Device Inventory
                      </h2>
                    </Card.Header>
                    <InventoryTable
                      devices={fetchedDevices}
                      loading={tableLoading}
                      filters={filters}
                      onFilterChange={setFilters}
                      onView={setViewingDevice}
                      onEdit={(device) => {
                        setEditingDevice(device);
                      }}
                      onDelete={setDeletingDevice}
                      currentPage={pagination.page}
                      itemsPerPage={pagination.limit}
                      total={pagination.total}
                      onPageChange={(page) =>
                        setPagination({ ...pagination, page })
                      }
                    />
                  </Card>
                </AnimateIn>
              </div>
            </main>
          </div>
        </div>

        {/* ── MODALS — all use the reusable <Modal> component ── */}

        {/* 1. Add Device — DeviceDetailsModal (tabbed form + IMEI scanner) */}
        <DeviceDetailsModal
          open={showAddDeviceModal}
          onClose={() => setShowAddDeviceModal(false)}
          onSave={handleAddDevice}
          device={viewingDevice || undefined} // if editing, pass the device data
        />

        {/* 2. Add Stock — IMEI scanner for units */}
        {/* <AddStockModal
          open={showAddStockModal}
          onClose={() => setShowAddStockModal(false)}
          onSaveIMEIs={handleAddStock}
          templateDevice={templateDevice}
        /> */}

        {editingDevice && (
          <DeviceDetailsModal
            open={true}
            onClose={() => setEditingDevice(null)}
            onSave={handleEditDevice}
            device={editingDevice}
          />
        )}

        {/* 3. View Device — reusable Modal */}
        {viewingDevice && (
          <ViewDeviceModal
            device={viewingDevice}
            onClose={() => setViewingDevice(null)}
            onEdit={() => {
              setEditingDevice(viewingDevice)
              setViewingDevice(null);
            }}
          />
        )}

        {/* 4. Delete Confirm — reusable Modal */}
        {deletingDevice && (
          <DeleteConfirmModal
            device={deletingDevice}
            onClose={() => setDeletingDevice(null)}
            onConfirm={handleConfirmDelete}
            loading={deleteLoading}
          />
        )}

        <ToastContainer toasts={useToast().toasts} />
      </Layout>
    </PageBackground>
  );
}

export default InventoryDashboard;
