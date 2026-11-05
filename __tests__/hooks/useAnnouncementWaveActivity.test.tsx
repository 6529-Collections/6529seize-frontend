import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useAnnouncementWaveActivity } from "@/hooks/useAnnouncementWaveActivity";
import { commonApiFetch } from "@/services/api/common-api";
import { WsMessageType } from "@/helpers/Types";
import type { SidebarWave } from "@/types/waves.types";

const callbacks = new Map<string, (data: unknown) => void>();
jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: (type: string, callback: (data: unknown) => void) => {
    callbacks.set(type, callback);
  },
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
