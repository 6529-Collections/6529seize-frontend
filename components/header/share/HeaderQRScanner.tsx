"use client";

import { useAuth } from "@/components/auth/Auth";
import { publicEnv } from "@/config/env";
import { areEqualURLS } from "@/helpers/Helpers";
import { t } from "@/i18n/messages";
import useCapacitor from "@/hooks/useCapacitor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { DeepLinkScope } from "@/hooks/useDeepLinkNavigation";
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerCameraDirection,
  type CapacitorBarcodeScannerOptions,
  CapacitorBarcodeScannerScanOrientation,
  CapacitorBarcodeScannerTypeHint,
  CapacitorBarcodeScannerTypeHintALLOption,
} from "@capacitor/barcode-scanner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const SCANNER_CANCELLED_ERROR_CODE = "OS-PLUG-BARC-0006";

function getScannerOptions(
  isAndroid: boolean,
  scanInstructions: string
): CapacitorBarcodeScannerOptions {
  const scannerOptions: CapacitorBarcodeScannerOptions = {
    hint: isAndroid
      ? CapacitorBarcodeScannerTypeHintALLOption.ALL
      : CapacitorBarcodeScannerTypeHint.QR_CODE,
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
      scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT,
    },
  };
}

function getQRScannerErrorField(
  error: unknown,
  field: "code" | "message"
): string | null {
  if (!error || typeof error !== "object" || !(field in error)) {
    return null;
  }

  const errorRecord = error as Partial<Record<"code" | "message", unknown>>;
  const fieldValue = errorRecord[field];
  if (typeof fieldValue === "string" && fieldValue.trim()) {
    return fieldValue.trim();
  }

  return null;
}

function getQRScannerErrorReason(error: unknown): string | null {
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return getQRScannerErrorField(error, "message");
}

function isQRScannerCancellation(error: unknown): boolean {
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

function getQRScannerErrorToastMessage({
  error,
  fallbackGuidance,
  scanFailed,
}: {
  readonly error: unknown;
  readonly fallbackGuidance: string;
  readonly scanFailed: string;
}): ReactNode {
  const reason = getQRScannerErrorReason(error);

  return (
    <>
      <p>{scanFailed}</p>
      <p className="tw-font-light">{reason ?? fallbackGuidance}</p>
    </>
  );
}

export default function HeaderQRScanner({
  onScanSuccess,
  appSidebar = false,
}: {
  readonly onScanSuccess: () => void;
  readonly appSidebar?: boolean | undefined;
}) {
  const appScheme = publicEnv.MOBILE_APP_SCHEME ?? "mobile6529";
  const baseEndpoint = publicEnv.BASE_ENDPOINT ?? "https://6529.io";

  const { setToast } = useAuth();
  const capacitor = useCapacitor();
  const locale = useBrowserLocale();
  const router = useRouter();
  const invalidQRCodeMessage = t(locale, "qrScanner.invalidCode");
  const scanFailedMessage = t(locale, "qrScanner.error.scanFailed");
  const scannerFallbackGuidance = t(locale, "qrScanner.error.fallbackGuidance");

  const [scanning, setScanning] = useState(false);
  const [scannerAvailable, setScannerAvailable] = useState(false);

  useEffect(() => {
    if (typeof CapacitorBarcodeScanner?.scanBarcode === "function") {
      setScannerAvailable(true);
    } else {
      console.warn("CapacitorBarcodeScanner is not available");
    }
  }, []);

  if (!capacitor.isCapacitor || !scannerAvailable) {
    return <></>;
  }

  const startScan = async () => {
    setScanning(true);

    try {
      const result = await CapacitorBarcodeScanner.scanBarcode(
        getScannerOptions(
          capacitor.isAndroid,
          t(locale, "qrScanner.instructions")
        )
      );

      setScanning(false);

      if (result.ScanResult) {
        handleQRCode(result.ScanResult);
      } else {
        setToast({
          message: invalidQRCodeMessage,
          type: "error",
        });
      }
    } catch (error) {
      setScanning(false);
      if (isQRScannerCancellation(error)) {
        return;
      }

      console.error("QR Scan failed:", error);
      setToast({
        message: getQRScannerErrorToastMessage({
          error,
          fallbackGuidance: scannerFallbackGuidance,
          scanFailed: scanFailedMessage,
        }),
        type: "error",
      });
    }
  };

  const handleQRCode = (content: string) => {
    try {
      const url = new URL(content);
      let path = "";
      let queryParams: Record<string, string | number> = {};

      if (url.origin === baseEndpoint) {
        const resolvedPath = `${url.pathname}${url.search}`;
        onScanSuccess();
        router.push(resolvedPath);
      } else if (areEqualURLS(url.protocol, `${appScheme}:`)) {
        const resolvedUrl = content.replace(`${appScheme}://`, "");
        const [scope, ...pathParts] = resolvedUrl.split("?")[0]?.split("/")!;

        // Extract query params
        const queryString = resolvedUrl.includes("?")
          ? resolvedUrl.split("?")[1]
          : "";
        const searchParams = new URLSearchParams(queryString);
        queryParams = Object.fromEntries(searchParams.entries());
        queryParams["_t"] = Math.floor(Date.now() / 1000);

        const stringQueryParams = Object.fromEntries(
          Object.entries(queryParams).map(([key, value]) => [
            key,
            String(value),
          ])
        );
        const queryParamsString = new URLSearchParams(
          stringQueryParams
        ).toString();

        switch (scope) {
          case DeepLinkScope.NAVIGATE:
            path = `/${pathParts.join("/")}`;
            break;
          case DeepLinkScope.SHARE_CONNECTION:
            path = "/accept-connection-sharing";
            break;
          default:
            console.warn("Unknown Deep Link Scope", scope);
            setToast({
              message: invalidQRCodeMessage,
              type: "error",
            });
            return;
        }

        // Navigate to the extracted path
        onScanSuccess();
        const routerPath = `${path}${
          queryParamsString ? `?${queryParamsString}` : ""
        }`;
        router.push(routerPath);
      } else {
        setToast({
          message: invalidQRCodeMessage,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error parsing QR code:", error);
      setToast({
        message: invalidQRCodeMessage,
        type: "error",
      });
    }
  };

  if (appSidebar) {
    return (
      <button
        onClick={startScan}
        className="tw-flex tw-w-full tw-items-center tw-space-x-4 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-300 tw-transition-colors tw-duration-200 active:tw-bg-iron-700 active:tw-text-iron-200"
        aria-label={t(locale, "qrScanner.sidebar.ariaLabel")}
      >
        <HeaderQRScannerIcon
          alt={t(locale, "qrScanner.iconAlt")}
          className="tw-h-6 tw-w-6 tw-flex-shrink-0"
        />
        <span>{t(locale, "qrScanner.sidebar.label")}</span>
      </button>
    );
  }

  return (
    <div className="tailwind-scope tw-self-center">
      <button
        disabled={scanning}
        type="button"
        aria-label={t(locale, "qrScanner.trigger.ariaLabel")}
        title={t(locale, "qrScanner.trigger.title")}
        onClick={startScan}
        className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-text-iron-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <HeaderQRScannerIcon alt={t(locale, "qrScanner.iconAlt")} />
      </button>
    </div>
  );
}

function HeaderQRScannerIcon({
  alt,
  className,
}: {
  readonly alt: string;
  readonly className?: string | undefined;
}) {
  return (
    <Image
      unoptimized
      priority
      loading="eager"
      src="/barcode-scanner.png"
      alt={alt}
      width={20}
      height={20}
      className={className ?? "tw-h-5 tw-w-5 tw-flex-shrink-0"}
    />
  );
}
