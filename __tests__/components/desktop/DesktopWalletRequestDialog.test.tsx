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
    const { container } = render(<DesktopWalletRequestDialog />);
    expect(container).toBeEmptyDOMElement();
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("shows the request code while waiting, and cancels", async () => {
    render(<DesktopWalletRequestDialog />);
    setStatus({
      kind: "waiting",
      requestCode: "ABC-123",
      expiresAt: 1,
      fingerprint: null,
    });

    expect(
      screen.getByRole("dialog", { name: "Signature request" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Request code ABC-123/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Finish there");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(cancel).toHaveBeenCalled();
  });

  it("shows the content fingerprint the browser page also shows", () => {
    render(<DesktopWalletRequestDialog />);
    setStatus({
      kind: "waiting",
      requestCode: "ABC-123",
      expiresAt: 1,
      fingerprint: "2c26b46b…6266e7ae",
    });
    expect(
      screen.getByText(
        /Content fingerprint 2c26b46b…6266e7ae\. The browser page shows the same fingerprint/
      )
    ).toBeInTheDocument();
  });

  const WAITING: DesktopWalletRequestStatus = {
    kind: "waiting",
    requestCode: "ABC-123",
    expiresAt: 1,
    fingerprint: null,
    transaction: false,
  };
  // The layered shell's two close controls: the backdrop (not tabbable) and
  // the header's X button. Both call the dialog's onHide.
  const closeControls = () => {
    const [backdrop, header] = screen.getAllByRole("button", {
      name: "Close wallet dialog",
    });
    return { backdrop: backdrop!, header: header! };
  };

  it("names the dialog by its title", () => {
    render(<DesktopWalletRequestDialog />);
    setStatus(WAITING);
    const dialog = screen.getByRole("dialog", { name: "Signature request" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it.each(["header", "backdrop", "Escape"] as const)(
    "cancels the open request (not just hides it) from %s while waiting",
    async (control) => {
      render(<DesktopWalletRequestDialog />);
      setStatus(WAITING);
      if (control === "Escape") {
        await userEvent.keyboard("{Escape}");
      } else {
        await userEvent.click(closeControls()[control]);
      }
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(dismiss).not.toHaveBeenCalled();
    }
  );

  it.each(["header", "backdrop", "Escape"] as const)(
    "dismisses a finished request from %s without cancelling anything",
    async (control) => {
      render(<DesktopWalletRequestDialog />);
      setStatus({ kind: "failed" });
      if (control === "Escape") {
        await userEvent.keyboard("{Escape}");
      } else {
        await userEvent.click(closeControls()[control]);
      }
      expect(dismiss).toHaveBeenCalledTimes(1);
      expect(cancel).not.toHaveBeenCalled();
    }
  );

  it("returns focus to the control that started the request", () => {
    render(
      <>
        <button type="button">Post drop</button>
        <DesktopWalletRequestDialog />
      </>
    );
    const trigger = screen.getByRole("button", { name: "Post drop" });
    trigger.focus();
    setStatus(WAITING);
    expect(trigger).not.toHaveFocus();
    setStatus({ kind: "idle" });
    expect(trigger).toHaveFocus();
  });

  it("limits reopening the way the shell does", async () => {
    jest.useFakeTimers();
    render(<DesktopWalletRequestDialog />);
    setStatus({
      kind: "waiting",
      requestCode: "ABC-123",
      expiresAt: 1,
      fingerprint: null,
    });

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
    setStatus({
      kind: "waiting",
      requestCode: "DEF-456",
      expiresAt: 1,
      fingerprint: null,
    });
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
    [
      "transaction",
      /does not send this transaction to your browser wallet. Continue on staging\.6529\.io/,
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

  it("titles a transaction refusal as a transaction", () => {
    render(<DesktopWalletRequestDialog />);
    setStatus({ kind: "transaction" });
    expect(
      screen.getByRole("dialog", { name: "Transaction" })
    ).toBeInTheDocument();
  });

  it.each([
    ["transactionUnverified", /reports it sent the transaction 0xcd/],
    ["transactionMismatch", /is not the one 6529 Desktop asked for/],
    ["lateTransaction", /approved after its request ended was sent/],
  ] as const)("explains a %s with an explorer link", (kind, text) => {
    const hash = `0x${"cd".repeat(32)}`;
    render(<DesktopWalletRequestDialog />);
    setStatus({ kind, hash, chainId: 11_155_111 });
    expect(screen.getByRole("alert")).toHaveTextContent(text);
    expect(
      screen.getByRole("link", { name: "View on Etherscan" })
    ).toHaveAttribute("href", `https://sepolia.etherscan.io/tx/${hash}`);
    expect(screen.getByRole("dialog", { name: "Transaction" })).toBeVisible();
  });

  it("asks for an update when this 6529 Desktop sends no transactions", () => {
    render(<DesktopWalletRequestDialog />);
    setStatus({ kind: "transactionUpdate" });
    expect(screen.getByRole("alert")).toHaveTextContent(/Update 6529 Desktop/);
    expect(
      screen.getByRole("button", { name: "Continue in your browser" })
    ).toBeInTheDocument();
  });

  it("says a transaction waits for five minutes", () => {
    render(<DesktopWalletRequestDialog />);
    setStatus({ ...WAITING, transaction: true });
    expect(
      screen.getByText(/send this transaction.*five minutes/)
    ).toBeVisible();
  });
});
