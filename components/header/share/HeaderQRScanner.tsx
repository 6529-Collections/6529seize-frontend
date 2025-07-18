"use client";

import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import useCapacitor from "../../../hooks/useCapacitor";
import { useAuth } from "../../auth/Auth";
import Image from "next/image";
import { areEqualURLS } from "../../../helpers/Helpers";
import { DeepLinkScope } from "../../../hooks/useDeepLinkNavigation";

export default function HeaderQRScanner({
  onScanSuccess,
  appSidebar = false,
}: {
  readonly onScanSuccess: () => void;
  readonly appSidebar?: boolean;
}) {
  const appScheme = process.env.MOBILE_APP_SCHEME ?? "mobile6529";
  const baseEndpoint = process.env.BASE_ENDPOINT ?? "https://6529.io";

  const { setToast } = useAuth();
  const capacitor = useCapacitor();
  const router = useRouter();

  const [scanning, setScanning] = useState(false);
  const [scannerAvailable, setScannerAvailable] = useState(false);

  useEffect(() => {
    if (typeof CapacitorBarcodeScanner?.scanBarcode === "function") {
      setScannerAvailable(true);
    } else {
      console.log("CapacitorBarcodeScanner is not available");
    }
  }, []);

  if (!capacitor.isCapacitor || !scannerAvailable) {
    return <></>;
  }

  const startScan = async () => {
    setScanning(true);

    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanInstructions: "Point your camera at a valid QR code on 6529.io",
        scanButton: false,
        cameraDirection: 1,
      });

      setScanning(false);

      if (result.ScanResult) {
        handleQRCode(result.ScanResult);
      } else {
        setToast({
          message: "Invalid QR code",
          type: "error",
        });
      }
    } catch (error) {
      console.error("QR Scan failed:", error);
      setScanning(false);
      setToast({
        message: (
          <>
            <p>Scan failed. Please try again.</p>
            <p className="tw-font-light">
              Make sure you have the latest version of the app installed.
            </p>
          </>
        ),
        type: "error",
      });
    }
  };

  const handleQRCode = (content: string) => {
    console.log("Scanned:", content);

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
        const [scope, ...pathParts] = resolvedUrl.split("?")[0].split("/");

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
            console.log("Unknown Deep Link Scope", scope);
            setToast({
              message: "Invalid QR code",
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
          message: "Invalid QR code",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error parsing QR code:", error);
      setToast({
        message: "Invalid QR code",
        type: "error",
      });
    }
  };

  if (appSidebar) {
    return (
      <button
        onClick={startScan}
        className="tw-bg-transparent tw-border-none tw-w-full tw-flex tw-items-center tw-space-x-4 tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-zinc-300 active:tw-bg-zinc-700 active:tw-text-zinc-200 tw-rounded-lg tw-transition-colors tw-duration-200"
        aria-label="Scan QR Code">
        <HeaderQRScannerIcon className="tw-w-6 tw-h-6 tw-flex-shrink-0" />
        <span>Scan QR Code</span>
      </button>
    );
  }

  return (
    <div className="tailwind-scope tw-self-center">
      <button
        disabled={scanning}
        type="button"
        aria-label="QR Code Scanner"
        title="QR Code Scanner"
        onClick={startScan}
        className="tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-h-10 tw-w-10 tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out">
        <HeaderQRScannerIcon />
      </button>
    </div>
  );
}

function HeaderQRScannerIcon({ className }: { readonly className?: string }) {
  return (
    <Image
      priority
      loading="eager"
      src="/barcode-scanner.png"
      alt="QR Scanner"
      width={20}
      height={20}
      className={className ?? "tw-h-5 tw-w-5 tw-flex-shrink-0"}
    />
  );
}
