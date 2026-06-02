import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import {
  ScanBarcode,
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  Trash2,
  FlipHorizontal,
  Plus,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import type { IDevice } from "../../interfaces/inventory";

// Export ScannedIMEI type for use in parent components
export interface ScannedIMEI {
  id: string;
  imei: string;
  scannedAt: string;
  method: "camera" | "manual";
  valid: boolean;
  brand?: string;
}

// ── IMEI Validation (Luhn algorithm)
function validateIMEI(imei: string): boolean {
  const cleaned = imei.replace(/\D/g, "");
  if (cleaned.length !== 15) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(cleaned[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// ── Guess brand from TAC
function guessBrand(imei: string): string {
  const tac = imei.slice(0, 8);
  const brandMap: Record<string, string> = {
    "01": "Samsung",
    "10": "Samsung",
    "35": "Apple",
    "45": "LG",
    "50": "Sony",
    "86": "Huawei",
    "99": "OnePlus",
  };
  for (const [prefix, brand] of Object.entries(brandMap)) {
    if (tac.startsWith(prefix)) return brand;
  }
  return "Unknown Brand";
}

function formatIMEI(imei: string): string {
  const c = imei.replace(/\D/g, "");
  return c.slice(0, 8) + " " + c.slice(8, 14) + " " + c.slice(14);
}

interface AddStockModalProps {
  open: boolean;
  onClose: () => void;
  onSaveIMEIs: (imeis: ScannedIMEI[]) => void;
  templateDevice: IDevice | null;
  isLoading?: boolean;
}

export const AddStockModal = ({
  open,
  onClose,
  onSaveIMEIs,
  templateDevice,
  isLoading = false,
}: AddStockModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [fullScreenCamera, setFullScreenCamera] = useState(false);
  const [manualIMEI, setManualIMEI] = useState("");
  const [scannedIMEIs, setScannedIMEIs] = useState<ScannedIMEI[]>([]);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  console.log(fullScreenCamera);

  // Initialize barcode reader
  useEffect(() => {
    if (!codeReaderRef.current) {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      codeReaderRef.current = new BrowserMultiFormatReader(hints);
    }
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      setError("");
      setFullScreenCamera(true);
      if (!videoRef.current || !codeReaderRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      setCameraActive(true);

      // Start decoding
      // Get available cameras
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();

      if (!devices.length) {
        setError("No camera found");
        return;
      }

      // Prefer rear camera
      const rearCamera =
        devices.find((d) => /back|rear|environment/i.test(d.label)) ||
        devices[0];

      // Start decoding
      await codeReaderRef.current.decodeFromVideoDevice(
        rearCamera.deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const raw = result.getText();

            // Extract 15-digit IMEI from barcode
            const match = raw.match(/\d{15}/);

            if (match) {
              handleIMEIScan(match[0]);
            }
          }

          if (err && err.name !== "NotFoundException") {
            console.warn("Scan error:", err);
          }
        },
      );
    } catch (err) {
      setError(
        `Camera access denied: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setCameraActive(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setCameraActive(false);
    setFullScreenCamera(false);
  };

  // Handle IMEI scan
  const handleIMEIScan = (scannedText: string) => {
    const imei = scannedText.trim();
    if (!imei) return;

    // Check if already scanned
    if (scannedIMEIs.some((s) => s.imei === imei)) {
      setError(`IMEI ${formatIMEI(imei)} already scanned!`);
      return;
    }

    const valid = validateIMEI(imei);
    const newScan: ScannedIMEI = {
      id: Date.now().toString(),
      imei,
      scannedAt: new Date().toLocaleTimeString(),
      method: "camera",
      valid,
      brand: valid ? guessBrand(imei) : undefined,
    };

    setScannedIMEIs((prev) => [...prev, newScan]);
    setSuccessMessage(`✓ Scanned: ${formatIMEI(imei)}`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Handle manual IMEI entry
  const handleManualAdd = () => {
    if (!manualIMEI.trim()) {
      setError("Please enter an IMEI");
      return;
    }

    const imei = manualIMEI.replace(/\D/g, "");

    if (scannedIMEIs.some((s) => s.imei === imei)) {
      setError(`IMEI ${formatIMEI(imei)} already added!`);
      return;
    }

    const valid = validateIMEI(imei);
    const newScan: ScannedIMEI = {
      id: Date.now().toString(),
      imei,
      scannedAt: new Date().toLocaleTimeString(),
      method: "manual",
      valid,
      brand: valid ? guessBrand(imei) : undefined,
    };

    setScannedIMEIs((prev) => [...prev, newScan]);
    setManualIMEI("");
    setSuccessMessage(`✓ Added: ${formatIMEI(imei)}`);
    setTimeout(() => setSuccessMessage(""), 3000);
    setError("");
  };

  // Remove IMEI from list
  const removeIMEI = (id: string) => {
    setScannedIMEIs((prev) => prev.filter((s) => s.id !== id));
  };

  // Save all IMEIs
  const handleSave = () => {
    if (scannedIMEIs.length === 0) {
      setError("Please scan or add at least one IMEI");
      return;
    }
    onSaveIMEIs(scannedIMEIs);
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    setScannedIMEIs([]);
    setManualIMEI("");
    setError("");
    setSuccessMessage("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <ScanBarcode size={24} className="text-yellow-400" />
          Add Stock Units
        </div>
      }
      subtitle={
        templateDevice
          ? `Template: ${templateDevice.brand} ${templateDevice.model} — scanning IMEIs for each unit`
          : undefined
      }
    >
      <div className="flex flex-col h-full gap-0">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Camera Section */}
        <Card padding="lg">
          <div className="space-y-3">
            {cameraActive ? (
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg object-cover"
                  autoPlay
                  playsInline
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={<CameraOff size={16} />}
                    onClick={stopCamera}
                    className="flex-1"
                  >
                    Stop Scanning
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={<FlipHorizontal size={16} />}
                    onClick={() => {
                      stopCamera();
                      setFacingMode((prev) =>
                        prev === "environment" ? "user" : "environment",
                      );
                      setTimeout(startCamera, 200);
                    }}
                    className="flex-1"
                  >
                    Flip Camera
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                iconLeft={<Camera size={16} />}
                onClick={startCamera}
                className="w-full"
              >
                Start Camera Scan
              </Button>
            )}
          </div>
        </Card>

        {/* Manual Entry Section */}
        <Card padding="lg">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus size={16} className="text-yellow-400" />
              Or Enter Manually
            </h3>
            <Input
              label="IMEI Number"
              placeholder="e.g. 35 123456 789012 3"
              value={manualIMEI}
              onChange={(e) => setManualIMEI(e.target.value)}
              error={error ? undefined : undefined}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleManualAdd();
                }
              }}
              helper="Enter a valid 15-digit IMEI number and press Enter"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleManualAdd}
              className="w-full"
            >
              Add IMEI
            </Button>
          </div>
        </Card>

        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
            <XCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-green-500/15 border border-green-500/30 rounded-lg">
            <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-300">{successMessage}</p>
          </div>
        )}

        {/* Scanned IMEIs List */}
        {scannedIMEIs.length > 0 && (
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              Scanned IMEIs ({scannedIMEIs.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {scannedIMEIs.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/8 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {scan.valid ? (
                        <CheckCircle2
                          size={14}
                          className="text-green-400 flex-shrink-0"
                        />
                      ) : (
                        <XCircle
                          size={14}
                          className="text-red-400 flex-shrink-0"
                        />
                      )}
                      <p className="text-sm font-mono text-white truncate">
                        {formatIMEI(scan.imei)}
                      </p>
                      {scan.brand && (
                        <Badge className="text-xs">{scan.brand}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 ml-5">
                      {scan.method === "camera" ? "📱 Camera" : "⌨️ Manual"} •{" "}
                      {scan.scannedAt}
                    </p>
                  </div>
                  <button
                    onClick={() => removeIMEI(scan.id)}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors ml-2 flex-shrink-0"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
        </div>

        {/* Footer Actions - Always visible at bottom */}
        <div className="flex gap-2 pt-4 border-t border-white/10 flex-shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={handleClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            className="flex-1"
            disabled={scannedIMEIs.length === 0 || isLoading}
            iconLeft={<CheckCircle2 size={16} />}
          >
            {isLoading
              ? "Saving..."
              : `Save ${scannedIMEIs.length} Unit${scannedIMEIs.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddStockModal;