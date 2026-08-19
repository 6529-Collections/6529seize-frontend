import type { CapacitorBarcodeScannerOptions } from "@capacitor/barcode-scanner";

const loadBarcodeScanner = () => import("@capacitor/barcode-scanner");

type BarcodeScannerModule = Awaited<ReturnType<typeof loadBarcodeScanner>>;

const SCANNER_CANCELLED_ERROR_CODE = "OS-PLUG-BARC-0006";

function getScannerOptions(
  scannerModule: BarcodeScannerModule,
  isAndroid: boolean,
  scanInstructions: string
): CapacitorBarcodeScannerOptions {
  const {
    CapacitorBarcodeScannerAndroidScanningLibrary,
    CapacitorBarcodeScannerCameraDirection,
    CapacitorBarcodeScannerScanOrientation,
    CapacitorBarcodeScannerTypeHint,
  } = scannerModule;
  const scannerOptions: CapacitorBarcodeScannerOptions = {
    hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
    scanInstructions,
    scanButton: false,
    cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
    scanOrientation: CapacitorBarcodeScannerScanOrientation.ADAPTIVE,
  };

  if (!isAndroid) {
    return scannerOptions;
  }

  return {
    ...scannerOptions,
    android: {
      scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.ZXING,
    },
  };
}

function getQRScannerErrorField(
  error: unknown,
  field: "code" | "message"
): string | null {
  if (
    error === null ||
    error === undefined ||
    typeof error !== "object" ||
    !(field in error)
  ) {
    return null;
  }

  const errorRecord = error as Partial<Record<"code" | "message", unknown>>;
  const fieldValue = errorRecord[field];
  if (typeof fieldValue !== "string") {
    return null;
  }

  const trimmedValue = fieldValue.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export function getQRScannerErrorReason(error: unknown): string | null {
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return getQRScannerErrorField(error, "message");
}

export function isQRScannerCancellation(error: unknown): boolean {
  const code = getQRScannerErrorField(error, "code");
  if (code === SCANNER_CANCELLED_ERROR_CODE) {
    return true;
  }

  const reason = getQRScannerErrorReason(error)?.toLowerCase() ?? "";
  return (
    reason.includes("process was cancelled") ||
    reason.includes("process was canceled")
  );
}

export async function isQRScannerAvailable(): Promise<boolean> {
  try {
    const { CapacitorBarcodeScanner } = await loadBarcodeScanner();
    return typeof CapacitorBarcodeScanner.scanBarcode === "function";
  } catch {
    return false;
  }
}

export async function scanQrCode({
  isAndroid,
  scanInstructions,
}: {
  readonly isAndroid: boolean;
  readonly scanInstructions: string;
}): Promise<string | null> {
  const scannerModule = await loadBarcodeScanner();
  const { CapacitorBarcodeScanner } = scannerModule;
  const result = await CapacitorBarcodeScanner.scanBarcode(
    getScannerOptions(scannerModule, isAndroid, scanInstructions)
  );
  return result.ScanResult || null;
}
