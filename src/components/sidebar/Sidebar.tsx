// components/ui/Sidebar.tsx
// ─────────────────────────────────────────────
// BMZ Admin Sidebar — fully reusable, collapsible, mobile-ready
// Uses lucide-react icons + react-router-dom Link for navigation
//
// Usage in a page:
//   import { Sidebar, MobileSidebarOverlay } from "../../components/ui/Sidebar";
//   import type { NavItem } from "../../components/ui/Sidebar";
//
//   <Sidebar
//     navItems={NAV_ITEMS}
//     activeKey={activeNav}
//     onNav={setActiveNav}
//     collapsed={collapsed}
//     onToggleCollapse={() => setCollapsed(c => !c)}
//     user={{ name: "Basit Khan", role: "Super Admin" }}
//     onLogout={handleLogout}
//   />
//
//   // For router-based navigation, pass `href` on each NavItem:
//   { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" }
// ─────────────────────────────────────────────

import { type ReactNode, type ElementType, useState } from "react";
import { ChevronLeft, ChevronRight, LogOut, X, Menu, Phone } from "lucide-react";
import { Link } from "react-router-dom";

// ── Types ─────────────────────────────────────

export interface NavItem {
  key: string;
  label: string;
  /** Any lucide-react icon component e.g. LayoutDashboard */
  icon: ElementType;
  /** Optional route path — if provided, renders as <a href> */
  href?: string;
  /** Numeric badge (unread count, stock alert, etc.) */
  badge?: number;
  /** Show a thin separator line above this item */
  dividerAbove?: boolean;
}

export interface SidebarUser {
  name: string;
  role?: string;
  avatarUrl?: string;
}

interface SidebarProps {
  navItems: NavItem[];
  activeKey: string;
  onNav: (key: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  user?: SidebarUser;
  onLogout?: () => void;
  /** Anything you want to show above the user section */
  footerExtra?: ReactNode;
}

// ── Mini avatar ───────────────────────────────

function SidebarAvatar({ user }: { user: SidebarUser }) {
  const initials = user.name
    ?.split(" ")
    ?.slice(0, 2)
    ?.map((w) => w[0])
    ?.join("")
    ?.toUpperCase();

  return (
    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-xs bg-gradient-to-br from-purple-600 to-blue-600 border border-white/10">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-full h-full object-cover rounded-xl"
        />
      ) : (
        initials
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────

export function Sidebar({
  navItems,
  activeKey,
  onNav,
  collapsed = false,
  onToggleCollapse,
  user,
  onLogout,
  footerExtra,
}: SidebarProps) {
  const [hovering, setHovering] = useState(false);

  return (
    <aside
      className={[
        "flex flex-col h-full select-none overflow-y-hidden",
        "bg-[#0b0614]/95 backdrop-blur-xl",
        "border-r border-white/8",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-60",
      ].join(" ")}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* ── Logo row ── */}
      <div
        className={[
          "flex items-center h-16 flex-shrink-0 border-b border-white/8",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        ].join(" ")}
      >
        <Link
          to="/"
          title="Go to homepage"
          className={[
            "flex items-center gap-2.5 cursor-pointer group",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          {!collapsed && (
            <span className="font-black text-[15px] tracking-tight whitespace-nowrap leading-tight">
              <span className="text-yellow-400">Basit</span>
              <span className="text-white"> Mobile </span>
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Zone
              </span>
            </span>
          )}
        </Link>

        {/* Collapse toggle — only visible on desktop when not collapsed */}
        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 text-gray-500 hover:text-white hover:bg-white/8 border border-white/8 hover:border-white/20 transition-all duration-200 cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        {/* Expand button when collapsed */}
        {onToggleCollapse && collapsed && (
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/8 border border-white/8 hover:border-white/20 transition-all duration-200 cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav
        className={[
          "flex-1 py-3 px-2 space-y-0.5",
          hovering ? "overflow-y-auto" : "overflow-hidden",
        ].join(" ")}
      >
        {navItems?.map((item) => {
          const Icon     = item.icon;
          const isActive = activeKey === item.key;

          const itemContent = (
            <>
              {/* Active indicator bar */}
              <div
                className={[
                  "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200",
                  isActive
                    ? "h-7 bg-yellow-400 opacity-100"
                    : "h-0 bg-yellow-400 opacity-0 group-hover:h-5 group-hover:opacity-40",
                ].join(" ")}
              />

              {/* Icon */}
              <Icon
                size={18}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={[
                  "flex-shrink-0 transition-all duration-200",
                  isActive
                    ? "text-yellow-400 scale-110"
                    : "text-gray-500 group-hover:text-white group-hover:scale-105",
                ].join(" ")}
              />

              {/* Label */}
              {!collapsed && (
                <span className="flex-1 text-left text-sm font-semibold flex items-center gap-1.5 truncate">
                  {item.label}
                  {/* Animated badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="relative inline-flex items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-50" />
                      <span className="relative inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-yellow-400 text-yellow-900 text-[10px] font-black">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    </span>
                  )}
                </span>
              )}

              {/* Dot when collapsed + badge */}
              {collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-yellow-400 border border-[#0b0614]" />
              )}

              {/* Active pulse dot */}
              {!collapsed && isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
              )}
            </>
          );

          const baseClass = [
            "relative group w-full flex items-center rounded-xl",
            "transition-all duration-200 outline-none",
            "cursor-pointer",
            collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
            isActive
              ? "bg-gradient-to-r from-purple-600/20 to-blue-600/10 text-white border border-purple-500/25"
              : "text-gray-400 hover:text-white hover:bg-white/6 border border-transparent",
          ].join(" ");

          return (
            <div key={item.key}>
              {item.dividerAbove && (
                <div className="my-2 mx-1 border-t border-white/6" />
              )}

              {/* If href provided, use anchor tag for router compatibility */}
              {item.href ? (
                <Link
                  to={item.href}
                  onClick={() => onNav(item.key)}
                  className={baseClass}
                  title={collapsed ? item.label : undefined}
                >
                  {itemContent}
                </Link>
              ) : (
                <button
                  onClick={() => onNav(item.key)}
                  className={baseClass}
                  title={collapsed ? item.label : undefined}
                >
                  {itemContent}
                </button>
              )}
            </div>
          );
        })}

        {/* Logout nav item */}
        {onLogout && (
          <div>
            <div className="my-2 mx-1 border-t border-white/6" />
            <button
              onClick={onLogout}
              className={[
                "relative group w-full flex items-center rounded-xl",
                "transition-all duration-200 outline-none cursor-pointer",
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
                "text-gray-400 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/15",
              ].join(" ")}
              title={collapsed ? "Logout" : undefined}
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200 h-0 bg-red-400 opacity-0 group-hover:h-5 group-hover:opacity-60" />
              <LogOut
                size={18}
                strokeWidth={1.8}
                className="flex-shrink-0 transition-all duration-200 group-hover:scale-105"
              />
              {!collapsed && (
                <span className="flex-1 text-left text-sm font-semibold">
                  Logout
                </span>
              )}
            </button>
          </div>
        )}
      </nav>

      {/* Footer extra slot */}
      {footerExtra && !collapsed && (
        <div className="px-3 pb-2 flex-shrink-0">{footerExtra}</div>
      )}

      {/* ── User section ── */}
      {user && (
        <div className="border-t border-white/8 px-3 py-3 flex-shrink-0">
          <div
            className={[
              "flex items-center rounded-xl px-2 py-2",
              "hover:bg-white/5 transition-colors duration-200",
              collapsed ? "justify-center" : "gap-3",
            ].join(" ")}
          >
            <SidebarAvatar user={user} />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">
                  {user.name}
                </p>
                {user.role && (
                  <p className="text-gray-500 text-[10px] truncate">
                    {user.role}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Copyright */}
          {!collapsed && (
            <p className="text-center text-gray-700 text-[10px] mt-2">
              © 2024 Basit Mobile Zone
            </p>
          )}
        </div>
      )}
    </aside>
  );
}

// ── Mobile Sidebar Overlay ────────────────────

interface MobileSidebarOverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileSidebarOverlay({
  open,
  onClose,
  children,
}: MobileSidebarOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative z-10 h-full animate-bmz-sidebar-in">
        {children}

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="absolute top-4 right-3 w-8 h-8 flex items-center justify-center rounded-xl bg-white/8 border border-white/10 text-gray-400 hover:text-white hover:bg-white/15 transition-all duration-200 cursor-pointer"
        >
          <X size={15} strokeWidth={2.5} />
        </button>
      </div>

      <style>{`
        @keyframes bmz-sidebar-in {
          from { transform: translateX(-100%); opacity: 0.7; }
          to   { transform: translateX(0);     opacity: 1;   }
        }
        .animate-bmz-sidebar-in {
          animation: bmz-sidebar-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  );
}

// ── Mobile Menu Button ────────────────────────
// Drop this in your top bar to open the mobile sidebar

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/8 border border-white/8 transition-all duration-200 cursor-pointer"
    >
      <Menu size={18} />
    </button>
  );
}

export default Sidebar;