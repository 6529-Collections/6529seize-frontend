import { act, renderHook } from "@testing-library/react";
import { useVirtualizedWaveMessages } from "@/hooks/useVirtualizedWaveMessages";
import type { Drop } from "@/helpers/waves/drop.helpers";

jest.useFakeTimers();

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamWaveMessages: jest.fn(),
}));

jest.mock("@/hooks/useDropMessages", () => ({
  useDropMessages: jest.fn(),
}));

const { useMyStreamWaveMessages } = require("@/contexts/wave/MyStreamContext");
const { useDropMessages } = require("@/hooks/useDropMessages");

const createDrop = (serialNo: number) => ({ serial_no: serialNo }) as Drop;

const createWaveData = (
  id: string,
  serials: number[],
  overrides: Partial<{
    hasNextPage: boolean;
    isLoading: boolean;
    isLoadingNextPage: boolean;
    latestFetchedSerialNo: number | null;
  }> = {}
) => ({
  id,
  isLoading: false,
  isLoadingNextPage: false,
  hasNextPage: false,
  drops: serials.map(createDrop),
  latestFetchedSerialNo: serials[0] ?? null,
  fetchNextPage: jest.fn(),
  ...overrides,
});

const createDropMessages = (serials: number[] = []) => ({
  isError: false,
  drops: serials.map(createDrop),
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isFetching: false,
  isFetchingNextPage: false,
  refetch: jest.fn(),
  manualFetch: jest.fn(),
});

const getSerials = (
  waveMessages: ReturnType<typeof useVirtualizedWaveMessages> | undefined
) => waveMessages?.drops.map((drop) => drop.serial_no);

describe("useVirtualizedWaveMessages", () => {
  let currentWaveMessages: ReturnType<typeof createWaveData> | undefined;
  let currentDropMessages: ReturnType<typeof createDropMessages> | undefined;

  beforeEach(() => {
    currentWaveMessages = undefined;
    currentDropMessages = createDropMessages();
    useMyStreamWaveMessages.mockImplementation(() => currentWaveMessages);
    useDropMessages.mockImplementation(() => currentDropMessages);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("returns undefined when no data is available", () => {
    const { result } = renderHook(() =>
      useVirtualizedWaveMessages("wave-1", null, 5)
    );

    expect(result.current).toBeUndefined();
  });

  it("preserves a failed thread request and its retry action", () => {
    currentDropMessages = { ...createDropMessages(), isError: true };
    const { result } = renderHook(() =>
      useVirtualizedWaveMessages("wave-1", "drop-1")
    );
    expect(result.current?.isError).toBe(true);
    expect(result.current?.drops).toEqual([]);
    result.current?.retryDropMessages?.();
    expect(currentDropMessages.refetch).toHaveBeenCalledTimes(1);
  });

  it("keeps the same-wave snapshot during transient gaps and clears it on wave change", () => {
    const waveMessagesById: Record<
      string,
      ReturnType<typeof createWaveData>
    > = {
      "wave-1": createWaveData("wave-1", [5, 4, 3], {
        hasNextPage: true,
        isLoading: true,
        isLoadingNextPage: true,
        latestFetchedSerialNo: 42,
      }),
    };

    useMyStreamWaveMessages.mockImplementation(
      (waveId: string) => waveMessagesById[waveId]
    );

    const { result, rerender } = renderHook(
      ({ waveId }: { waveId: string }) =>
        useVirtualizedWaveMessages(waveId, null, 2),
      {
        initialProps: { waveId: "wave-1" },
      }
    );

    expect(getSerials(result.current)).toEqual([5, 4]);
    expect(result.current?.hasNextPage).toBe(true);
    expect(result.current?.isLoading).toBe(true);
    expect(result.current?.isLoadingNextPage).toBe(true);
    expect(result.current?.latestFetchedSerialNo).toBe(42);

    delete waveMessagesById["wave-1"];
    rerender({ waveId: "wave-1" });

    expect(getSerials(result.current)).toEqual([5, 4]);
    expect(result.current?.hasNextPage).toBe(true);
    expect(result.current?.isLoading).toBe(true);
    expect(result.current?.isLoadingNextPage).toBe(true);
    expect(result.current?.latestFetchedSerialNo).toBe(42);

    rerender({ waveId: "wave-2" });

    expect(result.current).toBeUndefined();
  });

  it("resets the visible limit when the scope key changes", () => {
    const waveMessagesById: Record<
      string,
      ReturnType<typeof createWaveData>
    > = {
      "wave-1": createWaveData("wave-1", [5, 4, 3, 2, 1]),
      "wave-2": createWaveData("wave-2", [10, 9, 8, 7, 6]),
    };

    useMyStreamWaveMessages.mockImplementation(
      (waveId: string) => waveMessagesById[waveId]
    );

    const { result, rerender } = renderHook(
      ({ pageSize, waveId }: { pageSize: number; waveId: string }) =>
        useVirtualizedWaveMessages(waveId, null, pageSize),
      {
        initialProps: {
          waveId: "wave-1",
          pageSize: 2,
        },
      }
    );

    expect(getSerials(result.current)).toEqual([5, 4]);

    act(() => {
      result.current?.loadMoreLocally();
    });

    expect(getSerials(result.current)).toEqual([5, 4, 3, 2]);

    rerender({
      waveId: "wave-1",
      pageSize: 3,
    });

    expect(getSerials(result.current)).toEqual([5, 4, 3]);

    rerender({
      waveId: "wave-2",
      pageSize: 2,
    });

    expect(getSerials(result.current)).toEqual([10, 9]);
  });

  it("does not auto-grow on initial load but expands after later appends", () => {
    const { result, rerender } = renderHook(() =>
      useVirtualizedWaveMessages("wave-1", null, 2)
    );

    expect(result.current).toBeUndefined();

    currentWaveMessages = createWaveData("wave-1", [2, 1]);
    rerender();

    expect(getSerials(result.current)).toEqual([2, 1]);
    expect(result.current?.hasMoreLocal).toBe(false);

    currentWaveMessages = createWaveData("wave-1", [4, 3, 2, 1]);
    rerender();

    expect(getSerials(result.current)).toEqual([4, 3, 2, 1]);
    expect(result.current?.hasMoreLocal).toBe(false);

    currentWaveMessages = createWaveData("wave-1", [4, 3, 2, 1]);
    rerender();

    expect(getSerials(result.current)).toEqual([4, 3, 2, 1]);
  });

  it("continues local expansion from the auto-grown limit", () => {
    const { result, rerender } = renderHook(() =>
      useVirtualizedWaveMessages("wave-1", null, 2)
    );

    currentWaveMessages = createWaveData("wave-1", [8, 7]);
    rerender();

    expect(getSerials(result.current)).toEqual([8, 7]);

    currentWaveMessages = createWaveData("wave-1", [8, 7, 6, 5]);
    rerender();

    expect(getSerials(result.current)).toEqual([8, 7, 6, 5]);

    currentWaveMessages = createWaveData("wave-1", [8, 7, 6, 5, 4, 3, 2, 1]);
    rerender();

    expect(getSerials(result.current)).toEqual([8, 7, 6, 5, 4, 3]);
    expect(result.current?.hasMoreLocal).toBe(true);

    act(() => {
      result.current?.loadMoreLocally();
    });

    expect(getSerials(result.current)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    expect(result.current?.hasMoreLocal).toBe(false);
  });

  it("keeps rendered drops when more than a page of newer drops arrives", () => {
    const { result, rerender } = renderHook(() =>
      useVirtualizedWaveMessages("wave-1", null, 2)
    );

    currentWaveMessages = createWaveData("wave-1", [2, 1]);
    rerender();

    expect(getSerials(result.current)).toEqual([2, 1]);

    // A catch-up page of newer drops lands ahead of the rendered rows.
    currentWaveMessages = createWaveData("wave-1", [8, 7, 6, 5, 4, 3, 2, 1]);
    rerender();

    expect(getSerials(result.current)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    expect(result.current?.hasMoreLocal).toBe(false);
  });

  it("falls back to the normal limit when the oldest rendered drop is gone", () => {
    const { result, rerender } = renderHook(() =>
      useVirtualizedWaveMessages("wave-1", null, 2)
    );

    currentWaveMessages = createWaveData("wave-1", [2, 1]);
    rerender();

    expect(getSerials(result.current)).toEqual([2, 1]);

    // The previously oldest rendered drop is not in the new set.
    currentWaveMessages = createWaveData("wave-1", [12, 11, 10, 9, 8, 7, 6, 5]);
    rerender();

    expect(getSerials(result.current)).toEqual([12, 11, 10, 9]);
    expect(result.current?.hasMoreLocal).toBe(true);
  });

  it("keeps a revealed serial target rendered when newer drops arrive", async () => {
    const around = Array.from({ length: 38 }, (_, index) => 39 - index);
    currentWaveMessages = createWaveData("wave-1", around);

    const { result, rerender } = renderHook(() =>
      useVirtualizedWaveMessages("wave-1", null, 25)
    );

    expect(getSerials(result.current)).not.toContain(2);

    await act(async () => {
      const reveal = result.current!.waitAndRevealDrop(2, 100, 10);
      jest.runAllTimers();
      await expect(reveal).resolves.toBe(true);
    });

    expect(getSerials(result.current)).toContain(2);

    const newer = Array.from({ length: 50 }, (_, index) => 151 - index);
    currentWaveMessages = createWaveData("wave-1", [...newer, ...around]);
    rerender();

    expect(getSerials(result.current)).toEqual([...newer, ...around]);
  });

  it("expands appended drop messages and resets when the drop scope changes", () => {
    const dropMessagesById: Record<
      string,
      ReturnType<typeof createDropMessages>
    > = {
      "drop-1": createDropMessages([2, 1]),
      "drop-2": createDropMessages([9, 8, 7, 6]),
    };

    useDropMessages.mockImplementation(
      (_waveId: string, activeDropId: string | null) =>
        activeDropId ? dropMessagesById[activeDropId] : undefined
    );

    const { result, rerender } = renderHook(
      ({ activeDropId }: { activeDropId: string }) =>
        useVirtualizedWaveMessages("wave-1", activeDropId, 2),
      {
        initialProps: { activeDropId: "drop-1" },
      }
    );

    expect(getSerials(result.current)).toEqual([2, 1]);

    dropMessagesById["drop-1"] = createDropMessages([4, 3, 2, 1]);
    rerender({ activeDropId: "drop-1" });

    expect(getSerials(result.current)).toEqual([4, 3, 2, 1]);

    dropMessagesById["drop-1"] = createDropMessages([4, 3, 2, 1]);
    rerender({ activeDropId: "drop-1" });

    expect(getSerials(result.current)).toEqual([4, 3, 2, 1]);

    rerender({ activeDropId: "drop-2" });

    expect(getSerials(result.current)).toEqual([9, 8]);
  });

  it("waits for a later rerender to reveal the requested drop", async () => {
    currentWaveMessages = createWaveData("wave-1", [2, 1]);

    const { result, rerender } = renderHook(() =>
      useVirtualizedWaveMessages("wave-1", null, 2)
    );

    expect(getSerials(result.current)).toEqual([2, 1]);

    const revealPromise = result.current!.waitAndRevealDrop(5, 100, 10);

    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    currentWaveMessages = createWaveData("wave-1", [5, 4, 3, 2, 1]);
    rerender();

    await act(async () => {
      jest.runAllTimers();
      await expect(revealPromise).resolves.toBe(true);
    });

    expect(getSerials(result.current)).toEqual([5, 4, 3, 2, 1]);
  });
});
