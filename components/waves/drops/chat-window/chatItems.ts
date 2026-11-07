import type { WaveHistoryGap as HistoryGap } from "@/contexts/wave/hooks/types";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import type { BoostedDropsDisplayPreference } from "@/types/boosted-drops.types";
import {
  findHistoryGapBefore,
  getBoostCardKey,
} from "@/components/drops/view/dropsListShared";

/**
 * The windowed chat's items, oldest first. A drop row is keyed by the drop's
 * stable key; the decorations before it (history gap, boosted card, unread
 * divider) are items of their own with synthetic keys, in the order
 * `DropsList` renders them.
 */
export type ChatItem =
  | {
      readonly kind: "drop";
      readonly key: string;
      readonly drop: Drop;
      readonly dropIndex: number;
    }
  | { readonly kind: "gap"; readonly key: string; readonly gap: HistoryGap }
  | {
      readonly kind: "boost";
      readonly key: string;
      readonly boostedDrop: ApiDrop;
      readonly boostedIndex: number;
      readonly compact: boolean;
    }
  | { readonly kind: "unread"; readonly key: string; readonly serialNo: number };

export const getChatGapKey = (gap: HistoryGap): string =>
  `gap-${gap.newerThan}`;

export const getChatUnreadKey = (serialNo: number): string =>
  `unread-divider-${serialNo}`;

export function buildChatItems({
  orderedDrops,
  historyGaps,
  includeHistoryGaps,
  boostCardAtIndex,
  boostedDrops,
  boostedDropsDisplayPreference,
  unreadDividerSerialNo,
}: {
  readonly orderedDrops: readonly Drop[];
  readonly historyGaps: readonly HistoryGap[] | undefined;
  readonly includeHistoryGaps: boolean;
  readonly boostCardAtIndex: ReadonlyMap<number, number>;
  readonly boostedDrops: readonly ApiDrop[] | undefined;
  readonly boostedDropsDisplayPreference: BoostedDropsDisplayPreference;
  readonly unreadDividerSerialNo: number | null | undefined;
}): ChatItem[] {
  const items: ChatItem[] = [];
  orderedDrops.forEach((drop, dropIndex) => {
    const previousDrop = orderedDrops[dropIndex - 1] ?? null;
    const gap = includeHistoryGaps
      ? findHistoryGapBefore(historyGaps, drop, previousDrop)
      : undefined;
    if (gap) {
      items.push({ kind: "gap", key: getChatGapKey(gap), gap });
    }
    const boostedIndex = boostCardAtIndex.get(dropIndex);
    const boostedDrop =
      boostedIndex === undefined ? undefined : boostedDrops?.[boostedIndex];
    if (boostedIndex !== undefined && boostedDrop) {
      items.push({
        kind: "boost",
        key: getBoostCardKey(
          boostedIndex,
          boostedDrop,
          boostedDropsDisplayPreference
        ),
        boostedDrop,
        boostedIndex,
        compact: boostedDropsDisplayPreference === "compact",
      });
    }
    if (
      unreadDividerSerialNo !== null &&
      unreadDividerSerialNo !== undefined &&
      drop.serial_no === unreadDividerSerialNo
    ) {
      items.push({
        kind: "unread",
        key: getChatUnreadKey(unreadDividerSerialNo),
        serialNo: unreadDividerSerialNo,
      });
    }
    items.push({ kind: "drop", key: drop.stableKey, drop, dropIndex });
  });
  return items;
}

/**
 * Items that stay mounted outside the rendered range: the jump or shared-link
 * target, the unread divider with its first unread row, every history gap
 * (its button loads the gap when it comes into view) and the row holding
 * keyboard focus, so focus is never lost to an unmount.
 */
export function getPinnedChatItemIndices(
  items: readonly ChatItem[],
  {
    targetSerialNo,
    unreadDividerSerialNo,
    focusedKey,
  }: {
    readonly targetSerialNo: number | null;
    readonly unreadDividerSerialNo: number | null | undefined;
    readonly focusedKey: string | null;
  }
): number[] {
  const pinned: number[] = [];
  items.forEach((item, index) => {
    if (item.key === focusedKey || item.kind === "gap" || item.kind === "unread") {
      pinned.push(index);
      return;
    }
    if (
      item.kind === "drop" &&
      (item.drop.serial_no === targetSerialNo ||
        item.drop.serial_no === unreadDividerSerialNo)
    ) {
      pinned.push(index);
    }
  });
  return pinned;
}

/** The rendered range plus the pinned items, in list order. */
export function mergePinnedIndices(
  rangeIndices: readonly number[],
  pinnedIndices: readonly number[],
  count: number
): number[] {
  if (pinnedIndices.length === 0) {
    return [...rangeIndices];
  }
  const merged = new Set(rangeIndices);
  for (const index of pinnedIndices) {
    if (index >= 0 && index < count) {
      merged.add(index);
    }
  }
  return [...merged].sort((left, right) => left - right);
}

// Estimates before a row is measured. Rows are measured as they render; a
// closer estimate only means less correction while scrolling into history.
const FULL_DROP_BASE_PX = 72;
const TEXT_LINE_PX = 20;
const TEXT_CHARS_PER_LINE = 60;
const MAX_ESTIMATED_TEXT_LINES = 12;
const LIGHT_DROP_PX = 104;
const MEDIA_MAX_HEIGHT_PX = 256;
const MEDIA_MAX_WIDTH_PX = 360;
const MEDIA_FALLBACK_PX = 200;
const MEDIA_GAP_PX = 8;
const GAP_ITEM_PX = 64;
const UNREAD_ITEM_PX = 32;
const BOOST_COMPACT_PX = 56;
const BOOST_CARD_PX = 220;

const readDimension = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;

/**
 * The height a media item takes in a chat row. Uses the stored intrinsic size
 * (R11-2 `width` and `height` on the drop's media) when the API sends it, and
 * a typical media height otherwise.
 */
export function estimateChatMediaHeight(media: unknown): number {
  if (typeof media !== "object" || media === null) {
    return MEDIA_FALLBACK_PX;
  }
  const width = readDimension((media as { width?: unknown }).width);
  const height = readDimension((media as { height?: unknown }).height);
  if (width === null || height === null) {
    return MEDIA_FALLBACK_PX;
  }
  const scale = Math.min(1, MEDIA_MAX_WIDTH_PX / width);
  return Math.round(Math.min(MEDIA_MAX_HEIGHT_PX, height * scale));
}

const estimateFullDropHeight = (drop: ExtendedDrop) => {
  let height = FULL_DROP_BASE_PX;
  for (const part of drop.parts) {
    const characters = part.content?.length ?? 0;
    const lines = Math.min(
      MAX_ESTIMATED_TEXT_LINES,
      Math.ceil(characters / TEXT_CHARS_PER_LINE)
    );
    height += Math.max(0, lines - 1) * TEXT_LINE_PX;
    for (const media of part.media) {
      height += estimateChatMediaHeight(media) + MEDIA_GAP_PX;
    }
  }
  return height;
};

export function estimateChatItemSize(item: ChatItem | undefined): number {
  switch (item?.kind) {
    case "drop":
      return item.drop.type === DropSize.FULL
        ? estimateFullDropHeight(item.drop)
        : LIGHT_DROP_PX;
    case "gap":
      return GAP_ITEM_PX;
    case "unread":
      return UNREAD_ITEM_PX;
    case "boost":
      return item.compact ? BOOST_COMPACT_PX : BOOST_CARD_PX;
    default:
      return FULL_DROP_BASE_PX;
  }
}
