import { useState, useEffect, type ReactNode } from "react";
import { Button } from "./Button";
import { useAppSelector } from "../../app/index";
import { useAuth } from "../../hooks/useAuth";
import { Avatar } from "..";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LayoutDashboard, LogOut } from "lucide-react";
import { Dropdown, DropdownItem } from "../dropdown";

interface NavLink {
  label: string;
  href: string;
  icon?: string;
}

interface NavbarProps {
  links?: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  rightExtra?: ReactNode; // e.g. cart icon, user avatar
}

export function Navbar({
  links = [],
  ctaLabel = "Visit Store",
  ctaHref = "#",
  onCtaClick,
  rightExtra,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const state = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className={[
        "fixed top-0 left-0 right-0 z-40 transition-all duration-500",
        scrolled
          ? "bg-[#0b0614]/95 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-purple-900/10"
          : "bg-transparent",
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">📱</span>
          <span className="font-black text-lg tracking-tight">
            <span className="text-yellow-400">Basit</span>
            <span className="text-white"> Mobile </span>
            <span className="bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Zone
            </span>
          </span>
        </Link>

        {/* ── Desktop Links ── */}
        <div className="hidden md:flex items-center gap-7">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-gray-300 hover:text-yellow-400 transition-colors duration-200 relative group"
            >
              {link.icon && <span className="mr-1.5">{link.icon}</span>}
              {link.label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300 rounded-full" />
            </Link>
          ))}
        </div>

        {/* ── Right Side ── */}
        <div className="hidden md:flex items-center gap-3">
          {rightExtra}
          {state.isAuthenticated ? (
            <Dropdown
              buttonText={
                <Avatar
                  name={state.user?.fullName}
                  className="cursor-pointer"
                />
              }
              content={
                <>
                  <DropdownItem
                    onClick={() => {
                      navigate("/admin/dashboard");
                    }}
                  >
                    <LayoutDashboard size={16} />
                    <span>Dashboard</span>
                  </DropdownItem>
                  <div className="my-1 border-t border-white/10" />
                  <DropdownItem
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    isDanger
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </DropdownItem>
                </>
              }
            />
          ) : (
            ctaLabel && (
              <Button size="sm" onClick={onCtaClick}>
                <Link className="flex items-center gap-2" to={ctaHref}>
                  <span>{ctaLabel}</span> <ArrowRight size={12} />
                </Link>
              </Button>
            )
          )}
        </div>

        {/* ── Mobile Burger ── */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          <div className="w-5 space-y-1">
            <span
              className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`}
            />
            <span
              className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`}
            />
            <span
              className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
            />
          </div>
        </button>
      </div>

      {/* ── Mobile Drawer ── */}
      <div
        className={[
          "md:hidden transition-all duration-300 overflow-hidden",
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="px-4 pb-5 pt-2 space-y-1 bg-[#0b0614]/98 backdrop-blur-xl border-t border-white/5">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-yellow-400 hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {link.icon && <span>{link.icon}</span>}
              {link.label}
            </Link>
          ))}
          {rightExtra && <div className="px-4 py-2">{rightExtra}</div>}
          {state.isAuthenticated ? (
            <Avatar name={state.user?.fullName} />
          ) : (
            ctaLabel && (
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={onCtaClick}
                >
                  <Link className="flex items-center gap-2" to={ctaHref}>
                    <span>{ctaLabel}</span> <ArrowRight size={12} />
                  </Link>
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
