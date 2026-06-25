// app/Dashboard.tsx
// ─────────────────────────────────────────────
// Admin Dashboard — uses the full BMZ UI component library
// ─────────────────────────────────────────────

"use client";
import { useState } from "react";
import {
  ShoppingBag,
  Wrench,
  Plus,
  Pencil,
  Trash2,
  FileBarChart,
  Package,
  Phone,
  TrendingUp,
} from "lucide-react";

import {
  PageBackground,
  Tabs,
  useToast,
  ToastContainer,
} from "../../components/ui/Misc";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { Table } from "../../components/ui/Table";
import { AnimateIn } from "../../components/ui/Section";
import { DeviceDetailsModal } from "../../components/inventory";
import type { ICreateDeviceRequest } from "../../interfaces/inventory";
import { Layout } from "../../layout";
import { DeviceService } from "../../api/deviceService";

// ── Nav definition ────────────────────────────

// ── Mock data ─────────────────────────────────

interface Phone {
  id: number;
  name: string;
  brand: string;
  price: string;
  stock: number;
  stockStatus: "active" | "low" | "out";
}

interface Order {
  id: string;
  customer: string;
  phone: string;
  amount: string;
  status: "completed" | "pending" | "cancelled";
  date: string;
}

const PHONES: Phone[] = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    price: "PKR 459,999",
    stock: 12,
    stockStatus: "active",
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    price: "PKR 389,999",
    stock: 4,
    stockStatus: "low",
  },
  {
    id: 3,
    name: "OnePlus 12",
    brand: "OnePlus",
    price: "PKR 179,999",
    stock: 0,
    stockStatus: "out",
  },
  {
    id: 4,
    name: "Xiaomi 14 Ultra",
    brand: "Xiaomi",
    price: "PKR 249,999",
    stock: 8,
    stockStatus: "active",
  },
  {
    id: 5,
    name: "Google Pixel 8 Pro",
    brand: "Google",
    price: "PKR 199,999",
    stock: 2,
    stockStatus: "low",
  },
];

const ORDERS: Order[] = [
  {
    id: "#ORD-001",
    customer: "Ahmed Khan",
    phone: "iPhone 15 Pro Max",
    amount: "PKR 459,999",
    status: "completed",
    date: "21 May 2026",
  },
  {
    id: "#ORD-002",
    customer: "Sara Malik",
    phone: "Samsung Galaxy S24 Ultra",
    amount: "PKR 389,999",
    status: "pending",
    date: "21 May 2026",
  },
  {
    id: "#ORD-003",
    customer: "Usman Ali",
    phone: "Xiaomi 14 Ultra",
    amount: "PKR 249,999",
    status: "completed",
    date: "20 May 2026",
  },
  {
    id: "#ORD-004",
    customer: "Fatima Zahra",
    phone: "OnePlus 12",
    amount: "PKR 179,999",
    status: "cancelled",
    date: "20 May 2026",
  },
  {
    id: "#ORD-005",
    customer: "Bilal Raza",
    phone: "Google Pixel 8 Pro",
    amount: "PKR 199,999",
    status: "pending",
    date: "19 May 2026",
  },
];

const ORDER_TABS = [
  { key: "all", label: "All", count: 5 },
  { key: "completed", label: "Completed", count: 2 },
  { key: "pending", label: "Pending", count: 2 },
  { key: "cancelled", label: "Cancelled", count: 1 },
];

// ── Helpers ───────────────────────────────────

const orderStatusBadge = (status: Order["status"]) => {
  const map = {
    completed: { variant: "green" as const, label: "Completed" },
    pending: { variant: "yellow" as const, label: "Pending" },
    cancelled: { variant: "red" as const, label: "Cancelled" },
  };
  return <Badge variant={map[status].variant}>{map[status].label}</Badge>;
};

const stockBadge = (s: Phone["stockStatus"], stock: number) => {
  if (s === "out") return <Badge variant="red">Out of Stock</Badge>;
  if (s === "low") return <Badge variant="orange">Low ({stock})</Badge>;
  return <Badge variant="green">{stock} in stock</Badge>;
};

// ── Dashboard ─────────────────────────────────

const Dashboard = () => {
  const [orderTab, setOrderTab] = useState("all");
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const { toasts, addToast } = useToast();

  const filteredOrders =
    orderTab === "all" ? ORDERS : ORDERS.filter((o) => o.status === orderTab);

  const handleSaveDevice = async (device: ICreateDeviceRequest) => {
    try {
      const response = await DeviceService.addDevices(device);
      if (response.success && response.data) {
        addToast({
          message: `Saved device: ${device.model} (${device.brand})`,
          type: "success",
        });
        setShowDeviceModal(false);
      }
    } catch (error) {
      console.log("Error saving device:", error);
      addToast({
        message: `Failed to save device: ${error || "Unknown error"}`,
        type: "error",
      });
    }
  };

  return (
    <PageBackground>
      <Layout
        title="Dashboard - Basit Mobile Zone"
        author="Basit Mobile Zone"
        description="Admin dashboard for Basit Mobile Zone"
      >
        <div className="flex min-h-screen">
          {/* ── Main Area ── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* ── Scrollable body ── */}
            <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
              {/* Stats */}
              <AnimateIn>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Revenue"
                    value="PKR 2.4M"
                    icon={<TrendingUp />}
                    accent="yellow"
                    trend="+18%"
                  />
                  <StatCard
                    label="Phones Sold"
                    value="1,284"
                    icon={<Phone className="text-purple-400" />}
                    accent="purple"
                    trend="+9%"
                  />
                  <StatCard
                    label="Active Orders"
                    value="42"
                    icon={<Package className="text-yellow-400" />}
                    accent="blue"
                    trend="+5%"
                  />
                  <StatCard
                    label="Low Stock"
                    value="6"
                    icon="⚠️"
                    accent="red"
                    trend="-2%"
                    trendDown
                  />
                </div>
              </AnimateIn>

              {/* Quick Actions */}
              <AnimateIn delay={80}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    iconLeft={<Plus size={14} />}
                    fullWidth
                    onClick={() => setShowDeviceModal(true)}
                  >
                    Add Phone
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={<ShoppingBag size={14} />}
                    fullWidth
                    onClick={() =>
                      addToast({ message: "Opening order form…", type: "info" })
                    }
                  >
                    New Order
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={<Wrench size={14} />}
                    fullWidth
                    onClick={() =>
                      addToast({
                        message: "Opening repair form…",
                        type: "info",
                      })
                    }
                  >
                    Log Repair
                  </Button>
                  <Button
                    variant="dark"
                    size="sm"
                    iconLeft={<FileBarChart size={14} />}
                    fullWidth
                    onClick={() =>
                      addToast({ message: "Report exported!", type: "success" })
                    }
                  >
                    Export
                  </Button>
                </div>
              </AnimateIn>

              {/* Orders + Side cards */}
              {/* <div className="grid xl:grid-cols-3 gap-5">
                <AnimateIn delay={120} className="xl:col-span-2">
                  <Card padding="md">
                    <Card.Header>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h2 className="text-white font-black text-base">
                            Recent Orders
                          </h2>
                          <p className="text-gray-500 text-xs mt-0.5">
                            Latest customer orders
                          </p>
                        </div>
                        <Tabs
                          tabs={ORDER_TABS}
                          active={orderTab}
                          onChange={setOrderTab}
                        />
                      </div>
                    </Card.Header>
                    <Table
                      columns={[
                        { key: "id", label: "Order ID", bold: true },
                        { key: "customer", label: "Customer" },
                        { key: "amount", label: "Amount", align: "right" },
                        {
                          key: "status",
                          label: "Status",
                          render: (v) => orderStatusBadge(v),
                        },
                        {
                          key: "actions",
                          label: "",
                          render: (_, row) => (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() =>
                                addToast({
                                  message: `Viewing ${row.id}`,
                                  type: "info",
                                })
                              }
                            >
                              View
                            </Button>
                          ),
                        },
                      ]}
                      data={filteredOrders}
                      keyField="id"
                      emptyMessage="No orders found"
                    />
                  </Card>
                </AnimateIn>

                <div className="space-y-4">
                  <AnimateIn delay={160}>
                    <Card padding="md">
                      <Card.Header>
                        <h2 className="text-white font-black text-base">
                          Sales by Brand
                        </h2>
                      </Card.Header>
                      <div className="space-y-3">
                        {[
                          {
                            brand: "Apple",
                            pct: 38,
                            color: "from-purple-500 to-purple-400",
                          },
                          {
                            brand: "Samsung",
                            pct: 28,
                            color: "from-blue-500   to-blue-400",
                          },
                          {
                            brand: "OnePlus",
                            pct: 18,
                            color: "from-yellow-500 to-yellow-400",
                          },
                          {
                            brand: "Others",
                            pct: 16,
                            color: "from-gray-600   to-gray-500",
                          },
                        ].map((b) => (
                          <div key={b.brand}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-gray-300 font-medium">
                                {b.brand}
                              </span>
                              <span className="text-gray-500">{b.pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${b.color}`}
                                style={{ width: `${b.pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </AnimateIn>

                  <AnimateIn delay={200}>
                    <Card padding="md">
                      <Card.Header>
                        <h2 className="text-white font-black text-base">
                          Recent Activity
                        </h2>
                      </Card.Header>
                      <div className="space-y-3">
                        {[
                          {
                            icon: "📱",
                            text: "iPhone 15 Pro Max sold",
                            time: "2m ago",
                            bg: "bg-purple-500/15",
                          },
                          {
                            icon: "🔧",
                            text: "Screen repair completed",
                            time: "18m ago",
                            bg: "bg-blue-500/15",
                          },
                          {
                            icon: "📦",
                            text: "Xiaomi 14 stock updated",
                            time: "1h ago",
                            bg: "bg-yellow-500/15",
                          },
                          {
                            icon: "👤",
                            text: "New customer registered",
                            time: "3h ago",
                            bg: "bg-green-500/15",
                          },
                        ].map((a, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl ${a.bg} flex items-center justify-center text-sm flex-shrink-0`}
                            >
                              {a.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-300 text-xs font-medium truncate">
                                {a.text}
                              </p>
                              <p className="text-gray-600 text-[10px]">
                                {a.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </AnimateIn>
                </div>
              </div> */}

              {/* Inventory Table */}
              <AnimateIn delay={160}>
                <Card padding="md">
                  <Card.Header>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-white font-black text-base">
                          Inventory
                        </h2>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {PHONES.length} phones in system
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        iconLeft={<Plus size={14} />}
                        onClick={() => setShowDeviceModal(true)}
                      >
                        Add Phone
                      </Button>
                    </div>
                  </Card.Header>
                  <Table
                    columns={[
                      { key: "name", label: "Phone", bold: true },
                      { key: "brand", label: "Brand" },
                      { key: "price", label: "Price", align: "right" },
                      {
                        key: "stockStatus",
                        label: "Stock",
                        render: (v, row) => stockBadge(v, row.stock),
                      },
                      {
                        key: "actions",
                        label: "",
                        render: (_, row) => (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="xs"
                              iconLeft={<Pencil size={12} />}
                              onClick={() =>
                                addToast({
                                  message: `Editing ${row.name}`,
                                  type: "info",
                                })
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="xs"
                              iconLeft={<Trash2 size={12} />}
                              onClick={() =>
                                addToast({
                                  message: `${row.name} deleted`,
                                  type: "error",
                                })
                              }
                            >
                              Delete
                            </Button>
                          </div>
                        ),
                      },
                    ]}
                    data={PHONES}
                    keyField="id"
                  />
                </Card>
              </AnimateIn>

              {/* Bottom stats */}
              <div className="grid sm:grid-cols-3 gap-4 pb-4">
                {[
                  {
                    label: "Today's Sales",
                    value: "PKR 84,999",
                    icon: "📈",
                    accent: "yellow" as const,
                    trend: "+24%",
                  },
                  {
                    label: "Repairs Pending",
                    value: "7",
                    icon: "🔧",
                    accent: "blue" as const,
                    trend: "+2",
                  },
                  {
                    label: "New Customers",
                    value: "14",
                    icon: "👥",
                    accent: "green" as const,
                    trend: "+6",
                  },
                ].map((s, i) => (
                  <AnimateIn key={s.label} delay={i * 80}>
                    <StatCard {...s} />
                  </AnimateIn>
                ))}
              </div>
            </main>
          </div>
        </div>

        {/* Device Details Modal — opens on Add Phone click */}
        <DeviceDetailsModal
          open={showDeviceModal}
          onClose={() => setShowDeviceModal(false)}
          onSave={(device) => handleSaveDevice(device)}
        />

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} />
      </Layout>
    </PageBackground>
  );
};

export default Dashboard;
