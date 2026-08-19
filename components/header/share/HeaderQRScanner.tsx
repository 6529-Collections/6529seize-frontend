"use client";

import { useAuth } from "@/components/auth/Auth";
import { publicEnv } from "@/config/env";
import { areEqualURLS } from "@/helpers/Helpers";
import { t } from "@/i18n/messages";
import useCapacitor from "@/hooks/useCapacitor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { DeepLinkScope } from "@/hooks/useDeepLinkNavigation";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  getQRScannerErrorReason,
  isQRScannerAvailable,
  isQRScannerCancellation,
  scanQrCode,
} from "./qrScanner.utils";

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
    if (!capacitor.isCapacitor) {
      return;
    }

    let active = true;
    void isQRScannerAvailable().then((available) => {
      if (!active) {
        return;
      }

      if (available) {
        setScannerAvailable(true);
      } else {
        console.warn("CapacitorBarcodeScanner is not available");
      }
    });

    return () => {
      active = false;
    };
  }, [capacitor.isCapacitor]);

  if (!capacitor.isCapacitor || !scannerAvailable) {
    return <></>;
  }

  const startScan = async () => {
    setScanning(true);

    try {
      const scanResult = await scanQrCode({
        isAndroid: capacitor.isAndroid,
        scanInstructions: t(locale, "qrScanner.instructions"),
      });

      setScanning(false);

      if (scanResult) {
        handleQRCode(scanResult);
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
