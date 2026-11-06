import { act, renderHook } from "@testing-library/react";
import { useWaveRealtimeUpdater } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import {
  CHAT_GAP_TRAILING_CHECK_MAX_WAIT_MS,
  CHAT_GAP_TRAILING_CHECK_MS,
} from "@/contexts/wave/hooks/useWaveRealtimeUpdater.gapSync";
import { hydrateRealtimeChatDrop } from "@/contexts/wave/hooks/useWaveRealtimeUpdater.helpers";
import { WAVE_READ_DEBOUNCE_MS } from "@/hooks/useMarkWaveNotificationsRead.debounce";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WsMessageType } from "@/helpers/Types";
import type { WaveMessagesUpdate } from "@/contexts/wave/hooks/types";

let mockGapSyncEnabled = true;
const mockWebSocketCallbacks = new Map<
  WsMessageType,
  (messageData: unknown) => void
>();

jest.mock("@/contexts/wave/hooks/useWaveRealtimeUpdater.flags", () => ({
  isChatGapSyncEnabled: () => mockGapSyncEnabled,
}));

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: (
    messageType: WsMessageType,
    callback: (messageData: unknown) => void
  ) => {
    mockWebSocketCallbacks.set(messageType, callback);
    return { isConnected: true };
  },
}));

jest.mock("@/contexts/wave/WaveEligibilityContext", () => ({
  useWaveEligibility: () => ({
    refreshEligibility: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ activeProfileProxy: null }),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0xAAA" }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn().mockResolvedValue({ dm_unread_state: null }),
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(() => "test-jwt"),
  PROFILE_SWITCHED_EVENT: "6529-profile-switched",
}));

jest.mock("jwt-decode", () => ({
  jwtDecode: () => ({ sub: "0xAAA", role: null, exp: 4102444800 }),
}));

jest.mock("@/services/api/drop-api", () => ({
  fetchDropByIdBatched: jest.fn(),
}));

jest.mock("@/contexts/wave/drop-visibility", () => ({
  isWaveDropNearViewport: jest.fn(() => true),
}));

jest.mock("@/helpers/jitter.helpers", () => ({
  scheduleStaggered: (callback: () => void, maxDelayMs: number) => {
    const timer = setTimeout(callback, maxDelayMs);
    return () => clearTimeout(timer);
  },
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(() => ({
    cancelQueries: jest.fn().mockResolvedValue(undefined),
    invalidateQueries: jest.fn().mockResolvedValue(undefined),
    getQueryCache: () => ({ findAll: () => [] }),
    setQueryData: jest.fn(),
    setQueriesData: jest.fn(),
  })),
}));

const {
  commonApiPost,
  commonApiPostWithoutBodyAndResponse,
} = require("@/services/api/common-api");
const { fetchDropByIdBatched } = require("@/services/api/drop-api");
const { getAuthJwt } = require("@/services/auth/auth.utils");

const WAVE = "wave-1";

const viewerWave = {
  id: WAVE,
  is_direct_message: false,
  authenticated_user_eligible_to_vote: true,
  authenticated_user_eligible_to_participate: true,
  authenticated_user_eligible_to_chat: true,
  authenticated_user_eligible_to_reply: true,
  authenticated_user_can_delete_replies: false,
  authenticated_user_admin: true,
};

const storedDrop = (serialNo: number): ExtendedDrop =>
  ({
    id: `stored-${serialNo}`,
    serial_no: serialNo,
    drop_type: ApiDropType.Chat,
    wave: viewerWave,
    author: { id: "author-a", subscribed_actions: [] },
    context_profile_context: {
      rating: 3,
      min_rating: 0,
      max_rating: 0,
      reaction: ":fire:",
      boosted: true,
      bookmarked: true,
      curatable: true,
      curated: true,
    },
    type: DropSize.FULL,
    stableKey: `stored-${serialNo}`,
    stableHash: `stored-${serialNo}`,
  }) as unknown as ExtendedDrop;

// The server clears the viewer's context from every socket frame.
const frameDrop = (
  serialNo: number,
  overrides: Partial<Record<string, unknown>> = {}
): ApiDrop =>
  ({
    id: `frame-${serialNo}`,
    serial_no: serialNo,
    drop_type: ApiDropType.Chat,
    wave: { id: WAVE, is_direct_message: false },
    author: { id: "author-b" },
    ...overrides,
  }) as unknown as ApiDrop;

type Store = Record<
  string,
  { drops: ExtendedDrop[]; latestFetchedSerialNo: number | null }
>;

const makeProps = (store: Store) => ({
  activeWaveId: WAVE as string | null,
  getData: (key: string) => store[key] as never,
  updateData: jest.fn((update: WaveMessagesUpdate) => {
    const current = store[update.key];
    if (!current) return;
    // Like the store, the verified serial only moves forward.
    if (typeof update.latestFetchedSerialNo === "number") {
      current.latestFetchedSerialNo = Math.max(
        current.latestFetchedSerialNo ?? update.latestFetchedSerialNo,
        update.latestFetchedSerialNo
      );
    }
    if (!update.drops) return;
    const byId = new Map(current.drops.map((drop) => [drop.id, drop]));
    for (const drop of update.drops) byId.set(drop.id, drop as ExtendedDrop);
    current.drops = [...byId.values()].sort(
      (a, b) => b.serial_no - a.serial_no
    );
  }),
  hasServerFeedSeed: jest.fn(() => false),
  isWaveInUse: jest.fn((waveId: string) => waveId === WAVE),
  registerWave: jest.fn(),
  syncNewestMessages: jest.fn(
    async (): Promise<{
      drops: ApiDrop[] | null;
      highestSerialNo: number | null;
    }> => ({ drops: [], highestSerialNo: null })
  ),
  removeDrop: jest.fn(),
  removeDrops: jest.fn(),
  removeWaveDeliveredNotifications: jest.fn().mockResolvedValue(undefined),
  isWaveMuted: jest.fn(() => false),
});

const emit = async (type: WsMessageType, data: unknown) => {
  const callback = mockWebSocketCallbacks.get(type);
  if (!callback) throw new Error(`No callback for ${type}`);
  await act(async () => {
    callback(data);
    await Promise.resolve();
  });
};

const advance = async (ms: number) => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
};

let visibilityState: DocumentVisibilityState = "visible";
const setVisibility = async (state: DocumentVisibilityState) => {
  visibilityState = state;
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
  });
};

// Ordinary waves send a read without a body; direct messages send a serial.
const readPosts = () =>
  [
    ...(commonApiPostWithoutBodyAndResponse as jest.Mock).mock.calls,
    ...(commonApiPost as jest.Mock).mock.calls,
  ].filter(([request]) =>
    String(request.endpoint).startsWith("notifications/wave/")
  );

describe("useWaveRealtimeUpdater with gap-only sync", () => {
  beforeAll(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibilityState,
    });
  });

  beforeEach(() => {
    jest.useFakeTimers();
    mockGapSyncEnabled = true;
    visibilityState = "visible";
    (getAuthJwt as jest.Mock).mockReturnValue("test-jwt");
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockWebSocketCallbacks.clear();
    jest.useRealTimers();
  });

  const setup = (
    store: Store = {
      [WAVE]: { drops: [storedDrop(10)], latestFetchedSerialNo: 10 },
    }
  ) => {
    const props = makeProps(store);
    const rendered = renderHook(
      (current: ReturnType<typeof makeProps>) =>
        useWaveRealtimeUpdater(current),
      { initialProps: props }
    );
    return { props, store, ...rendered };
  };

  describe("newest-drops fetches", () => {
    it("applies a frame without a request and checks once after the burst", async () => {
      const { props, store } = setup();

      for (let serial = 11; serial <= 30; serial++) {
        await emit(WsMessageType.DROP_UPDATE, frameDrop(serial));
        await advance(200);
      }

      expect(store[WAVE]!.drops).toHaveLength(21);
      expect(props.syncNewestMessages).not.toHaveBeenCalled();

      await advance(CHAT_GAP_TRAILING_CHECK_MS);

      expect(props.syncNewestMessages).toHaveBeenCalledTimes(1);
      // The check covers everything past the last fetched serial, so a frame
      // lost anywhere in the burst is repaired.
      expect(props.syncNewestMessages).toHaveBeenCalledWith(
        WAVE,
        10,
        expect.any(AbortSignal)
      );
    });

    it("checks a continuous stream at least every max wait", async () => {
      const { props } = setup();

      for (let serial = 11; serial <= 40; serial++) {
        await emit(WsMessageType.DROP_UPDATE, frameDrop(serial));
        await advance(1_000);
      }

      // 30 s of one message a second: two checks, never one per message.
      expect(props.syncNewestMessages.mock.calls.length).toBe(
        Math.floor(30_000 / CHAT_GAP_TRAILING_CHECK_MAX_WAIT_MS)
      );
    });

    it("advances the verified watermark after a check", async () => {
      const store: Store = {
        [WAVE]: { drops: [storedDrop(10)], latestFetchedSerialNo: 10 },
      };
      const { props } = setup(store);
      props.syncNewestMessages.mockResolvedValueOnce({
        drops: [frameDrop(11)],
        highestSerialNo: 11,
      });

      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));
      await advance(CHAT_GAP_TRAILING_CHECK_MS);

      expect(props.updateData).toHaveBeenCalledWith(
        expect.objectContaining({ key: WAVE, latestFetchedSerialNo: 11 })
      );
    });

    // One rule: every socket message that changes a stored wave schedules
    // the check, whichever branch handles it, so a lost frame followed only
    // by updates is still repaired.
    it("schedules the check for an update to a stored drop", async () => {
      const { props } = setup();

      await emit(WsMessageType.DROP_UPDATE, frameDrop(10, { id: "stored-10" }));
      expect(props.syncNewestMessages).not.toHaveBeenCalled();
      await advance(CHAT_GAP_TRAILING_CHECK_MS);

      expect(props.syncNewestMessages).toHaveBeenCalledTimes(1);
      expect(props.syncNewestMessages).toHaveBeenCalledWith(
        WAVE,
        10,
        expect.any(AbortSignal)
      );
    });

    it.each([
      [WsMessageType.DROP_REACTION_UPDATE, "stored-10"],
      [WsMessageType.DROP_RATING_UPDATE, "stored-10"],
      // The store lacks this drop: it may follow a lost frame.
      [WsMessageType.DROP_REACTION_UPDATE, "frame-12"],
      [WsMessageType.DROP_RATING_UPDATE, "frame-12"],
    ])("schedules the check for a %s of %s", async (type, dropId) => {
      const { props } = setup();
      fetchDropByIdBatched.mockResolvedValue({
        ...storedDrop(10),
        id: dropId,
      });

      await emit(type, frameDrop(12, { id: dropId }));
      await advance(0);
      expect(props.syncNewestMessages).not.toHaveBeenCalled();
      await advance(CHAT_GAP_TRAILING_CHECK_MS);

      expect(props.syncNewestMessages).toHaveBeenCalledTimes(1);
      expect(props.syncNewestMessages).toHaveBeenCalledWith(
        WAVE,
        10,
        expect.any(AbortSignal)
      );
    });

    it("schedules the check for a full update of a drop known only from a compact ref", async () => {
      const { props, store } = setup();
      fetchDropByIdBatched.mockResolvedValue({
        ...frameDrop(11),
        wave: viewerWave,
      });
      await emit(WsMessageType.DROP_UPDATE_REF, {
        drop_id: "frame-11",
        wave_id: WAVE,
        author_id: "author-b",
        serial_no: 11,
        update_type: WsMessageType.DROP_UPDATE,
      });
      await advance(0);
      // The ref itself fetches at once; its drop is now stored.
      expect(props.syncNewestMessages).toHaveBeenCalledTimes(1);
      expect(store[WAVE]!.drops.map((drop) => drop.id)).toContain("frame-11");

      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));
      await advance(CHAT_GAP_TRAILING_CHECK_MS);

      expect(props.syncNewestMessages).toHaveBeenCalledTimes(2);
    });

    it("fetches the newest page when no fetch has verified a serial yet", async () => {
      // Socket drops never stand in for a verified serial.
      const { props } = setup({
        [WAVE]: { drops: [storedDrop(10)], latestFetchedSerialNo: null },
      });

      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));
      await advance(CHAT_GAP_TRAILING_CHECK_MS);

      expect(props.syncNewestMessages).not.toHaveBeenCalled();
      expect(props.registerWave).toHaveBeenCalledWith(WAVE, true);
    });

    it("checks a drop stored while the server-rendered feed was pending", async () => {
      const store: Store = {};
      const { props } = setup(store);
      props.hasServerFeedSeed.mockReturnValue(true);

      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));
      expect(props.updateData).toHaveBeenCalledWith(
        expect.objectContaining({
          key: WAVE,
          drops: [expect.objectContaining({ id: "frame-11" })],
        })
      );

      // Still pending at the first check: it waits and checks again.
      await advance(CHAT_GAP_TRAILING_CHECK_MS);
      expect(props.syncNewestMessages).not.toHaveBeenCalled();

      store[WAVE] = { drops: [storedDrop(10)], latestFetchedSerialNo: 10 };
      props.hasServerFeedSeed.mockReturnValue(false);
      await advance(CHAT_GAP_TRAILING_CHECK_MS);

      expect(props.syncNewestMessages).toHaveBeenCalledWith(
        WAVE,
        10,
        expect.any(AbortSignal)
      );
    });

    it("stops scheduled checks on unmount", async () => {
      const { props, unmount } = setup();

      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));
      unmount();
      await advance(CHAT_GAP_TRAILING_CHECK_MAX_WAIT_MS);

      expect(props.syncNewestMessages).not.toHaveBeenCalled();
    });

    it("fetches at once when no stored drop can supply the viewer context", async () => {
      const { props } = setup({
        [WAVE]: { drops: [], latestFetchedSerialNo: 10 },
      });

      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));

      expect(props.syncNewestMessages).toHaveBeenCalledTimes(1);
    });

    it("fetches at once for a new participatory drop", async () => {
      const { props } = setup();

      await emit(
        WsMessageType.DROP_UPDATE,
        frameDrop(11, { drop_type: ApiDropType.Participatory })
      );

      expect(props.syncNewestMessages).toHaveBeenCalledTimes(1);
    });

    it("treats a compact reference as a gap signal", async () => {
      const { props } = setup();
      fetchDropByIdBatched.mockResolvedValue({
        ...frameDrop(11),
        wave: viewerWave,
      });

      await emit(WsMessageType.DROP_UPDATE_REF, {
        drop_id: "frame-11",
        wave_id: WAVE,
        author_id: "author-b",
        serial_no: 11,
        update_type: WsMessageType.DROP_UPDATE,
      });
      await advance(0);

      expect(props.syncNewestMessages).toHaveBeenCalledTimes(1);
    });

    it("keeps the per-message fetch for legacy direct messages", async () => {
      const { props } = setup();

      await emit(
        WsMessageType.DROP_UPDATE,
        frameDrop(11, { wave: { id: WAVE, is_direct_message: true } })
      );

      expect(props.syncNewestMessages).toHaveBeenCalledTimes(1);
    });

    it("waits for a hidden tab to show before checking", async () => {
      const { props } = setup();

      await setVisibility("hidden");
      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));
      await advance(CHAT_GAP_TRAILING_CHECK_MAX_WAIT_MS);
      expect(props.syncNewestMessages).not.toHaveBeenCalled();

      await setVisibility("visible");
      expect(props.syncNewestMessages).toHaveBeenCalledTimes(1);
    });

    it("checks a cached wave that is not in use when it becomes active", async () => {
      const store: Store = {
        [WAVE]: { drops: [storedDrop(10)], latestFetchedSerialNo: 10 },
        "wave-2": { drops: [storedDrop(5)], latestFetchedSerialNo: 5 },
      };
      const { props, rerender } = setup(store);

      await emit(
        WsMessageType.DROP_UPDATE,
        frameDrop(12, { wave: { id: "wave-2", is_direct_message: false } })
      );
      await advance(CHAT_GAP_TRAILING_CHECK_MAX_WAIT_MS);
      expect(props.syncNewestMessages).not.toHaveBeenCalled();

      rerender({ ...props, activeWaveId: "wave-2" });
      await advance(0);

      expect(props.syncNewestMessages).toHaveBeenCalledWith(
        "wave-2",
        5,
        expect.any(AbortSignal)
      );
    });

    it("resyncs the open wave, spread out, when the server asks", async () => {
      const { props } = setup();

      await emit(WsMessageType.RESYNC_REQUIRED, {});
      expect(props.syncNewestMessages).not.toHaveBeenCalled();

      await advance(3_000);
      expect(props.syncNewestMessages).toHaveBeenCalledWith(
        WAVE,
        10,
        expect.any(AbortSignal)
      );
    });

    it("drops scheduled checks on a profile switch", async () => {
      const { props } = setup();

      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));
      await act(async () => {
        globalThis.dispatchEvent(new CustomEvent("6529-profile-switched"));
      });
      await advance(CHAT_GAP_TRAILING_CHECK_MAX_WAIT_MS);

      expect(props.syncNewestMessages).not.toHaveBeenCalled();
    });

    it("keeps the per-message fetch when the flag is off", async () => {
      mockGapSyncEnabled = false;
      const { props } = setup();

      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));
      await emit(WsMessageType.DROP_UPDATE, frameDrop(12));

      expect(props.syncNewestMessages).toHaveBeenCalledTimes(2);
    });
  });

  describe("convergence under lossy delivery", () => {
    // Deterministic PRNG (mulberry32), so a failing seed reproduces.
    const random = (seed: number) => {
      let state = seed >>> 0;
      return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    it.each([1, 7, 42, 1234, 99999])(
      "matches the server after loss, duplication and reordering (seed %i)",
      async (seed) => {
        const next = random(seed);
        const N = 40;
        const serverDrops = Array.from({ length: N }, (_, index) =>
          frameDrop(11 + index)
        );
        const { props, store } = setup();
        props.syncNewestMessages.mockImplementation(async (_waveId, since) => {
          const drops = serverDrops
            .filter((drop) => drop.serial_no > since)
            .map((drop) => ({ ...drop, wave: viewerWave }) as ApiDrop);
          return {
            drops,
            highestSerialNo: Math.max(since, ...drops.map((d) => d.serial_no)),
          };
        });

        // Lose about 20%, duplicate about 15%, then swap neighbours.
        const deliveries: ApiDrop[] = [];
        for (const drop of serverDrops) {
          if (next() < 0.2) continue;
          deliveries.push(drop);
          if (next() < 0.15) deliveries.push(drop);
        }
        for (let index = 1; index < deliveries.length; index++) {
          if (next() < 0.3) {
            [deliveries[index - 1], deliveries[index]] = [
              deliveries[index]!,
              deliveries[index - 1]!,
            ];
          }
        }

        for (const drop of deliveries) {
          await emit(WsMessageType.DROP_UPDATE, drop);
          await advance(Math.floor(next() * 400));
        }
        await advance(CHAT_GAP_TRAILING_CHECK_MAX_WAIT_MS * 2);

        expect(
          store[WAVE]!.drops.map((drop) => drop.id)
            .filter((id) => id !== "stored-10")
            .sort()
        ).toEqual(serverDrops.map((drop) => drop.id).sort());
        // Far fewer fetches than delivered frames.
        expect(props.syncNewestMessages.mock.calls.length).toBeLessThan(
          deliveries.length / 4
        );
      }
    );
  });

  describe("viewer context of socket drops", () => {
    it("fills a new chat drop's viewer context from the stored drops", async () => {
      const { store } = setup();

      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));

      const inserted = store[WAVE]!.drops.find(
        (drop) => drop.id === "frame-11"
      )!;
      expect(inserted.wave).toMatchObject({
        authenticated_user_eligible_to_chat: true,
        authenticated_user_eligible_to_vote: true,
        authenticated_user_admin: true,
        authenticated_user_eligible_to_reply: true,
      });
      // Wave-level curation rights carry over; per-drop state starts empty.
      expect(inserted.context_profile_context).toEqual({
        rating: 0,
        min_rating: 0,
        max_rating: 0,
        reaction: null,
        boosted: false,
        bookmarked: false,
        curatable: true,
        curated: false,
      });
    });

    it("keeps a signed-out viewer's context empty", () => {
      const template = {
        ...storedDrop(10),
        context_profile_context: null,
      } as ExtendedDrop;
      const drop = {
        ...frameDrop(11),
        type: DropSize.FULL,
        stableKey: "frame-11",
        stableHash: "frame-11",
      } as unknown as ExtendedDrop;

      expect(
        hydrateRealtimeChatDrop(drop, [template])?.context_profile_context
      ).toBeNull();
    });

    it("never copies context from optimistic or unhydrated drops", () => {
      const drop = {
        ...frameDrop(11),
        type: DropSize.FULL,
        stableKey: "frame-11",
        stableHash: "frame-11",
      } as unknown as ExtendedDrop;
      const optimistic = { ...storedDrop(12), id: "temp-12" } as ExtendedDrop;
      const unhydrated = {
        ...drop,
        id: "frame-9",
        context_profile_context: undefined,
      } as unknown as ExtendedDrop;

      expect(
        hydrateRealtimeChatDrop(drop, [optimistic, unhydrated])
      ).toBeNull();
    });
  });

  describe("read markers", () => {
    it("sends one read per window for a burst", async () => {
      setup();

      for (let serial = 11; serial <= 15; serial++) {
        await emit(WsMessageType.DROP_UPDATE, frameDrop(serial));
      }
      expect(readPosts()).toHaveLength(0);

      await advance(WAVE_READ_DEBOUNCE_MS);

      expect(readPosts()).toEqual([
        [
          {
            endpoint: `notifications/wave/${WAVE}/read`,
            headers: { Authorization: "Bearer test-jwt" },
          },
        ],
      ]);
    });

    it("sends the pending read at once when the reader leaves the wave", async () => {
      const { props, rerender } = setup();

      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));
      rerender({ ...props, activeWaveId: "wave-2" });
      await advance(0);

      expect(readPosts()).toHaveLength(1);
      await advance(WAVE_READ_DEBOUNCE_MS);
      expect(readPosts()).toHaveLength(1);
    });

    it("sends the pending read at once when the tab hides", async () => {
      setup();

      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));
      await setVisibility("hidden");

      expect(readPosts()).toHaveLength(1);
    });

    it("drops a leaving read that cannot be sent at once", async () => {
      (getAuthJwt as jest.Mock).mockReturnValue(null);
      const { props, rerender } = setup();

      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));
      rerender({ ...props, activeWaveId: "wave-2" });
      (getAuthJwt as jest.Mock).mockReturnValue("test-jwt");
      rerender({ ...props, activeWaveId: "wave-2" });
      await advance(WAVE_READ_DEBOUNCE_MS);

      // Sent later, an ordinary-wave read would also mark messages that
      // arrived after the reader left.
      expect(readPosts()).toHaveLength(0);
    });

    it("does not queue reads while the tab is hidden", async () => {
      setup();

      await setVisibility("hidden");
      await emit(WsMessageType.DROP_UPDATE, frameDrop(11));
      await setVisibility("visible");
      await advance(WAVE_READ_DEBOUNCE_MS);

      expect(readPosts()).toHaveLength(0);
    });

    it("sends legacy direct-message reads at once", async () => {
      setup();

      await emit(
        WsMessageType.DROP_UPDATE,
        frameDrop(11, { wave: { id: WAVE, is_direct_message: true } })
      );
      await advance(0);

      expect(readPosts()).toHaveLength(1);
    });
  });
});
