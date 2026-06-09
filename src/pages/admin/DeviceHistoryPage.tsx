// pages/admin/DeviceHistoryPage.tsx
// ─────────────────────────────────────────────
// Full history of all device activity:
// - Added to inventory (with IMEI, date, supplier)
// - Stock updates
// - Price changes
// - Status changes (sold, reserved, removed)
// ─────────────────────────────────────────────

import { useState, useMemo } from "react";
import {
  History,
  Search,
  PackagePlus,
  PackageMinus,
  Tag,
  ArrowRightLeft,
  TrendingUp,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

import {
  PageBackground,
  useToast,
  ToastContainer,
  Button,
  Badge,
  Card,
  StatCard,
  Select,
  AnimateIn,
} from "../../components/ui";
import { Layout } from "../../layout";
import { useInventory } from "../../hooks/useInventory";
import type { IDevice } from "../../interfaces/inventory";

// ── Types ─────────────────────────────────────

type EventType =
  | "added"
  | "sold"
  | "updated"
  | "price_change"
  | "status_change"
  | "deleted"
  | "stock_added";

interface DeviceEvent {
  id: string;
  type: EventType;
  deviceId: string;
  brand: string;
  model: string;
  variant?: string;
  imei: string;
  timestamp: string;
  date: string;
  // Event-specific fields
  oldValue?: string;
  newValue?: string;
  price?: number;
  supplier?: string;
  note?: string;
  performedBy?: string;
}

// ── Helpers ───────────────────────────────────

function formatPrice(n: number) {
  return `₨${n.toLocaleString("en-PK")}`;
}

function formatIMEI(imei: string) {
  const d = imei.replace(/\D/g, "");
  if (d.length < 15) return d;
  return `${d.slice(0, 2)}-${d.slice(2, 8)}-${d.slice(8, 14)}-${d.slice(14)}`;
}

/** Build a timeline of events from the devices array.
 *  In production this would come from your backend audit log table.
 *  Here we derive it from the device data we have.
 */
function buildHistory(devices: IDevice[]): DeviceEvent[] {
  const events: DeviceEvent[] = [];

  devices.forEach((device) => {
    // "Added to inventory" event
    events.push({
      id: `${device.id}-added`,
      type: "added",
      deviceId: device.id,
      brand: device.brand,
      model: device.model,
      variant: device.variant,
      imei: device.imei1,
      timestamp:
        device.purchaseDate ?? device.createdAt ?? new Date().toISOString(),
      date: device.purchaseDate
        ? new Date(device.purchaseDate).toLocaleDateString("en-PK", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "Unknown date",
      price: device.purchasePrice,
      supplier: device.supplierName,
      note: `Added via IMEI scan. Selling price: ${formatPrice(device.sellingPrice)}`,
      performedBy: "Admin",
    });

    // "Out of stock / sold" event — simulated when stockStatus is not available
    // if (device.stockStatus === "out-of-stock") {
    //   events.push({
    //     id: `${device.id}-sold`,
    //     type: "sold",
    //     deviceId: device.id,
    //     brand: device.brand,
    //     model: device.model,
    //     imei: device.imei1,
    //     timestamp: device.updatedAt ?? new Date().toISOString(),
    //     date: "Recently",
    //     price: device.sellingPrice,
    //     note: "Device marked out of stock",
    //     performedBy: "Admin",
    //   });
    // }

    // "Reserved" status event
    // if (device.stockStatus === "reserved") {
    //   events.push({
    //     id: `${device.id}-reserved`,
    //     type: "status_change",
    //     deviceId: device.id,
    //     brand: device.brand,
    //     model: device.model,
    //     imei: device.imei1,
    //     timestamp: device.updatedAt ?? new Date().toISOString(),
    //     date: "Recently",
    //     oldValue: "Available",
    //     newValue: "Reserved",
    //     performedBy: "Admin",
    //   });
    // }
  });

  // Sort newest first
  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

// ── Event config ──────────────────────────────

const EVENT_CONFIG: Record<
  EventType,
  {
    label: string;
    icon: React.ReactNode;
    badgeVariant: "green" | "red" | "blue" | "yellow" | "purple" | "orange";
    dotColor: string;
  }
> = {
  added: {
    label: "Added",
    icon: <PackagePlus size={14} />,
    badgeVariant: "green",
    dotColor: "bg-green-500",
  },
  sold: {
    label: "Sold",
    icon: <Tag size={14} />,
    badgeVariant: "blue",
    dotColor: "bg-blue-500",
  },
  updated: {
    label: "Updated",
    icon: <ArrowRightLeft size={14} />,
    badgeVariant: "yellow",
    dotColor: "bg-yellow-500",
  },
  price_change: {
    label: "Price Changed",
    icon: <TrendingUp size={14} />,
    badgeVariant: "orange",
    dotColor: "bg-orange-500",
  },
  status_change: {
    label: "Status Changed",
    icon: <ArrowRightLeft size={14} />,
    badgeVariant: "purple",
    dotColor: "bg-purple-500",
  },
  deleted: {
    label: "Deleted",
    icon: <PackageMinus size={14} />,
    badgeVariant: "red",
    dotColor: "bg-red-500",
  },
  stock_added: {
    label: "Stock Added",
    icon: <PackagePlus size={14} />,
    badgeVariant: "green",
    dotColor: "bg-green-500",
  },
};

// ── Event Row ─────────────────────────────────

function EventRow({ event }: { event: DeviceEvent }) {
  const cfg = EVENT_CONFIG[event.type];

  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/3 border border-white/8 hover:bg-white/5 transition-colors">
      {/* Icon */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
        ${
          event.type === "added"
            ? "bg-green-500/15 text-green-400"
            : event.type === "sold"
              ? "bg-blue-500/15  text-blue-400"
              : event.type === "deleted"
                ? "bg-red-500/15   text-red-400"
                : "bg-purple-500/15 text-purple-400"
        }`}
      >
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-semibold text-sm">
              {event.brand} {event.model}
            </p>
            {event.variant && (
              <span className="text-gray-500 text-xs">· {event.variant}</span>
            )}
            <Badge variant={cfg.badgeVariant} size="sm">
              {cfg.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 text-xs flex-shrink-0">
            <Calendar size={11} />
            {event.date}
          </div>
        </div>

        {/* IMEI */}
        <p className="text-gray-400 font-mono text-xs mt-1 tracking-wider">
          {formatIMEI(event.imei)}
        </p>

        {/* Event details */}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {event.price !== undefined && (
            <span className="text-xs text-gray-400">
              Price:{" "}
              <span className="text-yellow-400 font-semibold">
                {formatPrice(event.price)}
              </span>
            </span>
          )}
          {event.supplier && (
            <span className="text-xs text-gray-400">
              Supplier: <span className="text-white">{event.supplier}</span>
            </span>
          )}
          {event.oldValue && event.newValue && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="text-red-400">{event.oldValue}</span>
              <ArrowRightLeft size={10} />
              <span className="text-green-400">{event.newValue}</span>
            </span>
          )}
          {event.performedBy && (
            <span className="text-xs text-gray-600">
              by {event.performedBy}
            </span>
          )}
        </div>

        {event.note && (
          <p className="text-gray-500 text-xs mt-1 italic">{event.note}</p>
        )}
      </div>
    </div>
  );
}

// ── Summary Stats ─────────────────────────────

function HistoryStats({ events }: { events: DeviceEvent[] }) {
  const added = events.filter(
    (e) => e.type === "added" || e.type === "stock_added",
  ).length;
  const sold = events.filter((e) => e.type === "sold").length;
  const updated = events.filter(
    (e) =>
      e.type === "updated" ||
      e.type === "price_change" ||
      e.type === "status_change",
  ).length;
  const deleted = events.filter((e) => e.type === "deleted").length;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        label="Total Events"
        value={String(events.length)}
        icon="📋"
        accent="purple"
      />
      <StatCard
        label="Devices Added"
        value={String(added)}
        icon="📦"
        accent="green"
      />
      <StatCard
        label="Devices Sold"
        value={String(sold)}
        icon="✅"
        accent="blue"
      />
      <StatCard
        label="Updates / Changes"
        value={String(updated + deleted)}
        icon="🔄"
        accent="yellow"
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────

const DeviceHistoryPage = () => {
  const { devices } = useInventory();
  const { toasts, addToast } = useToast();

  const allEvents = useMemo(() => buildHistory(devices), [devices]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  // const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  // Filter
  const filtered = useMemo(() => {
    return allEvents.filter((e) => {
      const q = search.toLowerCase();
      if (
        q &&
        !`${e.brand} ${e.model} ${e.imei} ${e.supplier ?? ""}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      if (typeFilter && e.type !== typeFilter) return false;
      return true;
    });
  }, [allEvents, search, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Group by date for timeline display
  const grouped = useMemo(() => {
    const groups: Record<string, DeviceEvent[]> = {};
    paginated.forEach((e) => {
      const key = e.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return Object.entries(groups);
  }, [paginated]);

  const handleExport = () => {
    // CSV export of history
    const headers = [
      "Date",
      "Type",
      "Brand",
      "Model",
      "IMEI",
      "Price",
      "Supplier",
      "Note",
    ];
    const rows = filtered.map((e) => [
      e.date,
      e.type,
      e.brand,
      e.model,
      e.imei,
      e.price ?? "",
      e.supplier ?? "",
      e.note ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bmz-device-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    addToast({ message: "History exported as CSV", type: "success" });
  };

  return (
    <PageBackground>
      <Layout title="Device History — Basit Mobile Zone">
        <main className="px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <AnimateIn>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                  <History size={18} className="text-purple-400" />
                </div>
                <div>
                  <h1 className="text-white font-black text-xl">
                    Device History
                  </h1>
                  <p className="text-gray-400 text-sm">
                    {allEvents.length} total events
                  </p>
                </div>
              </div>
              <Button
                variant="dark"
                size="sm"
                iconLeft={<Download size={13} />}
                onClick={handleExport}
              >
                Export CSV
              </Button>
            </div>
          </AnimateIn>

          {/* Stats */}
          <AnimateIn delay={60}>
            <HistoryStats events={allEvents} />
          </AnimateIn>

          {/* Filters */}
          <AnimateIn delay={100}>
            <Card padding="md">
              <div className="flex flex-col sm:flex-row gap-3 mb-0">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    placeholder="Search brand, model, IMEI, supplier..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>

                {/* Type filter */}
                <Select
                  options={[
                    { value: "added", label: "Added" },
                    { value: "sold", label: "Sold" },
                    { value: "updated", label: "Updated" },
                    { value: "price_change", label: "Price Changed" },
                    { value: "status_change", label: "Status Changed" },
                    { value: "stock_added", label: "Stock Added" },
                    { value: "deleted", label: "Deleted" },
                  ]}
                  placeholder="All Event Types"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="sm:w-48"
                />

                {(search || typeFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<X size={13} />}
                    onClick={() => {
                      setSearch("");
                      setTypeFilter("");
                      setPage(1);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </Card>
          </AnimateIn>

          {/* Timeline */}
          <AnimateIn delay={140}>
            <div className="space-y-6">
              {grouped.length === 0 ? (
                <Card padding="md">
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <History size={40} className="text-gray-700" />
                    <div className="text-center">
                      <p className="text-gray-400 font-semibold">
                        No events found
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        {allEvents.length === 0
                          ? "Add devices to start tracking history"
                          : "Try adjusting your search or filters"}
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                grouped.map(([date, events]) => (
                  <div key={date}>
                    {/* Date label */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                        <Calendar size={12} className="text-yellow-400" />
                        <span className="text-white text-xs font-semibold">
                          {date}
                        </span>
                        <span className="text-gray-500 text-[10px]">
                          {events.length} event{events.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-white/6" />
                    </div>

                    {/* Events for this date */}
                    <div className="space-y-2 ml-2">
                      {events.map((event) => (
                        <EventRow key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </AnimateIn>

          {/* Pagination */}
          {totalPages > 1 && (
            <AnimateIn delay={160}>
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-xs">
                  Showing {(page - 1) * PER_PAGE + 1}–
                  {Math.min(page * PER_PAGE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="dark"
                    size="xs"
                    iconLeft={<ChevronLeft size={13} />}
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </Button>
                  {Array.from(
                    { length: Math.min(5, totalPages) },
                    (_, i) => i + 1,
                  ).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer
                        ${p === page ? "bg-yellow-400 text-yellow-900" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                    >
                      {p}
                    </button>
                  ))}
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
            </AnimateIn>
          )}
        </main>
        <ToastContainer toasts={toasts} />
      </Layout>
    </PageBackground>
  );
};

export default DeviceHistoryPage;
