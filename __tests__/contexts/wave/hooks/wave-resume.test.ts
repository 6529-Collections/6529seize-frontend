import { act, renderHook } from "@testing-library/react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useWaveMessagesStore from "@/contexts/wave/hooks/useWaveMessagesStore";
import { useWaveDataFetching } from "@/contexts/wave/hooks/useWaveDataFetching";
import { useWavePagination } from "@/contexts/wave/hooks/useWavePagination";
import {
  fetchAroundSerialNoWaveMessages,
  fetchNewestWaveMessages,
  fetchWaveMessages,
} from "@/contexts/wave/utils/wave-messages-utils";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";

const mockUpdateEligibility = jest.fn();
jest.mock("@/contexts/wave/WaveEligibilityContext", () => ({
  useWaveEligibility: () => ({ updateEligibility: mockUpdateEligibility }),
}));
jest.mock("@/contexts/wave/utils/wave-messages-utils", () => ({
  ...jest.requireActual("@/contexts/wave/utils/wave-messages-utils"),
  fetchAroundSerialNoWaveMessages: jest.fn(),
  fetchNewestWaveMessages: jest.fn(),
  fetchWaveMessages: jest.fn(),
}));
const around = jest.mocked(fetchAroundSerialNoWaveMessages);
const latest = jest.mocked(fetchNewestWaveMessages);
const history = jest.mocked(fetchWaveMessages);

function drop(serial: number): ApiDrop {
  return {
    id: `post-${serial}`,
    serial_no: serial,
    created_at: serial * 60_000,
    title: `Post ${serial}`,
    wave: { id: "wave" },
    author: { handle: "reader" },
    parts: [],
    metadata: [],
  } as unknown as ApiDrop;
}
const fullDrop = (serial: number): ExtendedDrop => ({
  ...drop(serial),
  type: DropSize.FULL,
  stableKey: `post-${serial}`,
  stableHash: `post-${serial}`,
});

function setup() {
  const hook = renderHook(() => {
    const store = useWaveMessagesStore();
    const fetching = useWaveDataFetching({ ...store });
    const pagination = useWavePagination(store);
    return { store, fetching, pagination };
  });
  act(() =>
    hook.result.current.store.updateData({ key: "wave", drops: [fullDrop(1)] })
  );
  return hook;
}

afterEach(() => jest.clearAllMocks());

it("shows the latest page in one request and leaves the missing interval for lazy loading", async () => {
  latest.mockResolvedValue({
    drops: Array.from({ length: 50 }, (_, i) => drop(1000 + i)),
    highestSerialNo: 1049,
  });
  const { result } = setup();
  await act(async () => {
    await result.current.fetching.registerWave("wave", true);
  });
  expect(latest).toHaveBeenCalledTimes(1);
  expect(latest.mock.calls[0]?.[1]).toBeNull();
  expect(history).not.toHaveBeenCalled();
  const state = result.current.store.getData("wave");
  expect(state?.drops).toHaveLength(51);
  expect(state?.drops[0]?.serial_no).toBe(1049);
  expect(state?.historyGaps).toEqual([{ newerThan: 1, olderThan: 1000 }]);
});

it("keeps live edits and deletions received while the latest snapshot is in flight", async () => {
  let finish!: (
    result: Awaited<ReturnType<typeof fetchNewestWaveMessages>>
  ) => void;
  latest.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  const { result } = setup();
  act(() =>
    result.current.store.updateData({
      key: "wave",
      drops: [fullDrop(2), fullDrop(3)],
    })
  );
  act(() => {
    result.current.fetching.registerWave("wave", true);
  });
  act(() => {
    result.current.store.updateData({
      key: "wave",
      drops: [{ ...fullDrop(2), title: "Live edit" }],
    });
    result.current.store.removeDrop("wave", "post-3");
    result.current.store.removeDrop("wave", "post-4");
  });
  await act(async () => {
    finish({ drops: [drop(2), drop(3), drop(4), drop(5)], highestSerialNo: 5 });
    await Promise.resolve();
  });
  const rows = result.current.store.getData("wave")?.drops;
  expect(rows?.find((row) => row.id === "post-2")).toMatchObject({
    title: "Live edit",
  });
  expect(rows?.some((row) => row.id === "post-3" || row.id === "post-4")).toBe(
    false
  );
  expect(rows?.some((row) => row.id === "post-5")).toBe(true);
});

it("loads one missed-history page without replacing cached messages or the latest cursor", async () => {
  const { result } = setup();
  const gap = { newerThan: 1, olderThan: 1000 };
  act(() =>
    result.current.store.updateData({
      key: "wave",
      historyGaps: [gap],
      drops: [fullDrop(1000)],
      latestFetchedSerialNo: 1000,
    })
  );
  history.mockResolvedValue(
    Array.from({ length: 50 }, (_, i) => drop(950 + i))
  );
  await act(async () => {
    await result.current.pagination.fetchNextPage({
      waveId: "wave",
      type: DropSize.FULL,
      gap,
    });
  });
  const state = result.current.store.getData("wave");
  expect(state?.drops).toHaveLength(52);
  expect(state?.latestFetchedSerialNo).toBe(1000);
  expect(state?.historyGaps).toEqual([{ newerThan: 1, olderThan: 950 }]);
  expect(history).toHaveBeenCalledTimes(1);
});

it("closes a gap at the cached boundary and keeps a failed gap retryable", async () => {
  const { result } = setup();
  const gap = { newerThan: 1, olderThan: 4 };
  act(() =>
    result.current.store.updateData({ key: "wave", historyGaps: [gap] })
  );
  history
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce([drop(1), drop(2), drop(3)]);
  await act(async () => {
    await result.current.pagination.fetchNextPage({
      waveId: "wave",
      type: DropSize.FULL,
      gap,
    });
  });
  expect(result.current.store.getData("wave")?.historyGaps).toEqual([gap]);
  await act(async () => {
    await result.current.pagination.fetchNextPage({
      waveId: "wave",
      type: DropSize.FULL,
      gap,
    });
  });
  expect(result.current.store.getData("wave")?.historyGaps).toEqual([]);
  expect(result.current.store.getData("wave")?.drops).toHaveLength(3);
});

it("closes an authoritative empty history interval while preserving cached rows", async () => {
  const { result } = setup();
  const gap = { newerThan: 1, olderThan: 10 };
  act(() =>
    result.current.store.updateData({ key: "wave", historyGaps: [gap] })
  );
  history.mockResolvedValue([]);
  await act(async () => {
    await result.current.pagination.fetchNextPage({
      waveId: "wave",
      type: DropSize.FULL,
      gap,
    });
  });
  expect(result.current.store.getData("wave")?.historyGaps).toEqual([]);
  expect(result.current.store.getData("wave")?.drops).toHaveLength(1);
});

it("discards an in-flight history response after a profile switch", async () => {
  let finish!: (drops: ApiDrop[]) => void;
  history.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  const { result } = setup();
  const gap = { newerThan: 1, olderThan: 10 };
  act(() =>
    result.current.store.updateData({ key: "wave", historyGaps: [gap] })
  );
  let pending!: Promise<
    (ApiDrop | import("@/generated/models/ApiDropId").ApiDropId)[] | null
  >;
  act(() => {
    pending = result.current.pagination.fetchNextPage({
      waveId: "wave",
      type: DropSize.FULL,
      gap,
    });
  });
  act(() => globalThis.dispatchEvent(new Event(PROFILE_SWITCHED_EVENT)));
  await act(async () => {
    finish([drop(2)]);
    await pending;
  });
  expect(result.current.store.getData("wave")).toBeUndefined();
});

it("loads distinct gaps on one wave independently and deduplicates each interval", async () => {
  const { result } = setup();
  const first = { newerThan: 1, olderThan: 100 };
  const second = { newerThan: 200, olderThan: 300 };
  act(() =>
    result.current.store.updateData({
      key: "wave",
      historyGaps: [first, second],
    })
  );
  let finishFirst!: (rows: ApiDrop[]) => void;
  let finishSecond!: (rows: ApiDrop[]) => void;
  history
    .mockReturnValueOnce(
      new Promise((resolve) => {
        finishFirst = resolve;
      })
    )
    .mockReturnValueOnce(
      new Promise((resolve) => {
        finishSecond = resolve;
      })
    );
  act(() => {
    void result.current.pagination.fetchNextPage({
      waveId: "wave",
      type: DropSize.FULL,
      gap: first,
    });
    void result.current.pagination.fetchNextPage({
      waveId: "wave",
      type: DropSize.FULL,
      gap: second,
    });
    void result.current.pagination.fetchNextPage({
      waveId: "wave",
      type: DropSize.FULL,
      gap: first,
    });
  });
  expect(history).toHaveBeenCalledTimes(2);
  await act(async () => {
    finishSecond([drop(299)]);
    await Promise.resolve();
  });
  expect(result.current.store.getData("wave")?.historyGaps).toEqual([first]);
  await act(async () => {
    finishFirst([drop(99)]);
    await Promise.resolve();
  });
  expect(result.current.store.getData("wave")?.historyGaps).toEqual([]);
  expect(result.current.store.getData("wave")?.drops).toHaveLength(3);
});

it("cancels every missed-history request when its wave is released", async () => {
  const { result } = setup();
  const gaps = [
    { newerThan: 1, olderThan: 100 },
    { newerThan: 200, olderThan: 300 },
  ];
  act(() =>
    result.current.store.updateData({ key: "wave", historyGaps: gaps })
  );
  let finish!: (rows: ApiDrop[]) => void;
  history.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  act(() => {
    for (const gap of gaps) {
      void result.current.pagination.fetchNextPage({
        waveId: "wave",
        type: DropSize.FULL,
        gap,
      });
    }
    result.current.pagination.cancelPaginationFetch("wave");
  });
  expect(history.mock.calls).toHaveLength(2);
  expect(history.mock.calls.every((call) => call[2]?.aborted)).toBe(true);
  await act(async () => {
    finish([drop(99)]);
    await Promise.resolve();
  });
  expect(result.current.store.getData("wave")?.historyGaps).toEqual(gaps);
  expect(result.current.store.getData("wave")?.drops).toHaveLength(1);
});

const range = (from: number, to: number): ApiDrop[] =>
  Array.from({ length: to - from + 1 }, (_, i) => drop(from + i));

function setupWithLatest() {
  const hook = setup();
  act(() =>
    hook.result.current.store.updateData({
      key: "wave",
      drops: range(1000, 1049).map((item) => fullDrop(item.serial_no)),
    })
  );
  return hook;
}

const jumpTo = (
  result: ReturnType<typeof setup>["result"],
  targetSerialNo: number
) =>
  act(async () => {
    await result.current.pagination.fetchNextPage({
      waveId: "wave",
      type: DropSize.LIGHT,
      targetSerialNo,
    });
  });

it("jumps to an old post by loading one window and leaving the rest as history gaps", async () => {
  around.mockResolvedValue(range(475, 525));
  const { result } = setupWithLatest();
  await jumpTo(result, 500);
  expect(around).toHaveBeenCalledTimes(1);
  expect(around.mock.calls[0]?.slice(0, 2)).toEqual(["wave", 500]);
  expect(history).not.toHaveBeenCalled();
  const state = result.current.store.getData("wave");
  // Post 1, the window and the latest page: nothing in between is loaded.
  expect(state?.drops).toHaveLength(1 + 51 + 50);
  expect(state?.drops.every((item) => item.type === DropSize.FULL)).toBe(true);
  expect(state?.historyGaps).toEqual([
    { newerThan: 1, olderThan: 475 },
    { newerThan: 525, olderThan: 1000 },
  ]);
});

it("jumps even when no older page remains", async () => {
  around.mockResolvedValue(range(475, 525));
  const { result } = setupWithLatest();
  act(() =>
    result.current.store.updateData({ key: "wave", hasNextPage: false })
  );
  await jumpTo(result, 500);
  expect(
    result.current.store
      .getData("wave")
      ?.drops.some((item) => item.serial_no === 500)
  ).toBe(true);
});

it("adds no gap for a window that reaches loaded posts", async () => {
  around.mockResolvedValue(range(960, 1010));
  const { result } = setupWithLatest();
  await jumpTo(result, 985);
  const state = result.current.store.getData("wave");
  expect(state?.historyGaps ?? []).toEqual([]);
  expect(state?.drops.some((item) => item.serial_no === 960)).toBe(true);
});

it("splits the gap a second jump lands in", async () => {
  around
    .mockResolvedValueOnce(range(475, 525))
    .mockResolvedValueOnce(range(700, 750));
  const { result } = setupWithLatest();
  await jumpTo(result, 500);
  await jumpTo(result, 725);
  expect(result.current.store.getData("wave")?.historyGaps).toEqual([
    { newerThan: 1, olderThan: 475 },
    { newerThan: 525, olderThan: 700 },
    { newerThan: 750, olderThan: 1000 },
  ]);
});

it("fills a gap forward from its oldest edge for a reader scrolling down", async () => {
  around.mockResolvedValue(range(475, 525));
  const { result } = setupWithLatest();
  await jumpTo(result, 500);
  const gap = { newerThan: 525, olderThan: 1000 };
  latest.mockResolvedValueOnce({
    drops: range(526, 575),
    highestSerialNo: 575,
  });
  await act(async () => {
    await result.current.pagination.fetchNextPage({
      waveId: "wave",
      type: DropSize.FULL,
      gap,
      direction: "newer",
    });
  });
  expect(latest.mock.calls[0]?.slice(0, 3)).toEqual(["wave", 525, 50]);
  expect(history).not.toHaveBeenCalled();
  const remaining = { newerThan: 575, olderThan: 1000 };
  expect(result.current.store.getData("wave")?.historyGaps).toEqual([
    { newerThan: 1, olderThan: 475 },
    remaining,
  ]);
  expect(
    result.current.store
      .getData("wave")
      ?.drops.filter((item) => item.serial_no > 525 && item.serial_no < 1000)
  ).toHaveLength(50);

  // A short page means the gap is exhausted.
  latest.mockResolvedValueOnce({
    drops: range(576, 580),
    highestSerialNo: 580,
  });
  await act(async () => {
    await result.current.pagination.fetchNextPage({
      waveId: "wave",
      type: DropSize.FULL,
      gap: remaining,
      direction: "newer",
    });
  });
  expect(result.current.store.getData("wave")?.historyGaps).toEqual([
    { newerThan: 1, olderThan: 475 },
  ]);
});

it("keeps a gap retryable when a forward page fails", async () => {
  const { result } = setupWithLatest();
  const gap = { newerThan: 1, olderThan: 1000 };
  act(() =>
    result.current.store.updateData({ key: "wave", historyGaps: [gap] })
  );
  latest.mockResolvedValueOnce({ drops: null, highestSerialNo: null });
  let page: unknown;
  await act(async () => {
    page = await result.current.pagination.fetchNextPage({
      waveId: "wave",
      type: DropSize.FULL,
      gap,
      direction: "newer",
    });
  });
  expect(page).toBeNull();
  expect(result.current.store.getData("wave")?.historyGaps).toEqual([gap]);
});
