import { useAuth } from "@/components/auth/Auth";
import HeaderQRScanner from "@/components/header/share/HeaderQRScanner";
import useCapacitor from "@/hooks/useCapacitor";

const SCANNER_FALLBACK_GUIDANCE =
  "Make sure you're using the latest version of the 6529 Mobile app and that camera access is enabled in your device settings.";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import React, { Fragment } from "react";

jest.mock("@/hooks/useCapacitor");
jest.mock("@/components/auth/Auth");
jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));
jest.mock("@capacitor/barcode-scanner", () => ({
  CapacitorBarcodeScanner: { scanBarcode: jest.fn() },
  CapacitorBarcodeScannerTypeHint: { QR_CODE: 1 },
}));

const mockedCapacitor = useCapacitor as jest.Mock;
const mockedAuth = useAuth as jest.Mock;
const mockedRouter = useRouter as jest.Mock;
const { CapacitorBarcodeScanner } = require("@capacitor/barcode-scanner");

describe("HeaderQRScanner", () => {
  const renderErrorToastMessage = (toast: jest.Mock) => {
    const toastArg = toast.mock.calls.at(-1)?.[0];
    expect(toastArg?.type).toBe("error");
    render(<Fragment>{toastArg?.message}</Fragment>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth.mockReturnValue({ setToast: jest.fn() });
  });

  it("renders nothing when not running in capacitor", () => {
    mockedCapacitor.mockReturnValue({ isCapacitor: false });
    const { container } = render(<HeaderQRScanner onScanSuccess={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("navigates to url on successful scan of base endpoint", async () => {
    mockedCapacitor.mockReturnValue({ isCapacitor: true });
    const push = jest.fn();
    mockedRouter.mockReturnValue({ push });
    const toast = jest.fn();
    mockedAuth.mockReturnValue({ setToast: toast });
    (CapacitorBarcodeScanner.scanBarcode as jest.Mock).mockResolvedValue({
      ScanResult: "https://test.6529.io/profile",
    });

    render(<HeaderQRScanner onScanSuccess={jest.fn()} />);
    const btn = await screen.findByRole("button", { name: "QR Code Scanner" });
    await userEvent.click(btn);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/profile"));
    expect(toast).not.toHaveBeenCalled();
  });

  it("handles deep link navigation", async () => {
    mockedCapacitor.mockReturnValue({ isCapacitor: true });
    const push = jest.fn();
    mockedRouter.mockReturnValue({ push });
    const onScan = jest.fn();
    mockedAuth.mockReturnValue({ setToast: jest.fn() });
    (CapacitorBarcodeScanner.scanBarcode as jest.Mock).mockResolvedValue({
      ScanResult: "testmobile6529://navigate/foo/bar?x=1",
    });

    render(<HeaderQRScanner onScanSuccess={onScan} />);
    const btn = await screen.findByRole("button", { name: "QR Code Scanner" });
    await userEvent.click(btn);

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        expect.stringMatching(/\/foo\/bar\?x=1&_t=\d+/)
      )
    );
    expect(onScan).toHaveBeenCalled();
  });

  it("shows toast on invalid scan result", async () => {
    mockedCapacitor.mockReturnValue({ isCapacitor: true });
    const push = jest.fn();
    mockedRouter.mockReturnValue({ push });
    const toast = jest.fn();
    mockedAuth.mockReturnValue({ setToast: toast });
    (CapacitorBarcodeScanner.scanBarcode as jest.Mock).mockResolvedValue({});

    render(<HeaderQRScanner onScanSuccess={jest.fn()} />);
    const btn = await screen.findByRole("button", { name: "QR Code Scanner" });
    await userEvent.click(btn);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith({
        message: "This QR code is not valid.",
        type: "error",
      })
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("shows the scanner error message when scan rejects", async () => {
    mockedCapacitor.mockReturnValue({ isCapacitor: true });
    const push = jest.fn();
    mockedRouter.mockReturnValue({ push });
    const toast = jest.fn();
    mockedAuth.mockReturnValue({ setToast: toast });
    (CapacitorBarcodeScanner.scanBarcode as jest.Mock).mockRejectedValue(
      new Error(
        "Couldn’t scan because camera access wasn’t provided. Check your camera permissions and try again."
      )
    );

    render(<HeaderQRScanner onScanSuccess={jest.fn()} />);
    const btn = await screen.findByRole("button", { name: "QR Code Scanner" });
    await userEvent.click(btn);

    await waitFor(() => expect(toast).toHaveBeenCalled());
    renderErrorToastMessage(toast);
    expect(screen.getByText("Scan failed.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Couldn’t scan because camera access wasn’t provided. Check your camera permissions and try again."
      )
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows fallback scanner guidance when the scan error has no message", async () => {
    mockedCapacitor.mockReturnValue({ isCapacitor: true });
    const push = jest.fn();
    mockedRouter.mockReturnValue({ push });
    const toast = jest.fn();
    mockedAuth.mockReturnValue({ setToast: toast });
    (CapacitorBarcodeScanner.scanBarcode as jest.Mock).mockRejectedValue({
      code: "UNKNOWN",
    });

    render(<HeaderQRScanner onScanSuccess={jest.fn()} />);
    const btn = await screen.findByRole("button", { name: "QR Code Scanner" });
    await userEvent.click(btn);

    await waitFor(() => expect(toast).toHaveBeenCalled());
    renderErrorToastMessage(toast);
    expect(screen.getByText("Scan failed.")).toBeInTheDocument();
    expect(screen.getByText(SCANNER_FALLBACK_GUIDANCE)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
