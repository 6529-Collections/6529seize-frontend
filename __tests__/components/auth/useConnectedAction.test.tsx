import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useConnectedAction } from "@/components/auth/useConnectedAction";
import { act, renderHook } from "@testing-library/react";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

const useSeizeConnectContextMock = jest.mocked(useSeizeConnectContext);
const seizeConnect = jest.fn();

describe("useConnectedAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("runs the action immediately when the active wallet can sign", () => {
    useSeizeConnectContextMock.mockReturnValue({
      canSignActiveWallet: true,
      seizeConnect,
      seizeConnectOpen: false,
    } as ReturnType<typeof useSeizeConnectContext>);
    const action = jest.fn();
    const { result } = renderHook(() => useConnectedAction());

    act(() => result.current(action));

    expect(action).toHaveBeenCalledTimes(1);
    expect(seizeConnect).not.toHaveBeenCalled();
  });

  it("opens connect and runs the pending action once after connection", () => {
    let connectionState = {
      canSignActiveWallet: false,
      seizeConnect,
      seizeConnectOpen: false,
    } as ReturnType<typeof useSeizeConnectContext>;
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
    let connectionState = {
      canSignActiveWallet: false,
      seizeConnect,
      seizeConnectOpen: false,
    } as ReturnType<typeof useSeizeConnectContext>;
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

    expect(action).not.toHaveBeenCalled();
  });

  it("does not run when signing becomes available before connect opens", () => {
    let connectionState = {
      canSignActiveWallet: false,
      seizeConnect,
      seizeConnectOpen: false,
    } as ReturnType<typeof useSeizeConnectContext>;
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
    let connectionState = {
      canSignActiveWallet: false,
      seizeConnect,
      seizeConnectOpen: false,
    } as ReturnType<typeof useSeizeConnectContext>;
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
