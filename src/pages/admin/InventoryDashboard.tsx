import { useEffect, useMemo, useState } from "react";
import {
  Smartphone,
  ScanBarcode,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Pencil,
  ShoppingBag,
} from "lucide-react";
import { Layout } from "../../layout";
import {
  Button,
  PageBackground,
  AnimateIn,
  useToast,
  ToastContainer,
  Modal,
  Badge,
  Input,
} from "../../components/ui";
import { DeviceDetailsModal } from "../../components/inventory";
import { useInventory } from "../../hooks/useInventory";
import type {
  IDevice,
  ICreateDeviceRequest,
  IInventoryFilters,
} from "../../interfaces/inventory";
import DeviceService from "../../api/deviceService";
import { formatPrice, conditionBadge, ptaBadge } from "../../utils";
import { formatDate } from "../../utils/formateDateAndTime";
import { Select } from "../../components";
import { SalesService } from "../../api/salesService";
import type { PaymentMethod } from "../../interfaces";

// ── View Device Modal ─────────────────────────

function ViewDeviceModal({
  device,
  onClose,
  onEdit,
  onSold,
  modalType,
}: {
  device: IDevice;
  onClose: () => void;
  onEdit: () => void;
  onSold: () => void;
  modalType: string;
}) {
  const profit = device.sellingPrice - device.purchasePrice;
  console.log(modalType);
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
    { label: "PTA Status", value: device.ptaStatus },
    { label: "Battery", value: `${device.batteryHealth}%` },
    { label: "Screen", value: device.screenCondition },
    { label: "Purchase Price", value: formatPrice(device.purchasePrice) },
    { label: "Selling Price", value: formatPrice(device.sellingPrice) },
    { label: "Supplier", value: device.supplierName || "—" },
    { label: "Invoice", value: device.invoiceNumber || "—" },
    { label: "Warranty", value: `${device.warrantyDays} days` },
    { label: "Purchased Date", value: `${formatDate(device.purchaseDate)}` },
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

      <div className="w-full overflow-x-auto mb-3">
        <div className="grid grid-cols-2 min-w-[500px] w-full gap-x-6 mb-1">
          {rows.map(({ label, value, mono }) => (
            <div
              key={label}
              className="flex justify-between items-center py-2 border-b border-white/5"
            >
              <span className="text-gray-400 text-xs">{label}</span>
              <span
                className={`text-white capitalize text-xs font-medium text-right max-w-[55%] truncate ${mono ? "font-mono tracking-wider" : ""}`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
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

      <Modal.Footer align="end">
        <div className="grid max-[335px]:grid-cols-1 max-[470px]:grid-cols-2 grid-cols-3 gap-2">
          <Button
            variant="ghost"
            className="max-[470px]:hidden"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Pencil size={13} />}
            onClick={onEdit}
            className="w-full"
          >
            Edit Device
          </Button>
          <Button
            variant="danger"
            size="sm"
            iconLeft={<ShoppingBag size={13} />}
            onClick={onSold}
            className="w-full"
          >
            Sold
          </Button>
        </div>
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

function SoldDeviceModal({
  device,
  onClose,
  // onConfirm,
  fetchAllDevices,
}: {
  device: IDevice;
  onClose: () => void;
  // onConfirm: (data: {
  //   customerName: string;
  //   phoneNo: string;
  //   paymentType: string;
  //   soldPrice: number;
  //   notes?: string;
  //   deviceId: string;
  //   receivedAmount?: number;
  //   remainingAmount: number | undefined;
  // }) => void;
  fetchAllDevices: () => void;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [soldPrice, setSoldPrice] = useState<number | undefined>();
  const [receivedAmount, setReceivedAmount] = useState<number | undefined>();
  const [remainingAmount, setRemainingAmount] = useState<number | undefined>();
  const [paymentType, setPaymentType] = useState<
    PaymentMethod | undefined | string
  >("");
  const [notes, setNotes] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    setRemainingAmount(
      Math.max(0, (Number(soldPrice) || 0) - (Number(receivedAmount) || 0)),
    );
  }, [soldPrice, receivedAmount]);

  // const handleCnicChange = (value: string) => {
  //   // Remove everything except digits
  //   const digits = value.replace(/\D/g, "").slice(0, 13);

  //   let formatted = digits;

  //   if (digits.length > 5) {
  //     formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
  //   }

  //   if (digits.length > 12) {
  //     formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  //   }

  //   setCnicNo(formatted);
  // };

  const handlePhoneChange = (value: string) => {
    // Keep only digits
    const digits = value.replace(/\D/g, "").slice(0, 11);

    let formatted = digits;

    if (digits.length > 4) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }

    setPhoneNo(formatted);
  };

  const handleConfirm = async () => {
    setLoading(true);
    console.log(device.id);
    try {
      if (
        !customerName ||
        !phoneNo ||
        !soldPrice ||
        !paymentType ||
        !receivedAmount
      )
        return;
      // onConfirm({
      //   customerName,
      //   phoneNo,
      //   soldPrice: Number(soldPrice),
      //   paymentType,
      //   notes,
      //   deviceId: device.id,
      //   receivedAmount,
      //   remainingAmount,
      // });
      const response = await SalesService.soldDevice({
        customerName,
        phoneNo,
        soldPrice,
        paymentType: paymentType?.toUpperCase(),
        notes,
        deviceId: device.id,
        receivedAmount,
        remainingAmount,
        brand: device.brand,
        model: device.model,
        imei1: device.imei1,
        imei2: device.imei2,
        variant: device.variant,
        color: device.color,
      });
      if (response.success) {
        addToast({
          message: response.message,
          type: "success",
        });
      }
    } catch (error) {
      console.log(error);
      addToast({
        message: "Something went wrong!",
        type: "error",
      });
    } finally {
      setLoading(false);
      onClose();
      fetchAllDevices();
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Mark Device as Sold" size="md">
      <div className="flex flex-col gap-4 py-2">
        {/* Device Info */}
        <div className="text-center flex flex-col items-center gap-1">
          <p className="text-white font-semibold">
            {device.brand} {device.model}
          </p>
          <p className="text-gray-400 text-xs font-mono">
            IMEI: {device.imei1}
          </p>
        </div>

        {/* Inputs */}
        <div className="grid md:grid-cols-3 min-[380px]:grid-cols-2 gap-3">
          <Input
            label="Customer Name"
            placeholder="Enter customer name"
            helper="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <Input
            label="Phone No"
            type="tel"
            placeholder="Enter phone no"
            helper="Phone No"
            value={phoneNo}
            onChange={(e) => handlePhoneChange(e.target.value)}
          />

          <Input
            label="Sold Price"
            type="number"
            placeholder="Enter sold price"
            helper="Sold Price"
            value={soldPrice}
            onChange={(e) => setSoldPrice(parseFloat(e.target.value))}
          />

          <Input
            label="Received"
            type="number"
            placeholder="Enter Received Money"
            helper="Received Money"
            value={receivedAmount}
            onChange={(e) => setReceivedAmount(parseFloat(e.target.value))}
          />

          <Input
            label="Remaining"
            type="number"
            placeholder="Enter Remaining Money"
            helper="Remaining Money"
            value={remainingAmount}
          />

          <Select
            label="Payment Type"
            placeholder="Enter payment type"
            options={[
              {
                label: "Cash",
                value: "cash",
              },
              {
                label: "EasyPaisa",
                value: "easypaisa",
              },
              {
                label: "JazzCash",
                value: "jazzcash",
              },
              {
                label: "Bank Transfer",
                value: "backtransfer",
              },
            ]}
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
          />

          <Input
            label="Notes (optional)"
            placeholder="Any remarks..."
            helper="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Warning / Info */}
        <div className="w-full p-3 rounded-xl bg-green-500/10 border border-green-500/15">
          <p className="text-green-300 text-xs leading-relaxed">
            This device will be moved to sold inventory and marked as completed
            sale.
          </p>
        </div>
      </div>

      <Modal.Footer>
        <div className="grid max-[310px]:grid-cols-1 grid-cols-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={!customerName || !soldPrice || loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-black"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Processing...
              </div>
            ) : (
              "Confirm Sold"
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

// ── Inventory Table (inline) ──────────────────
//
// CASCADING FILTERS — how this works:
//
//  - filters.brand   → narrows devices to that brand
//  - filters.model   → (within the brand-filtered set) narrows to that model
//  - filters.variant → (within brand+model-filtered set) narrows to that
//                        storage/RAM variant
//  - filters.color   → (within brand+model+variant-filtered set) narrows
//                        to that color
//
// Each dropdown's OPTION LIST is built from the set already narrowed by the
// filters ABOVE it — e.g. once "Samsung" is picked, the Model dropdown only
// shows models that exist for Samsung. Once a Model is picked, the Variant
// dropdown only shows variants that exist for that brand+model. Etc.
//
// IMPORTANT: filter values store the *exact* brand/model/variant/color
// strings (not lowercased) so they match `device.brand` etc. directly —
// lowercasing here previously broke the `.includes()` comparisons below.

function InventoryTable({
  devices,
  loading,
  filters,
  onFilterChange,
  onView,
  onEdit,
  onDelete,
}: {
  devices: IDevice[] | undefined;
  loading: boolean;
  filters: IInventoryFilters;
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
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  // ── Apply all 4 filters together ─────────────
  const filtered = useMemo(() => {
    const result = (devices ?? []).filter((d) => {
      const matchBrand =
        !filters.brand?.length || filters.brand.includes(d.brand);
      const matchModel =
        !filters.model?.length || filters.model.includes(d.model);
      const matchVariant =
        !filters.variant?.length || filters.variant.includes(d.variant);
      const matchColor =
        !filters.color?.length || filters.color.includes(d.color);
      const search = (filters.search || "").toLowerCase().trim();

      const matchSearch =
        !search ||
        d.brand?.toLowerCase().includes(search) ||
        d.model?.toLowerCase().includes(search) ||
        d.variant?.toLowerCase().includes(search) ||
        d.color?.toLowerCase().includes(search) ||
        d.imei1?.toLowerCase().includes(search) ||
        d.imei2?.toLowerCase().includes(search) ||
        d.variant?.toLowerCase().includes(search);

      return (
        matchBrand && matchModel && matchVariant && matchColor && matchSearch
      );
    });

    if (filters.priceSort === "lowToHigh") {
      result.sort((a, b) => a.sellingPrice - b.sellingPrice);
    }

    if (filters.priceSort === "highToLow") {
      result.sort((a, b) => b.sellingPrice - a.sellingPrice);
    }

    return result;
  }, [devices, filters]);

  // Reset to page 1 whenever the filtered result set changes
  useEffect(() => {
    setPage(1);
  }, [
    filters.brand,
    filters.model,
    filters.variant,
    filters.color,
    filters.search,
  ]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Cascading option lists ────────────────────
  // Each level's options come from devices narrowed by EVERY filter above it.

  const uniqueBrands: string[] = [
    ...new Set((devices ?? []).map((d) => d.brand)),
  ].filter(Boolean);

  // Models available — narrowed by selected brand(s)
  const modelBase = filters.brand?.length
    ? (devices ?? []).filter((d) => (filters?.brand ?? "").includes(d.brand))
    : (devices ?? []);
  const uniqueModels: string[] = [
    ...new Set(modelBase.map((d) => d.model)),
  ].filter(Boolean);

  // Variants available — narrowed by selected brand(s) + model(s)
  const variantBase = modelBase.filter(
    (d) => !filters.model?.length || filters.model.includes(d.model),
  );
  const uniqueVariants: string[] = [
    ...new Set(variantBase.map((d) => d.variant)),
  ].filter(Boolean);

  // Colors available — narrowed by selected brand(s) + model(s) + variant(s)
  const colorBase = variantBase.filter(
    (d) => !filters.variant?.length || filters.variant.includes(d.variant),
  );
  const uniqueColors: string[] = [
    ...new Set(colorBase.map((d) => d.color)),
  ].filter(Boolean);

  // ── Cascading change handlers ─────────────────
  // Picking a higher-level filter clears everything below it, since those
  // options may no longer be valid for the new selection.

  const handleFilterChange = (
    key: "brand" | "model" | "variant" | "color",
    values: string[],
  ) => {
    const next = { ...filters, [key]: values };
    if (key === "brand") {
      next.model = [];
      next.variant = [];
      next.color = [];
    }
    if (key === "model") {
      next.variant = [];
      next.color = [];
    }
    if (key === "variant") {
      next.color = [];
    }
    onFilterChange(next);
  };

  const FILTER_CONFIG: {
    label: string;
    key: "brand" | "model" | "variant" | "color";
    options: string[];
  }[] = [
    { label: "Brand", key: "brand", options: uniqueBrands },
    { label: "Model", key: "model", options: uniqueModels },
    { label: "Variant", key: "variant", options: uniqueVariants },
    { label: "Color", key: "color", options: uniqueColors },
  ];

  const activeFilterCount =
    (filters.brand?.length ?? 0) +
    (filters.model?.length ?? 0) +
    (filters.variant?.length ?? 0) +
    (filters.color?.length ?? 0);

  return (
    <div className="space-y-4">
      {/* Search + filter toggle */}
      <div className="grid grid-cols-3 gap-3">
        <Input
          type="search"
          helper="search"
          placeholder="Search brand, model, IMEI..."
          value={filters.search ?? ""}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value })
          }
          className="col-span-2"
        />
        <Button
          variant={showFilters ? "primary" : "dark"}
          size="sm"
          iconLeft={<Filter size={14} />}
          onClick={() => setShowFilters((f) => !f)}
          className="col-span-1"
        >
          Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
        </Button>
      </div>

      {/* Cascading filter dropdowns */}
      {showFilters && (
        <div className="p-4 rounded-2xl bg-white/4 border border-white/10 grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-5 gap-3">
          {FILTER_CONFIG.map(({ label, key, options }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {label}
              </label>
              <Select
                options={options.map((o) => ({ value: o, label: o }))}
                placeholder={`Select ${label}`}
                value={filters[key] || []}
                onChange={(e) =>
                  handleFilterChange(
                    key,
                    Array.from(e.target.selectedOptions).map((o) => o.value),
                  )
                }
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Price Sort
            </label>

            <Select
              options={[
                { value: "lowToHigh", label: "Low → High" },
                { value: "highToLow", label: "High → Low" },
              ]}
              placeholder="Sort Price"
              value={filters.priceSort || ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  priceSort: e.target.value,
                })
              }
            />
          </div>
          <div className="">
            <Button
              variant="ghost"
              size="xs"
              onClick={() =>
                onFilterChange({
                  search: filters.search,
                  brand: [],
                  model: [],
                  variant: [],
                  color: [],
                })
              }
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
        ) : filtered.length === 0 ? (
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
              {paginated.map((device) => (
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
                  <td className="px-4 py-4 text-nowrap">
                    <div className="flex flex-col w-fit items-center gap-1.5">
                      {conditionBadge(device.condition)}
                      {ptaBadge(device.ptaStatus)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-nowrap">
                    <p className="text-green-400 font-semibold text-sm">
                      {formatPrice(device.sellingPrice)}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Cost: {formatPrice(device.purchasePrice)}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-nowrap">
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

      {totalPages > 1 && (
        <div className="flex max-[450px]:flex-col gap-3 items-center justify-between mt-4">
          <p className="text-gray-500 text-xs">
            Showing {(page - 1) * PER_PAGE + 1}–
            {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
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
    </div>
  );
}

// ── Main Dashboard ────────────────────────────

export function InventoryDashboard() {
  const {
    filters,
    pagination,
    addDevice,
    setFilters,
    setPagination,
  } = useInventory();

  // Modal state — one per modal type, mutually exclusive
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [, setShowAddStockModal] = useState(false);
  const [templateDevice, setTemplateDevice] = useState<IDevice | null>(null);
  const [viewingDevice, setViewingDevice] = useState<IDevice | null>(null);
  const [editingDevice, setEditingDevice] = useState<IDevice | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<IDevice | null>(null);
  const [soldDevice, setSoldDevice] = useState<IDevice | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // API data
  const [fetchedDevices, setFetchedDevices] = useState<IDevice[] | undefined>(
    [],
  );
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
    const fetchData = async () => {
      await fetchAllDevices();
    };
    fetchData();
  }, []);

  // ── Profit trend ──────────────────────────

  // const yesterdayProfit = stats.totalProfit * 0.85;
  // const profitTrend = stats.totalProfit > yesterdayProfit;
  // const profitChange = Math.abs(
  //   ((stats.totalProfit - yesterdayProfit) / (yesterdayProfit || 1)) * 100,
  // );

  // ── Handlers ─────────────────────────────

  // Called when DeviceDetailsModal "Save" is pressed — receives the form data directly
  const handleAddDevice = (deviceData: ICreateDeviceRequest) => {
    const newDevice = addDevice(deviceData);
    setTemplateDevice(newDevice);
    setShowAddDeviceModal(false);
    setShowAddStockModal(true); // open IMEI scanner next
  };

  const handleEditDevice = async (updatedData: IDevice) => {
    try {
      const response = await DeviceService.updateDevice(
        editingDevice?.id,
        updatedData,
      );
      if (response.success) {
        addToast({ message: "Device updated successfully", type: "success" });
      } else {
        addToast({
          message: response.message || "Failed to update device",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Failed to update device:", error);
      addToast({ message: "Failed to update device", type: "error" });
    } finally {
      setEditingDevice(null);
      fetchAllDevices();
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDevice) return;
    setDeleteLoading(true);
    try {
      const response = await DeviceService.deleteDevice(deletingDevice.id);
      if (response.success) {
        addToast({
          message: response.message,
          type: "success",
        });
      }
    } catch {
      addToast({ message: "Failed to delete device", type: "error" });
    } finally {
      setDeleteLoading(false);
      setDeletingDevice(null);
      fetchAllDevices();
    }
  };

  return (
    <PageBackground>
      <Layout title="Inventory - Basit Mobile Zone">
        <div className="flex h-screen overflow-y-hidden">
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
                        {fetchedDevices?.length} devices in stock
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
                    </div>
                  </div>
                </AnimateIn>

                {/* Inventory Table */}
                <AnimateIn delay={200}>
                  <div>
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
                  </div>
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
          modalType="addDevice"
        />

        {editingDevice && (
          <DeviceDetailsModal
            open={true}
            onClose={() => setEditingDevice(null)}
            onSave={handleEditDevice}
            device={editingDevice}
            modalType="editDevice"
          />
        )}

        {/* 3. View Device — reusable Modal */}
        {viewingDevice && (
          <ViewDeviceModal
            device={viewingDevice}
            onClose={() => setViewingDevice(null)}
            onEdit={() => {
              setEditingDevice(viewingDevice);
              setViewingDevice(null);
            }}
            onSold={() => {
              setSoldDevice(viewingDevice);
              setViewingDevice(null);
            }}
            modalType="viewDevice"
          />
        )}

        {soldDevice && (
          <SoldDeviceModal
            device={soldDevice}
            onClose={() => setSoldDevice(null)}
            fetchAllDevices={fetchAllDevices}
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
