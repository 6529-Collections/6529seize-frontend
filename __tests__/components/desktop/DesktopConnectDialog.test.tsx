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

  it("starts browser sign-in for the setup that opened the picker and cancels it on close", async () => {
    const user = userEvent.setup();
    const controller = new AbortController();
    const setup = {
      address: `0x${"a".repeat(40)}`,
      signal: controller.signal,
      onStatus: jest.fn(),
    };
    render(<DesktopConnectDialog />);
    act(() => {
      openDesktopConnectDialog(openWalletConnect, setup);
    });
    expect(setup.onStatus).toHaveBeenLastCalledWith("picker");

    await user.click(
      screen.getByRole("button", { name: /Use a browser wallet/ })
    );
    expect(startBrowserConnectorSignIn).toHaveBeenCalledWith(setup);
    setStatus("waiting");

    await user.click(screen.getByRole("button", { name: /Cancel/ }));
    expect(setup.onStatus).toHaveBeenLastCalledWith("cancelled");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("ignores a phone-wallet handoff that finishes after setup has ended", async () => {
    const user = userEvent.setup();
    const controller = new AbortController();
    const onStatus = jest.fn();
    let finishHandoff: () => void = () => undefined;
    const handoff = new Promise<void>((resolve) => {
      finishHandoff = resolve;
    });
    const openPhoneWallet = jest.fn(() => handoff);
    render(<DesktopConnectDialog />);
    act(() => {
      openDesktopConnectDialog(openPhoneWallet, {
        address: `0x${"a".repeat(40)}`,
        signal: controller.signal,
        onStatus,
      });
    });

    await user.click(
      screen.getByRole("button", { name: /Scan with a phone wallet/ })
    );
    expect(openPhoneWallet).toHaveBeenCalledTimes(1);
    controller.abort();
    await act(async () => finishHandoff());

    expect(onStatus.mock.calls).toEqual([["picker"]]);
  });

  it("leaves a newer picker open when an old phone-wallet handoff fails", async () => {
    const user = userEvent.setup();
    const handoff = Promise.withResolvers<void>();
    openWalletConnect.mockReturnValueOnce(handoff.promise);
    render(<DesktopConnectDialog />);
    open();
    await user.click(
      screen.getByRole("button", { name: /Scan with a phone wallet/ })
    );
    expect(openWalletConnect).toHaveBeenCalledTimes(1);

    const setup = {
      address: `0x${"a".repeat(40)}`,
      signal: new AbortController().signal,
      onStatus: jest.fn(),
    };
    act(() => {
      openDesktopConnectDialog(openWalletConnect, setup);
    });
    await act(async () => handoff.reject(new Error("cannot open")));

    expect(setup.onStatus.mock.calls).toEqual([["picker"]]);
    await user.click(
      screen.getByRole("button", { name: /Use a browser wallet/ })
    );
    expect(startBrowserConnectorSignIn).toHaveBeenCalledWith(setup);
  });

  it("cancels an unfinished phone-wallet handoff when a new picker opens", async () => {
    const user = userEvent.setup();
    const handoff = Promise.withResolvers<void>();
    const controller = new AbortController();
    const onStatus = jest.fn();
    openWalletConnect.mockReturnValueOnce(handoff.promise);
    render(<DesktopConnectDialog />);
    act(() => {
      openDesktopConnectDialog(openWalletConnect, {
        address: `0x${"a".repeat(40)}`,
        signal: controller.signal,
        onStatus,
      });
    });
    await user.click(
      screen.getByRole("button", { name: /Scan with a phone wallet/ })
    );
    const signal = openWalletConnect.mock.calls.at(-1)?.[0] as AbortSignal;

    open();
    expect(signal.aborted).toBe(true);
    expect(onStatus).toHaveBeenLastCalledWith("cancelled");
    await act(async () => handoff.resolve());
    expect(onStatus).not.toHaveBeenCalledWith("walletconnect");
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("retires a pending unscoped browser startup when another picker opens", async () => {
    const user = userEvent.setup();
    const startup = Promise.withResolvers<void>();
    jest
      .mocked(startBrowserConnectorSignIn)
      .mockReturnValueOnce(startup.promise);
    render(<DesktopConnectDialog />);
    open();
    await user.click(
      screen.getByRole("button", { name: /Use a browser wallet/ })
    );
    const cancellations = jest.mocked(cancelBrowserConnectorSignIn).mock.calls
      .length;

    open();
    expect(cancelBrowserConnectorSignIn).toHaveBeenCalledTimes(
      cancellations + 1
    );
    await user.click(
      screen.getByRole("button", { name: /Scan with a phone wallet/ })
    );
    await act(async () => startup.resolve());
    expect(openWalletConnect).toHaveBeenCalledTimes(1);
  });

  it("keeps a hidden scoped browser login abortable while signing in", async () => {
    const user = userEvent.setup();
    const controller = new AbortController();
    const onStatus = jest.fn();
    render(<DesktopConnectDialog />);
    act(() => {
      openDesktopConnectDialog(openWalletConnect, {
        address: `0x${"a".repeat(40)}`,
        signal: controller.signal,
        onStatus,
      });
    });
    setStatus("signing-in");
    const cancellations = jest.mocked(cancelBrowserConnectorSignIn).mock.calls
      .length;

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onStatus).not.toHaveBeenCalledWith("cancelled");
    expect(cancelBrowserConnectorSignIn).toHaveBeenCalledTimes(cancellations);

    act(() => controller.abort());
    expect(cancelBrowserConnectorSignIn).toHaveBeenCalledTimes(
      cancellations + 1
    );
  });

  it("lets a new picker start while a retired browser startup is still pending", async () => {
    const user = userEvent.setup();
    const startup = Promise.withResolvers<void>();
    jest
      .mocked(startBrowserConnectorSignIn)
      .mockReturnValueOnce(startup.promise);
    const controller = new AbortController();
    render(<DesktopConnectDialog />);
    act(() => {
      openDesktopConnectDialog(openWalletConnect, {
        address: `0x${"a".repeat(40)}`,
        signal: controller.signal,
        onStatus: jest.fn(),
      });
    });
    await user.click(
      screen.getByRole("button", { name: /Use a browser wallet/ })
    );
    act(() => controller.abort());
    open();

    await user.click(
      screen.getByRole("button", { name: /Use a browser wallet/ })
    );
    await act(async () => startup.resolve());
    expect(startBrowserConnectorSignIn).toHaveBeenCalledTimes(2);
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

  it("cancels a browser sign-in that is still starting when closed", async () => {
    const user = userEvent.setup();
    let finishStart: () => void = () => undefined;
    jest.mocked(startBrowserConnectorSignIn).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishStart = resolve;
      })
    );
    render(<DesktopConnectDialog />);
    open();
    await user.click(
      screen.getByRole("button", { name: /Use a browser wallet/ })
    );

    // The status is still idle while the shell reports its scheme.
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(cancelBrowserConnectorSignIn).toHaveBeenCalledTimes(1);
    await act(async () => {
      finishStart();
    });
  });

  it("is usable again right after closing during a start that has not settled", async () => {
    const user = userEvent.setup();
    let finishStart: () => void = () => undefined;
    jest.mocked(startBrowserConnectorSignIn).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishStart = resolve;
      })
    );
    render(<DesktopConnectDialog />);
    open();
    await user.click(
      screen.getByRole("button", { name: /Use a browser wallet/ })
    );
    await user.click(screen.getByRole("button", { name: "Close" }));

    open();
    const walletConnect = screen.getByRole("button", {
      name: /Scan with a phone wallet/,
    });
    expect(walletConnect).toBeEnabled();
    await user.click(walletConnect);
    expect(openWalletConnect).toHaveBeenCalledTimes(1);

    // The old start settling later changes nothing.
    await act(async () => {
      finishStart();
    });
    expect(screen.queryByText(/Could not open your browser/)).toBeNull();
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
