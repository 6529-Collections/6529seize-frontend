import { act, renderHook } from "@testing-library/react";
import { createDeferredPromise } from "@/__tests__/utils/deferredPromise";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useProfileProxySwitch } from "@/components/auth/useProfileProxySwitch";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/utils/error-sanitizer", () => ({ logErrorSecurely: jest.fn() }));

const proxy = { id: "proxy-1" } as ApiProfileProxy;
const seizeConnect = jest.fn();
let canSignActiveWallet = false;
let seizeConnectOpen = false;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  canSignActiveWallet = false;
  seizeConnectOpen = false;
  jest.mocked(useSeizeConnectContext).mockImplementation(() => ({
    address: "0x1111111111111111111111111111111111111111",
    walletName: undefined,
    walletIcon: undefined,
    isSafeWallet: false,
    canSignActiveWallet,
    seizeConnect,
    seizeConnectOpen,
    connectedAccounts: [],
    seizeConnectFresh: () => Promise.resolve(),
    seizeDisconnect: () => Promise.resolve(),
    seizeDisconnectAndLogout: () => Promise.resolve(),
    seizeDisconnectAndLogoutAll: () => Promise.resolve(),
    seizeAcceptConnection: jest.fn(),
    isConnected: canSignActiveWallet,
    isWalletConnectionPending: false,
    hasActiveWalletAddress: true,
    hasValidWalletAuth: true,
    isSigningOutAll: false,
    isAuthenticated: true,
    connectionState: canSignActiveWallet ? "connected" : "disconnected",
    walletState: { status: "disconnected" },
    hasInitializationError: false,
    initializationError: undefined,
    seizeSwitchConnectedAccount: jest.fn(),
    seizeAddConnectedAccount: jest.fn(),
    canAddConnectedAccount: true,
    connectedAccountUnreadNotifications: {},
  }));
});
afterEach(() => jest.useRealTimers());

function options() {
  return {
    activeProxyId: null,
    canSignActiveWallet,
    contextFingerprint: "wallet-1:primary",
    enableWalletAuthentication: true,
    onSwitch: jest.fn(async () => true),
    setToast: jest.fn(),
  };
}

it("resumes the requested proxy with the latest signer after reconnecting", async () => {
  const initial = options();
  const { result, rerender } = renderHook(useProfileProxySwitch, {
    initialProps: initial,
  });
  await act(async () => {
    expect(await result.current(proxy)).toBe(false);
  });
  expect(seizeConnect).toHaveBeenCalledTimes(1);
  expect(initial.onSwitch).not.toHaveBeenCalled();
  seizeConnectOpen = true;
  rerender(initial);
  canSignActiveWallet = true;
  seizeConnectOpen = false;
  const latest = options();
  rerender(latest);
  await act(async () => {});
  expect(latest.onSwitch).toHaveBeenCalledWith(proxy);
  expect(initial.onSwitch).not.toHaveBeenCalled();
});

it("does not replay a canceled reconnect during a later connection", async () => {
  const initial = options();
  const { result, rerender } = renderHook(useProfileProxySwitch, {
    initialProps: initial,
  });
  await act(async () => {
    await result.current(proxy);
  });
  seizeConnectOpen = true;
  rerender(initial);
  seizeConnectOpen = false;
  rerender(initial);
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  canSignActiveWallet = true;
  rerender({ ...initial, canSignActiveWallet });
  expect(initial.onSwitch).not.toHaveBeenCalled();
});

it("registers only one reconnect continuation for repeated clicks", async () => {
  const initial = options();
  const { result, rerender } = renderHook(useProfileProxySwitch, {
    initialProps: initial,
  });
  await act(async () => {
    await result.current(proxy);
    await result.current(proxy);
  });
  expect(seizeConnect).toHaveBeenCalledTimes(1);
  seizeConnectOpen = true;
  rerender(initial);
  canSignActiveWallet = true;
  rerender({ ...initial, canSignActiveWallet });
  expect(initial.onSwitch).toHaveBeenCalledTimes(1);
  expect(initial.onSwitch).toHaveBeenCalledWith(proxy);
});

it("cancels recovery if the selected account changes", async () => {
  const initial = options();
  const { result, rerender } = renderHook(useProfileProxySwitch, {
    initialProps: initial,
  });
  await act(async () => {
    await result.current(proxy);
  });
  seizeConnectOpen = true;
  rerender(initial);
  canSignActiveWallet = true;
  rerender({
    ...initial,
    canSignActiveWallet,
    contextFingerprint: "wallet-2:primary",
  });
  expect(initial.onSwitch).not.toHaveBeenCalled();
  expect(initial.setToast).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: "error" })
  );
});

it("prevents duplicate signing while a switch is in progress", async () => {
  canSignActiveWallet = true;
  const pending = createDeferredPromise<boolean>();
  const initial = { ...options(), onSwitch: jest.fn(() => pending.promise) };
  const { result } = renderHook(useProfileProxySwitch, {
    initialProps: initial,
  });
  const first = result.current(proxy);
  await expect(result.current(proxy)).resolves.toBe(false);
  expect(initial.onSwitch).toHaveBeenCalledTimes(1);
  pending.resolve(true);
  await expect(first).resolves.toBe(true);
});
