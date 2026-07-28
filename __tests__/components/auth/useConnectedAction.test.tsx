import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useConnectedAction } from "@/components/auth/useConnectedAction";
import { act, renderHook } from "@testing-library/react";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

const useSeizeConnectContextMock = jest.mocked(useSeizeConnectContext);
const seizeConnect = jest.fn();

function createConnectionState({
  canSignActiveWallet,
}: Readonly<{
  canSignActiveWallet: boolean;
}>): ReturnType<typeof useSeizeConnectContext> {
  return {
    canSignActiveWallet,
    seizeConnect,
    seizeConnectOpen: false,
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
