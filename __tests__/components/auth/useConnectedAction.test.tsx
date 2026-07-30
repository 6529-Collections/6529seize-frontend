import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useConnectedAction } from "@/components/auth/useConnectedAction";
import { act, renderHook } from "@testing-library/react";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

const useSeizeConnectContextMock = jest.mocked(useSeizeConnectContext);
const seizeConnect = jest.fn();
const seizeSwitchConnectedAccount = jest.fn();

function createConnectionState({
  canSignActiveWallet,
  connectedAccounts = [],
}: Readonly<{
  canSignActiveWallet: boolean;
  connectedAccounts?: ReturnType<
    typeof useSeizeConnectContext
  >["connectedAccounts"];
}>): ReturnType<typeof useSeizeConnectContext> {
  return {
    canSignActiveWallet,
    connectedAccounts,
    seizeConnect,
    seizeConnectOpen: false,
    seizeSwitchConnectedAccount,
  } as unknown as ReturnType<typeof useSeizeConnectContext>;
}

describe("useConnectedAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("runs the action immediately when the active wallet can sign", () => {
    useSeizeConnectContextMock.mockReturnValue(
      createConnectionState({
        canSignActiveWallet: true,
      })
    );
    const action = jest.fn();
    const { result } = renderHook(() => useConnectedAction());

    act(() => result.current(action));

    expect(action).toHaveBeenCalledTimes(1);
    expect(seizeConnect).not.toHaveBeenCalled();
  });

  it("opens connect and runs the pending action once after connection", () => {
    let connectionState = createConnectionState({
      canSignActiveWallet: false,
    });
    useSeizeConnectContextMock.mockImplementation(() => connectionState);
    const action = jest.fn();
    const { result, rerender } = renderHook(() => useConnectedAction());

    act(() => result.current(action));

    expect(seizeConnect).toHaveBeenCalledTimes(1);
    expect(action).not.toHaveBeenCalled();

    connectionState = {
      ...connectionState,
      seizeConnectOpen: true,
    };
    rerender();
    connectionState = {
      ...connectionState,
      canSignActiveWallet: true,
      seizeConnectOpen: false,
    };
    rerender();
    rerender();

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("discards the pending action when connect closes without connecting", () => {
    jest.useFakeTimers();
    let connectionState = createConnectionState({
      canSignActiveWallet: false,
    });
    useSeizeConnectContextMock.mockImplementation(() => connectionState);
    const action = jest.fn();
    const { result, rerender } = renderHook(() => useConnectedAction());

    act(() => result.current(action));
    connectionState = {
      ...connectionState,
      seizeConnectOpen: true,
    };
    rerender();
    connectionState = {
      ...connectionState,
      seizeConnectOpen: false,
    };
    rerender();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    connectionState = {
      ...connectionState,
      canSignActiveWallet: true,
    };
    rerender();

    expect(action).not.toHaveBeenCalled();
  });

  it("runs the pending action when signer readiness follows modal close", () => {
    jest.useFakeTimers();
    let connectionState = createConnectionState({
      canSignActiveWallet: false,
    });
    useSeizeConnectContextMock.mockImplementation(() => connectionState);
    const action = jest.fn();
    const { result, rerender } = renderHook(() => useConnectedAction());

    act(() => result.current(action));
    connectionState = {
      ...connectionState,
      seizeConnectOpen: true,
    };
    rerender();
    connectionState = {
      ...connectionState,
      seizeConnectOpen: false,
    };
    rerender();
    connectionState = {
      ...connectionState,
      canSignActiveWallet: true,
    };
    rerender();
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it("aborts the pending action when its context changes", () => {
    let connectionState = createConnectionState({
      canSignActiveWallet: false,
    });
    let contextFingerprint = "before";
    useSeizeConnectContextMock.mockImplementation(() => connectionState);
    const action = jest.fn();
    const onContextChanged = jest.fn();
    const { result, rerender } = renderHook(() =>
      useConnectedAction({
        contextFingerprint,
        onContextChanged,
      })
    );

    act(() => result.current(action));
    connectionState = {
      ...connectionState,
      seizeConnectOpen: true,
    };
    rerender();
    contextFingerprint = "after";
    rerender();
    connectionState = {
      ...connectionState,
      canSignActiveWallet: true,
      seizeConnectOpen: false,
    };
    rerender();

    expect(action).not.toHaveBeenCalled();
    expect(onContextChanged).toHaveBeenCalledTimes(1);
  });

  it("switches to a newly connected authenticated account before retrying", () => {
    const firstAddress = "0x0000000000000000000000000000000000000001";
    const secondAddress = "0x0000000000000000000000000000000000000002";
    let connectionState = createConnectionState({
      canSignActiveWallet: false,
      connectedAccounts: [
        {
          address: firstAddress,
          role: null,
          profileId: "profile-1",
          profileHandle: "first",
          isActive: true,
          isConnected: false,
        },
        {
          address: secondAddress,
          role: null,
          profileId: "profile-2",
          profileHandle: "second",
          isActive: false,
          isConnected: false,
        },
      ],
    });
    let contextFingerprint = "first-profile";
    useSeizeConnectContextMock.mockImplementation(() => connectionState);
    const action = jest.fn();
    const onContextChanged = jest.fn();
    const { result, rerender } = renderHook(() =>
      useConnectedAction({
        contextFingerprint,
        onContextChanged,
        switchToConnectedAccount: true,
      })
    );

    act(() => result.current(action));
    connectionState = {
      ...connectionState,
      seizeConnectOpen: true,
      connectedAccounts: connectionState.connectedAccounts.map((account) => ({
        ...account,
        isConnected: account.address === secondAddress,
      })),
    };
    rerender();

    expect(seizeSwitchConnectedAccount).toHaveBeenCalledTimes(1);
    expect(seizeSwitchConnectedAccount).toHaveBeenCalledWith(secondAddress);
    expect(action).not.toHaveBeenCalled();

    contextFingerprint = "second-profile";
    connectionState = {
      ...connectionState,
      canSignActiveWallet: true,
      seizeConnectOpen: false,
      connectedAccounts: connectionState.connectedAccounts.map((account) => ({
        ...account,
        isActive: account.address === secondAddress,
      })),
    };
    rerender();

    expect(action).not.toHaveBeenCalled();
    expect(onContextChanged).toHaveBeenCalledTimes(1);
  });

  it("does not run when signing becomes available before connect opens", () => {
    let connectionState = createConnectionState({
      canSignActiveWallet: false,
    });
    useSeizeConnectContextMock.mockImplementation(() => connectionState);
    const action = jest.fn();
    const { result, rerender } = renderHook(() => useConnectedAction());

    act(() => result.current(action));
    connectionState = {
      ...connectionState,
      canSignActiveWallet: true,
    };
    rerender();

    expect(action).not.toHaveBeenCalled();
  });

  it("keeps the first pending action and opens connect once", () => {
    let connectionState = createConnectionState({
      canSignActiveWallet: false,
    });
    useSeizeConnectContextMock.mockImplementation(() => connectionState);
    const firstAction = jest.fn();
    const secondAction = jest.fn();
    const { result, rerender } = renderHook(() => useConnectedAction());

    act(() => {
      result.current(firstAction);
      result.current(secondAction);
    });
    connectionState = {
      ...connectionState,
      seizeConnectOpen: true,
    };
    rerender();
    connectionState = {
      ...connectionState,
      canSignActiveWallet: true,
      seizeConnectOpen: false,
    };
    rerender();

    expect(seizeConnect).toHaveBeenCalledTimes(1);
    expect(firstAction).toHaveBeenCalledTimes(1);
    expect(secondAction).not.toHaveBeenCalled();
  });
});
