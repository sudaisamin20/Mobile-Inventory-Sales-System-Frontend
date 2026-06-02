// components/ui/Modal.tsx
// ─────────────────────────────────────────────
// Reusable animated modal/dialog — uses lucide-react icons
//
// Usage:
//   const [open, setOpen] = useState(false);
//
//   <Modal open={open} onClose={() => setOpen(false)} title="Add Phone" subtitle="Fill details">
//     <p>Body content</p>
//     <Modal.Footer>
//       <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
//       <Button variant="primary">Save</Button>
//     </Modal.Footer>
//   </Modal>
// ─────────────────────────────────────────────

"use client";
import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string | ReactNode;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Prevent closing by clicking the backdrop */
  disableBackdropClose?: boolean;
  children: ReactNode;
}

const sizeMap: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

// ── Root ─────────────────────────────────────

function ModalRoot({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  disableBackdropClose = false,
  children,
}: ModalProps) {
  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4 pointer-events-none"
      style={{ zIndex: 99999 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-bmz-fade-in pointer-events-auto"
        onClick={disableBackdropClose ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={[
          "relative w-full max-h-[90vh] flex flex-col pointer-events-auto",
          "bg-gradient-to-br from-[#1a0a2e] to-[#0f0520]",
          "border border-white/15 rounded-3xl shadow-2xl shadow-black/60",
          "animate-bmz-modal-in",
          sizeMap[size],
        ].join(" ")}
      >
        {/* ── Header ── */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between px-6 py-3 border-b border-white/8 flex-shrink-0">
            <div>
              {title && (
                <h3 id="modal-title" className="text-white font-black text-xl max-[420px]:text-lg leading-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className={[
                "absolute top-6 right-3",
                "bg-white/5 text-gray-400",
                "transition-all duration-200",
                "cursor-pointer",
              ].join(" ")}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* ── Scrollable Body ── */}
        <div className="flex-1 p-4 max-[350px]:overflow-auto overflow-y-hidden">{children}</div>
      </div>

      {/* Keyframe animations — scoped with bmz- prefix */}
      <style>{`
        @keyframes bmz-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes bmz-modal-in {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        .animate-bmz-fade-in  { animation: bmz-fade-in  0.2s ease forwards; }
        .animate-bmz-modal-in { animation: bmz-modal-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
      `}</style>
    </div>
  );
}

// ── Footer sub-component ──────────────────────

interface ModalFooterProps {
  children: ReactNode;
  /** "end" (default) | "between" | "center" */
  align?: "end" | "between" | "center";
  className?: string;
}

function ModalFooter({ children, align = "end", className = "" }: ModalFooterProps) {
  const alignClass = {
    end:     "justify-end",
    between: "justify-between",
    center:  "justify-center",
  }[align];

  return (
    <div
      className={[
        "flex items-center gap-3 mt-3 pt-3 border-t border-white/8 max-[450px]:flex-col flex-row",
        alignClass,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// ── Attach sub-component & export ─────────────

export const Modal = Object.assign(ModalRoot, { Footer: ModalFooter });
export default Modal;