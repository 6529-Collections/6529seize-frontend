import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
} from "@capacitor/barcode-scanner";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import useCapacitor from "../../../hooks/useCapacitor";
import { useAuth } from "../../auth/Auth";

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

    if (
      content.startsWith(`${appScheme}://`) ||
      content.startsWith(baseEndpoint)
    ) {
      const path = content
        .replace(new RegExp(`^${appScheme}:\\/\\/`), "")
        .replace(new RegExp(`^${baseEndpoint}`), "");
      router.push(`/${path}`);
    } else {
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
    <svg
      height="20"
      width="20"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg">
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        strokeLinecap="round"
        strokeLinejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <path d="M4,4h6v6H4V4M20,4v6H14V4h6M14,15h2V13H14V11h2v2h2V11h2v2H18v2h2v3H18v2H16V18H13v2H11V16h3V15m2,0v3h2V15H16M4,20V14h6v6H4M6,6V8H8V6H6M16,6V8h2V6H16M6,16v2H8V16H6M4,11H6v2H4V11m5,0h4v4H11V13H9V11m2-5h2v4H11V6M2,2V6H0V2A2,2,0,0,1,2,0H6V2H2M22,0a2,2,0,0,1,2,2V6H22V2H18V0h4M2,18v4H6v2H2a2,2,0,0,1-2-2V18H2m20,4V18h2v4a2,2,0,0,1-2,2H18V22Z"></path>{" "}
      </g>
    </svg>
  );
}
