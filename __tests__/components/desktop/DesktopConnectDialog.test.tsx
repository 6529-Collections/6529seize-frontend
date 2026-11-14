import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesktopConnectDialog from "@/components/desktop/DesktopConnectDialog";
import {
  cancelBrowserConnectorSignIn,
  startBrowserConnectorSignIn,
} from "@/services/desktop/browserConnectorSignIn";
import {
  closeDesktopConnectDialog,
  openDesktopConnectDialog,
} from "@/services/desktop/desktopConnectDialog";

let mockStatus = "idle";
const statusListeners = new Set<() => void>();
const setStatus = (status: string) => {
  mockStatus = status;
  act(() => {
    statusListeners.forEach((listener) => listener());
  });
};

jest.mock("@/services/desktop/browserConnectorSignIn", () => ({
  startBrowserConnectorSignIn: jest.fn().mockResolvedValue(undefined),
  cancelBrowserConnectorSignIn: jest.fn(),
  resetFinishedBrowserConnectorStatus: () => {
    if (mockStatus !== "waiting" && mockStatus !== "signing-in") {
      mockStatus = "idle";
    }
  },
  getBrowserConnectorStatus: () => mockStatus,
  getServerBrowserConnectorStatus: () => "idle",
  subscribeBrowserConnectorStatus: (listener: () => void) => {
    statusListeners.add(listener);
    return () => statusListeners.delete(listener);
  },
}));

const openWalletConnect = jest.fn().mockResolvedValue(undefined);

const open = () => {
  act(() => {
    openDesktopConnectDialog(openWalletConnect);
  });
};

describe("DesktopConnectDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStatus = "idle";
    act(() => {
      closeDesktopConnectDialog();
    });
  });

  it("renders nothing until the connect flow opens it", () => {
    render(<DesktopConnectDialog />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("offers WalletConnect and a browser wallet, and no seed wallets", () => {
    render(<DesktopConnectDialog />);
    open();

    expect(
      screen.getByRole("button", { name: /Scan with a phone wallet/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Use a browser wallet/ })
    ).toBeInTheDocument();
    expect(screen.queryByText(/seed/i)).not.toBeInTheDocument();
  });

  it("tells a browser wallet from a phone wallet, browser wallet first", () => {
    render(<DesktopConnectDialog />);
    open();

    const [browser, phone] = screen
      .getAllByRole("button")
      .filter((button) => /wallet/i.test(button.textContent ?? ""));
    // A desktop MetaMask user must find the extension under the browser choice.
    expect(browser).toHaveAccessibleName(
      /Use a browser wallet.*MetaMask, Rabby.*Opens your web browser/
    );
    expect(phone).toHaveAccessibleName(
      /Scan with a phone wallet.*WalletConnect.*phone/
    );
    expect(
      screen.getByText(/cannot use browser extensions directly/)
    ).toBeVisible();
  });

  it("starts only one browser sign-in on a double click", async () => {
    const user = userEvent.setup();
    let finishStart: () => void = () => undefined;
    jest.mocked(startBrowserConnectorSignIn).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishStart = resolve;
      })
    );
    render(<DesktopConnectDialog />);
    open();
    const browser = screen.getByRole("button", {
      name: /Use a browser wallet/,
    });

    await user.dblClick(browser);

    expect(startBrowserConnectorSignIn).toHaveBeenCalledTimes(1);
    // Both choices wait until the start settles.
    expect(browser).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Scan with a phone wallet/ })
    ).toBeDisabled();
    await act(async () => {
      finishStart();
    });
    expect(browser).toBeEnabled();
  });

  it("hands WalletConnect back to the connect flow and closes", async () => {
    const user = userEvent.setup();
    render(<DesktopConnectDialog />);
    open();

    await user.click(
      screen.getByRole("button", { name: /Scan with a phone wallet/ })
    );

    expect(openWalletConnect).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Scan with a phone wallet/ })
      ).not.toBeInTheDocument()
    );
  });

  it("starts the browser connector, shows its progress and can cancel", async () => {
    const user = userEvent.setup();
    render(<DesktopConnectDialog />);
    open();

    await user.click(
      screen.getByRole("button", { name: /Use a browser wallet/ })
    );
    expect(startBrowserConnectorSignIn).toHaveBeenCalledTimes(1);

    setStatus("waiting");
    expect(screen.getByText(/Finish signing in in your browser/)).toBeVisible();
    expect(
      screen.getByRole("button", { name: /Use a browser wallet/ })
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(cancelBrowserConnectorSignIn).toHaveBeenCalled();
  });

  it("announces a failed or expired browser sign-in", () => {
    render(<DesktopConnectDialog />);
    open();

    setStatus("expired");
    expect(screen.getByRole("alert")).toHaveTextContent("timed out");
    setStatus("failed");
    expect(screen.getByRole("alert")).toHaveTextContent("did not work");
  });

  it("keeps a way out while signing in, without cancelling the sign-in", async () => {
    const user = userEvent.setup();
    render(<DesktopConnectDialog />);
    open();

    setStatus("signing-in");
    expect(screen.getByText("Signing in…")).toBeInTheDocument();
    // The dialog's own Close button stays available while signing in.
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(cancelBrowserConnectorSignIn).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Use a browser wallet/ })
      ).not.toBeInTheDocument()
    );
  });

  it("does not show an earlier finished sign-in when reopened", () => {
    mockStatus = "failed";
    render(<DesktopConnectDialog />);
    open();

    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
    expect(
      screen.getByRole("button", { name: /Use a browser wallet/ })
    ).toBeEnabled();
  });

  it("comes back with the reason when WalletConnect cannot open", async () => {
    const user = userEvent.setup();
    openWalletConnect.mockRejectedValueOnce(new Error("appkit"));
    render(<DesktopConnectDialog />);
    open();

    await user.click(
      screen.getByRole("button", { name: /Scan with a phone wallet/ })
    );

    expect(
      await screen.findByText("Could not open WalletConnect. Try again.")
    ).toBeInTheDocument();
  });

  it("says when the browser could not be opened", async () => {
    const user = userEvent.setup();
    jest
      .mocked(startBrowserConnectorSignIn)
      .mockRejectedValueOnce(new Error("no scheme"));
    render(<DesktopConnectDialog />);
    open();

    await user.click(
      screen.getByRole("button", { name: /Use a browser wallet/ })
    );

    expect(
      await screen.findByText(/Could not open your browser/)
    ).toBeInTheDocument();
  });

  it("closes when the browser sign-in finishes", async () => {
    render(<DesktopConnectDialog />);
    open();

    setStatus("signed-in");

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Use a browser wallet/ })
      ).not.toBeInTheDocument()
    );
  });
});
