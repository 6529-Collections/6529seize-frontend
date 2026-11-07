import {
  buildChatItems,
  estimateChatItemSize,
  estimateChatMediaHeight,
  getPinnedChatItemIndices,
  mergePinnedIndices,
  type ChatItem,
} from "@/components/waves/drops/chat-window/chatItems";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DropSize, type Drop } from "@/helpers/waves/drop.helpers";

const fullDrop = (
  serial: number,
  parts: Array<{ content?: string | null; media?: unknown[] }> = [{}]
): Drop =>
  ({
    id: `drop-${serial}`,
    serial_no: serial,
    stableKey: `key-${serial}`,
    stableHash: `hash-${serial}`,
    type: DropSize.FULL,
    wave: { id: "wave" },
    parts: parts.map((part, index) => ({
      part_id: index + 1,
      content: part.content ?? null,
      media: part.media ?? [],
    })),
  }) as unknown as Drop;

const lightDrop = (serial: number): Drop =>
  ({
    id: `drop-${serial}`,
    serial_no: serial,
    stableKey: `key-${serial}`,
    stableHash: `hash-${serial}`,
    type: DropSize.LIGHT,
    waveId: "wave",
  }) as unknown as Drop;

const boosted = { id: "boosted-1", serial_no: 1 } as ApiDrop;

const kindsAndKeys = (items: readonly ChatItem[]) =>
  items.map((item) => `${item.kind}:${item.key}`);

describe("buildChatItems", () => {
  const orderedDrops = [1, 2, 3, 4].map((serial) => fullDrop(serial));

  it("keys drop rows by stable key and puts each decoration before its drop", () => {
    const items = buildChatItems({
      orderedDrops,
      historyGaps: [{ newerThan: 2, olderThan: 3 }],
      includeHistoryGaps: true,
      boostCardAtIndex: new Map([[2, 0]]),
      boostedDrops: [boosted],
      boostedDropsDisplayPreference: "compact",
      unreadDividerSerialNo: 3,
    });

    expect(kindsAndKeys(items)).toEqual([
      "drop:key-1",
      "drop:key-2",
      "gap:gap-2",
      "boost:boost-card-0-boosted-1-compact",
      "unread:unread-divider-3",
      "drop:key-3",
      "drop:key-4",
    ]);
    expect(items[3]).toMatchObject({ kind: "boost", compact: true });
    expect(items[5]).toMatchObject({ kind: "drop", dropIndex: 2 });
  });

  it("leaves out history gaps when the list has no wave", () => {
    const items = buildChatItems({
      orderedDrops,
      historyGaps: [{ newerThan: 2, olderThan: 3 }],
      includeHistoryGaps: false,
      boostCardAtIndex: new Map(),
      boostedDrops: undefined,
      boostedDropsDisplayPreference: "expanded",
      unreadDividerSerialNo: null,
    });

    expect(items.map((item) => item.kind)).toEqual([
      "drop",
      "drop",
      "drop",
      "drop",
    ]);
  });

  it("skips a boost position whose boosted drop is missing", () => {
    const items = buildChatItems({
      orderedDrops,
      historyGaps: undefined,
      includeHistoryGaps: true,
      boostCardAtIndex: new Map([[1, 4]]),
      boostedDrops: [boosted],
      boostedDropsDisplayPreference: "expanded",
      unreadDividerSerialNo: undefined,
    });

    expect(items.some((item) => item.kind === "boost")).toBe(false);
  });
});

describe("getPinnedChatItemIndices", () => {
  const items = buildChatItems({
    orderedDrops: [1, 2, 3, 4, 5, 6].map((serial) => fullDrop(serial)),
    historyGaps: [{ newerThan: 1, olderThan: 2 }],
    includeHistoryGaps: true,
    boostCardAtIndex: new Map(),
    boostedDrops: undefined,
    boostedDropsDisplayPreference: "expanded",
    unreadDividerSerialNo: 4,
  });
  // drop 1, gap, drop 2, drop 3, unread, drop 4, drop 5, drop 6

  it("pins the jump target, the unread divider with its row, gaps and the focused row", () => {
    expect(
      getPinnedChatItemIndices(items, {
        targetSerialNo: 6,
        unreadDividerSerialNo: 4,
        focusedKey: "key-3",
      })
    ).toEqual([1, 3, 4, 5, 7]);
  });

  it("pins only the gaps when nothing else needs to stay mounted", () => {
    expect(
      getPinnedChatItemIndices(items, {
        targetSerialNo: null,
        unreadDividerSerialNo: null,
        focusedKey: null,
      })
    ).toEqual([1, 4]);
  });
});

describe("mergePinnedIndices", () => {
  it("adds pinned items to the rendered range in list order", () => {
    expect(mergePinnedIndices([40, 41, 42], [3, 41, 90], 100)).toEqual([
      3, 40, 41, 42, 90,
    ]);
  });

  it("ignores pins outside the list", () => {
    expect(mergePinnedIndices([0, 1], [-1, 7], 5)).toEqual([0, 1]);
  });

  it("returns the range as is without pins", () => {
    const range = [5, 6, 7];
    expect(mergePinnedIndices(range, [], 10)).toEqual(range);
  });
});

describe("chat item size estimates", () => {
  it("uses the media's stored size (R11-2) when the API sends it", () => {
    // Scaled to the chat media width, then capped at the media height limit.
    expect(estimateChatMediaHeight({ width: 720, height: 360 })).toBe(180);
    expect(estimateChatMediaHeight({ width: 200, height: 100 })).toBe(100);
    expect(estimateChatMediaHeight({ width: 400, height: 2000 })).toBe(256);
  });

  it("falls back to a typical media height without a usable size", () => {
    expect(estimateChatMediaHeight({ url: "a.png" })).toBe(200);
    expect(estimateChatMediaHeight({ width: 0, height: 100 })).toBe(200);
    expect(estimateChatMediaHeight({ width: "720", height: 360 })).toBe(200);
    expect(estimateChatMediaHeight(null)).toBe(200);
  });

  it("grows a full drop's estimate with its text and media", () => {
    const short = estimateChatItemSize({
      kind: "drop",
      key: "a",
      dropIndex: 0,
      drop: fullDrop(1, [{ content: "hi" }]),
    });
    const long = estimateChatItemSize({
      kind: "drop",
      key: "b",
      dropIndex: 1,
      drop: fullDrop(2, [{ content: "x".repeat(300) }]),
    });
    const withMedia = estimateChatItemSize({
      kind: "drop",
      key: "c",
      dropIndex: 2,
      drop: fullDrop(3, [
        { content: "hi", media: [{ width: 720, height: 360 }] },
      ]),
    });

    expect(long).toBeGreaterThan(short);
    expect(withMedia).toBe(short + 180 + 8);
  });

  it("estimates placeholders and decorations", () => {
    expect(
      estimateChatItemSize({
        kind: "drop",
        key: "l",
        dropIndex: 0,
        drop: lightDrop(1),
      })
    ).toBe(104);
    expect(
      estimateChatItemSize({
        kind: "gap",
        key: "g",
        gap: { newerThan: 1, olderThan: 2 },
      })
    ).toBe(64);
    expect(
      estimateChatItemSize({ kind: "unread", key: "u", serialNo: 1 })
    ).toBe(32);
    expect(
      estimateChatItemSize({
        kind: "boost",
        key: "b",
        boostedDrop: boosted,
        boostedIndex: 0,
        compact: true,
      })
    ).toBeLessThan(
      estimateChatItemSize({
        kind: "boost",
        key: "b",
        boostedDrop: boosted,
        boostedIndex: 0,
        compact: false,
      })
    );
    expect(estimateChatItemSize(undefined)).toBe(72);
  });
});
