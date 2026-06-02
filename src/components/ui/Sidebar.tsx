// components/ui/Sidebar.tsx
// ─────────────────────────────────────────────
// Reusable collapsible admin sidebar — lucide-react icons throughout
//
// Usage:
//   const [collapsed, setCollapsed] = useState(false);
//   const [mobileOpen, setMobileOpen] = useState(false);
//
//   // Pass your own nav items:
//   const NAV = [
//     { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
//     { key: "phones",    label: "Phones",    icon: Smartphone,      badge: 12 },
//   ];
//
//   <Sidebar
//     navItems={NAV}
//     activeKey={activeNav}
//     onNav={(key) => setActiveNav(key)}
//     collapsed={collapsed}
//     onToggleCollapse={() => setCollapsed(c => !c)}
//     user={{ name: "Basit Khan", role: "Admin", avatarUrl: "" }}
//     onLogout={() => {}}
//   />
//
//   // Mobile — wrap with <MobileSidebarOverlay>:
//   <MobileSidebarOverlay open={mobileOpen} onClose={() => setMobileOpen(false)}>
//     <Sidebar navItems={NAV} activeKey={activeNav} onNav={(k)=>{setActiveNav(k);setMobileOpen(false)}} />
//   </MobileSidebarOverlay>
// ─────────────────────────────────────────────

import type { ReactNode, ElementType } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";

// ── Types ─────────────────────────────────────

export interface NavItem {
  key: string;
  label: string;
  /** Any lucide-react icon component, e.g. LayoutDashboard */
  icon: ElementType;
  /** Optional numeric badge shown on the nav item */
  badge?: number;
  /** Render a separator line ABOVE this item */
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
  /** Extra content rendered below nav, above the user section */
  footerExtra?: ReactNode;
}

// ── Avatar fallback ───────────────────────────

function SidebarAvatar({ user, size = "sm" }: { user: SidebarUser; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={[
        dim,
        "rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white",
        "bg-gradient-to-br from-purple-600 to-blue-600",
        "border border-white/10",
      ].join(" ")}
    >
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-xl" />
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
  return (
    <aside
      className={[
        "flex flex-col h-full",
        "bg-[#0b0614]/90 backdrop-blur-xl",
        "border-r border-white/8",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-60",
      ].join(" ")}
    >

      {/* ── Logo + collapse toggle ── */}
      <div
        className={[
          "flex items-center border-b border-white/8 flex-shrink-0 h-16",
          collapsed ? "justify-center px-0" : "justify-between px-4",
        ].join(" ")}
      >
        {/* Logo */}
        <a
          href="/"
          className={[
            "flex items-center gap-2.5 cursor-pointer",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          <span className="text-2xl flex-shrink-0 select-none">📱</span>
          {!collapsed && (
            <span className="font-black text-[15px] tracking-tight whitespace-nowrap leading-tight">
              <span className="text-yellow-400">Basit</span>
              <span className="text-white"> Mobile</span>
            </span>
          )}
        </a>

        {/* Collapse toggle — desktop only */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={[
              "w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0",
              "text-gray-500 hover:text-white hover:bg-white/8",
              "border border-white/8 hover:border-white/15",
              "transition-all duration-200",
              "cursor-pointer",
              collapsed ? "hidden" : "",
            ].join(" ")}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;

          return (
            <div key={item.key}>
              {/* Optional divider above item */}
              {item.dividerAbove && (
                <div className="my-2 mx-2 border-t border-white/6" />
              )}

              <button
                onClick={() => onNav(item.key)}
                title={collapsed ? item.label : undefined}
                className={[
                  "w-full flex items-center rounded-xl text-sm font-medium",
                  "transition-all duration-200 outline-none",
                  "cursor-pointer",
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-gradient-to-r from-purple-600/25 to-blue-600/15 text-white border border-purple-500/25"
                    : "text-gray-400 hover:text-white hover:bg-white/6 border border-transparent",
                ].join(" ")}
              >
                {/* Icon */}
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={[
                    "flex-shrink-0 transition-colors",
                    isActive ? "text-yellow-400" : "text-current",
                  ].join(" ")}
                />

                {/* Label */}
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}

                {/* Badge */}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={[
                      "text-[10px] font-bold min-w-[18px] h-[18px] px-1",
                      "flex items-center justify-center rounded-full",
                      isActive
                        ? "bg-yellow-400 text-yellow-900"
                        : "bg-white/10 text-gray-400",
                    ].join(" ")}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}

                {/* Active dot when collapsed with badge */}
                {collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-yellow-400" />
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer extra slot */}
      {footerExtra && !collapsed && (
        <div className="px-3 pb-2">{footerExtra}</div>
      )}

      {/* ── User section ── */}
      {user && (
        <div className="border-t border-white/8 p-3 flex-shrink-0">
          <div
            className={[
              "flex items-center rounded-xl p-2",
              "hover:bg-white/5 transition-colors duration-200",
              collapsed ? "justify-center" : "gap-3",
            ].join(" ")}
          >
            <SidebarAvatar user={user} />

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.name}</p>
                {user.role && (
                  <p className="text-gray-500 text-[10px] truncate">{user.role}</p>
                )}
              </div>
            )}

            {!collapsed && onLogout && (
              <button
                onClick={onLogout}
                title="Logout"
                className={[
                  "w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0",
                  "text-gray-500 hover:text-red-400 hover:bg-red-500/10",
                  "border border-transparent hover:border-red-500/20",
                  "transition-all duration-200",
                  "cursor-pointer",
                ].join(" ")}
              >
                <LogOut size={14} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

// ── Mobile Sidebar Overlay ────────────────────
// Wraps <Sidebar> in a slide-in drawer for mobile screens
//
// Usage:
//   <MobileSidebarOverlay open={mobileOpen} onClose={() => setMobileOpen(false)}>
//     <Sidebar ... />
//   </MobileSidebarOverlay>

interface MobileSidebarOverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileSidebarOverlay({ open, onClose, children }: MobileSidebarOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative z-10 flex flex-col h-full animate-sidebar-slide-in">
        {children}

        {/* Close button — top right corner of drawer */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          className={[
            "absolute top-4 right-3",
            "w-8 h-8 flex items-center justify-center rounded-xl",
            "bg-white/8 border border-white/10 text-gray-400",
            "hover:text-white hover:bg-white/15",
            "transition-all duration-200",
            "cursor-pointer",
          ].join(" ")}
        >
          <X size={15} strokeWidth={2.5} />
        </button>
      </div>

      <style>{`
        @keyframes sidebar-slide-in {
          from { transform: translateX(-100%); opacity: 0.6; }
          to   { transform: translateX(0);     opacity: 1;   }
        }
        .animate-sidebar-slide-in {
          animation: sidebar-slide-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  );
}

export default Sidebar;