import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  Search,
  Filter,
  Eye,
  Printer,
  Download,
  ShoppingCart,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Smartphone,
  Calendar,
  DollarSign,
  BarChart3,
  Hourglass,
  CircleDollarSign,
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
import { SalesService } from "../../api";
import type { ISaleInfo, PaymentMethod, SaleStatus } from "../../interfaces";
import { formateTimeAndDate } from "../../utils/formateDateAndTime";

// ── Helpers ───────────────────────────────────

function formatPrice(n: number) {
  return `₨${n?.toLocaleString("en-PK")}`;
}

function formatIMEI(imei: string) {
  const d = imei.replace(/\D/g, "");
  if (d.length < 15) return d;
  return `${d.slice(0, 2)}-${d.slice(2, 8)}-${d.slice(8, 14)}-${d.slice(14)}`;
}

function statusBadge(s: SaleStatus) {
  const map: Record<
    SaleStatus,
    {
      v: "green" | "yellow" | "red" | "purple";
      l: string;
      icon: React.ReactNode;
    }
  > = {
    PAID: { v: "green", l: "PAID", icon: <CheckCircle2 size={10} /> },
    PENDING: { v: "yellow", l: "PENDING", icon: <Clock size={10} /> },
    CANCELLED: { v: "red", l: "CANCELLED", icon: <XCircle size={10} /> },
    REFUND: { v: "purple", l: "REFUND", icon: <XCircle size={10} /> },
  };
  const m = map[s];
  return (
    <Badge variant={m?.v} size="sm">
      {m?.icon} {m.l}
    </Badge>
  );
}

function paymentBadge(p: PaymentMethod | string | undefined) {
  const map: Record<
    PaymentMethod,
    { v: "blue" | "green" | "yellow" | "orange"; l: string }
  > = {
    cash: { v: "green", l: "Cash" },
    card: { v: "blue", l: "Card" },
    bank_transfer: { v: "yellow", l: "Bank Transfer" },
    installment: { v: "orange", l: "Installment" },
  };
  const m = map[p] ?? { v: "gray" as any, l: p };
  return (
    <Badge variant={m.v} size="sm">
      {m.l}
    </Badge>
  );
}

// ── Sale Detail Modal ─────────────────────────

function SaleDetailModal({
  sale,
  onClose,
  downloadInvoice,
  remainingAmountPaid,
}: {
  sale: ISaleInfo;
  onClose: () => void;
  downloadInvoice: () => void;
  remainingAmountPaid: () => void;
}) {
  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Invoice ${sale.invoiceNo}`}
      subtitle={`Sale on ${formateTimeAndDate(sale.soldAt)}`}
      size="md"
    >
      <div className="space-y-4">
        {/* Device info */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600/15 to-blue-600/10 border border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Smartphone size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-white font-black text-base">
                {sale.author?.brand} {sale.author?.model}
              </p>
              <p className="text-gray-400 text-sm">
                {sale.author?.variant}{" "}
                {sale.author?.color ? `· ${sale.author?.color}` : ""}
              </p>
              <p className="flex flex-col text-gray-500 font-mono text-xs mt-0.5">
                <span>IMEI 1: {formatIMEI(sale.author?.imei1 ?? "")}</span>
                <span>
                  {sale.author?.imei1 &&
                    `IMEI 2: ${formatIMEI(sale.author?.imei2 ?? "")}`}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-6">
          {[
            { label: "Customer", value: sale.customerName },
            { label: "Phone No", value: sale.phoneNo },
            { label: "Sale Price", value: formatPrice(sale.soldPrice) },
            {
              label: "Purchase Cost",
              value: formatPrice(sale.author?.purchasePrice ?? 0),
            },
            {
              label: "Profit",
              value: formatPrice(
                Number(sale.soldPrice) - (sale.author?.purchasePrice ?? 0),
              ),
            },
            {
              label: "Received",
              value: formatPrice(sale.receivedAmount ?? 0),
            },
            {
              label: "Remaining",
              value: formatPrice(sale.remainingAmount ?? 0),
            },
            {
              label: "Margin",
              value: `${(((Number(sale.soldPrice) - (sale.author?.purchasePrice ?? 0)) / (sale.author?.purchasePrice ?? 0)) * 100).toFixed(1)}%`,
            },
            {
              label: "Payment",
              value: (sale?.paymentType ?? "").replace("_", " ").toLowerCase(),
            },
            { label: "Condition", value: sale.author?.condition },
            {
              label: "Payment Status",
              value: sale.paymentStatus.toLowerCase(),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between py-2 border-b border-white/5"
            >
              <span className="text-gray-400 text-xs">{label}</span>
              <span className="text-white text-xs font-medium text-right capitalize">
                {value}
              </span>
            </div>
          ))}
        </div>

        {sale.notes && (
          <div className="p-3 rounded-xl bg-white/4 border border-white/8">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
              Notes
            </p>
            <p className="text-white text-sm">{sale.notes}</p>
          </div>
        )}
      </div>

      <Modal.Footer>
        <div className={`grid gap-3 grid-cols-2 max-[425px]:grid-cols-1`}>
          {sale.remainingAmount === 0 && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
          <Button
            onClick={downloadInvoice}
            variant="dark"
            size="sm"
            iconLeft={<Download size={13} />}
          >
            Download Invoice
          </Button>
          {sale.remainingAmount > 0 && (
            <Button
              onClick={() => {
                remainingAmountPaid();
                onClose();
              }}
              variant="success"
              size="sm"
              iconLeft={<CheckCircle2 size={13} />}
            >
              Amount Paid
            </Button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────

const Sales = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewingSale, setViewingSale] = useState<ISaleInfo | undefined>();
  const [salesData, setSalesData] = useState<ISaleInfo[] | undefined>();
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  const { toasts, addToast } = useToast();

  const fetchSalesData = async () => {
    try {
      const response = await SalesService.fetchSalesData();
      if (response.success) {
        setSalesData(response.data);
      }
    } catch (error) {
      console.log(error);
      addToast({
        message: "Something went wrong",
        type: "error",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchSalesData();
    };
    fetchData();
  }, []);

  // Filter
  const filtered = useMemo(() => {
    return salesData?.filter((s) => {
      const q = search.toLowerCase();
      if (
        q &&
        !`${s.author?.brand} ${s.author?.model} ${s.customerName} ${s.invoiceNo} ${s.author?.imei1}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      if (statusFilter && s.paymentStatus !== statusFilter.toUpperCase())
        return false;
      if (paymentFilter && s.paymentType !== paymentFilter.toUpperCase())
        return false;
      return true;
    });
  }, [salesData, search, statusFilter, paymentFilter]);

  const paginated = filtered?.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil((filtered?.length ?? 0) / PER_PAGE);

  // Stats
  const totalRevenue = salesData?.reduce((a, s) => a + s.soldPrice, 0);
  const totalProfit = salesData?.reduce(
    (a, s) => a + (s.soldPrice - Number(s.author?.purchasePrice)),
    0,
  );
  const totalSales = salesData?.length;
  const pendingCounts = salesData?.filter(
    (s) => s.paymentStatus === "PENDING",
  ).length;

  const handleExport = () => {
    const headers = [
      "Invoice",
      "Date",
      "Customer",
      "Brand",
      "Model",
      "IMEI",
      "Sale Price",
      "Profit",
      "Payment",
    ];
    const rows = salesData?.map((s) => [
      s.invoiceNo,
      s.soldAt,
      s.customerName,
      s.author?.brand,
      s.author?.model,
      s.author?.imei1,
      s.soldPrice,
      Number(s.soldPrice - (s.author?.purchasePrice ?? 0)),
      s.paymentType,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bmz-sales.csv";
    a.click();
    addToast({ message: "Sales exported as CSV", type: "success" });
  };

  const downloadInvoice = async (fileName: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/pdf/download/${fileName}`,
      );

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemainingAmountPaid = async (data: ISaleInfo) => {
    try {
      const response = await SalesService.confirmRemainingAmountPaid(data);
      if (response.success) {
        addToast({
          message:
            response.message || "Remaining amount received. Payment completed.",
          type: "success",
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      fetchSalesData();
    }
  };

  return (
    <PageBackground>
      <Layout title="Sales - Basit Mobile Zone">
        <main className="px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <AnimateIn>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                  <TrendingUp size={18} className="text-green-400" />
                </div>
                <div>
                  <h1 className="text-white font-black text-xl">Sales</h1>
                  <p className="text-gray-400 text-sm">
                    {totalSales} total transactions
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
            <div className="grid grid-cols-2 max-[525px]:grid-cols-1 xl:grid-cols-4 gap-4">
              <StatCard
                label="Total Revenue"
                value={`₨${(totalRevenue ?? 0) / 1000}K`}
                icon={<CircleDollarSign className="text-yellow-400" />}
                accent="yellow"
              />
              <StatCard
                label="Total Profit"
                value={`₨${(totalProfit ?? 0) / 1000}K`}
                icon={<TrendingUp className="text-green-400" />}
                accent="green"
              />
              <StatCard
                label="Sales Count"
                value={String(totalSales)}
                icon={<ShoppingCart className="text-purple-400" />}
                accent="purple"
              />
              <StatCard
                label="Pending"
                value={String(pendingCounts)}
                icon={<Hourglass className="text-blue-400" />}
                accent="blue"
              />
            </div>
          </AnimateIn>

          {/* Revenue breakdown chart (bars) */}
          <AnimateIn delay={100}>
            <Card padding="md">
              <Card.Header>
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-yellow-400" />
                  <h2 className="text-white font-black text-base">
                    Top Sales by Brand
                  </h2>
                </div>
              </Card.Header>
              <div className="space-y-3">
                {Object.entries(
                  salesData?.reduce(
                    (acc, s) => {
                      acc[s.author?.brand ?? ""] =
                        (acc[s.author?.brand ?? ""] || 0) + s.soldPrice;

                      return acc;
                    },
                    {} as Record<string, number>,
                  ) || {},
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([brand, rev], i) => {
                    const colors = [
                      "from-yellow-500 to-yellow-400",
                      "from-purple-500 to-purple-400",
                      "from-blue-500 to-blue-400",
                      "from-green-500 to-green-400",
                      "from-orange-500 to-orange-400",
                    ];
                    const pct = Math.round((rev / (totalRevenue ?? 0)) * 100);
                    return (
                      <div key={brand}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-300 font-medium">
                            {brand}
                          </span>
                          <span className="text-gray-500">
                            {formatPrice(rev)} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${colors[i]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          </AnimateIn>

          {/* Sales Table */}
          <AnimateIn delay={140}>
            <div>
              <div className="flex flex-col sm:flex-row gap-3 pb-3 items-start sm:items-center justify-between">
                <h2 className="text-white font-black text-base">
                  All Transactions
                </h2>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      placeholder="Search sales..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 outline-none focus:border-purple-500/50 transition-colors w-48"
                    />
                  </div>
                  <Button
                    variant={showFilters ? "secondary" : "dark"}
                    size="sm"
                    iconLeft={<Filter size={13} />}
                    onClick={() => setShowFilters((f) => !f)}
                  >
                    Filters
                  </Button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 p-4 rounded-2xl bg-white/3 border border-white/8">
                  <Select
                    label="Status"
                    options={[
                      { value: "paid", label: "Paid" },
                      { value: "pending", label: "Pending" },
                      { value: "cancelled", label: "Cancelled" },
                      { value: "refunded", label: "Refunded" },
                    ]}
                    placeholder="All Status"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                  />
                  <Select
                    label="Payment"
                    options={[
                      { value: "cash", label: "Cash" },
                      { value: "card", label: "Card" },
                      { value: "bank_transfer", label: "Bank Transfer" },
                      { value: "installment", label: "Installment" },
                    ]}
                    placeholder="All Methods"
                    value={paymentFilter}
                    onChange={(e) => {
                      setPaymentFilter(e.target.value);
                      setPage(1);
                    }}
                  />
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      iconLeft={<X size={13} />}
                      onClick={() => {
                        setStatusFilter("");
                        setPaymentFilter("");
                        setSearch("");
                        setPage(1);
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
                      {[
                        "Invoice",
                        "Date & Time",
                        "Customer",
                        "Device",
                        "IMEI",
                        "Amount",
                        "Status",
                        "Payment",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className={`px-4 py-3 text-nowrap text-xs font-semibold text-gray-400 uppercase tracking-wider ${h === "" ? "text-center" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated?.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <ShoppingCart size={36} className="text-gray-700" />
                            <p className="text-gray-500 text-sm">
                              No sales found
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginated?.map((sale) => (
                        <tr
                          key={sale.id}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors group"
                        >
                          <td className="px-4 py-3 text-nowrap">
                            <span className="text-yellow-400 font-mono text-xs font-semibold">
                              {sale.invoiceNo}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-nowrap">
                            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                              <Calendar size={11} />
                              {formateTimeAndDate(sale.soldAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-nowrap">
                            <p className="text-white text-xs font-medium">
                              {sale.customerName}
                            </p>
                            <p className="text-gray-500 text-[10px]">
                              {sale.author?.model}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-nowrap">
                            <p className="text-white text-xs font-semibold">
                              {sale.author?.brand} {sale.author?.model}
                            </p>
                            <p className="text-gray-500 text-[10px]">
                              {sale.author?.variant}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-nowrap">
                            <span className="text-gray-400 font-mono text-[10px]">
                              {formatIMEI(sale.author?.imei1 ?? "")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-nowrap">
                            <p className="text-green-400 font-bold text-xs">
                              {formatPrice(sale.author?.purchasePrice ?? 0)}
                            </p>
                            <p className="text-yellow-400 text-[10px]">
                              +
                              {formatPrice(
                                Number(
                                  sale.soldPrice -
                                    (sale.author?.purchasePrice ?? 0),
                                ),
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-nowrap">
                            <span className="text-gray-400 font-mono text-[10px]">
                              {statusBadge(sale.paymentStatus)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-nowrap">
                            {paymentBadge(sale.paymentType ?? "cash")}
                          </td>
                          <td className="px-4 py-3 text-nowrap">
                            <div className="flex justify-start gap-1">
                              <button
                                onClick={() => setViewingSale(sale)}
                                title="View"
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-400/10 transition-all cursor-pointer"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                title="Print"
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 transition-all cursor-pointer"
                                onClick={() => downloadInvoice(sale?.pdf ?? "")}
                              >
                                <Download size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
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
                          i === 1 ||
                          i === totalPages ||
                          Math.abs(i - page) <= 1;

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
          </AnimateIn>
        </main>

        {viewingSale && (
          <SaleDetailModal
            sale={viewingSale}
            onClose={() => setViewingSale(undefined)}
            downloadInvoice={() => downloadInvoice(viewingSale?.pdf ?? "")}
            remainingAmountPaid={() => handleRemainingAmountPaid(viewingSale)}
          />
        )}
        <ToastContainer toasts={toasts} />
      </Layout>
    </PageBackground>
  );
};

export default Sales;
