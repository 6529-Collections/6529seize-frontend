import React from "react";
import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DropSize } from "@/helpers/waves/drop.helpers";
import {
  MyStreamProvider,
  useMyStream,
  useMyStreamWaveMessages,
} from "@/contexts/wave/MyStreamContext";

let mockActiveWaveId: string | null = null;
const mockSetActiveWave = jest.fn();

jest.mock("@/contexts/wave/hooks/useActiveWaveManager", () => ({
  useActiveWaveManager: () => ({
    activeWaveId: mockActiveWaveId,
    setActiveWave: mockSetActiveWave,
  }),
}));

const mockAddPinnedWave = jest.fn();
const mockRemovePinnedWave = jest.fn();
const mockMainFetchNextPage = jest.fn();
const mockDmFetchNextPage = jest.fn();
const mockMainWavesRefetch = jest.fn();
const mockDmMainWavesRefetch = jest.fn();
const mockRefetchAllWaves = jest.fn();
const mockRefetchAllDmWaves = jest.fn();
const mockResetMainWavesNewDropsCount = jest.fn();
const mockResetDmWavesNewDropsCount = jest.fn();
const mockRestoreWaveUnreadCount = jest.fn();

jest.mock("@/hooks/useWavesList", () => ({
  __esModule: true,
  default: () => ({
    waves: [],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: true,
    fetchNextPage: mockMainFetchNextPage,
    status: "success",
    pinnedWaves: [],
    isPinnedWavesLoading: false,
    hasPinnedWavesError: false,
    addPinnedWave: mockAddPinnedWave,
    removePinnedWave: mockRemovePinnedWave,
    mainWaves: [],
    missingPinnedIds: [],
    mainWavesRefetch: mockMainWavesRefetch,
    refetchAllWaves: mockRefetchAllWaves,
  }),
}));

jest.mock("@/hooks/useDmWavesList", () => ({
  __esModule: true,
  default: () => ({
    waves: [],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: true,
    fetchNextPage: mockDmFetchNextPage,
    status: "success",
    pinnedWaves: [],
    isPinnedWavesLoading: false,
    hasPinnedWavesError: false,
    addPinnedWave: jest.fn(),
    removePinnedWave: jest.fn(),
    mainWaves: [],
    missingPinnedIds: [],
    mainWavesRefetch: mockDmMainWavesRefetch,
    refetchAllWaves: mockRefetchAllDmWaves,
  }),
}));

jest.mock("@/contexts/wave/hooks/useEnhancedWavesListCore", () => ({
  __esModule: true,
  default: (_activeWaveId: string | null, wavesData: any, options: any) => ({
    waves: wavesData.waves,
    isFetching: wavesData.isFetching,
    isFetchingNextPage: wavesData.isFetchingNextPage,
    hasNextPage: wavesData.hasNextPage,
    fetchNextPage: wavesData.fetchNextPage,
    addPinnedWave: options.supportsPinning
      ? wavesData.addPinnedWave
      : jest.fn(),
    removePinnedWave: options.supportsPinning
      ? wavesData.removePinnedWave
      : jest.fn(),
    refetchAllWaves: wavesData.refetchAllWaves,
    resetAllWavesNewDropsCount: options.supportsPinning
      ? mockResetMainWavesNewDropsCount
      : mockResetDmWavesNewDropsCount,
    restoreWaveUnreadCount: mockRestoreWaveUnreadCount,
  }),
}));

const mockRegisterWave = jest.fn();
const mockFetchNextPage = jest.fn();
const mockFetchAroundSerialNo = jest.fn();

jest.mock("@/contexts/wave/hooks/useWaveDataManager", () => ({
  useWaveDataManager: () => ({
    registerWave: mockRegisterWave,
    fetchNextPage: mockFetchNextPage,
    fetchAroundSerialNo: mockFetchAroundSerialNo,
    syncNewestMessages: jest.fn(),
  }),
}));

const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockGetData = jest.fn();
const mockOptimisticUpdateDrop = jest.fn();

jest.mock("@/contexts/wave/hooks/useWaveMessagesStore", () => ({
  __esModule: true,
  default: () => ({
    updateData: jest.fn(),
    removeDrop: jest.fn(),
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    getData: mockGetData,
    optimisticUpdateDrop: mockOptimisticUpdateDrop,
  }),
}));

jest.mock("@/contexts/wave/hooks/useWaveRealtimeUpdater", () => ({
  useWaveRealtimeUpdater: () => ({
    processIncomingDrop: jest.fn(),
    processDropRemoved: jest.fn(),
  }),
}));

let mockWebsocketStatus = "disconnected";

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebsocketStatus: () => mockWebsocketStatus,
  useWebSocketMessage: jest.fn(),
}));

let mockCapacitorState = { isCapacitor: false, isActive: true };

jest.mock("@/hooks/useCapacitor", () => () => mockCapacitorState);

jest.mock("@/components/notifications/NotificationsContext", () => ({
  useNotificationsContext: () => ({
    removeWaveDeliveredNotifications: jest.fn().mockResolvedValue(undefined),
    removeAllDeliveredNotifications: jest.fn().mockResolvedValue(undefined),
  }),
}));

const renderWithProvider = (children: React.ReactNode = null) => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MyStreamProvider>{children}</MyStreamProvider>
    </QueryClientProvider>
  );
};

describe("MyStreamProvider integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveWaveId = null;
    mockWebsocketStatus = "disconnected";
    mockCapacitorState = { isCapacitor: false, isActive: true };
    mockGetData.mockReturnValue(undefined);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  it("delegates wave actions to underlying hooks", () => {
    function TestComponent() {
      const { registerWave: reg, fetchNextPageForWave, waves } = useMyStream();

      React.useEffect(() => {
        reg("wave");
        fetchNextPageForWave({ waveId: "wave", type: DropSize.FULL });
        waves.addPinnedWave("wave");
        waves.removePinnedWave("wave");
      }, [reg, fetchNextPageForWave, waves]);

      return null;
    }

    renderWithProvider(<TestComponent />);

    expect(mockRegisterWave).toHaveBeenCalledWith("wave");
    expect(mockFetchNextPage).toHaveBeenCalledWith({
      waveId: "wave",
      type: DropSize.FULL,
    });
    expect(mockAddPinnedWave).toHaveBeenCalledWith("wave");
    expect(mockRemovePinnedWave).toHaveBeenCalledWith("wave");
  });

  it("updates hook data via useMyStreamWaveMessages", () => {
    const listeners: Record<string, (data: any) => void> = {};

    mockSubscribe.mockImplementation((key, cb) => {
      listeners[key] = cb;
      cb({ id: key, drops: ["a"] });
    });
    mockGetData.mockImplementation(() => ({ id: "wave", drops: ["a"] }));

    function Messages({ waveId }: { readonly waveId: string }) {
      const data = useMyStreamWaveMessages(waveId);
      return <div>{data ? data.drops.join(",") : "none"}</div>;
    }

    const { rerender } = renderWithProvider(<Messages waveId="wave" />);

    expect(screen.getByText("a")).toBeInTheDocument();

    act(() => listeners.wave({ id: "wave", drops: ["b"] }));
    expect(screen.getByText("b")).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MyStreamProvider>
          <Messages waveId="other" />
        </MyStreamProvider>
      </QueryClientProvider>
    );

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("refreshes the active wave and waves list when the tab becomes visible", () => {
    mockActiveWaveId = "wave-1";

    renderWithProvider(<div>child</div>);

    mockRegisterWave.mockClear();
    mockMainWavesRefetch.mockClear();
    mockDmMainWavesRefetch.mockClear();
    mockRefetchAllWaves.mockClear();
    mockRefetchAllDmWaves.mockClear();
    mockResetMainWavesNewDropsCount.mockClear();
    mockResetDmWavesNewDropsCount.mockClear();

    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(mockRegisterWave).toHaveBeenCalledWith("wave-1", true);
    expect(mockRefetchAllWaves).toHaveBeenCalledTimes(1);
    expect(mockRefetchAllDmWaves).toHaveBeenCalledTimes(1);
    expect(mockMainWavesRefetch).not.toHaveBeenCalled();
    expect(mockDmMainWavesRefetch).not.toHaveBeenCalled();
    expect(mockResetMainWavesNewDropsCount).not.toHaveBeenCalled();
    expect(mockResetDmWavesNewDropsCount).not.toHaveBeenCalled();
  });

  it("refreshes the active wave and waves list when the websocket reconnects", () => {
    mockActiveWaveId = "wave-1";

    const queryClient = new QueryClient();
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MyStreamProvider>
          <div>child</div>
        </MyStreamProvider>
      </QueryClientProvider>
    );

    mockRegisterWave.mockClear();
    mockMainWavesRefetch.mockClear();
    mockDmMainWavesRefetch.mockClear();
    mockRefetchAllWaves.mockClear();
    mockRefetchAllDmWaves.mockClear();
    mockResetMainWavesNewDropsCount.mockClear();
    mockResetDmWavesNewDropsCount.mockClear();

    act(() => {
      mockWebsocketStatus = "connected";
      rerender(
        <QueryClientProvider client={queryClient}>
          <MyStreamProvider>
            <div>child</div>
          </MyStreamProvider>
        </QueryClientProvider>
      );
    });

    expect(mockRegisterWave).toHaveBeenCalledWith("wave-1", true);
    expect(mockRefetchAllWaves).toHaveBeenCalledTimes(1);
    expect(mockRefetchAllDmWaves).toHaveBeenCalledTimes(1);
    expect(mockMainWavesRefetch).not.toHaveBeenCalled();
    expect(mockDmMainWavesRefetch).not.toHaveBeenCalled();
    expect(mockResetMainWavesNewDropsCount).not.toHaveBeenCalled();
    expect(mockResetDmWavesNewDropsCount).not.toHaveBeenCalled();
  });

  it("dedupes visibilitychange and focus foreground refreshes", () => {
    mockActiveWaveId = "wave-1";

    renderWithProvider(<div>child</div>);

    mockRegisterWave.mockClear();
    mockMainWavesRefetch.mockClear();
    mockDmMainWavesRefetch.mockClear();
    mockRefetchAllWaves.mockClear();
    mockRefetchAllDmWaves.mockClear();
    mockResetMainWavesNewDropsCount.mockClear();
    mockResetDmWavesNewDropsCount.mockClear();

    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1000);

    act(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("focus"));
    });

    expect(mockRegisterWave).toHaveBeenCalledTimes(1);
    expect(mockRefetchAllWaves).toHaveBeenCalledTimes(1);
    expect(mockRefetchAllDmWaves).toHaveBeenCalledTimes(1);
    expect(mockMainWavesRefetch).not.toHaveBeenCalled();
    expect(mockDmMainWavesRefetch).not.toHaveBeenCalled();
    expect(mockResetMainWavesNewDropsCount).not.toHaveBeenCalled();
    expect(mockResetDmWavesNewDropsCount).not.toHaveBeenCalled();

    nowSpy.mockRestore();
  });

  it("dedupes websocket reconnect with web focus foreground refreshes", () => {
    mockActiveWaveId = "wave-1";

    const queryClient = new QueryClient();
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MyStreamProvider>
          <div>child</div>
        </MyStreamProvider>
      </QueryClientProvider>
    );

    mockRegisterWave.mockClear();
    mockMainWavesRefetch.mockClear();
    mockDmMainWavesRefetch.mockClear();
    mockRefetchAllWaves.mockClear();
    mockRefetchAllDmWaves.mockClear();
    mockResetMainWavesNewDropsCount.mockClear();
    mockResetDmWavesNewDropsCount.mockClear();

    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(3000);

    act(() => {
      window.dispatchEvent(new Event("focus"));
      mockWebsocketStatus = "connected";
      rerender(
        <QueryClientProvider client={queryClient}>
          <MyStreamProvider>
            <div>child</div>
          </MyStreamProvider>
        </QueryClientProvider>
      );
    });

    expect(mockRegisterWave).toHaveBeenCalledTimes(1);
    expect(mockRegisterWave).toHaveBeenCalledWith("wave-1", true);
    expect(mockRefetchAllWaves).toHaveBeenCalledTimes(1);
    expect(mockRefetchAllDmWaves).toHaveBeenCalledTimes(1);
    expect(mockMainWavesRefetch).not.toHaveBeenCalled();
    expect(mockDmMainWavesRefetch).not.toHaveBeenCalled();
    expect(mockResetMainWavesNewDropsCount).not.toHaveBeenCalled();
    expect(mockResetDmWavesNewDropsCount).not.toHaveBeenCalled();

    nowSpy.mockRestore();
  });

  it("refreshes the overview lists without re-registering when no active wave is selected", () => {
    renderWithProvider(<div>child</div>);

    mockRegisterWave.mockClear();
    mockMainWavesRefetch.mockClear();
    mockDmMainWavesRefetch.mockClear();
    mockRefetchAllWaves.mockClear();
    mockRefetchAllDmWaves.mockClear();
    mockResetMainWavesNewDropsCount.mockClear();
    mockResetDmWavesNewDropsCount.mockClear();

    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(2000);

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(mockRegisterWave).not.toHaveBeenCalled();
    expect(mockRefetchAllWaves).toHaveBeenCalledTimes(1);
    expect(mockRefetchAllDmWaves).toHaveBeenCalledTimes(1);
    expect(mockMainWavesRefetch).not.toHaveBeenCalled();
    expect(mockDmMainWavesRefetch).not.toHaveBeenCalled();
    expect(mockResetMainWavesNewDropsCount).not.toHaveBeenCalled();
    expect(mockResetDmWavesNewDropsCount).not.toHaveBeenCalled();

    nowSpy.mockRestore();
  });

  it("resets all new-drop counters when the native app returns to foreground", () => {
    mockActiveWaveId = "wave-1";
    mockCapacitorState = { isCapacitor: true, isActive: false };

    const { rerender } = renderWithProvider(<div>child</div>);

    mockRegisterWave.mockClear();
    mockMainWavesRefetch.mockClear();
    mockDmMainWavesRefetch.mockClear();
    mockRefetchAllWaves.mockClear();
    mockRefetchAllDmWaves.mockClear();
    mockResetMainWavesNewDropsCount.mockClear();
    mockResetDmWavesNewDropsCount.mockClear();

    mockCapacitorState = { isCapacitor: true, isActive: true };

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MyStreamProvider>
          <div>child</div>
        </MyStreamProvider>
      </QueryClientProvider>
    );

    expect(mockRegisterWave).toHaveBeenCalledWith("wave-1", true);
    expect(mockRefetchAllWaves).toHaveBeenCalledTimes(1);
    expect(mockRefetchAllDmWaves).toHaveBeenCalledTimes(1);
    expect(mockMainWavesRefetch).not.toHaveBeenCalled();
    expect(mockDmMainWavesRefetch).not.toHaveBeenCalled();
    expect(mockResetMainWavesNewDropsCount).toHaveBeenCalledTimes(1);
    expect(mockResetDmWavesNewDropsCount).toHaveBeenCalledTimes(1);
  });
});
