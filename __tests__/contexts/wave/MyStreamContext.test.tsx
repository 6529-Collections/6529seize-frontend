import React from "react";
import { render, screen, act } from "@testing-library/react";
import { DropSize } from "@/helpers/waves/drop.helpers";
import {
  MyStreamProvider,
  useMyStream,
  useMyStreamWaveMessages,
} from "@/contexts/wave/MyStreamContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("@/contexts/wave/hooks/useActiveWaveManager", () => ({
  useActiveWaveManager: () => ({
    activeWaveId: null,
    setActiveWave: jest.fn(),
  }),
}));

const addPinnedWave = jest.fn();
const removePinnedWave = jest.fn();

jest.mock("@/contexts/wave/hooks/useEnhancedWavesList", () => ({
  __esModule: true,
  default: () => ({
    waves: [],
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: true,
    fetchNextPage: jest.fn(),
    addPinnedWave,
    removePinnedWave,
    refetchAllWaves: jest.fn(),
    resetAllWavesNewDropsCount: jest.fn(),
  }),
}));

const registerWave = jest.fn();
const fetchNextPage = jest.fn();
const fetchAroundSerialNo = jest.fn();

jest.mock("@/contexts/wave/hooks/useWaveDataManager", () => ({
  useWaveDataManager: () => ({
    registerWave,
    fetchNextPage,
    fetchAroundSerialNo,
    syncNewestMessages: jest.fn(),
  }),
}));

const subscribe = jest.fn();
const unsubscribe = jest.fn();
const getData = jest.fn();

jest.mock("@/contexts/wave/hooks/useWaveMessagesStore", () => ({
  __esModule: true,
  default: () => ({
    updateData: jest.fn(),
    removeDrop: jest.fn(),
    subscribe,
    unsubscribe,
    getData,
  }),
}));

jest.mock("@/contexts/wave/hooks/useWaveRealtimeUpdater", () => ({
  useWaveRealtimeUpdater: () => ({
    processIncomingDrop: jest.fn(),
    processDropRemoved: jest.fn(),
  }),
}));

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebsocketStatus: () => "connected",
  useWebSocketMessage: jest.fn(),
}));

jest.mock("@/hooks/useCapacitor", () => () => ({ isCapacitor: false }));

jest.mock("@/components/notifications/NotificationsContext", () => ({
  useNotificationsContext: () => ({
    removeWaveDeliveredNotifications: jest.fn().mockResolvedValue(undefined),
    removeAllDeliveredNotifications: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe("MyStreamProvider integration", () => {
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

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MyStreamProvider>
          <TestComponent />
        </MyStreamProvider>
      </QueryClientProvider>
    );

    expect(registerWave).toHaveBeenCalledWith("wave");
    expect(fetchNextPage).toHaveBeenCalledWith({
      waveId: "wave",
      type: DropSize.FULL,
    });
    expect(addPinnedWave).toHaveBeenCalledWith("wave");
    expect(removePinnedWave).toHaveBeenCalledWith("wave");
  });

  it("updates hook data via useMyStreamWaveMessages", () => {
    const listeners: Record<string, (data: any) => void> = {};
    subscribe.mockImplementation((key, cb) => {
      listeners[key] = cb;
      cb({ id: key, drops: ["a"] });
    });
    getData.mockImplementation(() => ({ id: "wave", drops: ["a"] }));

    function Messages({ waveId }: { readonly waveId: string }) {
      const data = useMyStreamWaveMessages(waveId);
      return <div>{data ? data.drops.join(",") : "none"}</div>;
    }

    const queryClient = new QueryClient();
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MyStreamProvider>
          <Messages waveId="wave" />
        </MyStreamProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText("a")).toBeInTheDocument();

    act(() => listeners["wave"]({ id: "wave", drops: ["b"] }));
    expect(screen.getByText("b")).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={queryClient}>
        <MyStreamProvider>
          <Messages waveId="other" />
        </MyStreamProvider>
      </QueryClientProvider>
    );

    expect(unsubscribe).toHaveBeenCalled();
  });
});
