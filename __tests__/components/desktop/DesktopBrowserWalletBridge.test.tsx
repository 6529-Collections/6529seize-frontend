import { act, render } from "@testing-library/react";
import DesktopBrowserWalletBridge from "@/components/desktop/DesktopBrowserWalletBridge";

const ACTIVE = "0x1111111111111111111111111111111111111111";
const OTHER = "0x2222222222222222222222222222222222222222";
const forwarding = { id: "desktopBrowserWallet" };

let activeAddress: string | undefined = ACTIVE;
let account: {
  status: string;
  address?: string;
  connector?: { id: string };
} = { status: "disconnected" };
let connectors: { id: string }[] = [forwarding];
let flagged = new Set([ACTIVE]);
const profileListeners = new Set<() => void>();
let requestKind = "idle";
const connectAsync = jest.fn(async () => undefined);
const disconnectAsync = jest.fn(async () => undefined);
const cancel = jest.fn();
const forget = jest.fn(async (_address: string) => undefined);

jest.mock("wagmi", () => ({
  useAccount: () => account,
  useConnectors: () => connectors,
  useConnect: () => ({ connectAsync }),
  useDisconnect: () => ({ disconnectAsync }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: activeAddress }),
}));
jest.mock("@/services/desktop/desktopBrowserWallet", () => ({
  isBrowserWalletProfile: (address: string | null) =>
    address !== null && flagged.has(address),
  subscribeBrowserWalletProfiles: (listener: () => void) => {
    profileListeners.add(listener);
    return () => profileListeners.delete(listener);
  },
  getDesktopWalletRequestStatus: () => ({ kind: requestKind }),
  cancelDesktopWalletRequest: () => cancel(),
  forgetBrowserWalletProfile: (address: string) => forget(address),
}));

describe("DesktopBrowserWalletBridge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeAddress = ACTIVE;
    account = { status: "disconnected" };
    connectors = [forwarding];
    flagged = new Set([ACTIVE]);
    requestKind = "idle";
  });

  it("does nothing when the connector is not installed (web, older builds)", () => {
    connectors = [];
    render(<DesktopBrowserWalletBridge />);
    expect(connectAsync).not.toHaveBeenCalled();
    expect(disconnectAsync).not.toHaveBeenCalled();
  });

  it("connects for a browser-wallet profile with no wallet connected", () => {
    render(<DesktopBrowserWalletBridge />);
    expect(connectAsync).toHaveBeenCalledWith({ connector: forwarding });
  });

  it("never connects for a profile that did not sign in with a browser wallet", () => {
    flagged = new Set();
    render(<DesktopBrowserWalletBridge />);
    expect(connectAsync).not.toHaveBeenCalled();
  });

  it("attaches when the same signed-in profile becomes eligible", () => {
    flagged = new Set();
    render(<DesktopBrowserWalletBridge />);
    expect(connectAsync).not.toHaveBeenCalled();

    act(() => {
      flagged.add(ACTIVE);
      profileListeners.forEach((listener) => listener());
    });

    expect(connectAsync).toHaveBeenCalledTimes(1);
    expect(connectAsync).toHaveBeenCalledWith({ connector: forwarding });
  });

  it("leaves a WalletConnect connection alone and stops offering forwarding", () => {
    account = {
      status: "connected",
      address: ACTIVE,
      connector: { id: "walletConnect" },
    };
    render(<DesktopBrowserWalletBridge />);
    expect(connectAsync).not.toHaveBeenCalled();
    expect(disconnectAsync).not.toHaveBeenCalled();
    expect(forget).toHaveBeenCalledWith(ACTIVE);
  });

  it("disconnects when the active profile changes, and cancels its request", () => {
    account = { status: "connected", address: ACTIVE, connector: forwarding };
    const { rerender } = render(<DesktopBrowserWalletBridge />);
    expect(disconnectAsync).not.toHaveBeenCalled();

    requestKind = "waiting";
    activeAddress = OTHER;
    rerender(<DesktopBrowserWalletBridge />);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(disconnectAsync).toHaveBeenCalledWith({ connector: forwarding });
  });

  it("cancels an open request on sign-out", () => {
    const { rerender } = render(<DesktopBrowserWalletBridge />);
    requestKind = "waiting";
    activeAddress = undefined;
    rerender(<DesktopBrowserWalletBridge />);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("does not cancel when the profile stays the same", () => {
    requestKind = "waiting";
    const { rerender } = render(<DesktopBrowserWalletBridge />);
    rerender(<DesktopBrowserWalletBridge />);
    expect(cancel).not.toHaveBeenCalled();
  });
});
