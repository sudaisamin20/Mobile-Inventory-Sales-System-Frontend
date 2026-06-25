import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  ScanBarcode,
  Smartphone,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Phone,
} from "lucide-react";

import {
  PageBackground,
  useToast,
  ToastContainer,
} from "../../components/ui/Misc";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { StatCard } from "../../components/ui/StatCard";
import { Select } from "../../components/ui/Input";
import { AnimateIn } from "../../components/ui/Section";
import { Layout } from "../../layout";
import { DeviceDetailsModal, AddStockModal } from "../../components/inventory";
import { useInventory } from "../../hooks/useInventory";
import type { IDevice, ICreateDeviceRequest } from "../../interfaces/inventory";
import type { ScannedIMEI } from "../../components/inventory/AddStockModal";
import { DeviceService } from "../../api/deviceService";
import { Input } from "../../components";

// ── Helpers ───────────────────────────────────

export function formatPrice(n: number) {
  return `₨${n?.toLocaleString("en-PK")}`;
}

export function conditionBadge(c: string) {
  const map: Record<
    string,
    { v: "green" | "blue" | "yellow" | "orange"; l: string }
  > = {
    new: { v: "green", l: "New" },
    "open-box": { v: "blue", l: "Open Box" },
    used: { v: "yellow", l: "Used" },
    refurbished: { v: "orange", l: "Refurbished" },
  };
  const m = map[c] ?? { v: "gray" as any, l: c };
  return (
    <Badge variant={m.v} size="sm">
      {m.l}
    </Badge>
  );
}

export function stockBadge(s: string) {
  const map: Record<
    string,
    { v: "green" | "yellow" | "red" | "purple"; l: string }
  > = {
    available: { v: "green", l: "Available" },
    low: { v: "yellow", l: "Low Stock" },
    "out-of-stock": { v: "red", l: "Out of Stock" },
    reserved: { v: "purple", l: "Reserved" },
  };
  const m = map[s] ?? { v: "gray" as any, l: s };
  return (
    <Badge variant={m.v} size="sm">
      {m.l}
    </Badge>
  );
}

export function ptaBadge(s: string) {
  if (s === "approved")
    return (
      <Badge variant="green" size="sm">
        PTA Approved
      </Badge>
    );
  if (s === "pending")
    return (
      <Badge variant="yellow" size="sm">
        PTA Pending
      </Badge>
    );
  if (s === "blocked")
    return (
      <Badge variant="red" size="sm">
        PTA Blocked
      </Badge>
    );
  return (
    <Badge variant="gray" size="sm">
      PTA Unknown
    </Badge>
  );
}

// ── Device Table Row ──────────────────────────

function DeviceRow({
  device,
  index,
}: {
  device: IDevice;
  index: number;
  onView: (d: IDevice) => void;
  onEdit: (d: IDevice) => void;
  onDelete: (d: IDevice) => void;
}) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/3 transition-colors group">
      <td className="px-4 py-3 text-gray-500 text-xs text-center w-10">
        {index}
      </td>

      {/* Model */}
      <td className="px-4 py-3">
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
              {device.model}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 text-white text-xs font-medium">
        {device.brand}
      </td>
      <td className="px-4 py-3 text-white text-xs">{device.units ?? "—"}</td>
      <td className="px-4 py-3 text-white text-xs">
        {device.colors ?? device.color ?? "—"}
      </td>
      <td className="px-4 py-3 text-white text-xs">
        {device.variants ?? device.variant ?? "—"}
      </td>

      {/* Actions */}
      {/* <td className="px-4 py-3">
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
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(device)}
            title="Delete"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td> */}
    </tr>
  );
}

// ── View Device Modal ─────────────────────────
// Uses the reusable <Modal> component

// function ViewDeviceModal({
//   device,
//   onClose,
//   onEdit,
// }: {
//   device: IDevice;
//   onClose: () => void;
//   onEdit: () => void;
// }) {
//   const rows = [
//     { label: "Brand", value: device.brand },
//     { label: "Model", value: device.model },
//     { label: "Variant", value: device.variant || "—" },
//     { label: "Color", value: device.color || "—" },
//     { label: "IMEI 1", value: device.imei1, mono: true },
//     { label: "IMEI 2", value: device.imei2 || "—", mono: true },
//     {
//       label: "TAC Code",
//       value: device.tacCode || device.imei1?.slice(0, 8),
//       mono: true,
//     },
//     { label: "Country", value: device.countryVersion || "—" },
//     { label: "PTA Status", value: device.ptaStatus },
//     { label: "Network Lock", value: device.networkLockStatus },
//     { label: "Battery", value: `${device.batteryHealth}%` },
//     { label: "Screen", value: device.screenCondition },
//     { label: "Purchase Price", value: formatPrice(device.purchasePrice) },
//     { label: "Selling Price", value: formatPrice(device.sellingPrice) },
//     { label: "Supplier", value: device.supplierName || "—" },
//     { label: "Invoice", value: device.invoiceNumber || "—" },
//     { label: "Warranty", value: `${device.warrantyDays} days` },
//   ];

//   const profit = device.sellingPrice - device.purchasePrice;
//   const margin =
//     device.purchasePrice > 0
//       ? (
//           ((device.sellingPrice - device.purchasePrice) /
//             device.purchasePrice) *
//           100
//         ).toFixed(1)
//       : "0";

//   return (
//     <Modal
//       open={true}
//       onClose={onClose}
//       title={`${device.brand} ${device.model}`}
//       subtitle={device.variant || "Device details"}
//       size="lg"
//     >
//       {/* Device image */}
//       {device.images?.front && (
//         <img
//           src={device.images.front}
//           alt="Device"
//           className="w-full h-48 object-cover rounded-2xl mb-4"
//         />
//       )}

//       {/* Status badges */}
//       <div className="flex flex-wrap gap-2 mb-4">
//         {conditionBadge(device.condition)}
//         {ptaBadge(device.ptaStatus)}
//         <Badge variant="blue" size="sm">
//           Battery {device.batteryHealth}%
//         </Badge>
//       </div>

//       {/* Detail grid */}
//       <div className="grid grid-cols-2 gap-x-6 gap-y-0 mb-4">
//         {rows.map(({ label, value, mono }) => (
//           <div
//             key={label}
//             className="flex justify-between items-center py-2 border-b border-white/5"
//           >
//             <span className="text-gray-400 text-xs">{label}</span>
//             <span
//               className={`text-white text-xs font-medium text-right max-w-[55%] truncate ${mono ? "font-mono tracking-wider" : ""}`}
//             >
//               {value}
//             </span>
//           </div>
//         ))}
//       </div>

//       {/* Profit summary */}
//       <div className="p-4 rounded-2xl bg-green-600/8 border border-green-500/20 mb-4">
//         <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-3">
//           Profit Summary
//         </p>
//         <div className="grid grid-cols-3 gap-4 text-center">
//           <div>
//             <p className="text-gray-400 text-xs">Profit</p>
//             <p
//               className={`font-black text-base ${profit >= 0 ? "text-green-400" : "text-red-400"}`}
//             >
//               {formatPrice(profit)}
//             </p>
//           </div>
//           <div>
//             <p className="text-gray-400 text-xs">Margin</p>
//             <p className="text-yellow-400 font-black text-base">{margin}%</p>
//           </div>
//           <div>
//             <p className="text-gray-400 text-xs">Warranty</p>
//             <p className="text-white font-black text-base">
//               {device.warrantyDays}d
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Accessories */}
//       {/* {device.accessories && (
//         <div className="mb-4">
//           <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
//             Accessories
//           </p>
//           <div className="flex flex-wrap gap-2">
//             {Object.entries(device.accessories).map(([key, val]) => (
//               <div
//                 key={key}
//                 className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${val ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-white/4 text-gray-600 border border-white/8"}`}
//               >
//                 {val ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
//                 {key.charAt(0).toUpperCase() + key.slice(1)}
//               </div>
//             ))}
//           </div>
//         </div>
//       )} */}

//       {/* {device.notes && (
//         <div className="p-3 rounded-xl bg-white/4 border border-white/8 mb-4">
//           <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
//             Notes
//           </p>
//           <p className="text-white text-sm">{device.notes}</p>
//         </div>
//       )} */}

//       <Modal.Footer align="between">
//         <Button variant="ghost" size="sm" onClick={onClose}>
//           Close
//         </Button>
//         <Button
//           variant="primary"
//           size="sm"
//           iconLeft={<Pencil size={13} />}
//           onClick={onEdit}
//         >
//           Edit Device
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }

// ── Delete Confirm Modal ──────────────────────
// Uses the reusable <Modal> component

// function DeleteConfirmModal({
//   device,
//   onClose,
//   onConfirm,
//   loading,
// }: {
//   device: IDevice;
//   onClose: () => void;
//   onConfirm: () => void;
//   loading: boolean;
// }) {
//   return (
//     <Modal
//       open={true}
//       onClose={onClose}
//       title="Delete Device"
//       subtitle="This action cannot be undone"
//       size="sm"
//       disableBackdropClose={loading}
//     >
//       {/* Warning icon */}
//       <div className="flex flex-col items-center gap-4 py-2 text-center">
//         <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
//           <AlertTriangle size={28} className="text-red-400" />
//         </div>

//         <div>
//           <p className="text-white font-semibold text-base">
//             Delete {device.brand} {device.model}?
//           </p>
//           <p className="text-gray-400 text-sm mt-1">
//             IMEI: <span className="font-mono text-white">{device.imei1}</span>
//           </p>
//         </div>

//         <div className="w-full p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-left">
//           <p className="text-red-300 text-xs leading-relaxed">
//             This will permanently remove this device from your inventory. All
//             associated data including pricing, condition, and history will be
//             deleted.
//           </p>
//         </div>
//       </div>

//       <Modal.Footer>
//         <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
//           Cancel
//         </Button>
//         <Button
//           variant="danger"
//           size="sm"
//           loading={loading}
//           onClick={onConfirm}
//         >
//           Yes, Delete Device
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }

// ── Main Page ─────────────────────────────────

const PhonesPage = () => {
  const {
    filters,
    pagination,
    stats,
    addDevice,
    deleteDevice,
    setFilters,
    setPagination,
  } = useInventory();

  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [templateDevice, setTemplateDevice] = useState<IDevice | null>(null);
  const [viewingDevice, setViewingDevice] = useState<IDevice | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<IDevice | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [brandFilter, setBrandFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [fetchedDevices, setFetchedDevices] = useState<IDevice[] | undefined>(
    [],
  );
  const [modalType, setModalType] = useState<
    "addDevice" | "editDevice" | "deleteDevice" | null
  >(null);
  const { toasts, addToast } = useToast();
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;
  console.log(modalType);

  // ── Fetch devices ─────────────────────────

  const fetchAllDevices = async () => {
    try {
      const response = await DeviceService.getDevicesByModelUnits();
      if (response.success) setFetchedDevices(response.data);
    } catch (error: any) {
      addToast({
        message: error?.response?.data?.message || "Failed to fetch inventory",
        type: "error",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchAllDevices();
    };
    fetchData();
  }, []);

  // ── Local filters ─────────────────────────

  const filtered = useMemo(() => {
    const search = (filters.search || "").toLowerCase().trim();

    return fetchedDevices?.filter((d) => {
      if (brandFilter && d.brand !== brandFilter) return false;

      if (modelFilter && d.model !== modelFilter) return false;

      if (conditionFilter && d.condition !== conditionFilter) return false;

      const matchesSearch =
        !search ||
        d.brand?.toLowerCase().includes(search) ||
        d.model?.toLowerCase().includes(search) ||
        d.color?.toLowerCase().includes(search) ||
        d.variant?.toLowerCase().includes(search);

      return matchesSearch;
    });
  }, [
    fetchedDevices,
    brandFilter,
    modelFilter,
    conditionFilter,
    stockFilter,
    filters.search,
  ]);

  const uniqueBrands = [...new Set(fetchedDevices?.map((d) => d.brand))].filter(
    Boolean,
  );

  const modelBase = brandFilter
    ? (fetchedDevices ?? []).filter((d) => d.brand === brandFilter)
    : (fetchedDevices ?? []);

  const uniqueModels: string[] = [
    ...new Set(modelBase.map((d) => d.model)),
  ].filter(Boolean);

  // const totalPages = Math.ceil(pagination.total / pagination.limit);

  const paginated = filtered?.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil((filtered?.length ?? 0) / PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [brandFilter, modelFilter, conditionFilter, stockFilter, filters.search]);

  // ── Handlers ─────────────────────────────

  const handleAddDevice = (deviceData: ICreateDeviceRequest) => {
    const newDevice = addDevice(deviceData);
    setTemplateDevice(newDevice);
    setShowDeviceModal(false);
    setShowAddStockModal(true);
  };

  const handleAddStock = (scannedIMEIs: ScannedIMEI[]) => {
    if (!templateDevice) return;
    scannedIMEIs.forEach((scan) => {
      addDevice({
        ...templateDevice,
        imei1: scan.imei,
        imei2: undefined,
        tacCode: scan.imei.slice(0, 8),
        serialNumber: scan.imei.slice(8, 14),
        quantity: 1,
      } as ICreateDeviceRequest);
    });
    addToast({
      message: `${scannedIMEIs.length} unit(s) added`,
      type: "success",
    });
    setShowAddStockModal(false);
    setTemplateDevice(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDevice) return;
    setDeleteLoading(true);
    try {
      await deleteDevice(deletingDevice.id);
      addToast({
        message: `${deletingDevice.brand} ${deletingDevice.model} deleted`,
        type: "success",
      });
      fetchAllDevices(); // refresh list
    } catch {
      addToast({ message: "Failed to delete device", type: "error" });
    } finally {
      setDeleteLoading(false);
      setDeletingDevice(null);
    }
  };

  return (
    <PageBackground>
      <Layout title="Phones - Basit Mobile Zone">
        <main className="px-4 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto">
          {/* Stats */}
          <AnimateIn>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-green-500/20 flex items-center justify-center">
                  <Smartphone size={18} className="text-purple-400" />
                </div>
                <div>
                  <h1 className="text-white font-black text-xl">Phones</h1>
                  <p className="text-gray-400 text-sm">
                    {filtered?.length} total phones
                  </p>
                </div>
              </div>
              {/* <Button
                variant="dark"
                size="sm"
                iconLeft={<Download size={13} />}
                onClick={handleExport}
              >
                Export CSV
              </Button> */}
            </div>
          </AnimateIn>

          {/* <AnimateIn>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                label="Total Devices"
                value={String(stats.totalDevices)}
                icon="📱"
                accent="purple"
              />
              <StatCard
                label="Available"
                value={String(stats.availableDevices)}
                icon="✅"
                accent="green"
              />
              <StatCard
                label="Low Stock"
                value={String(stats.lowStockAlerts)}
                icon="⚠️"
                accent="yellow"
              />
              <StatCard
                label="Stock Value"
                value={`₨${(stats.totalSellingValue / 1000).toFixed(0)}K`}
                icon="💰"
                accent="blue"
              />
            </div>
          </AnimateIn> */}

          {/* Table card */}
          <AnimateIn delay={60}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              {/* <div>
                  <h1 className="text-white font-black text-xl">
                    Phones Inventory
                  </h1>
                  <p className="text-gray-400 text-sm mt-0.5">
                    {fetchedDevices?.length} models
                  </p>
                </div> */}
              {/* <div className="flex gap-2 flex-wrap">
                  {templateDevice && (
                    <Button
                      variant="secondary"
                      size="sm"
                      iconLeft={<ScanBarcode size={14} />}
                      onClick={() => setShowAddStockModal(true)}
                    >
                      Add More Units
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    iconLeft={<Plus size={14} />}
                    onClick={() => setShowDeviceModal(true)}
                  >
                    Add Device
                  </Button>
                </div> */}
            </div>

            {/* Search + filter row */}
            <div className="grid grid-cols-1 min-[350px]:grid-cols-3 gap-3 mb-4">
              <Input
                type="search"
                helper="Search brand, model..."
                placeholder="Search brand, model, IMEI..."
                value={filters.search ?? ""}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full col-span-1 min-[350px]:col-span-2"
              />
              <Button
                variant={showFilters ? "secondary" : "dark"}
                size="sm"
                iconLeft={<Filter size={14} />}
                onClick={() => setShowFilters((f) => !f)}
                className="col-span-1 w-full"
              >
                Filters
                {brandFilter || modelFilter || conditionFilter || stockFilter
                  ? " •"
                  : ""}
              </Button>
            </div>

            {/* Filters panel */}
            {showFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-4 rounded-2xl bg-white/3 border border-white/8">
                <Select
                  label="Brand"
                  options={uniqueBrands.map((b) => ({ value: b, label: b }))}
                  placeholder="All Brands"
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                />
                <Select
                  label="Model"
                  options={uniqueModels.map((m) => ({ value: m, label: m }))}
                  placeholder="All Models"
                  value={modelFilter}
                  onChange={(e) => setModelFilter(e.target.value)}
                />
                {/* <Select
                    label="Condition"
                    options={[
                      { value: "new", label: "New" },
                      { value: "open-box", label: "Open Box" },
                      { value: "used", label: "Used" },
                      { value: "refurbished", label: "Refurbished" },
                    ]}
                    placeholder="All Conditions"
                    value={conditionFilter}
                    onChange={(e) => setConditionFilter(e.target.value)}
                  />
                  <Select
                    label="Stock Status"
                    options={[
                      { value: "available", label: "Available" },
                      { value: "low", label: "Low Stock" },
                      { value: "out-of-stock", label: "Out of Stock" },
                      { value: "reserved", label: "Reserved" },
                    ]}
                    placeholder="All Status"
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                  /> */}
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setBrandFilter("");
                      setConditionFilter("");
                      setStockFilter("");
                      setModelFilter("");
                      setFilters({
                        ...filters,
                        search: "",
                      });
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/8 bg-white/3">
                    {["#", "Model", "Brand", "Units", "Colors", "Variants"].map(
                      (h) => (
                        <th
                          key={h}
                          className={`px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${h === "Actions" ? "text-center" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginated?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Smartphone size={36} className="text-gray-700" />
                          <p className="text-gray-500 text-sm">
                            No devices found
                          </p>
                          <Button
                            variant="primary"
                            size="sm"
                            iconLeft={<Plus size={13} />}
                            onClick={() => setShowDeviceModal(true)}
                          >
                            Add First Device
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated?.map((device, i) => (
                      <DeviceRow
                        key={device.id}
                        device={device}
                        index={(pagination.page - 1) * pagination.limit + i + 1}
                        onView={setViewingDevice}
                        onEdit={() => {
                          setViewingDevice(null);
                          setShowDeviceModal(true);
                        }}
                        onDelete={setDeletingDevice}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-gray-500 text-xs">
                  Showing {(page - 1) * PER_PAGE + 1}–
                  {Math.min(page * PER_PAGE, filtered?.length ?? 0)} of{" "}
                  {filtered?.length ?? 0}
                </p>

                <div className="flex items-center gap-2">
                  {/* Prev Button */}
                  <Button
                    variant="dark"
                    size="xs"
                    iconLeft={<ChevronLeft size={13} />}
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </Button>

                  {/* Page Numbers with Ellipsis */}
                  {(() => {
                    const pages = [];

                    for (let i = 1; i <= totalPages; i++) {
                      const shouldShow =
                        i === 1 || i === totalPages || Math.abs(i - page) <= 1;

                      if (shouldShow) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setPage(i)}
                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer
                  ${
                    i === page
                      ? "bg-yellow-400 text-black"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                          >
                            {i}
                          </button>,
                        );
                      } else {
                        const prev = i - 1;

                        if (
                          prev === 1 ||
                          prev === totalPages - 1 ||
                          Math.abs(prev - page) <= 1
                        ) {
                          pages.push(
                            <span
                              key={`dots-${i}`}
                              className="px-2 text-gray-500 text-sm"
                            >
                              ...
                            </span>,
                          );
                        }
                      }
                    }

                    return pages;
                  })()}

                  {/* Next Button */}
                  <Button
                    variant="dark"
                    size="xs"
                    icon={<ChevronRight size={13} />}
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </AnimateIn>
        </main>

        {/* ── Modals ── */}

        {/* 1. Add / Edit device — DeviceDetailsModal */}
        <DeviceDetailsModal
          open={showDeviceModal}
          onClose={() => setShowDeviceModal(false)}
          onSave={(device: IDevice) => handleAddDevice(device)}
        />

        {/* 2. Add stock units scanner */}
        <AddStockModal
          open={showAddStockModal}
          onClose={() => setShowAddStockModal(false)}
          onSaveIMEIs={handleAddStock}
          templateDevice={templateDevice}
        />

        {/* 3. View device — reusable Modal */}
        {viewingDevice && (
          <ViewDeviceModal
            device={viewingDevice}
            onClose={() => setViewingDevice(null)}
            onEdit={() => {
              setViewingDevice(null);
              setShowDeviceModal(true);
              setModalType("editDevice");
            }}
          />
        )}

        {/* 4. Delete confirm — reusable Modal */}
        {deletingDevice && (
          <DeleteConfirmModal
            device={deletingDevice}
            onClose={() => setDeletingDevice(null)}
            onConfirm={handleConfirmDelete}
            loading={deleteLoading}
          />
        )}

        <ToastContainer toasts={toasts} />
      </Layout>
    </PageBackground>
  );
};

export default PhonesPage;
