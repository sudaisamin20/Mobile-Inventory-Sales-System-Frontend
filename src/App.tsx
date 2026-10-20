import { Route, Routes, Navigate } from "react-router-dom";
import { HomePage } from "./pages/home";
import { LoginPage, SignupPage } from "./pages/auth";
import {
  CustomersPage,
  Dashboard,
  Sales,
  Purchases,
  InventoryDashboard,
  OrdersPage,
  PhonesPage,
  RepairsPage,
  ReportsPage,
  SettingsPage,
  StaffPage,
} from "./pages/admin";
import { PublicRoute } from "./components";
import { useAuthVerify } from "./hooks";
import { SidebarContentPage } from "./components/sidebar";
import DeviceHistoryPage from "./pages/admin/DeviceHistoryPage";

function App() {
  // Verify auth on app load
  useAuthVerify();

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />

        {/* Auth Routes - Redirect if already logged in */}
        {/* <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        /> */}

        {/* Protected Routes - Require Admin Role */}
        <Route path="/admin" element={<SidebarContentPage />}>
          {/* <Route path="dashboard" element={<Dashboard />} /> */}
          <Route path="sales" element={<Sales />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="phones" element={<PhonesPage />} />
          <Route path="inventory" element={<InventoryDashboard />} />
          <Route path="history" element={<DeviceHistoryPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="repairs" element={<RepairsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 404 - Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
