import { act, render } from "@testing-library/react";
import { MyStreamProvider, useMyStream } from "@/contexts/wave/MyStreamContext";

const mockSetActiveWave = jest.fn();
const mockRegisterWave = jest.fn();
const mockSyncNewestMessages = jest.fn();
const mockFetchNextPage = jest.fn();
const mockFetchAroundSerialNo = jest.fn();

jest.mock("@/components/notifications/NotificationsContext", () => ({
  useNotificationsContext: jest.fn(() => ({
    removeWaveDeliveredNotifications: jest.fn(),
  })),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isCapacitor: false, isActive: true })),
}));

jest.mock("@/hooks/useWavesList", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useDmWavesList", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebsocketStatus: jest.fn(() => "disconnected"),
}));

jest.mock("@/hooks/useWaveById", () => ({
  useWaveById: jest.fn(() => ({
    wave: null,
    isLoading: false,
    isFetching: false,
  })),
}));

jest.mock("@/contexts/wave/hooks/useActiveWaveManager", () => ({
  useActiveWaveManager: jest.fn(() => ({
    activeWaveId: "wave-1",
    setActiveWave: mockSetActiveWave,
  })),
}));

jest.mock("@/contexts/wave/hooks/useWaveDataManager", () => ({
  useWaveDataManager: jest.fn(() => ({
    registerWave: mockRegisterWave,
    syncNewestMessages: mockSyncNewestMessages,
    fetchNextPage: mockFetchNextPage,
    fetchAroundSerialNo: mockFetchAroundSerialNo,
  })),
}));

jest.mock("@/contexts/wave/hooks/useWaveMessagesStore", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    updateData: jest.fn(),
    getData: jest.fn(),
    removeDrop: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    optimisticUpdateDrop: jest.fn(),
  })),
}));

jest.mock("@/contexts/wave/hooks/useWaveRealtimeUpdater", () => ({
  useWaveRealtimeUpdater: jest.fn(() => ({
    processIncomingDrop: jest.fn(),
    processDropRemoved: jest.fn(),
  })),
}));

jest.mock("@/contexts/wave/hooks/useEnhancedWavesListCore", () => ({
  __esModule: true,
  default: jest.fn((_activeWaveId: string | null, wavesData: any) => ({
    waves: wavesData.waves,
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: wavesData.fetchNextPage,
    addPinnedWave: wavesData.addPinnedWave,
    removePinnedWave: wavesData.removePinnedWave,
    refetchAllWaves: wavesData.refetchAllWaves,
    resetAllWavesNewDropsCount: jest.fn(),
    restoreWaveUnreadCount: jest.fn(),
  })),
}));

const useWavesListMock = require("@/hooks/useWavesList").default as jest.Mock;
const useDmWavesListMock = require("@/hooks/useDmWavesList")
  .default as jest.Mock;

const setDocumentVisibilityState = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
};

const createListData = (refetchAllWaves: jest.Mock) => ({
  waves: [],
  isFetching: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  fetchNextPage: jest.fn(),
  mainWavesRefetch: jest.fn(),
  refetchAllWaves,
  addPinnedWave: jest.fn(),
  removePinnedWave: jest.fn(),
});

const CaptureMyStream = ({
  onContext,
}: {
  readonly onContext: (context: ReturnType<typeof useMyStream>) => void;
}) => {
  onContext(useMyStream());
  return null;
};

describe("MyStreamProvider resume sync", () => {
  const mainRefetch = jest.fn();
  const dmRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    setDocumentVisibilityState("visible");
    useWavesListMock.mockReturnValue(createListData(mainRefetch));
    useDmWavesListMock.mockReturnValue(createListData(dmRefetch));
  });

  it("registers selected waves before delegating active wave navigation", () => {
    let context: ReturnType<typeof useMyStream> | null = null;

    render(
      <MyStreamProvider>
        <CaptureMyStream
          onContext={(nextContext) => {
            context = nextContext;
          }}
        />
      </MyStreamProvider>
    );

    expect(context).not.toBeNull();
    const capturedContext = context;

    act(() => {
      capturedContext!.activeWave.set("wave-2", {
        isDirectMessage: true,
        divider: 9,
      });
    });

    expect(mockRegisterWave).toHaveBeenCalledWith("wave-2", true);
    expect(mockSetActiveWave).toHaveBeenCalledWith("wave-2", {
      isDirectMessage: true,
      divider: 9,
    });
  });

  it("refetches both Waves and DMs when the browser comes online", () => {
    render(
      <MyStreamProvider>
        <div />
      </MyStreamProvider>
    );

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(mainRefetch).toHaveBeenCalledTimes(1);
    expect(dmRefetch).toHaveBeenCalledTimes(1);
  });

  it("does not refetch on online while the document is hidden", () => {
    setDocumentVisibilityState("hidden");

    render(
      <MyStreamProvider>
        <div />
      </MyStreamProvider>
    );

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(mainRefetch).not.toHaveBeenCalled();
    expect(dmRefetch).not.toHaveBeenCalled();
  });
});
