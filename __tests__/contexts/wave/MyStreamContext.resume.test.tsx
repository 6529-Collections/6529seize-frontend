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

jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  markMobileLaunchStep: jest.fn(),
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

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/waves"),
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
    loadSubwavesForParent: wavesData.loadSubwavesForParent,
    prefetchSubwavesForParent: wavesData.prefetchSubwavesForParent,
    loadingSubwaveParentIds: [],
    refetchAllWaves: wavesData.refetchAllWaves,
    resetAllWavesNewDropsCount: jest.fn(),
    markWaveRead: jest.fn(),
    restoreWaveUnreadCount: jest.fn(),
  })),
}));

const useWavesListMock = require("@/hooks/useWavesList").default as jest.Mock;
const useDmWavesListMock = require("@/hooks/useDmWavesList")
  .default as jest.Mock;
const useCapacitorMock = require("@/hooks/useCapacitor").default as jest.Mock;
const usePathnameMock = require("next/navigation").usePathname as jest.Mock;
const useActiveWaveManagerMock =
  require("@/contexts/wave/hooks/useActiveWaveManager")
    .useActiveWaveManager as jest.Mock;
const useEnhancedWavesListCoreMock =
  require("@/contexts/wave/hooks/useEnhancedWavesListCore")
    .default as jest.Mock;
const markMobileLaunchStepMock =
  require("@/utils/monitoring/mobileLaunchTiming")
    .markMobileLaunchStep as jest.Mock;

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
  loadSubwavesForParent: jest.fn(),
  prefetchSubwavesForParent: jest.fn(),
  loadingSubwaveParentIds: [],
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
    useCapacitorMock.mockReturnValue({ isCapacitor: false, isActive: true });
    usePathnameMock.mockReturnValue("/waves");
    useActiveWaveManagerMock.mockReturnValue({
      activeWaveId: "wave-1",
      setActiveWave: mockSetActiveWave,
    });
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

  it("does not refetch DMs when the browser comes online and no DM list is active", () => {
    render(
      <MyStreamProvider>
        <div />
      </MyStreamProvider>
    );

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(mainRefetch).toHaveBeenCalledTimes(1);
    expect(dmRefetch).not.toHaveBeenCalled();
    expect(useDmWavesListMock).toHaveBeenLastCalledWith({ enabled: false });
    expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: true });
  });

  it("defers the main Waves list on native wave detail until it is requested", () => {
    useCapacitorMock.mockReturnValue({ isCapacitor: true, isActive: true });
    usePathnameMock.mockReturnValue("/waves/wave-1");
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

    expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: false });
    expect(useEnhancedWavesListCoreMock.mock.calls[0][2]).toEqual(
      expect.objectContaining({
        enabled: false,
        supportsPinning: true,
      })
    );
    expect(markMobileLaunchStepMock).toHaveBeenCalledWith(
      "main_waves_list_deferred"
    );

    expect(context).not.toBeNull();
    act(() => {
      context!.requestMainWavesList();
    });

    expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: true });
    expect(markMobileLaunchStepMock).toHaveBeenCalledWith(
      "main_waves_list_enabled"
    );
  });

  it("treats a null pathname as a non-messages route", () => {
    usePathnameMock.mockReturnValue(null);

    render(
      <MyStreamProvider>
        <div />
      </MyStreamProvider>
    );

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(mainRefetch).toHaveBeenCalledTimes(1);
    expect(dmRefetch).not.toHaveBeenCalled();
    expect(useDmWavesListMock).toHaveBeenLastCalledWith({ enabled: false });
  });

  it("refetches DMs on browser resume for messages routes", () => {
    usePathnameMock.mockReturnValue("/messages/wave-1");

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
    expect(useDmWavesListMock).toHaveBeenLastCalledWith({ enabled: true });
  });

  it("refetches DMs while a DM surface activation is mounted", () => {
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

    expect(useDmWavesListMock).toHaveBeenLastCalledWith({ enabled: false });
    expect(context).not.toBeNull();

    let releaseDirectMessagesList: (() => void) | null = null;
    act(() => {
      releaseDirectMessagesList = context!.requestDirectMessagesList();
    });

    expect(useDmWavesListMock).toHaveBeenLastCalledWith({ enabled: true });

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(mainRefetch).toHaveBeenCalledTimes(1);
    expect(dmRefetch).toHaveBeenCalledTimes(1);

    act(() => {
      releaseDirectMessagesList?.();
    });

    expect(useDmWavesListMock).toHaveBeenLastCalledWith({ enabled: false });
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
