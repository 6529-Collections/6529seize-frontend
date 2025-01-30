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
import { areEqualURLS } from "../../../helpers/Helpers";

export default function HeaderQRScanner({
  onScanSuccess,
}: {
  readonly onScanSuccess: () => void;
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
        const resolvedPath = url.pathname;
        onScanSuccess();
        router.push(resolvedPath);
        return;
      } else if (areEqualURLS(url.protocol, `${appScheme}:`)) {
        const resolvedUrl = content.replace(`${appScheme}://`, "");
        const [scope, ...pathParts] = resolvedUrl.split("?")[0].split("/");

        // Extract query params
        const queryString = resolvedUrl.includes("?")
          ? resolvedUrl.split("?")[1]
          : "";
        const searchParams = new URLSearchParams(queryString);
        queryParams = Object.fromEntries(searchParams.entries());
        queryParams["_t"] = Date.now() / 1000; // Add timestamp for freshness

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
        router.push({ pathname: path, query: queryParams });
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
      priority
      loading="eager"
      src="/barcode-scanner.png"
      alt="QR Scanner"
      width={20}
      height={20}
      className="tw-h-5 tw-w-5 tw-flex-shrink-0"
    />
  );
}
