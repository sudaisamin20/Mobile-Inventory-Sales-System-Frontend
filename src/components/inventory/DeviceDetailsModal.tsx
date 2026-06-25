// components/inventory/DeviceDetailsModal.tsx
// ─────────────────────────────────────────────────────────────────
//
//  WORKFLOW:
//  1. Admin fills device specs once (brand, model, condition, price...)
//  2. On the final "Add Units" tab they scan or type IMEI for EACH
//     physical unit of that device — e.g. 5 Samsung S25s = 5 IMEIs
//  3. onSave() fires once per scanned unit with full device data
//
//  Every physical phone has a unique IMEI, so we never store a single
//  IMEI on the template — only on the individual inventory entries.
// ─────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ImageIcon,
  Camera,
  CameraOff,
  ScanBarcode,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  RefreshCw,
  Keyboard,
  Package,
  Edit,
} from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

import {} from "../ui/Badge";
import { Input, Select, RangeSlider, Badge, Button, Modal } from "../ui";
import { type IDevice } from "../../interfaces/inventory";

// ── Types ─────────────────────────────────────────────────────────

export type DeviceCondition = "new" | "used" | "open-box" | "refurbished";
export type PTAStatus = "approved" | "pending" | "blocked" | "unknown";
export type NetworkLockStatus = "unlocked" | "locked" | "unknown";
export type StockStatus = "available" | "low" | "out-of-stock" | "reserved";

/** One full inventory entry — one per physical unit / per IMEI */
export interface ICreateDeviceRequest {
  // Unique per unit
  id?: string;
  imei1: string;
  imei2?: string;
  tacCode: string;
  serialNumber: string;
  // Shared across all units of same model
  brand: string;
  model: string;
  variant: string;
  color: string;
  countryVersion: string;
  ptaStatus: PTAStatus;
  networkLockStatus: NetworkLockStatus;
  condition: DeviceCondition;
  batteryHealth: number;
  screenCondition: string;
  cameraCondition: string;
  speakerCondition: string;
  chargingCondition: string;
  faceIdStatus: string;
  fingerprintStatus: string;
  waterpakStatus: string;
  purchasePrice: number;
  sellingPrice: number;
  supplierName: string;
  purchaseDate: string;
  invoiceNumber: string;
  warrantyDays: number;
  quantity: number;

  colors?: number;
  units?: number;
  variants?: number;

  // stockStatus: StockStatus;
  // shelfLocation: string;
  // notes: string;
  images: { front?: string; back?: string; invoice?: string };
  createdAt?: string;
  updatedAt?: string;
}

/** A scanned/typed IMEI entry (before saving) */
interface ScannedUnit {
  id?: string;
  imei1: string;
  imei2?: string;
  valid: boolean;
  addedAt: string;
  savedToInventory: boolean;
}

// ── Option lists ──────────────────────────────────────────────────

const BRANDS = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "OnePlus",
  "Huawei",
  "Oppo",
  "Vivo",
  "Realme",
  "Motorola",
  "Nothing",
  "Google",
  "Other",
].map((b) => ({ value: b, label: b }));

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
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "blocked", label: "Blocked" },
  { value: "unknown", label: "Unknown" },
];
const NETWORK_OPTS = [
  { value: "unlocked", label: "Unlocked" },
  { value: "locked", label: "Locked" },
  { value: "unknown", label: "Unknown" },
];
const COUNTRY_OPTS = [
  { value: "Pakistan", label: "Pakistan" },
  { value: "Global", label: "Global" },
  { value: "USA", label: "USA" },
  { value: "EU", label: "EU" },
  { value: "China", label: "China" },
  { value: "UAE", label: "UAE" },
];
// const STOCK_OPTS = [
//   { value: "available", label: "Available" },
//   { value: "low", label: "Low Stock" },
//   { value: "out-of-stock", label: "Out of Stock" },
//   { value: "reserved", label: "Reserved" },
// ];
// const WATERPAK_OPTS = [
//   { value: "present", label: "Present" },
//   { value: "absent", label: "Absent" },
//   { value: "damaged", label: "Damaged" },
// ];
// const ACCESSORY_LABELS: Record<string, string> = {
//   box: "Original Box",
//   charger: "Charger",
//   cable: "Cable",
//   earphones: "Earphones",
//   cover: "Cover / Case",
//   protector: "Screen Protector",
// };

// ── Helpers ───────────────────────────────────────────────────────

/** Luhn algorithm — same one carriers use to validate IMEI */
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

function formatIMEI(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length < 15) return d;
  return `${d.slice(0, 2)}-${d.slice(2, 8)}-${d.slice(8, 14)}-${d.slice(14)}`;
}

// function guessBrand(imei: string): string {
//   const prefix = imei.slice(0, 2);
//   const map: Record<string, string> = {
//     "35": "Apple", "01": "Samsung", "10": "Samsung",
//     "86": "Huawei", "45": "LG", "99": "OnePlus",
//   };
//   return map[prefix] ?? "";
// }

// ── Image Uploader ────────────────────────────────────────────────

function ImageUploader({
  label,
  preview,
  onSelect,
}: {
  label: string;
  preview?: string;
  onSelect: (b64: string) => void;
}) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Max 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onSelect(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-gray-300">{label}</p>
      <label className="block cursor-pointer">
        <div
          className={[
            "relative w-full h-28 rounded-xl border-2 border-dashed",
            "flex items-center justify-center overflow-hidden transition-all duration-200",
            preview
              ? "border-purple-500/40"
              : "border-white/15 hover:border-yellow-400/40 hover:bg-yellow-400/5",
          ].join(" ")}
        >
          {preview ? (
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <ImageIcon size={22} />
              <span className="text-xs">Click to upload</span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFile}
        />
      </label>
    </div>
  );
}

// ── Default form ──────────────────────────────────────────────────

type DeviceTemplate = ICreateDeviceRequest;

const defaultTemplate = (): IDevice => ({
  id: "",
  imei1: "",
  imei2: "",
  tacCode: "",
  serialNumber: "",
  brand: "",
  model: "",
  variant: "",
  color: "",
  countryVersion: "",
  ptaStatus: "unknown",
  networkLockStatus: "unknown",
  condition: "new",
  batteryHealth: 100,
  screenCondition: "perfect",
  cameraCondition: "perfect",
  speakerCondition: "working",
  chargingCondition: "working",
  faceIdStatus: "working",
  fingerprintStatus: "working",
  waterpakStatus: "present",
  purchasePrice: 0,
  sellingPrice: 0,
  supplierName: "",
  warrantyDays: 0,
  purchaseDate: new Date().toISOString().slice(0, 10),
  invoiceNumber: "",
  quantity: 1,
  // stockStatus: "available",
  // shelfLocation: "",
  // notes: "",
  images: {},
});

// ── Tab types ─────────────────────────────────────────────────────

type TabId = "basic" | "condition" | "pricing" | "media" | "units";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "basic", label: "Basic Info", icon: <Package size={13} /> },
  { id: "condition", label: "Condition", icon: <CheckCircle2 size={13} /> },
  { id: "pricing", label: "Pricing", icon: <Package size={13} /> },
  { id: "media", label: "Media", icon: <ImageIcon size={13} /> },
  { id: "units", label: "Add Units", icon: <ScanBarcode size={13} /> },
];

// ── IMEI Unit Scanner (final tab) ─────────────────────────────────

function UnitScanner({
  units,
  device,
  onAdd,
  templateBrand,
  modalType,
  onUpdate,
}: {
  units: ScannedUnit[];
  device: IDevice;
  onAdd: (unit: ScannedUnit) => void;
  onRemove: (id: string | undefined) => void;
  templateBrand: string;
  modalType?: string;
  onUpdate: (unit: ScannedUnit) => void;
}) {
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [scanning, setScanning] = useState(false);
  const [manualIMEI, setManual] = useState("");
  const [manualIMEI2, setManual2] = useState("");
  const [scanError, setScanError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScan = useRef<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIMEI1, setEditIMEI1] = useState("");
  const [editIMEI2, setEditIMEI2] = useState("");
  const isEditMode: boolean = modalType === "editDevice";
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isEditMode) return;
    if (!device?.imei1) return;

    // prevent duplicate initialization
    if (initializedRef.current) return;
    initializedRef.current = true;

    const existingUnit: ScannedUnit = {
      id: device.id?.toString(),
      imei1: device.imei1,
      imei2: device.imei2,
      valid: true,
      addedAt: new Date().toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      savedToInventory: true,
    };
    if (units.length === 0) {
      onAdd(existingUnit);
    }
  }, [device, isEditMode]);

  const startEdit = (unit: ScannedUnit) => {
    setEditingId(unit.id ?? null);
    setEditIMEI1(unit.imei1);
    setEditIMEI2(unit.imei2 ?? "");
  };

  const saveEdit = (id: string | undefined) => {
    if (!id) return;

    const cleaned = editIMEI1.replace(/\D/g, "").slice(0, 15);
    if (cleaned.length !== 15) return;

    // prevent duplicates
    if (units.some((u) => u.imei1 === cleaned && u.id !== id)) {
      setScanError("IMEI already exists");
      return;
    }

    const updatedUnit = {
      id,
      imei1: cleaned,
      imei2: editIMEI2?.replace(/\D/g, "").slice(0, 15) || undefined,
      valid: validateIMEI(cleaned),
      addedAt: units.find((u) => u.id === id)?.addedAt || "",
      savedToInventory: true,
    };

    onUpdate(updatedUnit);

    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditIMEI1("");
    setEditIMEI2("");
  };

  const stopScan = useCallback(() => {
    try {
      BrowserMultiFormatReader.releaseAllStreams();
    } catch (_) {
      // Ignore errors from stopping camera
      console.log(_);
    }
    readerRef.current = null;
    setScanning(false);
    lastScan.current = "";
  }, []);

  useEffect(() => () => stopScan(), [stopScan]);

  const addUnit = useCallback(
    (imei1: string, imei2?: string) => {
      const cleaned = imei1.replace(/\D/g, "").slice(0, 15);
      if (cleaned.length !== 15) return;

      // prevent duplicates
      if (units.some((u) => u.imei1 === cleaned)) {
        setScanError(`IMEI already exists`);
        return;
      }

      setScanError("");

      const unit: ScannedUnit = {
        imei1: cleaned,
        imei2: imei2?.replace(/\D/g, "").slice(0, 15) || undefined,
        valid: validateIMEI(cleaned),
        addedAt: new Date().toLocaleTimeString("en-PK", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        savedToInventory: isEditMode ? true : false,
      };

      onAdd(unit);
    },
    [units, onAdd, isEditMode],
  );

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    setScanError("");
    try {
      await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (!devices.length) {
        setScanError("No camera found.");
        return;
      }
      const rear =
        devices.find((d) => /back|rear|environment/i.test(d.label)) ??
        devices[0];
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
              stopScan();
            }
          }
          if (err && err?.name !== "NotFoundException") console.warn(err);
        },
      );
    } catch (e: any) {
      setScanError(e?.message ?? "Camera failed.");
      setScanning(false);
    }
  }, [addUnit, stopScan]);

  const handleManualAdd = () => {
    if (manualIMEI.length !== 15) return;
    addUnit(manualIMEI, manualIMEI2 || undefined);
    setManual("");
    setManual2("");
  };

  return (
    <div className="space-y-4 pr-1">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
        <p className="text-purple-300 text-sm leading-relaxed">
          <span className="font-bold text-white">Device template saved.</span>{" "}
          Now scan or enter the IMEI for each physical unit of this{" "}
          {templateBrand} you are adding to inventory. Each unit gets its own
          unique IMEI entry.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex max-[400px]:flex-col gap-2">
        <Button
          variant={mode === "manual" ? "primary" : "dark"}
          size="sm"
          iconLeft={<Keyboard size={13} />}
          onClick={() => {
            setMode("manual");
            stopScan();
          }}
        >
          Manual Entry
        </Button>
        <Button
          variant={mode === "camera" ? "primary" : "dark"}
          size="sm"
          iconLeft={<Camera size={13} />}
          onClick={() => setMode("camera")}
        >
          Camera Scan
        </Button>
      </div>

      {/* Camera mode */}
      {mode === "camera" && (
        <div className="space-y-3">
          <div className="relative w-full aspect-video bg-black/60 rounded-2xl overflow-hidden border border-white/10">
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
            {/* Corner brackets */}
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
                    Point at IMEI barcode
                  </span>
                </div>
              </div>
            )}
          </div>
          {scanError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <XCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-xs">{scanError}</p>
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

      {/* Manual mode */}
      {!isEditMode && mode === "manual" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 max-[400px]:grid-cols-1 gap-3">
            <Input
              label="IMEI 1"
              placeholder="15-digit IMEI"
              value={manualIMEI}
              helper="Enter 15-digit IMEI"
              onChange={(e) =>
                setManual(e.target.value.replace(/\D/g, "").slice(0, 15))
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                manualIMEI.length === 15 &&
                handleManualAdd()
              }
              suffix={
                <span
                  className={`text-[10px] font-mono ${manualIMEI?.length === 15 ? "text-green-400" : "text-gray-500"}`}
                >
                  {manualIMEI?.length}/15
                </span>
              }
              hint="Dial *#06# on the device"
              error={scanError || undefined}
            />
            <Input
              label="IMEI 2 (optional)"
              placeholder="Optional"
              value={manualIMEI2}
              helper="Enter IMEI 2"
              onChange={(e) =>
                setManual2(e.target.value.replace(/\D/g, "").slice(0, 15))
              }
              suffix={
                <span
                  className={`text-[10px] font-mono ${manualIMEI2?.length === 15 ? "text-green-400" : "text-gray-500"}`}
                >
                  {manualIMEI2?.length}/15
                </span>
              }
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Plus size={14} />}
            onClick={handleManualAdd}
            disabled={manualIMEI.length !== 15}
          >
            Add Unit
          </Button>
        </div>
      )}

      {/* Unit list */}
      {units.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-300">
              Units Added — {units.length}
            </p>
            <Badge
              variant={units.every((u) => u.valid) ? "green" : "orange"}
              size="sm"
            >
              {units.filter((u) => u.valid).length} valid
            </Badge>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
            {units.map((u, idx) => (
              <div
                key={u.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/8"
              >
                <span className="text-gray-500 text-xs w-5">{idx + 1}.</span>

                <div
                  className={`flex-shrink-0 ${u.valid ? "text-green-400" : "text-red-400"}`}
                >
                  {u.valid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                </div>

                {/* NORMAL VIEW */}
                {editingId !== u.id ? (
                  <div className="flex-1">
                    <p className="text-white font-mono text-sm">
                      {formatIMEI(u.imei1)}
                    </p>

                    {u.imei2 && (
                      <p className="text-gray-500 text-xs">
                        {formatIMEI(u.imei2)}
                      </p>
                    )}
                  </div>
                ) : (
                  /* EDIT MODE */
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      className="bg-black/40 p-2 rounded text-white text-sm"
                      value={editIMEI1}
                      onChange={(e) =>
                        setEditIMEI1(
                          e.target.value.replace(/\D/g, "").slice(0, 15),
                        )
                      }
                    />

                    <input
                      className="bg-black/40 p-2 rounded text-white text-sm"
                      value={editIMEI2}
                      onChange={(e) =>
                        setEditIMEI2(
                          e.target.value.replace(/\D/g, "").slice(0, 15),
                        )
                      }
                    />
                  </div>
                )}

                {/* ACTIONS */}
                {editingId !== u.id ? (
                  <button
                    onClick={() => startEdit(u)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Edit size={14} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => saveEdit(u.id)}
                      className="text-green-400"
                    >
                      <CheckCircle2 size={14} />
                    </button>

                    <button onClick={cancelEdit} className="text-red-400">
                      <XCircle size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {units.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <ScanBarcode size={36} className="text-gray-700" />
          <p className="text-gray-500 text-sm">
            No units added yet.
            <br />
            Scan or enter IMEI for each phone.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called once per scanned unit with full device data */
  onSave: (device: IDevice) => void;
  device?: IDevice | undefined; // Optional existing device for editing (not implemented yet)
  modalType?: string;
}

export function DeviceDetailsModal({
  open,
  onClose,
  onSave,
  device,
  modalType,
}: Props) {
  const [tab, setTab] = useState<TabId>("basic");
  const [tmpl, setTmpl] = useState<IDevice>(defaultTemplate);
  const [units, setUnits] = useState<ScannedUnit[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  console.log(modalType);
  const set = <K extends keyof DeviceTemplate>(
    key: K,
    val: DeviceTemplate[K],
  ) => setTmpl((prev) => ({ ...prev, [key]: val }));

  // ── Validation ──────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (device ? !device.brand : !tmpl.brand) e.brand = "Brand is required";
    if (device ? !device.model : !tmpl.model) e.model = "Model is required";
    if (device ? !device?.purchasePrice : (tmpl?.purchasePrice ?? 0 <= 0)) {
      e.purchasePrice = "Enter a valid purchase price";
    }
    if (device ? !device?.sellingPrice : (tmpl?.sellingPrice ?? 0 <= 0)) {
      e.sellingPrice = "Enter a valid selling price";
    }
    setErrors(e);
    if (e.brand || e.model) {
      setTab("basic");
      return false;
    }
    if (e.purchasePrice || e.sellingPrice) {
      setTab("pricing");
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (device) {
      setTmpl({
        id: device.id,
        imei1: device.imei1 ?? "",
        imei2: device.imei2 ?? "",
        tacCode: device.tacCode ?? "",
        serialNumber: device.serialNumber ?? "",
        brand: device.brand ?? "",
        model: device.model ?? "",
        variant: device.variant ?? "",
        color: device.color ?? "",
        countryVersion: device.countryVersion ?? "",
        ptaStatus: device.ptaStatus ?? "unknown",
        networkLockStatus: device.networkLockStatus ?? "unknown",
        condition: device.condition ?? "new",
        batteryHealth: device.batteryHealth ?? 100,
        screenCondition: device.screenCondition ?? "perfect",
        cameraCondition: device.cameraCondition ?? "perfect",
        speakerCondition: device.speakerCondition ?? "working",
        chargingCondition: device.chargingCondition ?? "working",
        faceIdStatus: device.faceIdStatus ?? "working",
        fingerprintStatus: device.fingerprintStatus ?? "working",
        waterpakStatus: device.waterpakStatus ?? "present",
        purchasePrice: device.purchasePrice ?? 0,
        sellingPrice: device.sellingPrice ?? 0,
        supplierName: device.supplierName ?? "",
        purchaseDate: device.purchaseDate ?? "",
        invoiceNumber: device.invoiceNumber ?? "",
        warrantyDays: device.warrantyDays ?? 0,
        quantity: device.quantity ?? 1,
        images: device.images ?? {},
      });

      setUnits([]); // optional (or load units if editing them)
    } else {
      setTmpl(defaultTemplate());
      setUnits([]);
    }
  }, [device, open]);

  // ── Save all units ──────────────────────────────────────────────
  const handleSaveAll = () => {
    if (!validate()) return;
    if (units.length === 0) {
      setTab("units");
      return;
    }
    // Fire onSave once per unit — each with its own IMEI
    units.forEach((unit) => {
      onSave({
        ...tmpl,
        id: unit.id,
        imei1: unit.imei1,
        imei2: unit.imei2,
        tacCode: unit.imei1.slice(0, 8),
        serialNumber: unit.imei1.slice(8, 14),
        quantity: 1,
      });
    });
    console.log(`Saved ${units.length} units:`, units, ``);
    handleClose();
  };

  const handleClose = () => {
    setTmpl(defaultTemplate());
    setUnits([]);
    setErrors({});
    setTab("basic");
    onClose();
  };
  console.log(tmpl);
  const profit =
    (device ? (device?.sellingPrice ?? 0) : (tmpl?.sellingPrice ?? 0)) -
    (device ? (device?.purchasePrice ?? 0) : (tmpl?.purchasePrice ?? 0));
  const margin =
    (device ? (device?.purchasePrice ?? 0) : (tmpl?.purchasePrice ?? 0)) > 0
      ? (
          (profit /
            (device
              ? (device?.purchasePrice ?? 0)
              : (tmpl?.purchasePrice ?? 0))) *
          100
        ).toFixed(1)
      : "0";

  const tabErrors: Record<TabId, number> = {
    basic: (errors.brand ? 1 : 0) + (errors.model ? 1 : 0),
    condition: 0,
    pricing: (errors.purchasePrice ? 1 : 0) + (errors.sellingPrice ? 1 : 0),
    media: 0,
    units: units.filter((u) => !u.valid).length,
  };

  // ── Tab panels ──────────────────────────────────────────────────
  const panels: Record<TabId, React.ReactNode> = {
    basic: (
      <div className="space-y-4 pr-1">
        <div className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-4">
          <Select
            label="Brand"
            required
            options={BRANDS}
            placeholder="Select brand"
            value={tmpl.brand}
            error={errors.brand}
            onChange={(e) => {
              set("brand", e.target.value);
            }}
          />
          <Input
            label="Model"
            required
            placeholder="Galaxy S25 Ultra"
            helper="Mobile Model"
            value={tmpl.model}
            error={errors.model}
            onChange={(e) => set("model", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-4">
          <Input
            label="Variant (RAM / Storage)"
            placeholder="12GB / 512GB"
            helper="Variant"
            value={tmpl.variant}
            onChange={(e) => set("variant", e.target.value)}
          />
          <Input
            label="Color"
            placeholder="Phantom Black"
            helper="Device Color"
            value={tmpl.color}
            onChange={(e) => set("color", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 min-[450px]:grid-cols-2  gap-4">
          <Select
            label="PTA Status"
            options={PTA_OPTS}
            value={tmpl.ptaStatus}
            onChange={(e) => set("ptaStatus", e.target.value as PTAStatus)}
          />
          <Select
            label="Condition"
            options={CONDITION_OPTS}
            value={tmpl.condition}
            onChange={(e) =>
              set("condition", e.target.value as DeviceCondition)
            }
          />
        </div>
      </div>
    ),

    condition: (
      <div className="space-y-4 pr-1">
        {(device && device.brand === "Apple") || tmpl.brand === "Apple" ? (
          <RangeSlider
            label="Battery Health"
            value={tmpl.batteryHealth}
            onChange={(v) => set("batteryHealth", v)}
            unit="%"
          />
        ) : (
          ""
        )}
        <div className="grid max-[400px]:grid-cols-1 grid-cols-2 gap-4">
          <Select
            label="Screen"
            options={SCREEN_OPTS}
            value={tmpl.screenCondition}
            onChange={(e) => set("screenCondition", e.target.value)}
          />
          <Select
            label="Camera"
            options={SCREEN_OPTS}
            value={tmpl.cameraCondition}
            onChange={(e) => set("cameraCondition", e.target.value)}
          />
          <Select
            label="Speaker"
            options={SPEAKER_OPTS}
            value={tmpl.speakerCondition}
            onChange={(e) => set("speakerCondition", e.target.value)}
          />
          <Select
            label="Charging Port"
            options={SPEAKER_OPTS}
            value={tmpl.chargingCondition}
            onChange={(e) => set("chargingCondition", e.target.value)}
          />
          <Select
            label="Face ID"
            options={FACEID_OPTS}
            value={tmpl.faceIdStatus}
            onChange={(e) => set("faceIdStatus", e.target.value)}
          />
          <Select
            label="Fingerprint"
            options={FACEID_OPTS}
            value={tmpl.fingerprintStatus}
            onChange={(e) => set("fingerprintStatus", e.target.value)}
          />
        </div>
      </div>
    ),

    pricing: (
      <div className="space-y-4 pr-1">
        <div className="grid grid-cols-3 max-[500px]:grid-cols-1 gap-4">
          <Input
            label="Purchase Price"
            required
            type="number"
            prefix="₨"
            placeholder="0"
            helper="Purchase Price"
            value={tmpl.purchasePrice || ""}
            error={errors.purchasePrice}
            onChange={(e) =>
              set("purchasePrice", parseFloat(e.target.value) || 0)
            }
          />
          <Input
            label="Selling Price"
            required
            type="number"
            prefix="₨"
            placeholder="0"
            helper="Selling Price"
            value={tmpl.sellingPrice || ""}
            error={errors.sellingPrice}
            onChange={(e) =>
              set("sellingPrice", parseFloat(e.target.value) || 0)
            }
          />
          <Input
            label="Warranty (Days)"
            type="number"
            placeholder="0"
            helper="Warranty period in days"
            value={tmpl.warrantyDays || ""}
            onChange={(e) => set("warrantyDays", parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="grid grid-cols-3 max-[500px]:grid-cols-1 gap-4">
          <Input
            label="Supplier Name"
            placeholder="Ali Traders"
            helper="Name of the supplier"
            value={tmpl.supplierName}
            onChange={(e) => set("supplierName", e.target.value)}
          />
          <Input
            label="Purchase Date"
            type="date"
            helper="Date of purchase"
            value={
              modalType === "editDevice"
                ? tmpl.purchaseDate.split("T")[0]
                : tmpl.purchaseDate
            }
            onChange={(e) => set("purchaseDate", e.target.value)}
          />
          <Input
            label="Invoice Number"
            placeholder="INV-001"
            helper="Invoice number"
            value={tmpl.invoiceNumber}
            onChange={(e) => set("invoiceNumber", e.target.value)}
          />
        </div>
        {tmpl.purchasePrice > 0 && tmpl.sellingPrice > 0 && (
          <div className="p-4 rounded-2xl bg-green-600/10 border border-green-500/20">
            <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-3">
              Profit per Unit
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-xs">Profit</p>
                <p
                  className={`font-black text-lg ${profit >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  ₨{profit.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Margin</p>
                <p
                  className={`font-black text-lg ${Number(margin) >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {margin}%
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">
                  Est. Total ({units.length} units)
                </p>
                <p className="text-white font-black text-lg">
                  ₨{(profit * Math.max(units.length, 1)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    ),

    media: (
      <div className="space-y-4 pr-1">
        <p className="text-gray-400 text-sm">
          Upload photos for this device model. These will apply to all units.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ImageUploader
            label="Front"
            preview={tmpl.images?.front}
            onSelect={(b64) => set("images", { ...tmpl.images, front: b64 })}
          />
          <ImageUploader
            label="Back"
            preview={tmpl.images?.back}
            onSelect={(b64) => set("images", { ...tmpl.images, back: b64 })}
          />
          <ImageUploader
            label="Invoice / Receipt"
            preview={tmpl.images?.invoice}
            onSelect={(b64) => set("images", { ...tmpl.images, invoice: b64 })}
          />
        </div>
      </div>
    ),

    units: (
      <UnitScanner
        units={units}
        device={device || tmpl}
        onAdd={(unit) => setUnits((prev) => [...prev, unit])}
        onRemove={(id) => setUnits((prev) => prev.filter((u) => u.id !== id))}
        templateBrand={tmpl.brand || "device"}
        modalType={modalType}
        onUpdate={(updatedUnit) =>
          setUnits((prev) =>
            prev.map((u) => (u.id === updatedUnit.id ? updatedUnit : u)),
          )
        }
      />
    ),
  };

  // ── Navigation helpers ──────────────────────────────────────────
  const tabIdx = TABS.findIndex((t) => t.id === tab);
  const prevTab = tabIdx > 0 ? TABS[tabIdx - 1].id : null;
  const nextTab = tabIdx < TABS.length - 1 ? TABS[tabIdx + 1].id : null;
  const isLast = tab === "units";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        tab === "units"
          ? `${device ? "Edit Unit" : "Add Units"} — ${tmpl.brand || "Device"} ${tmpl.model || ""}`.trim()
          : "Add Device to Inventory"
      }
      subtitle={
        tab === "units"
          ? "Scan or enter IMEI for each physical unit"
          : "Fill in the shared specs for this device model"
      }
      size="lg"
    >
      {/* ── Tab bar ── */}
      <div className="flex gap-1 overflow-x-auto pb-3 border-b border-white/8 -mx-1 px-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs",
              "whitespace-nowrap transition-all duration-200 flex-shrink-0 cursor-pointer",
              tab === t.id
                ? "bg-yellow-400/15 text-yellow-400 border border-yellow-400/25"
                : "text-gray-400 hover:text-white hover:bg-white/6 border border-transparent",
            ].join(" ")}
          >
            {t.icon}
            <span>{t.label}</span>
            {tabErrors[t.id] > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {tabErrors[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="max-h-[55vh] overflow-y-auto pr-0.5">{panels[tab]}</div>

      {/* ── Footer ── */}
      <Modal.Footer align="between">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {TABS.map((t) => (
            <div
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                "h-1 rounded-full transition-all duration-300 cursor-pointer",
                tab === t.id
                  ? "w-5 bg-yellow-400"
                  : "w-1.5 bg-white/15 hover:bg-white/30",
              ].join(" ")}
            />
          ))}
        </div>

        <div
          className={`grid max-[200px]:grid-cols-1 max-[330px]:grid-cols-2 ${prevTab && !isLast ? "grid-cols-4" : "grid-cols-3"} items-center gap-2`}
        >
          <Button variant="ghost" size="sm" type="button" onClick={handleClose}>
            Cancel
          </Button>

          {prevTab && (
            <Button
              variant="dark"
              size="sm"
              type="button"
              onClick={() => setTab(prevTab)}
            >
              Back
            </Button>
          )}

          {!isLast && (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                if (
                  tab === "basic" &&
                  (device
                    ? !device.brand || !device.model
                    : !tmpl.brand || !tmpl.model)
                ) {
                  validate();
                  return;
                }
                if (nextTab) setTab(nextTab);
              }}
            >
              Next
            </Button>
          )}

          {/* Save button — always visible on units tab, also on other tabs for quick save */}
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={handleSaveAll}
            disabled={isLast && units.length === 0}
          >
            Save Unit
            {/* {isLast
              ? `Save ${units.length} Unit${units.length !== 1 ? "s" : ""}`
              : "Save"} */}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

export default DeviceDetailsModal;
