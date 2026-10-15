import { act, renderHook } from "@testing-library/react";
import { useWaveDataFetching } from "@/contexts/wave/hooks/useWaveDataFetching";
import type {
  WaveMessages,
  WaveMessagesUpdate,
} from "@/contexts/wave/hooks/types";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";

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
