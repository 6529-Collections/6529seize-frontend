import { act, render } from "@testing-library/react";
import { Fragment } from "react";
import {
  MyStreamProvider,
  useMyStream,
  useMyStreamActions,
} from "@/contexts/wave/MyStreamContext";
import type { WaveMessagesUpdate } from "@/contexts/wave/hooks/types";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater.helpers";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  DropSize,
  type Drop,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";

// The real wave messages store runs here; only its collaborators are mocked.
const mockWaveId = "wave-1";
const ROW_COUNT = 100;

const mockStableFns = {
  setActiveWave: jest.fn(),
  registerWave: jest.fn(),
  syncNewestMessages: jest.fn(),
  fetchNextPage: jest.fn(),
  fetchAroundSerialNo: jest.fn(),
  cancelWaveDataFetch: jest.fn(),
  cancelPaginationFetch: jest.fn(),
  processDropRemoved: jest.fn(),
  markWaveNotificationsRead: jest.fn(),
  removeWaveDeliveredNotifications: jest.fn(),
  listFn: jest.fn(),
};
const mockCapturedStore: {
  updateData: ((update: WaveMessagesUpdate) => void) | null;
} = { updateData: null };
// The provider rebuilds processIncomingDrop on every render here, like the
// real updater does when the active wave, mute state or eligibility changes.
const mockProcessIncomingDropImpls: jest.Mock[] = [];
const mockMainWaves: { current: readonly { id: string; unread: number }[] } = {
  current: [{ id: mockWaveId, unread: 0 }],
};

jest.mock("@/components/notifications/NotificationsContext", () => ({
  useNotificationsContext: () => ({
    removeWaveDeliveredNotifications:
      mockStableFns.removeWaveDeliveredNotifications,
  }),
}));

jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  markMobileLaunchStep: jest.fn(),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false, isActive: true }),
}));

const mockListData = (waves: readonly unknown[]) => ({
  waves,
  isFetching: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  fetchNextPage: mockStableFns.listFn,
  refetchAllWaves: mockStableFns.listFn,
  refreshStaleWaves: mockStableFns.listFn,
  addPinnedWave: mockStableFns.listFn,
  removePinnedWave: mockStableFns.listFn,
  loadSubwavesForParent: mockStableFns.listFn,
  prefetchSubwavesForParent: mockStableFns.listFn,
  loadingSubwaveParentIds: [],
});
const mockEmptyWaves: readonly unknown[] = [];

jest.mock("@/hooks/useWavesList", () => ({
  __esModule: true,
  default: () => mockListData(mockMainWaves.current),
}));

jest.mock("@/hooks/useDmWavesList", () => ({
  __esModule: true,
  default: () => mockListData(mockEmptyWaves),
}));

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebsocketStatus: () => "disconnected",
}));

const mockDmUnread = {};
jest.mock("@/services/dm-unread/DmUnreadStateProvider", () => ({
  useDmUnreadConversations: () => mockDmUnread,
}));

jest.mock("@/hooks/useMarkWaveNotificationsRead", () => ({
  useMarkWaveNotificationsRead: () => mockStableFns.markWaveNotificationsRead,
}));

jest.mock("@/hooks/useWaveById", () => ({
  useWaveById: () => ({ wave: null, isLoading: false, isFetching: false }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/waves",
}));

jest.mock("@/contexts/wave/hooks/useActiveWaveManager", () => ({
  useActiveWaveManager: () => ({
    activeWaveId: mockWaveId,
    hasActiveWaveDropTarget: false,
    setActiveWave: mockStableFns.setActiveWave,
  }),
}));

jest.mock("@/contexts/wave/hooks/useWaveDataManager", () => ({
  useWaveDataManager: ({
    updateData,
  }: {
    readonly updateData: (update: WaveMessagesUpdate) => void;
  }) => {
    mockCapturedStore.updateData = updateData;
    return {
      registerWave: mockStableFns.registerWave,
      syncNewestMessages: mockStableFns.syncNewestMessages,
      fetchNextPage: mockStableFns.fetchNextPage,
      fetchAroundSerialNo: mockStableFns.fetchAroundSerialNo,
      cancelWaveDataFetch: mockStableFns.cancelWaveDataFetch,
      cancelPaginationFetch: mockStableFns.cancelPaginationFetch,
    };
  },
}));

jest.mock("@/contexts/wave/hooks/useWaveRealtimeUpdater", () => ({
  useWaveRealtimeUpdater: () => {
    const processIncomingDrop = jest.fn();
    mockProcessIncomingDropImpls.push(processIncomingDrop);
    return {
      processIncomingDrop,
      processDropRemoved: mockStableFns.processDropRemoved,
    };
  },
}));

jest.mock("@/contexts/wave/hooks/useEnhancedWavesListCore", () => ({
  __esModule: true,
  default: (
    _activeWaveId: string | null,
    wavesData: { readonly waves: readonly unknown[] }
  ) => ({
    waves: wavesData.waves,
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: mockStableFns.listFn,
    addPinnedWave: mockStableFns.listFn,
    removePinnedWave: mockStableFns.listFn,
    loadSubwavesForParent: mockStableFns.listFn,
    prefetchSubwavesForParent: mockStableFns.listFn,
    loadingSubwaveParentIds: [],
    refetchAllWaves: mockStableFns.listFn,
    resetAllWavesNewDropsCount: mockStableFns.listFn,
    markWaveRead: mockStableFns.listFn,
    restoreWaveUnreadCount: mockStableFns.listFn,
  }),
}));

type MyStreamActions = ReturnType<typeof useMyStreamActions>;

const ActionRow = ({
  onRender,
}: {
  readonly onRender: (actions: MyStreamActions) => void;
}) => {
  onRender(useMyStreamActions());
  return null;
};

const DataRow = ({ onRender }: { readonly onRender: () => void }) => {
  useMyStream();
  onRender();
  return null;
};

const buildDrop = (id: string, serialNo: number): Drop =>
  ({
    id,
    serial_no: serialNo,
    wave: { id: mockWaveId },
    author: { handle: "author" },
    parts: [],
    metadata: [],
    created_at: serialNo * 1000,
    title: "original",
    type: DropSize.FULL,
  }) as unknown as Drop;

const flushStoreNotifications = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

// One "incoming drop": the store merges it and the waves list gets a new
// unread count, which is what changes the full stream context today.
const deliverIncomingDrop = async (drop: Drop, unread: number) => {
  act(() => {
    mockMainWaves.current = [{ id: mockWaveId, unread }];
    mockCapturedStore.updateData?.({ key: mockWaveId, drops: [drop] });
  });
  await flushStoreNotifications();
};

const renderRows = async () => {
  const actionRowRender = jest.fn<void, [MyStreamActions]>();
  const dataRowRender = jest.fn();
  render(
    <MyStreamProvider>
      {Array.from({ length: ROW_COUNT }, (_, index) => (
        <Fragment key={index}>
          <ActionRow onRender={actionRowRender} />
          <DataRow onRender={dataRowRender} />
        </Fragment>
      ))}
    </MyStreamProvider>
  );
  await flushStoreNotifications();
  return { actionRowRender, dataRowRender };
};

describe("MyStreamProvider actions context", () => {
  const originalStructuredClone = globalThis.structuredClone;

  beforeAll(() => {
    // jsdom does not expose structuredClone; the store clones plain drops.
    globalThis.structuredClone ??= <T,>(value: T): T =>
      JSON.parse(JSON.stringify(value)) as T;
  });

  afterAll(() => {
    globalThis.structuredClone = originalStructuredClone;
  });

  beforeEach(() => {
    mockProcessIncomingDropImpls.length = 0;
    mockMainWaves.current = [{ id: mockWaveId, unread: 0 }];
    mockCapturedStore.updateData = null;
  });

  it("does not re-render action-only rows when drops arrive", async () => {
    const { actionRowRender, dataRowRender } = await renderRows();
    actionRowRender.mockClear();
    dataRowRender.mockClear();

    await deliverIncomingDrop(buildDrop("drop-1", 1), 1);
    await deliverIncomingDrop(buildDrop("drop-2", 2), 2);

    // Rows on the full context re-render once per drop; action rows do not.
    expect(dataRowRender).toHaveBeenCalledTimes(ROW_COUNT * 2);
    expect(actionRowRender).not.toHaveBeenCalled();
    // The provider rebuilt processIncomingDrop on each of those renders.
    expect(mockProcessIncomingDropImpls.length).toBeGreaterThan(2);
  });

  it("runs mount-time actions against the latest stream state", async () => {
    const { actionRowRender } = await renderRows();
    const actions = actionRowRender.mock.calls[0]![0];
    actionRowRender.mockClear();

    await deliverIncomingDrop(buildDrop("drop-late", 7), 1);
    expect(actionRowRender).not.toHaveBeenCalled();

    // The drop arrived after the row last rendered; the action still finds it.
    let handle: ReturnType<MyStreamActions["applyOptimisticDropUpdate"]> = null;
    act(() => {
      handle = actions.applyOptimisticDropUpdate({
        waveId: mockWaveId,
        dropId: "drop-late",
        update: (draft) => {
          if (draft.type === DropSize.FULL) {
            draft.title = "edited";
          }
        },
      });
    });
    await flushStoreNotifications();

    expect(handle).not.toBeNull();
    expect(
      actions.waveMessagesStore
        .getData(mockWaveId)
        ?.drops.find(
          (drop): drop is ExtendedDrop =>
            drop.type === DropSize.FULL && drop.id === "drop-late"
        )?.title
    ).toBe("edited");

    // processIncomingDrop delegates to the newest provider implementation.
    const incoming = { id: "drop-ws" } as ApiDrop;
    await act(async () => {
      await actions.processIncomingDrop(
        incoming,
        ProcessIncomingDropType.DROP_INSERT
      );
    });
    const latestImpl = mockProcessIncomingDropImpls.at(-1)!;
    expect(latestImpl).toHaveBeenCalledWith(
      incoming,
      ProcessIncomingDropType.DROP_INSERT
    );
    for (const staleImpl of mockProcessIncomingDropImpls.slice(0, -1)) {
      expect(staleImpl).not.toHaveBeenCalled();
    }
    expect(actionRowRender).not.toHaveBeenCalled();
  });
});
