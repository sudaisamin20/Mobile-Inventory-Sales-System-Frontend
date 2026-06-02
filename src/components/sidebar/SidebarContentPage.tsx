// components/ui/SidebarContentPage.tsx
// Root admin layout — sidebar + topbar + outlet

import { useState, useCallback, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { SidebarConfig } from "./SidebarConfig";
import { PageBackground, Avatar } from "../ui";
import { Bell, Search, Menu, X } from "lucide-react";
// import { useAppSelector } from "../../app/index";

const SidebarContentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // const user = useAppSelector((state) => state.auth.user);\
  const user = {
    fullName: "John Doe",
    role: "ADMIN",
  }
  console.log("🔍 SidebarContentPage - User:", user);

  

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Controls whether the drawer is mounted (for exit animation)
  const [mobileVisible, setMobileVisible] = useState(false);

  const navItems = SidebarConfig[(user?.role as keyof typeof SidebarConfig) ?? "USER"];

  const getActiveKey = useCallback(() => {
    const match = navItems?.find(
      (item: any) => item.href && location.pathname.startsWith(item.href),
    );
    return match?.key ?? navItems?.[0]?.key ?? "dashboard";
  }, [location.pathname, navItems]);

  const [activeKey, setActiveKey] = useState(getActiveKey());

  useEffect(() => {
    setActiveKey(getActiveKey());
  }, [getActiveKey]);

  // Open: mount immediately then animate in
  const openMobile = () => {
    setMobileVisible(true);
    // tiny delay so the element is mounted before CSS transition fires
    requestAnimationFrame(() => setMobileOpen(true));
  };

  // Close: animate out, then unmount after transition completes
  const closeMobile = () => {
    setMobileOpen(false);
    setTimeout(() => setMobileVisible(false), 300); // match transition duration
  };

  const handleNav = (key: string) => {
    setActiveKey(key);
    closeMobile();
    const item = navItems.find((n) => n.key === key);
    if (item?.href) navigate(item.href);
  };

  const handleLogout = () => {
    // dispatch(logout());
    navigate("/login");
  };

  return (
    <PageBackground>
      {/*
        ── Z-index legend ──
        z-[99999]  Modal (always on top — set in Modal.tsx)
        z-[49]     Mobile sidebar overlay
        z-[39]     Sticky admin topbar
        (sidebar is not fixed, just sticky, so no z needed)
      */}
      
      {/* Hide topbar when modal is open (body overflow hidden) */}
      <style>{`
        body[style*="overflow:hidden"] header[role="banner"] {
          display: none;
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* ── Desktop Sidebar — sticky, NOT fixed ── */}
        <div className="hidden lg:block h-screen fixed top-0 left-0 shrink-0">
          <Sidebar
            navItems={navItems}
            activeKey={activeKey}
            onNav={handleNav}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
            user={{ name: user?.fullName || "User", role: user?.role || "USER" }}
            onLogout={handleLogout}
          />
        </div>

        {/* ── Mobile Sidebar Overlay ── */}
        {mobileVisible && (
          <div className="fixed inset-0 z-[49] lg:hidden">
            {/* Backdrop */}
            <div
              onClick={closeMobile}
              aria-hidden="true"
              className={[
                "absolute inset-0 bg-black/60 backdrop-blur-sm",
                "transition-opacity duration-300 cursor-pointer",
                mobileOpen ? "opacity-100" : "opacity-0",
              ].join(" ")}
            />

            {/* Drawer — slides in/out */}
            <div
              className={[
                "absolute top-0 left-0 h-full",
                "transition-transform duration-300 ease-in-out",
                mobileOpen ? "translate-x-0" : "-translate-x-full",
              ].join(" ")}
            >
              <Sidebar
                navItems={navItems}
                activeKey={activeKey}
                onNav={handleNav}
                user={{ name: user?.fullName || "User", role: user?.role || "USER" }}
                onLogout={handleLogout}
              />

              {/* Close button */}
              <button
                onClick={closeMobile}
                aria-label="Close menu"
                className="absolute top-4 right-[-40px] w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 border border-white/15 text-gray-300 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <div
          className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${collapsed ? "lg:ml-[70px]" : "lg:ml-60"}`}
        >
          {/* Topbar — sticky but NOT fixed, lives inside the flex child */}
          {/* z-[39] keeps it below modal (z-[99999]) and mobile overlay (z-[49]) */}
          <header role="banner" className="fixed w-full lg:hidden top-0 flex items-center justify-between gap-3 px-4 sm:px-6 h-16 border-b border-white/8 bg-[#0b0614]/90 backdrop-blur-xl flex-shrink-0"
          style={{ zIndex: 9999 }}
          >
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={openMobile}
                aria-label="Open menu"
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/8 border border-white/8 transition-all duration-200 cursor-pointer"
              >
                <Menu size={18} />
              </button>

              <div>
                <h1 className="text-white font-black text-base leading-tight">
                  {navItems?.find((n: { key: string }) => n.key === activeKey)?.label ??
                    "Dashboard"}
                </h1>
                <p className="text-gray-500 text-[11px]">
                  {new Date().toLocaleDateString("en-PK", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search */}
              <label className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-44 lg:w-56 focus-within:border-purple-500/50 transition-colors cursor-text">
                <Search size={13} className="text-gray-500 flex-shrink-0" />
                <input
                  placeholder="Search..."
                  className="bg-transparent outline-none text-white placeholder-gray-600 w-full text-sm"
                />
              </label>

              {/* Notifications */}
              <button
                aria-label="Notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
              >
                <Bell size={15} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full text-[9px] font-black text-yellow-900 flex items-center justify-center">
                  3
                </span>
              </button>

              <Avatar name={user?.fullName} size="sm" status="online" />
            </div>
          </header>

          {/* Page content */}
          <Outlet />
        </div>
      </div>
    </PageBackground>
  );
};

export default SidebarContentPage;
