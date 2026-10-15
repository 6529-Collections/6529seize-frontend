import { act, renderHook } from "@testing-library/react";
import { useWaveDataFetching } from "@/contexts/wave/hooks/useWaveDataFetching";
import type {
  WaveMessages,
  WaveMessagesUpdate,
} from "@/contexts/wave/hooks/types";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";

import { markMobileLaunchStep } from "@/utils/monitoring/mobileLaunchTiming";

jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  markMobileLaunchStep: jest.fn(),
}));

const mockFetchMessages = jest.fn<
  Promise<ApiDrop[] | null>,
  [string, number | null, AbortSignal]
>();
const mockUpdateEligibility = jest.fn();
jest.mock("@/contexts/wave/utils/wave-messages-utils", () => ({
  ...jest.requireActual("@/contexts/wave/utils/wave-messages-utils"),
  fetchWaveMessages: (...args: Parameters<typeof mockFetchMessages>) =>
    mockFetchMessages(...args),
}));
jest.mock("@/contexts/wave/WaveEligibilityContext", () => ({
  useWaveEligibility: () => ({ updateEligibility: mockUpdateEligibility }),
}));

function pendingMessages() {
  let resolve!: (drops: ApiDrop[]) => void;
  const promise = new Promise<ApiDrop[]>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const drop = (id: string) => ({ id, serial_no: 1 }) as ApiDrop;

function setup() {
  const store = new Map<string, WaveMessages>();
  const updateData = jest.fn((update: WaveMessagesUpdate) => {
    store.set(update.key, {
      ...store.get(update.key),
      ...update,
    } as WaveMessages);
  });
  const props = {
    updateData,
    getData: (key: string) => store.get(key),
    removeDrop: jest.fn(),
    hasServerFeedSeed: () => false,
    isCapacitor: true,
  };
  return { ...renderHook(() => useWaveDataFetching(props)), store, updateData };
}

beforeEach(() => {
  mockFetchMessages.mockReset();
  jest.mocked(markMobileLaunchStep).mockClear();
});

it("shares a pending prefetch with a tap and reuses the resulting cache", async () => {
  const response = pendingMessages();
  mockFetchMessages.mockReturnValueOnce(response.promise);
  const { result, store } = setup();
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.prefetchWave("dm");
    result.current.registerWave("dm", true);
  });
  expect(mockFetchMessages).toHaveBeenCalledTimes(1);
  await act(async () => {
    response.resolve([drop("cached")]);
    await pending;
  });
  expect(store.get("dm")?.drops.map((message) => message.id)).toEqual([
    "cached",
  ]);
  expect(store.get("dm")?.isLoading).toBe(false);
  await act(async () => {
    await result.current.prefetchWave("dm");
  });
  expect(mockFetchMessages).toHaveBeenCalledTimes(1);
});

it("allows a real open to retry after prefetch fails", async () => {
  mockFetchMessages
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce([drop("retried")]);
  const { result, store } = setup();
  await act(async () => {
    await result.current.prefetchWave("dm");
  });
  expect(store.get("dm")?.isLoading).toBe(false);
  await act(async () => {
    result.current.registerWave("dm");
  });
  expect(mockFetchMessages).toHaveBeenCalledTimes(2);
  expect(store.get("dm")?.drops.map((message) => message.id)).toEqual([
    "retried",
  ]);
});

it("cancels the old account request without poisoning the new account cache", async () => {
  const oldResponse = pendingMessages();
  const newResponse = pendingMessages();
  mockFetchMessages
    .mockReturnValueOnce(oldResponse.promise)
    .mockReturnValueOnce(newResponse.promise);
  const { result, store } = setup();
  let oldPending!: Promise<void>;
  let newPending!: Promise<void>;
  act(() => {
    oldPending = result.current.prefetchWave("dm");
  });
  const oldSignal = mockFetchMessages.mock.calls[0]![2];
  act(() => {
    globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
    store.clear();
    newPending = result.current.prefetchWave("dm");
  });
  expect(oldSignal.aborted).toBe(true);
  expect(mockFetchMessages).toHaveBeenCalledTimes(2);
  await act(async () => {
    oldResponse.resolve([drop("old-account")]);
    await oldPending;
  });
  expect(store.get("dm")?.drops).toEqual([]);
  expect(store.get("dm")?.isLoading).toBe(true);
  await act(async () => {
    newResponse.resolve([drop("new-account")]);
    await newPending;
  });
  expect(store.get("dm")?.drops.map((message) => message.id)).toEqual([
    "new-account",
  ]);
});

it.each([
  { opening: "pending", skipInitialBackfill: false },
  { opening: "cached", skipInitialBackfill: false },
  { opening: "pending", skipInitialBackfill: true },
  { opening: "cached", skipInitialBackfill: true },
])(
  "preserves native backfill on a $opening open (skip: $skipInitialBackfill)",
  async ({ opening, skipInitialBackfill }) => {
    jest.useFakeTimers();
    try {
      const initialDrops = Array.from({ length: 20 }, (_, index) => ({
        ...drop(`initial-${index}`),
        serial_no: 100 - index,
      }));
      const history = Array.from({ length: 30 }, (_, index) => ({
        ...drop(`history-${index}`),
        serial_no: 80 - index,
      }));
      const response = pendingMessages();
      mockFetchMessages
        .mockReturnValueOnce(response.promise)
        .mockResolvedValueOnce(history);
      const { result, store } = setup();
      let pending!: Promise<void>;
      act(() => {
        pending = result.current.prefetchWave("dm");
        if (opening === "pending") {
          result.current.registerWave("dm", false, { skipInitialBackfill });
        }
      });
      await act(async () => {
        response.resolve(initialDrops);
        await pending;
      });
      if (opening === "cached") {
        await act(async () => {
          await jest.runAllTimersAsync();
        });
        expect(mockFetchMessages).toHaveBeenCalledTimes(1);
        expect(markMobileLaunchStep).not.toHaveBeenCalled();
        act(() => {
          result.current.registerWave("dm", false, { skipInitialBackfill });
        });
      }
      expect(mockFetchMessages).toHaveBeenCalledTimes(1);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(250);
      });
      expect(mockFetchMessages).toHaveBeenCalledTimes(
        skipInitialBackfill ? 1 : 2
      );
      expect(markMobileLaunchStep).toHaveBeenCalledWith("wave_messages_loaded");
      expect(store.get("dm")?.drops).toHaveLength(
        skipInitialBackfill ? 20 : 50
      );
      if (!skipInitialBackfill) {
        expect(mockFetchMessages).toHaveBeenLastCalledWith(
          "dm",
          81,
          expect.any(AbortSignal),
          expect.any(Function),
          expect.objectContaining({ limit: 30 })
        );
      }
    } finally {
      jest.useRealTimers();
    }
  }
);

it("does not backfill or mark a visible load after a shared prefetch is cancelled", async () => {
  jest.useFakeTimers();
  try {
    const response = pendingMessages();
    mockFetchMessages.mockReturnValueOnce(response.promise);
    const { result, store } = setup();
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.prefetchWave("dm");
      result.current.registerWave("dm");
      result.current.cancelWaveDataFetch("dm");
    });
    await act(async () => {
      response.resolve(
        Array.from({ length: 20 }, (_, index) => ({
          ...drop(`cancelled-${index}`),
          serial_no: 100 - index,
        }))
      );
      await pending;
      await jest.runAllTimersAsync();
    });
    expect(mockFetchMessages).toHaveBeenCalledTimes(1);
    expect(store.get("dm")?.drops).toEqual([]);
    expect(markMobileLaunchStep).not.toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});
