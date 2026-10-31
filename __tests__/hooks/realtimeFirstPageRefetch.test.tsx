import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WsMessageType } from "@/helpers/Types";
import { useDropMessages } from "@/hooks/useDropMessages";
import { useWaveCurationDrops } from "@/hooks/useWaveCurationDrops";
import { useWaveDrops } from "@/hooks/useWaveDrops";
import { fetchWaveCurationDropsV2 } from "@/services/api/wave-curation-drops-v2-api";
import {
  fetchDropRepliesV2,
  fetchWaveDropsFeedV2,
} from "@/services/api/wave-drops-v2-api";

const mockSocketCallbacks = new Map<string, (message: unknown) => void>();

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: (type: string, callback: (message: unknown) => void) => {
    mockSocketCallbacks.set(type, callback);
  },
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: { id: "viewer-1" } }),
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/helpers/waves/wave.helpers", () => ({
  ...jest.requireActual("@/helpers/waves/wave.helpers"),
  toApiWaveMin: (wave: { id: string }) => ({ id: wave.id }),
}));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  ...jest.requireActual("@/services/api/wave-drops-v2-api"),
  fetchWaveDropsFeedV2: jest.fn(),
  fetchDropRepliesV2: jest.fn(),
}));
jest.mock("@/services/api/wave-curation-drops-v2-api", () => ({
  fetchWaveCurationDropsV2: jest.fn(),
}));

type FeedResult = Awaited<ReturnType<typeof fetchWaveDropsFeedV2>>;

const fetchFeedMock = jest.mocked(fetchWaveDropsFeedV2);
const fetchRepliesMock = jest.mocked(fetchDropRepliesV2);
const fetchCurationMock = jest.mocked(fetchWaveCurationDropsV2);

const WAVE_ID = "wave-1";
const wave = { id: WAVE_ID } as ApiWave;

// Newest first, like every list these hooks read.
const makeDrop = (id: number) => ({
  id: `drop-${id}`,
  serial_no: id,
  created_at: id,
  title: null,
  author: { handle: "author" },
  wave: { id: WAVE_ID },
  parts: [{ content: `part ${id}`, media: [] }],
  metadata: [],
  reply_to: null,
});

const idsOf = (drops: readonly { readonly id: string }[]) =>
  drops.map((drop) => drop.id);
const dropIds = (...numbers: number[]) => numbers.map((id) => `drop-${id}`);
const range = (from: number, to: number) =>
  Array.from({ length: from - to + 1 }, (_, index) => from - index);

const emit = (type: WsMessageType, message: unknown) => {
  act(() => {
    mockSocketCallbacks.get(type)?.(message);
  });
};

let queryClient: QueryClient;
const wrapper = ({ children }: { readonly children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

beforeEach(() => {
  jest.clearAllMocks();
  mockSocketCallbacks.clear();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
});

afterEach(() => {
  queryClient.clear();
});

describe("useWaveDrops realtime refresh", () => {
  const PAGE_SIZE = 2;
  let serverSerials: number[];

  beforeEach(() => {
    serverSerials = range(10, 1);
    fetchFeedMock.mockImplementation(
      async ({
        serialNoLimit,
      }: {
        serialNoLimit?: number | null | undefined;
      }) => {
        const older =
          typeof serialNoLimit === "number"
            ? serverSerials.filter((serial) => serial < serialNoLimit)
            : serverSerials;
        return {
          drops: older.slice(0, PAGE_SIZE).map(makeDrop),
        } as unknown as FeedResult;
      }
    );
  });

  const loadTwoPages = async () => {
    const hook = renderHook(
      () => useWaveDrops({ waveId: WAVE_ID, limit: PAGE_SIZE }),
      { wrapper }
    );
    await waitFor(() => expect(hook.result.current.drops).toHaveLength(2));
    await act(async () => {
      await hook.result.current.fetchNextPage();
    });
    await waitFor(() => expect(hook.result.current.drops).toHaveLength(4));
    fetchFeedMock.mockClear();
    return hook;
  };

  it("requests only the first page for a new drop and keeps load-more working", async () => {
    const { result } = await loadTwoPages();

    serverSerials = [11, ...serverSerials];
    emit(WsMessageType.DROP_UPDATE, makeDrop(11));
    await waitFor(() => expect(fetchFeedMock).toHaveBeenCalledTimes(1));
    await settle();

    expect(idsOf(result.current.drops)).toEqual(dropIds(11, 10, 9, 8, 7));
    expect(fetchFeedMock).toHaveBeenCalledTimes(1);
    expect(fetchFeedMock).toHaveBeenCalledWith(
      expect.objectContaining({ serialNoLimit: null, waveId: WAVE_ID })
    );

    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() =>
      expect(idsOf(result.current.drops)).toEqual(
        dropIds(11, 10, 9, 8, 7, 6, 5)
      )
    );
    expect(fetchFeedMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ serialNoLimit: 7 })
    );
  });

  it("falls back to refetching every loaded page when the first page cannot connect", async () => {
    const { result } = await loadTwoPages();

    serverSerials = [16, 15, 14, 13, 12, 11, ...serverSerials];
    emit(WsMessageType.DROP_UPDATE, makeDrop(16));

    await waitFor(() =>
      expect(idsOf(result.current.drops)).toEqual(dropIds(16, 15, 14, 13))
    );
    // One first-page attempt, then the two loaded pages.
    expect(fetchFeedMock).toHaveBeenCalledTimes(3);
  });

  it("ignores updates for other waves", async () => {
    await loadTwoPages();

    emit(WsMessageType.DROP_UPDATE, {
      ...makeDrop(11),
      wave: { id: "another-wave" },
    });
    await settle();

    expect(fetchFeedMock).not.toHaveBeenCalled();
  });

  it("stops refreshing once the hook unmounts", async () => {
    const { unmount } = await loadTwoPages();
    let finishFeed!: (value: FeedResult) => void;
    fetchFeedMock.mockImplementationOnce(
      () =>
        new Promise<FeedResult>((resolve) => {
          finishFeed = resolve;
        })
    );

    emit(WsMessageType.DROP_UPDATE, makeDrop(11));
    expect(fetchFeedMock).toHaveBeenCalledTimes(1);
    const signal = fetchFeedMock.mock.calls[0]?.[0].signal;
    unmount();
    finishFeed({ drops: [makeDrop(11), makeDrop(10)] } as unknown as FeedResult);
    await settle();

    expect(signal?.aborted).toBe(true);
  });
});

describe("useWaveCurationDrops realtime refresh", () => {
  const PAGE_SIZE = 2;
  let serverIds: number[];

  beforeEach(() => {
    serverIds = range(10, 1);
    fetchCurationMock.mockImplementation(
      async ({ page }: { page: number }) =>
        ({
          data: serverIds
            .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
            .map(makeDrop),
          page,
          next: page * PAGE_SIZE < serverIds.length,
        }) as unknown as Awaited<ReturnType<typeof fetchWaveCurationDropsV2>>
    );
  });

  const loadTwoPages = async () => {
    const hook = renderHook(
      () =>
        useWaveCurationDrops({
          wave,
          curationId: "curation-1",
          pageSize: PAGE_SIZE,
        }),
      { wrapper }
    );
    await waitFor(() => expect(hook.result.current.drops).toHaveLength(2));
    await act(async () => {
      await hook.result.current.fetchNextPage();
    });
    await waitFor(() => expect(hook.result.current.drops).toHaveLength(4));
    fetchCurationMock.mockClear();
    return hook;
  };

  it("requests only the first page when it is unchanged and keeps the older pages", async () => {
    const { result } = await loadTwoPages();

    emit(WsMessageType.DROP_UPDATE, makeDrop(5));
    await settle();

    expect(fetchCurationMock).toHaveBeenCalledTimes(1);
    expect(fetchCurationMock).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: PAGE_SIZE })
    );
    expect(idsOf(result.current.drops)).toEqual(dropIds(10, 9, 8, 7));

    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() =>
      expect(idsOf(result.current.drops)).toEqual(dropIds(10, 9, 8, 7, 6, 5))
    );
  });

  it("refetches every loaded page when the first page changed", async () => {
    const { result } = await loadTwoPages();

    serverIds = [11, ...serverIds];
    emit(WsMessageType.DROP_UPDATE, makeDrop(5));

    await waitFor(() =>
      expect(idsOf(result.current.drops)).toEqual(dropIds(11, 10, 9, 8))
    );
    expect(fetchCurationMock).toHaveBeenCalledTimes(3);
  });
});

describe("useDropMessages realtime refresh", () => {
  const PAGE_SIZE = 50;
  let serverIds: number[];

  beforeEach(() => {
    serverIds = range(60, 1);
    fetchRepliesMock.mockImplementation(
      async ({ page }: { page: number }) =>
        ({
          wave: { id: WAVE_ID },
          drops: serverIds
            .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
            .map(makeDrop),
          count: serverIds.length,
          page,
          next: page * PAGE_SIZE < serverIds.length,
        }) as unknown as Awaited<ReturnType<typeof fetchDropRepliesV2>>
    );
  });

  const loadTwoPages = async () => {
    const hook = renderHook(
      () => useDropMessages(WAVE_ID, "thread-drop", wave),
      { wrapper }
    );
    await waitFor(() => expect(hook.result.current.drops).toHaveLength(50));
    await act(async () => {
      await hook.result.current.fetchNextPage();
    });
    await waitFor(() => expect(hook.result.current.drops).toHaveLength(60));
    fetchRepliesMock.mockClear();
    return hook;
  };

  it("requests only the first page for an update that does not touch the thread", async () => {
    const { result } = await loadTwoPages();

    emit(WsMessageType.DROP_UPDATE, makeDrop(500));
    await settle();

    expect(fetchRepliesMock).toHaveBeenCalledTimes(1);
    expect(fetchRepliesMock).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, parentDropId: "thread-drop" })
    );
    expect(result.current.drops).toHaveLength(60);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("refetches every loaded page when a reply was added", async () => {
    const { result } = await loadTwoPages();

    serverIds = [61, ...serverIds];
    emit(WsMessageType.DROP_UPDATE, {
      ...makeDrop(61),
      reply_to: { drop_id: "thread-drop", drop_part_id: 1 },
    });

    await waitFor(() => expect(result.current.drops).toHaveLength(61));
    expect(fetchRepliesMock).toHaveBeenCalledTimes(3);
  });
});
