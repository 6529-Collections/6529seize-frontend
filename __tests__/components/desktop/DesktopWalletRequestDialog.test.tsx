import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesktopWalletRequestDialog from "@/components/desktop/DesktopWalletRequestDialog";
import type { getDesktopWalletRequestStatus } from "@/services/desktop/desktopBrowserWallet";

type DesktopWalletRequestStatus = ReturnType<
  typeof getDesktopWalletRequestStatus
>;

let status: DesktopWalletRequestStatus = { kind: "idle" };
const listeners = new Set<() => void>();
const cancel = jest.fn();
const reopen = jest.fn();
const dismiss = jest.fn();
const continueInBrowser = jest.fn(() => true);

jest.mock("@/services/desktop/desktopBrowserWallet", () => ({
  getDesktopWalletRequestStatus: () => status,
  getServerDesktopWalletRequestStatus: () => ({ kind: "idle" }),
  subscribeDesktopWalletRequestStatus: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  cancelDesktopWalletRequest: () => cancel(),
  reopenDesktopWalletRequest: () => reopen(),
  dismissDesktopWalletRequestStatus: () => dismiss(),
}));
jest.mock("@/services/desktop/continueInBrowser", () => ({
  continueInBrowser: () => continueInBrowser(),
  getWebsiteHost: () => "staging.6529.io",
}));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

const setStatus = (next: DesktopWalletRequestStatus) => {
  status = next;
  act(() => listeners.forEach((listener) => listener()));
};

describe("DesktopWalletRequestDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    status = { kind: "idle" };
    listeners.clear();
  });

  it("renders nothing while no request is open", () => {
    render(<DesktopWalletRequestDialog />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the request code while waiting, and cancels", async () => {
    render(<DesktopWalletRequestDialog />);
    setStatus({ kind: "waiting", requestCode: "ABC-123", expiresAt: 1 });

    expect(
      screen.getByRole("dialog", { name: "Signature request" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Request code ABC-123/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Finish there");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(cancel).toHaveBeenCalled();
  });

  it("limits reopening the way the shell does", async () => {
    jest.useFakeTimers();
    render(<DesktopWalletRequestDialog />);
    setStatus({ kind: "waiting", requestCode: "ABC-123", expiresAt: 1 });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const button = screen.getByRole("button", {
        name: "Open the page again",
      });
      expect(button).toBeEnabled();
      fireEvent.click(button);
      expect(reopen).toHaveBeenCalledTimes(attempt + 1);
      // After the third, the shell will not open it again: no button.
      if (attempt === 2) break;
      expect(
        screen.getByRole("button", { name: "Open the page again" })
      ).toBeDisabled();
      expect(
        screen.getByText(/open it again in a few seconds/)
      ).toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(5000);
      });
    }
    expect(
      screen.queryByRole("button", { name: "Open the page again" })
    ).toBeNull();

    // A new request starts over.
    setStatus({ kind: "waiting", requestCode: "DEF-456", expiresAt: 1 });
    expect(
      screen.getByRole("button", { name: "Open the page again" })
    ).toBeEnabled();
  });

  it("stays open with the reason when the browser does not open", async () => {
    continueInBrowser.mockReturnValueOnce(false);
    render(<DesktopWalletRequestDialog />);
    setStatus({ kind: "refused" });
    await userEvent.click(
      screen.getByRole("button", { name: "Continue in your browser" })
    );
    expect(dismiss).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your browser did not open. Open staging.6529.io"
    );
  });

  it.each([
    [
      "refused",
      /would not sign this request. Continue on staging\.6529\.io/,
      true,
    ],
    [
      "unverified",
      /Smart-contract wallets .* continue on staging\.6529\.io/,
      true,
    ],
    ["busy", /Another signature request/, false],
    ["expired", /timed out/, false],
    ["cancelled", /was cancelled/, false],
    ["failed", /did not work/, false],
  ] as const)("explains a %s request", async (kind, text, offersBrowser) => {
    render(<DesktopWalletRequestDialog />);
    setStatus({ kind });

    expect(screen.getByRole("alert")).toHaveTextContent(text);
    const browserButton = screen.queryByRole("button", {
      name: "Continue in your browser",
    });
    if (offersBrowser) {
      await userEvent.click(browserButton!);
      expect(continueInBrowser).toHaveBeenCalled();
      expect(dismiss).toHaveBeenCalled();
    } else {
      expect(browserButton).toBeNull();
    }
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(dismiss).toHaveBeenCalled();
  });
});
