import { useAuth } from "@/components/auth/Auth";
import HeaderQRScanner from "@/components/header/share/HeaderQRScanner";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { Fragment } from "react";

jest.mock("@/hooks/useCapacitor");
jest.mock("@/hooks/useBrowserLocale");
jest.mock("@/components/auth/Auth");
jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("next/image", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@capacitor/barcode-scanner", () => ({
  CapacitorBarcodeScanner: { scanBarcode: jest.fn() },
  CapacitorBarcodeScannerAndroidScanningLibrary: { ZXING: "zxing" },
  CapacitorBarcodeScannerCameraDirection: { BACK: 1 },
  CapacitorBarcodeScannerScanOrientation: { ADAPTIVE: 3 },
  CapacitorBarcodeScannerTypeHint: { QR_CODE: 0 },
}));

const mockedCapacitor = useCapacitor as jest.Mock;
const mockedBrowserLocale = useBrowserLocale as jest.Mock;
const mockedAuth = useAuth as jest.Mock;
const mockedRouter = useRouter as jest.Mock;
const { CapacitorBarcodeScanner } = require("@capacitor/barcode-scanner");

describe("HeaderQRScanner", () => {
  const getTriggerName = (locale: SupportedLocale = "en-US") =>
    t(locale, "qrScanner.trigger.ariaLabel");

  const renderErrorToastMessage = (toast: jest.Mock) => {
    const toastArg = toast.mock.calls.at(-1)?.[0];
    expect(toastArg?.type).toBe("error");
    render(<Fragment>{toastArg?.message}</Fragment>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedBrowserLocale.mockReturnValue("en-US");
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
    const btn = await screen.findByRole("button", { name: getTriggerName() });
    await userEvent.click(btn);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/profile"));
    expect(CapacitorBarcodeScanner.scanBarcode).toHaveBeenCalledWith({
      hint: 0,
      scanInstructions: t("en-US", "qrScanner.instructions"),
      scanButton: false,
      cameraDirection: 1,
      scanOrientation: 3,
    });
    expect(toast).not.toHaveBeenCalled();
  });

  it("uses Android scanner options on Capacitor Android", async () => {
    mockedCapacitor.mockReturnValue({ isCapacitor: true, isAndroid: true });
    const push = jest.fn();
    mockedRouter.mockReturnValue({ push });
    mockedAuth.mockReturnValue({ setToast: jest.fn() });
    (CapacitorBarcodeScanner.scanBarcode as jest.Mock).mockResolvedValue({
      ScanResult: "https://test.6529.io/profile",
    });

    render(<HeaderQRScanner onScanSuccess={jest.fn()} />);
    const btn = await screen.findByRole("button", { name: getTriggerName() });
    await userEvent.click(btn);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/profile"));
    expect(CapacitorBarcodeScanner.scanBarcode).toHaveBeenCalledWith({
      hint: 0,
      scanInstructions: t("en-US", "qrScanner.instructions"),
      scanButton: false,
      cameraDirection: 1,
      scanOrientation: 3,
      android: {
        scanningLibrary: "zxing",
      },
    });
  });

  it("uses localized scanner copy", async () => {
    mockedBrowserLocale.mockReturnValue("fr-FR");
    mockedCapacitor.mockReturnValue({ isCapacitor: true });
    const push = jest.fn();
    mockedRouter.mockReturnValue({ push });
    mockedAuth.mockReturnValue({ setToast: jest.fn() });
    (CapacitorBarcodeScanner.scanBarcode as jest.Mock).mockResolvedValue({
      ScanResult: "https://test.6529.io/profile",
    });

    render(<HeaderQRScanner onScanSuccess={jest.fn()} />);
    const btn = await screen.findByRole("button", {
      name: getTriggerName("fr-FR"),
    });
    await userEvent.click(btn);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/profile"));
    expect(CapacitorBarcodeScanner.scanBarcode).toHaveBeenCalledWith(
      expect.objectContaining({
        scanInstructions: t("fr-FR", "qrScanner.instructions"),
      })
    );
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
    const btn = await screen.findByRole("button", { name: getTriggerName() });
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
    const btn = await screen.findByRole("button", { name: getTriggerName() });
    await userEvent.click(btn);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith({
        message: t("en-US", "qrScanner.invalidCode"),
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
    const btn = await screen.findByRole("button", { name: getTriggerName() });
    await userEvent.click(btn);

    await waitFor(() => expect(toast).toHaveBeenCalled());
    renderErrorToastMessage(toast);
    expect(
      screen.getByText(t("en-US", "qrScanner.error.scanFailed"))
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Couldn’t scan because camera access wasn’t provided. Check your camera permissions and try again."
      )
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it.each([
    {
      capacitor: { isCapacitor: true, isIos: true },
      code: "OS-PLUG-BARC-0006",
      message: "Couldn’t scan because the process was cancelled.",
    },
    {
      capacitor: { isCapacitor: true, isAndroid: true },
      error: new Error("Couldn’t scan because the process was cancelled."),
    },
  ])(
    "does not show an error toast when the scanner is cancelled",
    async (testCase) => {
      mockedCapacitor.mockReturnValue(testCase.capacitor);
      const push = jest.fn();
      mockedRouter.mockReturnValue({ push });
      const toast = jest.fn();
      mockedAuth.mockReturnValue({ setToast: toast });
      (CapacitorBarcodeScanner.scanBarcode as jest.Mock).mockRejectedValue(
        "error" in testCase ? testCase.error : testCase
      );

      render(<HeaderQRScanner onScanSuccess={jest.fn()} />);
      const btn = await screen.findByRole("button", {
        name: getTriggerName(),
      });
      await userEvent.click(btn);

      await waitFor(() =>
        expect(CapacitorBarcodeScanner.scanBarcode).toHaveBeenCalled()
      );
      expect(toast).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
    }
  );

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
    const btn = await screen.findByRole("button", { name: getTriggerName() });
    await userEvent.click(btn);

    await waitFor(() => expect(toast).toHaveBeenCalled());
    renderErrorToastMessage(toast);
    expect(
      screen.getByText(t("en-US", "qrScanner.error.scanFailed"))
    ).toBeInTheDocument();
    expect(
      screen.getByText(t("en-US", "qrScanner.error.fallbackGuidance"))
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
