import { act, render } from "@testing-library/react";
import WebBrainLeftSidebarWaves from "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWaves";
import { MyStreamProvider, useMyStream } from "@/contexts/wave/MyStreamContext";
import { useWaveDataManager } from "@/contexts/wave/hooks/useWaveDataManager";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";

const mockSetActiveWave = jest.fn();
const mockRegisterWave = jest.fn();
const mockPrefetchWave = jest.fn();
const mockRecentDmPrefetch = jest.fn();
jest.mock("@/contexts/wave/hooks/useRecentDirectMessagePrefetch", () => ({
  useRecentDirectMessagePrefetch: (...args: unknown[]) =>
    mockRecentDmPrefetch(...args),
}));
const mockSyncNewestMessages = jest.fn();
const mockFetchNextPage = jest.fn();
const mockFetchAroundSerialNo = jest.fn();
const mockCancelWaveDataFetch = jest.fn();
const mockCancelPaginationFetch = jest.fn();
const mockResetAllWavesNewDropsCount = jest.fn();

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

jest.mock("@/services/dm-unread/DmUnreadStateProvider", () => ({
  useDmUnreadConversations: jest.fn(() => ({})),
}));

jest.mock("@/components/brain/left-sidebar/web/WebUnifiedWavesList", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/hooks/useMarkWaveNotificationsRead", () => ({
  useMarkWaveNotificationsRead: jest.fn(() => jest.fn()),
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
    prefetchWave: mockPrefetchWave,
    syncNewestMessages: mockSyncNewestMessages,
    fetchNextPage: mockFetchNextPage,
    fetchAroundSerialNo: mockFetchAroundSerialNo,
    cancelWaveDataFetch: mockCancelWaveDataFetch,
    cancelPaginationFetch: mockCancelPaginationFetch,
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
    trackActiveWave: jest.fn(),
    isWaveInUse: jest.fn(() => false),
    subscribeToEvictions: jest.fn(() => () => {}),
    optimisticUpdateDrop: jest.fn(),
    hasServerFeedSeed: jest.fn(() => false),
    registerPendingServerFeedSeed: jest.fn(),
    clearPendingServerFeedSeed: jest.fn(),
    replacePendingServerFeedSeed: jest.fn(),
    expireServerFeedSeed: jest.fn(),
    applyServerFeedSeed: jest.fn(),
    completeInitialServerFeedRegistration: jest.fn(),
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
    resetAllWavesNewDropsCount: mockResetAllWavesNewDropsCount,
    markWaveRead: jest.fn(),
    restoreWaveUnreadCount: jest.fn(),
  })),
}));

const useWavesListMock = require("@/hooks/useWavesList").default as jest.Mock;
const useDmWavesListMock = require("@/hooks/useDmWavesList")
  .default as jest.Mock;
const useCapacitorMock = require("@/hooks/useCapacitor").default as jest.Mock;
const usePathnameMock = require("next/navigation").usePathname as jest.Mock;
const useWaveByIdMock = require("@/hooks/useWaveById").useWaveById as jest.Mock;
const useActiveWaveManagerMock =
  require("@/contexts/wave/hooks/useActiveWaveManager")
    .useActiveWaveManager as jest.Mock;
const useEnhancedWavesListCoreMock =
  require("@/contexts/wave/hooks/useEnhancedWavesListCore")
    .default as jest.Mock;
const markMobileLaunchStepMock =
  require("@/utils/monitoring/mobileLaunchTiming")
    .markMobileLaunchStep as jest.Mock;
const useWebsocketStatusMock =
  require("@/services/websocket/useWebSocketMessage")
    .useWebsocketStatus as jest.Mock;
const useWaveMessagesStoreMock =
  require("@/contexts/wave/hooks/useWaveMessagesStore").default as jest.Mock;
const defaultWaveMessagesStoreImplementation =
  useWaveMessagesStoreMock.getMockImplementation();

const setDocumentVisibilityState = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
};

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { readonly timeout: number }
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const createListData = (
  refetchAllWaves: jest.Mock,
  refreshStaleWaves: jest.Mock
) => ({
  waves: [],
  isFetching: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  fetchNextPage: jest.fn(),
  mainWavesRefetch: jest.fn(),
  refetchAllWaves,
  refreshStaleWaves,
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

const renderWithContext = () => {
  let context: ReturnType<typeof useMyStream> | null = null;
  // A fresh element per render so the provider re-reads its mocked hooks.
  const createTree = () => (
    <MyStreamProvider>
      <CaptureMyStream
        onContext={(nextContext) => {
          context = nextContext;
        }}
      />
    </MyStreamProvider>
  );
  const view = render(createTree());

  return {
    ...view,
    getContext: () => {
      if (!context) {
        throw new Error("Expected MyStream context");
      }
      return context;
    },
    rerenderTree: () => view.rerender(createTree()),
  };
};

describe("MyStreamProvider resume sync", () => {
  const mainRefetch = jest.fn();
  const dmRefetch = jest.fn();
  const mainRefreshStale = jest.fn();
  const dmRefreshStale = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useWaveMessagesStoreMock.mockImplementation(
      defaultWaveMessagesStoreImplementation!
    );
    setDocumentVisibilityState("visible");
    useCapacitorMock.mockReturnValue({ isCapacitor: false, isActive: true });
    useWebsocketStatusMock.mockReturnValue("disconnected");
    usePathnameMock.mockReturnValue("/waves");
    useWaveByIdMock.mockReturnValue({
      wave: null,
      isLoading: false,
      isFetching: false,
    });
    useActiveWaveManagerMock.mockReturnValue({
      activeWaveId: "wave-1",
      setActiveWave: mockSetActiveWave,
    });
    useWavesListMock.mockReturnValue(
      createListData(mainRefetch, mainRefreshStale)
    );
    useDmWavesListMock.mockReturnValue({
      ...createListData(dmRefetch, dmRefreshStale),
      viewerIdentityKey: "wallet:primary",
    });
  });

  it("keeps the active wave cached and releases the data of evicted waves", async () => {
    useWaveMessagesStoreMock.mockImplementation(
      jest.requireActual("@/contexts/wave/hooks/useWaveMessagesStore").default
    );
    const { getContext } = renderWithContext();
    const updateData = jest
      .mocked(useWaveDataManager)
      .mock.calls.at(-1)?.[0].updateData;
    const waveIds = [
      "wave-1",
      "wave-2",
      "wave-3",
      "wave-4",
      "wave-5",
      "wave-6",
      "wave-7",
    ];
    mockCancelWaveDataFetch.mockClear();
    mockCancelPaginationFetch.mockClear();

    for (const waveId of waveIds) {
      act(() => updateData?.({ key: waveId, isLoading: true, drops: [] }));
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    }

    const { getData } = getContext().waveMessagesStore;
    // wave-1 is the active wave, so the two least recent others go instead.
    expect(waveIds.filter((waveId) => getData(waveId) !== undefined)).toEqual([
      "wave-1",
      "wave-4",
      "wave-5",
      "wave-6",
      "wave-7",
    ]);
    expect(mockCancelWaveDataFetch.mock.calls).toEqual([
      ["wave-2"],
      ["wave-3"],
    ]);
    expect(mockCancelPaginationFetch.mock.calls).toEqual([
      ["wave-2"],
      ["wave-3"],
    ]);
  });

  it.each([
    [true, true, "/messages", null, true],
    [false, true, "/messages", null, false],
    [true, false, "/messages", null, false],
    [true, true, "/messages", "dm", false],
    [true, true, "/messages/dm", "dm", false],
    [true, true, "/messages/create", null, false],
    [true, true, "/waves", null, false],
  ])(
    "gates recent DM prefetch for native=%s active=%s path=%s chat=%s",
    (isCapacitor, isActive, pathname, activeWaveId, enabled) => {
      useCapacitorMock.mockReturnValue({ isCapacitor, isActive });
      usePathnameMock.mockReturnValue(pathname);
      useActiveWaveManagerMock.mockReturnValue({
        activeWaveId,
        setActiveWave: mockSetActiveWave,
      });
      renderWithContext();
      expect(mockRecentDmPrefetch).toHaveBeenLastCalledWith({
        enabled,
        viewerIdentityKey: "wallet:primary",
        waves: [],
        prefetchWave: mockPrefetchWave,
      });
    }
  );

  it("does not let an old profile refresh cancel or restart the current profile's fetches", () => {
    useWaveMessagesStoreMock.mockImplementation(
      jest.requireActual("@/contexts/wave/hooks/useWaveMessagesStore").default
    );
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
    const staleRefresh = context!.refreshWaveMessages;
    act(() =>
      globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT))
    );
    mockRegisterWave.mockClear();
    mockCancelWaveDataFetch.mockClear();
    mockCancelPaginationFetch.mockClear();

    act(() => staleRefresh("wave-1"));
    expect(mockCancelWaveDataFetch).not.toHaveBeenCalled();
    expect(mockCancelPaginationFetch).not.toHaveBeenCalled();
    expect(mockRegisterWave).not.toHaveBeenCalled();

    act(() => context!.refreshWaveMessages("wave-1"));
    expect(mockCancelWaveDataFetch).toHaveBeenCalledWith("wave-1");
    expect(mockCancelPaginationFetch).toHaveBeenCalledWith("wave-1");
    expect(mockRegisterWave).toHaveBeenCalledWith("wave-1");
  });

  it("registers selected waves before delegating active wave navigation", () => {
    const { getContext } = renderWithContext();
    const capturedContext = getContext();

    act(() => {
      capturedContext.activeWave.set("wave-2", {
        isDirectMessage: true,
        divider: 9,
      });
    });

    expect(mockRegisterWave).toHaveBeenCalledWith("wave-2", true, {
      skipInitialBackfill: false,
    });
    expect(mockSetActiveWave).toHaveBeenCalledWith("wave-2", {
      isDirectMessage: true,
      divider: 9,
    });
  });

  it("does not skip native backfill for blank serial targets", () => {
    const { getContext } = renderWithContext();
    const capturedContext = getContext();
    mockRegisterWave.mockClear();

    act(() => {
      capturedContext.activeWave.set("wave-2", {
        serialNo: "   ",
      });
    });

    expect(mockRegisterWave).toHaveBeenCalledWith("wave-2", true, {
      skipInitialBackfill: false,
    });
  });

  it("does not refetch DMs when the browser comes online and no DM list is active", () => {
    const { getContext } = renderWithContext();
    act(() => {
      getContext().requestMainWavesList();
    });

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(mainRefreshStale).toHaveBeenCalledTimes(1);
    expect(dmRefreshStale).not.toHaveBeenCalled();
    expect(mainRefetch).not.toHaveBeenCalled();
    expect(dmRefetch).not.toHaveBeenCalled();
    expect(useDmWavesListMock).toHaveBeenLastCalledWith({ enabled: false });
    expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: true });
  });

  it("syncs the active wave on the first websocket connection and reconnect", () => {
    const { getContext, rerenderTree } = renderWithContext();
    act(() => {
      getContext().requestMainWavesList();
    });
    mockRegisterWave.mockClear();

    useWebsocketStatusMock.mockReturnValue("connected");
    rerenderTree();

    expect(mockRegisterWave).toHaveBeenCalledWith("wave-1", true, {
      skipInitialBackfill: undefined,
    });
    expect(mainRefreshStale).toHaveBeenCalledTimes(1);

    useWebsocketStatusMock.mockReturnValue("disconnected");
    rerenderTree();
    useWebsocketStatusMock.mockReturnValue("connected");
    rerenderTree();

    expect(mockRegisterWave).toHaveBeenCalledTimes(2);
    expect(mockRegisterWave).toHaveBeenNthCalledWith(2, "wave-1", true, {
      skipInitialBackfill: undefined,
    });
    expect(mainRefreshStale).toHaveBeenCalledTimes(2);
    // Web reconnects never force-refetch fresh list data.
    expect(mainRefetch).not.toHaveBeenCalled();
    expect(mockResetAllWavesNewDropsCount).not.toHaveBeenCalled();
  });

  it("keeps the main Waves list idle on web routes until a surface requests it", () => {
    jest.useFakeTimers();
    usePathnameMock.mockReturnValue("/about");

    try {
      const { getContext, rerenderTree } = renderWithContext();

      expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: false });
      expect(useEnhancedWavesListCoreMock).toHaveBeenCalledWith(
        "wave-1",
        expect.anything(),
        expect.objectContaining({ enabled: false, supportsPinning: true })
      );
      // Sidebars that render before their request read the list as loading.
      expect(getContext().waves.isFetching).toBe(true);

      useWebsocketStatusMock.mockReturnValue("connected");
      rerenderTree();
      act(() => {
        window.dispatchEvent(new Event("focus"));
        window.dispatchEvent(new Event("online"));
        document.dispatchEvent(new Event("visibilitychange"));
        jest.advanceTimersByTime(10_000);
      });

      expect(mainRefreshStale).not.toHaveBeenCalled();
      expect(mainRefetch).not.toHaveBeenCalled();
      expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: false });
      expect(markMobileLaunchStepMock).not.toHaveBeenCalledWith(
        "main_waves_list_deferred"
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps a requested main Waves list enabled after leaving Waves", () => {
    const { getContext, rerenderTree } = renderWithContext();

    act(() => {
      getContext().requestMainWavesList();
    });
    expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: true });
    expect(getContext().waves.isFetching).toBe(false);

    usePathnameMock.mockReturnValue("/about");
    rerenderTree();

    expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: true });
  });

  it("keeps the forced refetch and counter reset on native reconnect", () => {
    useCapacitorMock.mockReturnValue({ isCapacitor: true, isActive: true });
    const { rerenderTree } = renderWithContext();

    expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: true });

    useWebsocketStatusMock.mockReturnValue("connected");
    rerenderTree();

    expect(mainRefetch).toHaveBeenCalledTimes(1);
    expect(mainRefreshStale).not.toHaveBeenCalled();
    expect(mockResetAllWavesNewDropsCount).toHaveBeenCalled();
  });

  it("lets the real web sidebar request the list through the real provider", () => {
    let context: ReturnType<typeof useMyStream> | null = null;
    const renderTree = () => (
      <MyStreamProvider>
        <WebBrainLeftSidebarWaves scrollContainerRef={{ current: null }} />
        <CaptureMyStream
          onContext={(nextContext) => {
            context = nextContext;
          }}
        />
      </MyStreamProvider>
    );

    const getContext = () => {
      if (!context) {
        throw new Error("Expected MyStream context");
      }
      return context;
    };

    const { rerender } = render(renderTree());

    expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: true });
    const firstContext = getContext();
    // Surfaces return these from effects, so each must return a cleanup function.
    expect(typeof firstContext.requestMainWavesList()).toBe("function");
    let releaseDirectMessagesList: unknown;
    act(() => {
      releaseDirectMessagesList = firstContext.requestDirectMessagesList();
    });
    expect(typeof releaseDirectMessagesList).toBe("function");

    rerender(renderTree());

    // Stable identities keep surface effects from re-requesting or releasing.
    expect(getContext().requestMainWavesList).toBe(
      firstContext.requestMainWavesList
    );
    expect(getContext().requestDirectMessagesList).toBe(
      firstContext.requestDirectMessagesList
    );
  });

  it("keeps loading the main Waves list on native non-detail routes without a request", () => {
    useCapacitorMock.mockReturnValue({ isCapacitor: true, isActive: true });
    usePathnameMock.mockReturnValue("/about");

    renderWithContext();

    expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: true });
    expect(markMobileLaunchStepMock).not.toHaveBeenCalledWith(
      "main_waves_list_deferred"
    );
  });

  it.each(["/waves/wave-1", "/messages/wave-1"])(
    "leaves the initial detail registration to the gated page on %s",
    (pathname) => {
      usePathnameMock.mockReturnValue(pathname);

      render(
        <MyStreamProvider>
          <div />
        </MyStreamProvider>
      );

      expect(mockRegisterWave).not.toHaveBeenCalled();
    }
  );

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

  it("auto-enables the deferred main Waves list after route idle", () => {
    jest.useFakeTimers();
    const idleWindow = window as IdleWindow;
    const originalRequestIdleCallback = idleWindow.requestIdleCallback;
    const originalCancelIdleCallback = idleWindow.cancelIdleCallback;
    Object.defineProperty(idleWindow, "requestIdleCallback", {
      configurable: true,
      value: jest.fn((callback: () => void) => {
        callback();
        return 1;
      }),
    });
    Object.defineProperty(idleWindow, "cancelIdleCallback", {
      configurable: true,
      value: jest.fn(),
    });
    useCapacitorMock.mockReturnValue({ isCapacitor: true, isActive: true });
    usePathnameMock.mockReturnValue("/waves/wave-1");

    try {
      render(
        <MyStreamProvider>
          <div />
        </MyStreamProvider>
      );

      expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: false });
      expect(markMobileLaunchStepMock).toHaveBeenCalledWith(
        "main_waves_list_deferred"
      );

      act(() => {
        jest.advanceTimersByTime(999);
      });
      expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: false });

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: true });
      expect(markMobileLaunchStepMock).toHaveBeenCalledWith(
        "main_waves_list_enabled"
      );
    } finally {
      Object.defineProperty(idleWindow, "requestIdleCallback", {
        configurable: true,
        value: originalRequestIdleCallback,
      });
      Object.defineProperty(idleWindow, "cancelIdleCallback", {
        configurable: true,
        value: originalCancelIdleCallback,
      });
      jest.useRealTimers();
    }
  });

  it("handles active wave data without metrics", () => {
    const activeWave = { id: "wave-1" };
    useWaveByIdMock.mockReturnValue({
      wave: activeWave,
      isLoading: false,
      isFetching: false,
    });

    expect(() => {
      render(
        <MyStreamProvider>
          <div />
        </MyStreamProvider>
      );
    }).not.toThrow();
    expect(useWavesListMock).toHaveBeenLastCalledWith({
      activeWave,
      enabled: false,
    });
  });

  it("does not surface placeholder data from the previously active wave", () => {
    useWaveByIdMock.mockReturnValue({
      wave: { id: "wave-before-navigation" },
      isLoading: false,
      isFetching: true,
    });

    render(
      <MyStreamProvider>
        <div />
      </MyStreamProvider>
    );

    expect(useWavesListMock).toHaveBeenLastCalledWith({ enabled: false });
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

    expect(mainRefreshStale).not.toHaveBeenCalled();
    expect(dmRefreshStale).not.toHaveBeenCalled();
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

    // Messages pages do not request the main list; only stale DMs refresh.
    expect(mainRefreshStale).not.toHaveBeenCalled();
    expect(dmRefreshStale).toHaveBeenCalledTimes(1);
    expect(dmRefetch).not.toHaveBeenCalled();
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

    expect(mainRefreshStale).not.toHaveBeenCalled();
    expect(dmRefreshStale).toHaveBeenCalledTimes(1);
    expect(dmRefetch).not.toHaveBeenCalled();

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
    expect(mainRefreshStale).not.toHaveBeenCalled();
    expect(dmRefreshStale).not.toHaveBeenCalled();
  });
});
