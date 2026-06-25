import { useState, useRef, useCallback, useEffect } from "react";
import {
  PackagePlus,
  Plus,
  Trash2,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Camera,
  CameraOff,
  RefreshCw,
  ScanBarcode,
  Keyboard,
  Edit,
  Save,
  X as XIcon,
  Smartphone,
  BarChart3,
  ArrowRight,
  EllipsisVertical,
  Trash,
  Hourglass,
  Package,
} from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

import {
  PageBackground,
  useToast,
  ToastContainer,
} from "../../components/ui/Misc";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import {
  Input,
  Select,
  Textarea,
  RangeSlider,
} from "../../components/ui/Input";
import { AnimateIn } from "../../components/ui/Section";
import { Layout } from "../../layout";
import { ImageUploader } from "../../components/inventory/ImageUploader";
import { Dropdown, DropdownItem } from "../../components/dropdown";
import { Modal } from "../../components";
import { DeviceService } from "../../api/deviceService";
import type { ICreateDeviceRequest } from "../../interfaces/inventory";

// ── Option lists ──────────────────────────────

const CONDITION_OPTS = [
  { value: "new", label: "New" },
  { value: "open-box", label: "Open Box" },
  { value: "used", label: "Used" },
  { value: "refurbished", label: "Refurbished" },
];
const SCREEN_OPTS = [
  { value: "perfect", label: "Perfect" },
  { value: "minor-scratches", label: "Minor Scratches" },
  { value: "major-damage", label: "Major Damage" },
  { value: "broken", label: "Broken" },
];
const SPEAKER_OPTS = [
  { value: "working", label: "Working" },
  { value: "partial", label: "Partial" },
  { value: "not-working", label: "Not Working" },
];
const FACEID_OPTS = [
  { value: "working", label: "Working" },
  { value: "not-available", label: "Not Available" },
  { value: "not-working", label: "Not Working" },
];
const PTA_OPTS = [
  { value: "non-pta", label: "Non-PT" },
  { value: "jv", label: "JV" },
  { value: "unknown", label: "Unknown" },
  { value: "approved", label: "Approved" },
];

// ── Types ─────────────────────────────────────

interface ScannedUnit {
  id: string;
  imei: string;
  imei2?: string;
  valid: boolean;
  addedAt: string;
}

// One variant = one color + storage combo (e.g. "Black / 256GB")
// Each variant has N units, each unit needs a unique IMEI
interface DeviceVariant {
  id: string;
  color: string;
  storage: string; // e.g. "256GB" or "8GB/256GB"
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  units: ScannedUnit[];
}

interface DeviceForm {
  brand: string;
  model: string;
  condition: string;
  countryVersion: string;
  networkLockStatus: string;
  ptaStatus: string;
  batteryHealth: number;
  screenCondition: string;
  cameraCondition: string;
  speakerCondition: string;
  chargingCondition: string;
  faceIdStatus: string;
  fingerprintStatus: string;
  purchasePrice: number;
  sellingPrice: number;
  supplierName: string;
  purchaseDate: string;
  invoiceNumber: string;
  warrantyDays: number;
  notes: string;
  images: { front?: string; back?: string; invoice?: string };
}

// ── Helpers ───────────────────────────────────

function validateIMEI(imei: string): boolean {
  const d = imei.replace(/\D/g, "");
  if (d.length !== 15) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let n = parseInt(d[i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

function formatIMEI(imei: string) {
  const d = imei.replace(/\D/g, "");
  if (d.length < 15) return d;
  return `${d.slice(0, 2)}-${d.slice(2, 8)}-${d.slice(8, 14)}-${d.slice(14)}`;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

const defaultForm = (): DeviceForm => ({
  brand: "",
  model: "",
  condition: "new",
  countryVersion: "",
  networkLockStatus: "unknown",
  ptaStatus: "approved",
  batteryHealth: 100,
  screenCondition: "perfect",
  cameraCondition: "perfect",
  speakerCondition: "working",
  chargingCondition: "working",
  faceIdStatus: "working",
  fingerprintStatus: "working",
  purchasePrice: 0,
  sellingPrice: 0,
  supplierName: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  invoiceNumber: "",
  warrantyDays: 0,
  notes: "",
  images: {},
});

// ── Step indicator ────────────────────────────

const STEPS = [
  { n: 1, label: "Device Info" },
  { n: 2, label: "Variants" },
  { n: 3, label: "Scan IMEIs" },
  { n: 4, label: "Review" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="grid max-[350px]:grid-cols-2 grid-cols-4 items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div
              className={[
                "w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300",
                current === s.n
                  ? "bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-400/30"
                  : current > s.n
                    ? "bg-green-500 text-white"
                    : "bg-white/8 border border-white/15 text-gray-500",
              ].join(" ")}
            >
              {current > s.n ? <CheckCircle2 size={16} /> : s.n}
            </div>
            <span
              className={`text-[10px] font-semibold whitespace-nowrap ${current === s.n ? "text-yellow-400" : current > s.n ? "text-green-400" : "text-gray-600"}`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 mb-4 transition-all duration-300 ${current > s.n ? "bg-green-500" : "bg-white/8"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── IMEI Scanner sub-component ────────────────

function IMEIScanner({
  variant,
  allUnits,
  onAdd,
  onRemove,
  onEditSave,
}: {
  variant: DeviceVariant;
  allUnits: ScannedUnit[]; // all units across all variants for duplicate check
  onAdd: (unit: ScannedUnit) => void;
  onRemove: (id: string) => void;
  onEditSave: (id: string, imei: string, imei2?: string) => void;
}) {
  const [mode, setMode] = useState<"manual" | "camera">("manual");
  const [scanning, setScanning] = useState(false);
  const [manIMEI, setManIMEI] = useState("");
  const [manIMEI2, setManIMEI2] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editIMEI, setEditIMEI] = useState("");
  const [editIMEI2, setEditIMEI2] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScan = useRef("");

  const stopScan = useCallback(() => {
    try {
      BrowserMultiFormatReader.releaseAllStreams();
    } catch (_) {
      console.log(_);
    }
    readerRef.current = null;
    setScanning(false);
    lastScan.current = "";
  }, []);

  useEffect(() => () => stopScan(), [stopScan]);

  const addUnit = useCallback(
    (imei: string, imei2?: string) => {
      const c = imei.replace(/\D/g, "").slice(0, 15);
      if (c.length !== 15) return;
      if (allUnits.some((u) => u.imei === c)) {
        setError(`IMEI ${formatIMEI(c)} already added.`);
        return;
      }
      setError("");
      onAdd({
        id: uid(),
        imei: c,
        imei2: imei2?.replace(/\D/g, "").slice(0, 15) || undefined,
        valid: validateIMEI(c),
        addedAt: new Date().toLocaleTimeString("en-PK", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    },
    [allUnits, onAdd],
  );

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    setError("");
    try {
      await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      const devs = await BrowserMultiFormatReader.listVideoInputDevices();
      if (!devs.length) {
        setError("No camera found.");
        return;
      }
      const rear =
        devs.find((d) => /back|rear|environment/i.test(d.label)) ?? devs[0];
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
      const reader = new BrowserMultiFormatReader(hints);
      readerRef.current = reader;
      setScanning(true);
      await reader.decodeFromVideoDevice(
        rear.deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const raw = result.getText();
            if (raw === lastScan.current) return;
            lastScan.current = raw;
            const match = raw.match(/\d{15}/);
            if (match) {
              addUnit(match[0]);
            } // keep scanning for multiple units
          }
          if (err && err?.name !== "NotFoundException") console.warn(err);
        },
      );
    } catch (e: any) {
      setError(e?.message ?? "Camera failed.");
      setScanning(false);
    }
  }, [addUnit]);

  const neededCount = variant.quantity - variant.units.length;
  const isComplete = variant.units.length >= variant.quantity;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/8">
        <div>
          <p className="text-white text-sm font-semibold">
            {variant.color} · {variant.storage}
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            {variant.units.length} / {variant.quantity} units scanned
          </p>
        </div>
        <Badge
          variant={isComplete ? "green" : "yellow"}
          size="sm"
          dot={!isComplete}
        >
          {isComplete ? "Complete" : `${neededCount} left`}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min((variant.units.length / variant.quantity) * 100, 100)}%`,
          }}
        />
      </div>

      {/* Mode toggle */}
      {!isComplete && (
        <div className="flex gap-2">
          <Button
            variant={mode === "manual" ? "primary" : "dark"}
            size="sm"
            iconLeft={<Keyboard size={13} />}
            onClick={() => {
              setMode("manual");
              stopScan();
            }}
          >
            Manual
          </Button>
          <Button
            variant={mode === "camera" ? "primary" : "dark"}
            size="sm"
            iconLeft={<Camera size={13} />}
            onClick={() => setMode("camera")}
          >
            Camera
          </Button>
        </div>
      )}

      {/* Camera */}
      {!isComplete && mode === "camera" && (
        <div className="space-y-3">
          <div className="relative w-full aspect-video bg-black/70 rounded-2xl overflow-hidden border border-white/10">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transition-opacity duration-300 ${scanning ? "opacity-100" : "opacity-0"}`}
              muted
              playsInline
            />
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <CameraOff size={32} className="text-gray-600" />
                <p className="text-gray-500 text-sm">Camera off</p>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none">
                {[
                  "top-4 left-4 border-t-2 border-l-2",
                  "top-4 right-4 border-t-2 border-r-2",
                  "bottom-4 left-4 border-b-2 border-l-2",
                  "bottom-4 right-4 border-b-2 border-r-2",
                ].map((c, i) => (
                  <div
                    key={i}
                    className={`absolute w-8 h-8 border-yellow-400 rounded-sm ${c}`}
                  />
                ))}
                <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <span className="text-yellow-400 text-xs font-semibold bg-black/60 px-3 py-1 rounded-full">
                    Point at IMEI barcode — scans continuously
                  </span>
                </div>
              </div>
            )}
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <XCircle size={13} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}
          <div className="flex gap-2">
            {!scanning ? (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                iconLeft={<Camera size={14} />}
                onClick={startCamera}
              >
                Start Camera
              </Button>
            ) : (
              <>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  iconLeft={<CameraOff size={14} />}
                  onClick={stopScan}
                >
                  Stop
                </Button>
                <Button
                  variant="dark"
                  size="sm"
                  iconLeft={<RefreshCw size={13} />}
                  onClick={() => {
                    stopScan();
                    setTimeout(startCamera, 400);
                  }}
                >
                  Restart
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Manual entry */}
      {!isComplete && mode === "manual" && (
        <div className="space-y-3">
          <div className="grid min-[500px]:grid-cols-2 gap-3">
            <Input
              label="IMEI 1"
              placeholder="357391089012345"
              helper="IMEI 1"
              value={manIMEI}
              onChange={(e) =>
                setManIMEI(e.target.value.replace(/\D/g, "").slice(0, 15))
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                manIMEI.length === 15 &&
                (addUnit(manIMEI, manIMEI2 || undefined),
                setManIMEI(""),
                setManIMEI2(""))
              }
              suffix={
                <span
                  className={`text-[10px] font-mono ${manIMEI.length === 15 ? "text-green-400" : "text-gray-500"}`}
                >
                  {manIMEI.length}/15
                </span>
              }
              hint="Dial *#06# on phone"
              error={error || undefined}
            />
            <Input
              label="IMEI 2 (Dual SIM)"
              placeholder="Optional"
              helper="IMEI 2 (Dual SIM)"
              value={manIMEI2}
              onChange={(e) =>
                setManIMEI2(e.target.value.replace(/\D/g, "").slice(0, 15))
              }
              suffix={
                <span
                  className={`text-[10px] font-mono ${manIMEI2.length === 15 ? "text-green-400" : "text-gray-500"}`}
                >
                  {manIMEI2.length}/15
                </span>
              }
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Plus size={14} />}
            onClick={() => {
              addUnit(manIMEI, manIMEI2 || undefined);
              setManIMEI("");
              setManIMEI2("");
            }}
            disabled={manIMEI.length !== 15}
          >
            Add Unit
          </Button>
        </div>
      )}

      {/* Scanned units list */}
      {variant.units.length > 0 && (
        <div className="relative space-y-2 max-h-64 overflow-y-auto pr-0.5">
          {variant.units.map((u, idx) => (
            <div
              key={u.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/8 group mr-1"
            >
              <span className="text-gray-500 text-xs w-5 flex-shrink-0">
                {idx + 1}.
              </span>
              <div
                className={`flex-shrink-0 ${u.valid ? "text-green-400" : "text-red-400"}`}
              >
                {u.valid ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              </div>
              <Modal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Edit IMEI"
                size="sm"
              >
                <div className="space-y-4">
                  <Input
                    label="IMEI 1"
                    helper="IMEI 1"
                    value={editIMEI}
                    onChange={(e) =>
                      setEditIMEI(
                        e.target.value.replace(/\D/g, "").slice(0, 15),
                      )
                    }
                  />

                  <Input
                    label="IMEI 2"
                    helper="IMEI 2"
                    value={editIMEI2}
                    onChange={(e) =>
                      setEditIMEI2(
                        e.target.value.replace(/\D/g, "").slice(0, 15),
                      )
                    }
                  />

                  <Modal.Footer>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="dark"
                        onClick={() => setEditModalOpen(false)}
                      >
                        Cancel
                      </Button>

                      <Button
                        variant="primary"
                        onClick={() => {
                          if (!editId) return;

                          onEditSave(editId, editIMEI, editIMEI2 || undefined);

                          setEditModalOpen(false);
                          setEditId(null);
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </Modal.Footer>
                </div>
              </Modal>

              {editId === u.id && window.innerWidth > 500 ? (
                /* Inline edit */
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input
                    className="flex-1 bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs font-mono outline-none focus:border-yellow-400/50"
                    value={editIMEI}
                    onChange={(e) =>
                      setEditIMEI(
                        e.target.value.replace(/\D/g, "").slice(0, 15),
                      )
                    }
                  />
                  <input
                    className="flex-1 bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-white text-xs font-mono outline-none focus:border-yellow-400/50"
                    placeholder="IMEI 2"
                    value={editIMEI2}
                    onChange={(e) =>
                      setEditIMEI2(
                        e.target.value.replace(/\D/g, "").slice(0, 15),
                      )
                    }
                  />
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-white font-mono text-sm tracking-wider">
                    {formatIMEI(u.imei)}
                  </p>
                  {u.imei2 && (
                    <p className="text-gray-500 font-mono text-xs">
                      SIM2: {formatIMEI(u.imei2)}
                    </p>
                  )}
                  <p className="text-gray-600 text-[10px]">{u.addedAt}</p>
                </div>
              )}

              {!u.valid && editId !== u.id && (
                <Badge className="max-[500px]:hidden" variant="red" size="sm">
                  Invalid
                </Badge>
              )}

              <div className="flex items-center gap-1">
                {editId === u.id && window.innerWidth > 500 ? (
                  <>
                    <button
                      onClick={() => {
                        onEditSave(u.id, editIMEI, editIMEI2 || undefined);
                        setEditId(null);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded text-green-400 hover:bg-green-400/10 cursor-pointer"
                    >
                      <Save size={12} />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-white/10 cursor-pointer"
                    >
                      <XIcon size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditId(u.id);
                        setEditIMEI(u.imei);
                        setEditIMEI2(u.imei2 || "");
                      }}
                      className="max-[500px]:hidden w-6 h-6 flex items-center justify-center rounded text-blue-400 hover:bg-blue-400/10 transition-all cursor-pointer"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => onRemove(u.id)}
                      className="max-[500px]:hidden w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                    <Dropdown
                      buttonText={
                        <button className="max-[500px]:flex w-6 h-6 hidden items-center justify-center rounded text-gray-400 hover:bg-gray-400/10 transition-all cursor-pointer">
                          <EllipsisVertical size={20} />
                        </button>
                      }
                      content={
                        <>
                          <DropdownItem
                            onClick={() => {
                              setEditId(u.id);
                              setEditIMEI(u.imei);
                              setEditIMEI2(u.imei2 || "");
                              setEditModalOpen(true);
                            }}
                          >
                            <Edit
                              className="text-blue-400 hover:bg-blue-400/10 transition-all"
                              size={16}
                            />
                            <span>Edit</span>
                          </DropdownItem>
                          <DropdownItem
                            onClick={() => {
                              onRemove(u.id);
                            }}
                          >
                            <Trash
                              className="text-red-400 hover:bg-red-400/10 transition-all"
                              size={16}
                            />
                            <span>Delete</span>
                          </DropdownItem>
                        </>
                      }
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {variant.units.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
          <ScanBarcode size={32} className="text-gray-700" />
          <p className="text-gray-500 text-sm">No units scanned yet</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────

const Purchases = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DeviceForm | ICreateDeviceRequest>(defaultForm);
  const [variants, setVariants] = useState<DeviceVariant[]>([
    {
      id: uid(),
      color: "",
      storage: "",
      quantity: 1,
      purchasePrice: 0,
      sellingPrice: 0,
      units: [],
    },
  ]);
  const [activeVariantIdx, setActiveVariantIdx] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toasts, addToast } = useToast();

  const set = <K extends keyof DeviceForm>(k: K, v: DeviceForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  // ── Validation ────────────────────────────

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.brand) e.brand = "Brand is required";
    if (!form.model) e.model = "Model is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Validates each variant has color, storage, valid quantity AND valid
  // per-variant pricing (purchasePrice / sellingPrice live on the variant
  // now, not on the top-level form).
  const validateStep2 = () => {
    const e: Record<string, string> = {};

    for (const v of variants) {
      if (!v.color) {
        addToast({ message: "All variants need a color", type: "error" });
        return false;
      }
      if (!v.storage) {
        addToast({ message: "All variants need a storage", type: "error" });
        return false;
      }
      if (v.quantity < 1) {
        addToast({ message: "Quantity must be at least 1", type: "error" });
        return false;
      }
      if (v.purchasePrice <= 0) {
        e.purchasePrice = "Enter a valid purchase price";
      }
      if (v.sellingPrice <= 0) {
        e.sellingPrice = "Enter a valid selling price";
      }
    }

    setErrors(e);

    if (e.purchasePrice) {
      addToast({ message: "Enter a purchase price for every variant", type: "error" });
      return false;
    }
    if (e.sellingPrice) {
      addToast({ message: "Enter a selling price for every variant", type: "error" });
      return false;
    }
    return true;
  };

  const allUnits = variants.flatMap((v) => v.units);
  const totalUnitsNeeded = variants.reduce((a, v) => a + v.quantity, 0);
  const totalUnitsScanned = allUnits.length;
  const allComplete = variants.every((v) => v.units.length >= v.quantity);

  // ── Variant helpers ───────────────────────

  const addVariant = () =>
    setVariants((prev) => [
      ...prev,
      {
        id: uid(),
        color: "",
        storage: "",
        quantity: 1,
        purchasePrice: 0,
        sellingPrice: 0,
        units: [],
      },
    ]);

  const removeVariant = (id: string) =>
    setVariants((prev) => prev.filter((v) => v.id !== id));

  const updateVariant = (
    id: string,
    key: keyof DeviceVariant,
    val: string | number,
  ) =>
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [key]: val } : v)),
    );

  const addUnit = (variantId: string, unit: ScannedUnit) =>
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId ? { ...v, units: [...v.units, unit] } : v,
      ),
    );

  const removeUnit = (variantId: string, unitId: string) =>
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? { ...v, units: v.units.filter((u) => u.id !== unitId) }
          : v,
      ),
    );

  const editUnitSave = (
    variantId: string,
    unitId: string,
    imei: string,
    imei2?: string,
  ) =>
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? {
              ...v,
              units: v.units.map((u) =>
                u.id === unitId
                  ? { ...u, imei, imei2, valid: validateIMEI(imei) }
                  : u,
              ),
            }
          : v,
      ),
    );

  // ── Pricing calculations (account for per-variant quantity) ─────
  //
  // Each variant carries its OWN purchasePrice / sellingPrice, so every
  // total below is computed PER VARIANT and then summed — we never read
  // form.purchasePrice / form.sellingPrice for money math, those no
  // longer represent the whole purchase once multiple variants exist.

  // Planned totals — based on the quantity entered for each variant (Step 2)
  const totalPurchaseValue = variants.reduce(
    (sum, v) => sum + v.purchasePrice * v.quantity,
    0,
  );
  const totalSellingValue = variants.reduce(
    (sum, v) => sum + v.sellingPrice * v.quantity,
    0,
  );
  // Total profit across ALL planned units (quantity already applied per variant)
  const profit = variants.reduce(
    (sum, v) => sum + (v.sellingPrice - v.purchasePrice) * v.quantity,
    0,
  );
  const margin =
    totalPurchaseValue > 0
      ? ((profit / totalPurchaseValue) * 100).toFixed(1)
      : "0";

  // Whether at least one variant has valid pricing entered yet
  const hasPricing = variants.some(
    (v) => v.purchasePrice > 0 && v.sellingPrice > 0,
  );

  // Actual totals — based on units actually scanned so far (Step 3 / Step 4)
  const scannedProfit = variants.reduce(
    (sum, v) => sum + (v.sellingPrice - v.purchasePrice) * v.units.length,
    0,
  );
  const scannedPurchaseValue = variants.reduce(
    (sum, v) => sum + v.purchasePrice * v.units.length,
    0,
  );
  const scannedSellingValue = variants.reduce(
    (sum, v) => sum + v.sellingPrice * v.units.length,
    0,
  );

  // ── Submit ────────────────────────────────

  const handleSubmit = async () => {
    // Build the payload that would go to the backend.
    // Each variant becomes its own line item with its own pricing,
    // quantity, and the IMEIs scanned for it.
    const payload: ICreateDeviceRequest = {
      brand: form.brand,
      model: form.model,
      condition: form.condition,
      countryVersion: form.countryVersion,
      networkLockStatus: form.networkLockStatus,
      ptaStatus: form.ptaStatus,
      batteryHealth: form.batteryHealth,
      screenCondition: form.screenCondition,
      cameraCondition: form.cameraCondition,
      speakerCondition: form.speakerCondition,
      chargingCondition: form.chargingCondition,
      faceIdStatus: form.faceIdStatus,
      fingerprintStatus: form.fingerprintStatus,
      supplierName: form.supplierName,
      purchaseDate: form.purchaseDate,
      invoiceNumber: form.invoiceNumber,
      warrantyDays: form.warrantyDays,
      notes: form.notes,
      images: form.images,

      // Per-variant breakdown — each variant = color + storage combo,
      // with its own pricing, quantity, and the IMEIs scanned for it
      variants: variants.map((v) => ({
        color: v.color,
        storage: v.storage,
        quantity: v.quantity,
        purchasePrice: v.purchasePrice,
        sellingPrice: v.sellingPrice,
        profitPerUnit: v.sellingPrice - v.purchasePrice,
        totalPurchaseValue: v.purchasePrice * v.quantity,
        totalSellingValue: v.sellingPrice * v.quantity,
        totalProfit: (v.sellingPrice - v.purchasePrice) * v.quantity,
        unitsScanned: v.units.length,
        units: v.units.map((u) => ({
          imei1: u.imei,
          imei2: u.imei2 ?? null,
          valid: u.valid,
        })),
      })),

      // Aggregated totals across all variants
      summary: {
        totalVariants: variants.length,
        totalUnitsNeeded,
        totalUnitsScanned,
        totalPurchaseValue,
        totalSellingValue,
        totalProfit: profit,
        margin: Number(margin),
        scannedPurchaseValue,
        scannedSellingValue,
        scannedProfit,
      },
    };

    const response = await DeviceService.addDevices(payload)

    if(response.success) {
        addToast({
            message: `${totalUnitsScanned} units of ${form.brand} ${form.model} added to inventory!`,
            type: "success",
        });
        setStep(1);
        setForm(defaultForm());
        setVariants([
          { id: uid(), color: "", storage: "", quantity: 1, purchasePrice: 0, sellingPrice: 0, units: [] },
        ]);
        setActiveVariantIdx(0);
    }
  };

  return (
    <PageBackground>
      <Layout title="Purchases — Basit Mobile Zone">
        <main className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <AnimateIn>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center">
                <PackagePlus size={18} className="text-yellow-400" />
              </div>
              <div>
                <h1 className="text-white font-black max-[310px]:text-lg text-xl">
                  New Purchase
                </h1>
                <p className="text-gray-400 text-sm max-[310px]:text-xs">
                  Add new stock to your inventory
                </p>
              </div>
            </div>
          </AnimateIn>

          {/* Step bar */}
          <AnimateIn delay={40}>
            <StepBar current={step} />
          </AnimateIn>

          {/* ─────────────────────────────── */}
          {/* STEP 1 — Device Info           */}
          {/* ─────────────────────────────── */}
          {step === 1 && (
            <AnimateIn>
              <div className="space-y-5">
                <Card padding="md">
                  <Card.Header>
                    <h2 className="text-white font-black text-base flex items-center gap-2">
                      <Smartphone size={16} className="text-yellow-400" />
                      Basic Information
                    </h2>
                  </Card.Header>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Brand"
                        required
                        placeholder="Enter Brand"
                        helper="Brand"
                        value={form.brand}
                        error={errors.brand}
                        onChange={(e) => set("brand", e.target.value)}
                      />
                      <Input
                        label="Model"
                        required
                        placeholder="Galaxy S25 Ultra"
                        helper="Model"
                        value={form.model}
                        error={errors.model}
                        onChange={(e) => set("model", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Condition"
                        options={CONDITION_OPTS}
                        value={form.condition}
                        onChange={(e) => set("condition", e.target.value)}
                      />
                      <Select
                        label="PTA Status"
                        options={PTA_OPTS}
                        value={form.ptaStatus}
                        onChange={(e) => set("ptaStatus", e.target.value)}
                      />
                    </div>
                  </div>
                </Card>

                <Card padding="md">
                  <Card.Header>
                    <h2 className="text-white font-black text-base">
                      Device Condition
                    </h2>
                  </Card.Header>
                  <div className="space-y-4">
                    {form.brand === "Apple" && (
                      <RangeSlider
                        label="Battery Health"
                        value={form.batteryHealth}
                        onChange={(v) => set("batteryHealth", v)}
                        unit="%"
                      />
                    )}
                    <div className="grid max-[400px]:grid-cols-1 grid-cols-2 sm:grid-cols-3 gap-4">
                      <Select
                        label="Screen"
                        options={SCREEN_OPTS}
                        value={form.screenCondition}
                        onChange={(e) => set("screenCondition", e.target.value)}
                      />
                      <Select
                        label="Camera"
                        options={SCREEN_OPTS}
                        value={form.cameraCondition}
                        onChange={(e) => set("cameraCondition", e.target.value)}
                      />
                      <Select
                        label="Speaker"
                        options={SPEAKER_OPTS}
                        value={form.speakerCondition}
                        onChange={(e) =>
                          set("speakerCondition", e.target.value)
                        }
                      />
                      <Select
                        label="Charging Port"
                        options={SPEAKER_OPTS}
                        value={form.chargingCondition}
                        onChange={(e) =>
                          set("chargingCondition", e.target.value)
                        }
                      />
                      <Select
                        label="Face ID"
                        options={FACEID_OPTS}
                        value={form.faceIdStatus}
                        onChange={(e) => set("faceIdStatus", e.target.value)}
                      />
                      <Select
                        label="Fingerprint"
                        options={FACEID_OPTS}
                        value={form.fingerprintStatus}
                        onChange={(e) =>
                          set("fingerprintStatus", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </Card>

                <Card padding="md">
                  <Card.Header>
                    <h2 className="text-white font-black text-base">Photos</h2>
                  </Card.Header>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <ImageUploader
                      label="Front"
                      preview={form.images.front}
                      onImageSelect={(b64) =>
                        set("images", { ...form.images, front: b64 })
                      }
                    />
                    <ImageUploader
                      label="Back"
                      preview={form.images.back}
                      onImageSelect={(b64) =>
                        set("images", { ...form.images, back: b64 })
                      }
                    />
                    <ImageUploader
                      label="Invoice"
                      preview={form.images.invoice}
                      onImageSelect={(b64) =>
                        set("images", { ...form.images, invoice: b64 })
                      }
                    />
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    icon={<ArrowRight size={16} />}
                    onClick={() => {
                      if (validateStep1()) setStep(2);
                    }}
                  >
                    Next: Add Variants
                  </Button>
                </div>
              </div>
            </AnimateIn>
          )}

          {/* ─────────────────────────────── */}
          {/* STEP 2 — Variants              */}
          {/* ─────────────────────────────── */}
          {step === 2 && (
            <AnimateIn>
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-blue-300 text-sm leading-relaxed">
                    <span className="text-white font-semibold">
                      Define variants
                    </span>{" "}
                    — each variant is a unique combination of color and storage.
                    If you have 10 identical Black 256GB units, add one variant
                    with quantity 10. If you have both Black and White, add two
                    separate variants.
                  </p>
                </div>

                <div className="space-y-4">
                  {variants.map((v, i) => (
                    <Card key={v.id} padding="md">
                      <Card.Header>
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-semibold text-sm">
                            Variant {i + 1}
                            {v.color && v.storage && (
                              <span className="text-gray-400 font-normal ml-2">
                                — {v.color} · {v.storage}
                              </span>
                            )}
                          </h3>
                          {variants.length > 1 && (
                            <button
                              onClick={() => removeVariant(v.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </Card.Header>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                          label="Color"
                          placeholder="e.g. Phantom Black"
                          helper="Color"
                          value={v.color}
                          onChange={(e) =>
                            updateVariant(v.id, "color", e.target.value)
                          }
                        />
                        <Input
                          label="Storage / Variant"
                          placeholder="e.g. 8GB / 256GB"
                          helper="Storage / Variant"
                          value={v.storage}
                          onChange={(e) =>
                            updateVariant(v.id, "storage", e.target.value)
                          }
                        />
                        <Input
                          label="Quantity (units)"
                          type="number"
                          helper="Quantity (units)"
                          placeholder="1"
                          value={v.quantity || ""}
                          onChange={(e) =>
                            updateVariant(
                              v.id,
                              "quantity",
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          hint={`You will scan ${v.quantity} IMEI${v.quantity !== 1 ? "s" : ""} for this variant`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Purchase Price"
                          required
                          type="number"
                          helper="Purchase Price"
                          prefix="₨"
                          value={v.purchasePrice || ""}
                          error={errors.purchasePrice}
                          onChange={(e) =>
                            updateVariant(
                              v.id,
                              "purchasePrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                        <Input
                          label="Selling Price"
                          required
                          type="number"
                          helper="Selling Price"
                          prefix="₨"
                          value={v.sellingPrice || ""}
                          error={errors.sellingPrice}
                          onChange={(e) =>
                            updateVariant(
                              v.id,
                              "sellingPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </div>

                      {/* Per-variant profit preview */}
                      {v.purchasePrice > 0 && v.sellingPrice > 0 && (
                        <div className="mt-4 p-3 rounded-xl bg-green-600/8 border border-green-500/20">
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <p className="text-gray-400 text-[10px] uppercase tracking-wider">
                                Profit / Unit
                              </p>
                              <p
                                className={`font-black text-sm ${
                                  v.sellingPrice - v.purchasePrice >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                ₨{(v.sellingPrice - v.purchasePrice).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-[10px] uppercase tracking-wider">
                                Margin
                              </p>
                              <p className="text-yellow-400 font-black text-sm">
                                {v.purchasePrice > 0
                                  ? (((v.sellingPrice - v.purchasePrice) / v.purchasePrice) * 100).toFixed(1)
                                  : "0"}
                                %
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-[10px] uppercase tracking-wider">
                                Total ({v.quantity} {v.quantity === 1 ? "unit" : "units"})
                              </p>
                              <p className="text-white font-black text-sm">
                                ₨{((v.sellingPrice - v.purchasePrice) * v.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                <Button
                  variant="dark"
                  size="sm"
                  iconLeft={<Plus size={14} />}
                  onClick={addVariant}
                >
                  Add Another Variant
                </Button>
                <Card padding="md">
                  <Card.Header>
                    <h2 className="text-white font-black text-base">
                      Pricing & Purchase
                    </h2>
                  </Card.Header>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Warranty (Days)"
                        type="number"
                        helper="Warranty (Days)"
                        placeholder="365"
                        value={form.warrantyDays || ""}
                        onChange={(e) =>
                          set("warrantyDays", parseInt(e.target.value) || 0)
                        }
                      />
                      <Input
                        label="Supplier Name"
                        placeholder="Ali Traders"
                        helper="Supplier Name"
                        value={form.supplierName}
                        onChange={(e) => set("supplierName", e.target.value)}
                      />
                      <Input
                        label="Purchase Date"
                        type="date"
                        helper="Purchase Date"
                        value={form.purchaseDate}
                        onChange={(e) => set("purchaseDate", e.target.value)}
                      />
                      <Input
                        label="Invoice Number"
                        placeholder="INV-001"
                        helper="Invoice Number"
                        value={form.invoiceNumber}
                        onChange={(e) => set("invoiceNumber", e.target.value)}
                      />
                    </div>
                    {hasPricing && (
                      <div className="p-4 rounded-2xl bg-green-600/8 border border-green-500/20">
                        <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-3">
                          Profit Summary — All Variants
                        </p>
                        <div className="grid max-[400px]:grid-cols-1 grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-gray-400 text-xs">Total Profit</p>
                            <p
                              className={`font-black text-lg ${profit >= 0 ? "text-green-400" : "text-red-400"}`}
                            >
                              ₨{profit.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Margin</p>
                            <p className="text-yellow-400 font-black text-lg">
                              {margin}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">
                              Total ({totalUnitsNeeded} units)
                            </p>
                            <p className="text-white font-black text-lg">
                              ₨{totalPurchaseValue.toLocaleString()} → ₨{totalSellingValue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <Textarea
                      label="Notes"
                      placeholder="Any additional notes..."
                      rows={3}
                      value={form.notes}
                      onChange={(e) => set("notes", e.target.value)}
                    />
                  </div>
                </Card>
                {/* Summary */}
                <div className="grid max-[400px]:grid-cols-1 grid-cols-3 gap-4">
                  <div className="max-[500px]:p-2 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <p className="max-[500px]:text-lg text-2xl font-black text-purple-300">
                      {variants.length}
                    </p>
                    <p className="text-xs text-purple-400 mt-0.5">Variants</p>
                  </div>
                  <div className="max-[500px]:p-2 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                    <p className="max-[500px]:text-lg text-2xl font-black text-yellow-300">
                      {totalUnitsNeeded}
                    </p>
                    <p className="text-xs text-yellow-400 mt-0.5">
                      Total Units
                    </p>
                  </div>
                  <div className="max-[500px]:p-2 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                    <p className="max-[500px]:text-lg text-2xl font-black text-green-300">
                      ₨{(profit / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-green-400 mt-0.5">Est. Profit</p>
                  </div>
                </div>

                <div className="flex max-[400px]:flex-col gap-3 justify-between">
                  <Button
                    variant="dark"
                    size="md"
                    iconLeft={<ChevronLeft size={16} />}
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    icon={<ArrowRight size={16} />}
                    onClick={() => {
                      if (validateStep2()) setStep(3);
                    }}
                  >
                    Next: Scan IMEIs
                  </Button>
                </div>
              </div>
            </AnimateIn>
          )}

          {/* ─────────────────────────────── */}
          {/* STEP 3 — Scan IMEIs            */}
          {/* ─────────────────────────────── */}
          {step === 3 && (
            <AnimateIn>
              <div className="space-y-5">
                {/* Overall progress */}
                {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                    label="Total Needed"
                    value={String(totalUnitsNeeded)}
                    icon={<Package className="text-purple-400" />}
                    accent="purple"
                  />
                  <StatCard
                    label="Scanned"
                    value={String(totalUnitsScanned)}
                    icon={<CheckCircle2 className="text-green-400" />}
                    accent="green"
                  />
                  <StatCard
                    label="Remaining"
                    value={String(totalUnitsNeeded - totalUnitsScanned)}
                    icon={<Hourglass className="text-yellow-400" />}
                    accent="yellow"
                  />
                </div> */}

                {/* Variant tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {variants.map((v, i) => {
                    const done = v.units.length >= v.quantity;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setActiveVariantIdx(i)}
                        className={[
                          "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0",
                          activeVariantIdx === i
                            ? "bg-yellow-400/15 text-yellow-400 border border-yellow-400/25"
                            : "text-gray-400 hover:text-white hover:bg-white/6 border border-transparent",
                        ].join(" ")}
                      >
                        {done ? (
                          <CheckCircle2 size={13} className="text-green-400" />
                        ) : (
                          <ScanBarcode size={13} />
                        )}
                        {v.color || `Variant ${i + 1}`} · {v.storage || "—"}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${done ? "bg-green-500/20 text-green-400" : "bg-white/10 text-gray-400"}`}
                        >
                          {v.units.length}/{v.quantity}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active variant scanner */}
                <Card padding="md">
                  <IMEIScanner
                    variant={variants[activeVariantIdx]}
                    allUnits={allUnits}
                    onAdd={(unit) =>
                      addUnit(variants[activeVariantIdx].id, unit)
                    }
                    onRemove={(unitId) =>
                      removeUnit(variants[activeVariantIdx].id, unitId)
                    }
                    onEditSave={(unitId, imei, imei2) =>
                      editUnitSave(
                        variants[activeVariantIdx].id,
                        unitId,
                        imei,
                        imei2,
                      )
                    }
                  />
                </Card>

                <div className="flex max-[400px]:flex-col gap-3 justify-between">
                  <Button
                    variant="dark"
                    size="md"
                    iconLeft={<ChevronLeft size={16} />}
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    icon={<ArrowRight size={16} />}
                    onClick={() => {
                      if (!allComplete) {
                        addToast({
                          message: `${totalUnitsNeeded - totalUnitsScanned} units still need IMEIs`,
                          type: "warning",
                        });
                      }
                      setStep(4);
                    }}
                  >
                    {allComplete
                      ? "Review & Submit"
                      : `Continue (${totalUnitsScanned}/${totalUnitsNeeded})`}
                  </Button>
                </div>
              </div>
            </AnimateIn>
          )}

          {/* ─────────────────────────────── */}
          {/* STEP 4 — Review & Submit       */}
          {/* ─────────────────────────────── */}
          {step === 4 && (
            <AnimateIn>
              <div className="space-y-5">
                {/* Device summary */}
                <Card padding="md">
                  <Card.Header>
                    <h2 className="text-white font-black text-base flex items-center gap-2">
                      <BarChart3 size={16} className="text-yellow-400" />
                      Purchase Summary
                    </h2>
                  </Card.Header>
                  <div className="grid max-[320px]:grid-cols-1 grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    {[
                      { l: "Brand", v: form.brand },
                      { l: "Model", v: form.model },
                      { l: "Condition", v: form.condition },
                      { l: "PTA Status", v: form.ptaStatus },
                      {
                        l: "Avg Purchase Price",
                        v: `₨${(totalUnitsNeeded > 0 ? totalPurchaseValue / totalUnitsNeeded : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                      },
                      {
                        l: "Avg Selling Price",
                        v: `₨${(totalUnitsNeeded > 0 ? totalSellingValue / totalUnitsNeeded : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                      },
                      {
                        l: "Avg Profit/Unit",
                        v: `₨${(totalUnitsNeeded > 0 ? profit / totalUnitsNeeded : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                      },
                      { l: "Supplier", v: form.supplierName || "—" },
                    ].map(({ l, v }) => (
                      <div
                        key={l}
                        className="p-3 rounded-xl bg-white/4 border border-white/8"
                      >
                        <p className="text-gray-400 text-[10px] uppercase tracking-wider">
                          {l}
                        </p>
                        <p className="text-white text-sm font-semibold mt-0.5">
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Variants breakdown */}
                  <div className="space-y-3">
                    {variants.map((v, i) => (
                      <div
                        key={v.id}
                        className="p-4 rounded-2xl bg-white/3 border border-white/8"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {v.color} · {v.storage}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {v.units.length} / {v.quantity} units
                              {" · "}
                              ₨{v.purchasePrice.toLocaleString()} → ₨{v.sellingPrice.toLocaleString()}
                              {" · "}
                              profit ₨{((v.sellingPrice - v.purchasePrice) * v.quantity).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                v.units.length >= v.quantity ? "green" : "red"
                              }
                              size="sm"
                            >
                              {v.units.length >= v.quantity
                                ? "Complete"
                                : "Incomplete"}
                            </Badge>
                            <button
                              onClick={() => {
                                setActiveVariantIdx(i);
                                setStep(3);
                              }}
                              className="text-xs text-yellow-400 hover:text-yellow-300 underline cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {v.units.map((u, j) => (
                            <div
                              key={u.id}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span className="text-gray-600 w-4">
                                {j + 1}.
                              </span>
                              <div
                                className={
                                  u.valid ? "text-green-400" : "text-red-400"
                                }
                              >
                                {u.valid ? (
                                  <CheckCircle2 size={11} />
                                ) : (
                                  <XCircle size={11} />
                                )}
                              </div>
                              <div className="grid max-[450px]:grid-cols-1 grid-cols-2">
                                <span className="text-gray-300 font-mono">
                                  {formatIMEI(u.imei)}
                                </span>
                                {u.imei2 && (
                                  <span className="text-gray-500 font-mono">
                                    <span className="hidden min-[450px]:inline">
                                      {" "}
                                      /{" "}
                                    </span>
                                    {formatIMEI(u.imei2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals — based on units actually scanned so far */}
                  <div className="grid max-[450px]:grid-cols-1 grid-cols-3 gap-4 mt-4">
                    <div className="max-[550px]:p-2 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                      <p className="max-[550px]:text-lg text-2xl font-black text-purple-300">
                        {totalUnitsScanned}
                      </p>
                      <p className="text-xs text-purple-400 mt-0.5">
                        Units Ready
                      </p>
                    </div>
                    <div className="max-[550px]:p-2 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                      <p className="max-[550px]:text-lg text-2xl font-black text-green-300">
                        ₨{(scannedProfit / 1000).toFixed(1)}K
                      </p>
                      <p className="text-xs text-green-400 mt-0.5">
                        Total Est. Profit
                      </p>
                    </div>
                    <div className="max-[550px]:p-2 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                      <p className="max-[550px]:text-lg text-2xl font-black text-yellow-300">
                        ₨{(scannedPurchaseValue / 1000).toFixed(1)}K
                      </p>
                      <p className="text-xs text-yellow-400 mt-0.5">
                        Total Investment
                      </p>
                    </div>
                  </div>
                </Card>

                {!allComplete && (
                  <div className="flex items-center gap-2 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                    <ScanBarcode
                      size={16}
                      className="text-yellow-400 flex-shrink-0"
                    />
                    <p className="text-yellow-300 text-sm">
                      {totalUnitsNeeded - totalUnitsScanned} unit(s) still need
                      IMEIs. You can still submit with incomplete units.
                    </p>
                  </div>
                )}

                <div className="flex max-[450px]:flex-col gap-3 justify-between">
                  <Button
                    variant="dark"
                    size="md"
                    iconLeft={<ChevronLeft size={16} />}
                    onClick={() => setStep(3)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="success"
                    size="md"
                    iconLeft={<CheckCircle2 size={16} />}
                    onClick={handleSubmit}
                  >
                    Submit {totalUnitsScanned} Units to Inventory
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

export default Purchases;