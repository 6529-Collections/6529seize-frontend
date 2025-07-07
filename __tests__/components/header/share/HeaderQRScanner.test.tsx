import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HeaderQRScanner from "@/components/header/share/HeaderQRScanner";
import useCapacitor from "@/hooks/useCapacitor";
import { useAuth } from "@/components/auth/Auth";
import { useRouter } from "next/navigation";

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
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BASE_ENDPOINT = "https://6529.io";
    process.env.MOBILE_APP_SCHEME = "mobile6529";
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
      ScanResult: "https://6529.io/profile",
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
      ScanResult: "mobile6529://navigate/foo/bar?x=1",
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
        message: "Invalid QR code",
        type: "error",
      })
    );
    expect(push).not.toHaveBeenCalled();
  });
});
