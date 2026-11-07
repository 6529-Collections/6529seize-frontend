import { buildChatItems } from "@/components/waves/drops/chat-window/chatItems";
import {
  CHAT_TRIM_IDLE_MS,
  toReaderDropRange,
  useChatResidentCap,
} from "@/components/waves/drops/chat-window/useChatResidentCap";
import type { Drop } from "@/helpers/waves/drop.helpers";
import { act, renderHook } from "@testing-library/react";

const mockTrimWaveDrops = jest.fn();
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamActions: () => ({ trimWaveDrops: mockTrimWaveDrops }),
}));

/** Oldest first. */
const drops = (count: number): Drop[] =>
  Array.from(
    { length: count },
    (_, index) =>
      ({
        id: `drop-${index + 1}`,
        serial_no: index + 1,
        stableKey: `key-${index + 1}`,
      }) as unknown as Drop
  );

const itemsFor = (orderedDrops: Drop[]) =>
  buildChatItems({
    orderedDrops,
    historyGaps: undefined,
    includeHistoryGaps: true,
    boostCardAtIndex: new Map(),
    boostedDrops: undefined,
    boostedDropsDisplayPreference: "expanded",
    unreadDividerSerialNo: 400,
  });

const instance = (startIndex: number, endIndex: number, isScrolling = false) =>
  ({ isScrolling, range: { startIndex, endIndex } }) as never;

describe("useChatResidentCap", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockTrimWaveDrops.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("maps the rendered item range to drops, skipping decorations", () => {
    const orderedDrops = drops(500);
    const items = itemsFor(orderedDrops);
    // The unread divider sits just before drop 400 (item index 399).
    expect(
      toReaderDropRange(items, { startIndex: 399, endIndex: 401 })
    ).toEqual({ first: 399, last: 400 });
  });

  it("trims the far end once scrolling has stopped for the idle period", () => {
    const orderedDrops = drops(600);
    const { result } = renderHook(() =>
      useChatResidentCap({
        waveId: "wave-1",
        orderedDrops,
        items: itemsFor(orderedDrops),
        pinnedSerials: new Set(),
      })
    );

    act(() => {
      result.current(instance(580, 590));
      jest.advanceTimersByTime(CHAT_TRIM_IDLE_MS - 1);
    });
    expect(mockTrimWaveDrops).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(mockTrimWaveDrops).toHaveBeenCalledTimes(1);
    const [waveId, plan] = mockTrimWaveDrops.mock.calls[0];
    expect(waveId).toBe("wave-1");
    // The reader is among the newest 500: the oldest 100 go.
    expect(plan.dropIds).toHaveLength(100);
    expect(plan.dropIds[0]).toBe("drop-1");
    expect(plan.releasesOlderHistory).toBe(true);
  });

  it("waits while the list scrolls and never trims under the cap", () => {
    const manyDrops = drops(600);
    const { result, rerender } = renderHook(
      ({ orderedDrops }) =>
        useChatResidentCap({
          waveId: "wave-1",
          orderedDrops,
          items: itemsFor(orderedDrops),
          pinnedSerials: new Set(),
        }),
      { initialProps: { orderedDrops: manyDrops } }
    );

    act(() => {
      result.current(instance(10, 20));
      jest.advanceTimersByTime(CHAT_TRIM_IDLE_MS / 2);
      // Scrolling resumes before the idle period ends.
      result.current(instance(10, 20, true));
      jest.advanceTimersByTime(CHAT_TRIM_IDLE_MS * 2);
    });
    expect(mockTrimWaveDrops).not.toHaveBeenCalled();

    rerender({ orderedDrops: drops(540) });
    act(() => {
      result.current(instance(10, 20));
      jest.advanceTimersByTime(CHAT_TRIM_IDLE_MS * 2);
    });
    expect(mockTrimWaveDrops).not.toHaveBeenCalled();
  });
});
