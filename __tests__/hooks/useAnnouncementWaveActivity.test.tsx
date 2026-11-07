import { act, renderHook, waitFor } from "@testing-library/react";
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useAnnouncementWaveActivity } from "@/hooks/useAnnouncementWaveActivity";
import { commonApiFetch } from "@/services/api/common-api";
import { WsMessageType } from "@/helpers/Types";
import type { SidebarWave } from "@/types/waves.types";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";

const callbacks = new Map<string, (data: unknown) => void>();
let mockSocketStatus: WebSocketStatus = WebSocketStatus.CONNECTED;
jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: (type: string, callback: (data: unknown) => void) => {
    callbacks.set(type, callback);
  },
  useWebsocketStatus: () => mockSocketStatus,
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
const fetchMock = jest.mocked(commonApiFetch);
const options = {
  waveId: "announcements",
  enabled: true,
  viewerIdentityKey: "reader",
};

function useTimestamp({
  waveId,
  enabled,
  viewerIdentityKey,
}: {
  readonly waveId: string | null;
  readonly enabled: boolean;
  readonly viewerIdentityKey: string;
}) {
  const wave = waveId
    ? ({ id: waveId, repliesCollapsed: enabled } as SidebarWave)
    : null;
  return (
    useAnnouncementWaveActivity(wave, viewerIdentityKey)
      ?.latestTopLevelDropTimestamp ?? null
  );
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

function emit(type: WsMessageType, data: unknown) {
  act(() => callbacks.get(type)?.(data));
}

beforeEach(() => {
  callbacks.clear();
  fetchMock.mockReset();
  mockSocketStatus = WebSocketStatus.CONNECTED;
});

it("loads the latest main-feed post without using a reply-inclusive metric", async () => {
  fetchMock.mockResolvedValue({ drops: [{ created_at: 100 }] });
  const { wrapper } = setup();
  const { result } = renderHook(() => useTimestamp(options), {
    wrapper,
  });
  expect(result.current).toBeNull();
  await waitFor(() => expect(result.current).toBe(100));
  expect(fetchMock).toHaveBeenCalledWith(
    expect.objectContaining({
      endpoint: "v2/waves/announcements/drops",
      params: { limit: "1" },
      signal: expect.any(AbortSignal),
    })
  );
  emit(WsMessageType.DROP_UPDATE, {
    wave: { id: "announcements" },
    reply_to: { drop_id: "root" },
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  fetchMock.mockResolvedValue({ drops: [{ created_at: 200 }] });
  emit(WsMessageType.DROP_UPDATE, { wave: { id: "announcements" } });
  await waitFor(() => expect(result.current).toBe(200));
});

it("rechecks compact updates and recovers the previous post after deletion", async () => {
  fetchMock.mockResolvedValue({ drops: [{ created_at: 100 }] });
  const { wrapper } = setup();
  const { result } = renderHook(() => useTimestamp(options), {
    wrapper,
  });
  await waitFor(() => expect(result.current).toBe(100));
  emit(WsMessageType.DROP_UPDATE_REF, {
    drop_id: "reply",
    wave_id: "announcements",
    author_id: "other",
    serial_no: 4,
    update_type: WsMessageType.DROP_UPDATE,
  });
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(result.current).toBe(100);
  fetchMock.mockResolvedValue({ drops: [{ created_at: 50 }] });
  emit(WsMessageType.DROP_DELETE, { wave_id: "announcements" });
  await waitFor(() => expect(result.current).toBe(50));
  fetchMock.mockResolvedValue({ drops: [] });
  emit(WsMessageType.DROP_DELETE, { wave_id: "announcements" });
  await waitFor(() => expect(result.current).toBeNull());
});

it("keeps viewer caches separate and hides the timestamp until the new viewer loads", async () => {
  fetchMock.mockResolvedValue({ drops: [{ created_at: 100 }] });
  const { wrapper } = setup();
  const { result, rerender } = renderHook(
    ({ viewerIdentityKey }) => useTimestamp({ ...options, viewerIdentityKey }),
    { wrapper, initialProps: { viewerIdentityKey: "reader" } }
  );
  await waitFor(() => expect(result.current).toBe(100));
  fetchMock.mockResolvedValue({ drops: [{ created_at: 50 }] });
  rerender({ viewerIdentityKey: "other" });
  expect(result.current).toBeNull();
  await waitFor(() => expect(result.current).toBe(50));
});

it("does not request an absent or disabled wave", () => {
  const { wrapper } = setup();
  const { result } = renderHook(
    () =>
      useTimestamp({
        ...options,
        waveId: null,
        enabled: false,
      }),
    { wrapper }
  );
  expect(result.current).toBeNull();
  emit(WsMessageType.DROP_DELETE, { wave_id: "announcements" });
  expect(fetchMock).not.toHaveBeenCalled();
});

it("removes the timestamp override when replies switch back to inline", async () => {
  fetchMock.mockResolvedValue({ drops: [{ created_at: 100 }] });
  const { wrapper } = setup();
  const { result, rerender } = renderHook(
    ({ repliesCollapsed }) =>
      useAnnouncementWaveActivity(
        {
          id: "announcements",
          repliesCollapsed,
        } as SidebarWave,
        "reader"
      ),
    { wrapper, initialProps: { repliesCollapsed: true } }
  );
  await waitFor(() =>
    expect(result.current?.latestTopLevelDropTimestamp).toBe(100)
  );
  rerender({ repliesCollapsed: false });
  expect(result.current).not.toHaveProperty("latestTopLevelDropTimestamp");
});

describe("refresh cadence", () => {
  const FIVE_MINUTES = 5 * 60 * 1000;

  const advance = async (ms: number) => {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(ms);
    });
  };

  const renderLoaded = async () => {
    fetchMock.mockResolvedValue({ drops: [{ created_at: 100 }] });
    const { wrapper } = setup();
    const view = renderHook(() => useTimestamp(options), { wrapper });
    await advance(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(view.result.current).toBe(100);
    return view;
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    focusManager.setFocused(undefined);
    jest.useRealTimers();
  });

  it("relies on socket frames instead of polling while the socket is connected", async () => {
    await renderLoaded();

    await advance(2 * FIVE_MINUTES);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    emit(WsMessageType.DROP_UPDATE, { wave: { id: "announcements" } });
    await advance(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("polls every five minutes, not every 30 seconds, without a socket", async () => {
    mockSocketStatus = WebSocketStatus.DISCONNECTED;
    await renderLoaded();

    await advance(30_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advance(FIVE_MINUTES - 30_000 - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await advance(FIVE_MINUTES);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("falls back to the slow poll once the socket drops", async () => {
    const view = await renderLoaded();

    mockSocketStatus = WebSocketStatus.CONNECTING;
    view.rerender();
    await advance(FIVE_MINUTES);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not poll while the tab is hidden", async () => {
    mockSocketStatus = WebSocketStatus.DISCONNECTED;
    await renderLoaded();

    act(() => focusManager.setFocused(false));
    await advance(3 * FIVE_MINUTES);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
