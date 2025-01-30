import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import useCapacitor from "../../../hooks/useCapacitor";
import { useAuth } from "../../auth/Auth";
import { DeepLinkScope } from "../capacitor/CapacitorWidget";
import Image from "next/image";

export default function HeaderQRScanner() {
  const appScheme = process.env.MOBILE_APP_SCHEME ?? "mobile6529";
  const baseEndpoint = process.env.BASE_ENDPOINT ?? "https://6529.io";

  const { setToast } = useAuth();

  const capacitor = useCapacitor();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);

  const [scannerAvailable, setScannerAvailable] = useState(false);

  useEffect(() => {
    if (typeof CapacitorBarcodeScanner?.scanBarcode === "function") {
      console.log("CapacitorBarcodeScanner is available");
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
        message: "Scan failed. Please try again.",
        type: "error",
      });
    }
  };

  const handleQRCode = (content: string) => {
    console.log("Scanned:", content);

    try {
      const url = new URL(content);

      if (url.protocol === `${appScheme}:` || url.origin === baseEndpoint) {
        let path = "";

        if (url.protocol === `${appScheme}:`) {
          if (url.pathname.startsWith(`/${DeepLinkScope.NAVIGATE}`)) {
            path = url.pathname.slice(`/${DeepLinkScope.NAVIGATE}`.length);
          } else {
            path = url.pathname;
          }
        } else if (url.origin === baseEndpoint) {
          path = url.pathname;
        }

        // Ensure we don't start with a slash when pushing to router
        router.push(path.startsWith("/") ? path : `/${path}`);
      } else {
        setToast({
          message: "Invalid QR code",
          type: "error",
        });
      }
    } catch (error) {
      setToast({
        message: "Invalid QR code",
        type: "error",
      });
    }
  };

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

function HeaderQRScannerIcon() {
  return (
    <Image
      src="/barcode-scanner.png"
      alt="QR Scanner"
      width={20}
      height={20}
      className="tw-h-5 tw-w-5 tw-flex-shrink-0"
    />
  );
}
