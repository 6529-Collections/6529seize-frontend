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
      screen.getByRole("button", { name: /Scan with a mobile wallet/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Use a browser wallet/ })
    ).toBeInTheDocument();
    expect(screen.queryByText(/seed/i)).not.toBeInTheDocument();
  });

  it("hands WalletConnect back to the connect flow and closes", async () => {
    const user = userEvent.setup();
    render(<DesktopConnectDialog />);
    open();

    await user.click(
      screen.getByRole("button", { name: /Scan with a mobile wallet/ })
    );

    expect(openWalletConnect).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Scan with a mobile wallet/ })
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

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not open your browser"
    );
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
