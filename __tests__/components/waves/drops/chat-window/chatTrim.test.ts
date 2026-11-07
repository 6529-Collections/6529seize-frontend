import { planChatTrim } from "@/components/waves/drops/chat-window/chatTrim";
import type { Drop } from "@/helpers/waves/drop.helpers";

const LIMITS = { cap: 10, slack: 2, liveKeep: 3 };

/** Oldest first; serial i + 1. */
const drops = (count: number): Drop[] =>
  Array.from(
    { length: count },
    (_, index) =>
      ({ id: `drop-${index + 1}`, serial_no: index + 1 }) as unknown as Drop
  );

const serialsOf = (ids: readonly string[]) =>
  ids.map((id) => Number(id.replace("drop-", "")));

describe("planChatTrim", () => {
  it("keeps everything up to the cap plus slack", () => {
    expect(
      planChatTrim({
        orderedDrops: drops(12),
        readerRange: { first: 0, last: 2 },
        pinnedSerials: new Set(),
        limits: LIMITS,
      })
    ).toBeNull();
  });

  it("releases the oldest drops while the reader is among the newest", () => {
    const plan = planChatTrim({
      orderedDrops: drops(20),
      readerRange: { first: 15, last: 18 },
      pinnedSerials: new Set(),
      limits: LIMITS,
    });

    expect(serialsOf(plan!.dropIds)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(plan!.releasesOlderHistory).toBe(true);
    expect(plan!.historyGap).toBeNull();
  });

  it("keeps a window around a reader deep in history and the newest drops", () => {
    // 40 drops; the reader looks at serials 11-13 (indices 10-12).
    const plan = planChatTrim({
      orderedDrops: drops(40),
      readerRange: { first: 10, last: 12 },
      pinnedSerials: new Set(),
      limits: LIMITS,
    });
    const released = serialsOf(plan!.dropIds);

    // Window of cap - liveKeep = 7 drops around index 11: serials 9-15.
    expect(released).toEqual([
      ...[1, 2, 3, 4, 5, 6, 7, 8],
      ...Array.from({ length: 22 }, (_, index) => index + 16),
    ]);
    expect(plan!.releasesOlderHistory).toBe(true);
    // The released middle sits behind a gap between serials 15 and 38.
    expect(plan!.historyGap).toEqual({ newerThan: 15, olderThan: 38 });
  });

  it("starts the window at the oldest drop when the reader is at the top", () => {
    const plan = planChatTrim({
      orderedDrops: drops(40),
      readerRange: { first: 0, last: 2 },
      pinnedSerials: new Set(),
      limits: LIMITS,
    });

    expect(plan!.releasesOlderHistory).toBe(false);
    expect(plan!.historyGap).toEqual({ newerThan: 7, olderThan: 38 });
  });

  it("never releases pinned drops or pending sends, and keeps no hole around them", () => {
    const orderedDrops = drops(40);
    orderedDrops[38] = {
      id: "temp-1",
      serial_no: 39,
    } as unknown as Drop;
    const plan = planChatTrim({
      orderedDrops,
      readerRange: { first: 10, last: 12 },
      // An older pinned row (serial 3) and a newer one (serial 30).
      pinnedSerials: new Set([3, 30]),
      limits: LIMITS,
    });
    const released = serialsOf(
      plan!.dropIds.filter((id) => id.startsWith("drop-"))
    );

    expect(released).toEqual([1, 2, 31, 32, 33, 34, 35, 36, 37]);
    expect(plan!.dropIds).not.toContain("temp-1");
    expect(plan!.historyGap).toEqual({ newerThan: 30, olderThan: 38 });
  });

  it("releases nothing when pinned drops cover the whole excess", () => {
    expect(
      planChatTrim({
        orderedDrops: drops(14),
        readerRange: { first: 12, last: 13 },
        pinnedSerials: new Set([1]),
        limits: LIMITS,
      })
    ).toBeNull();
  });
});
