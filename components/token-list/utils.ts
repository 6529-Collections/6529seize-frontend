import type { TokenMetadata, TokenRange } from "@/components/nft-picker/NftPicker.types";

export const ROW_HEIGHT = 72;
export const GRID_ROW_HEIGHT = 380; // Taller rows for grid items
export const DEFAULT_OVERSCAN = 8;
export const BIGINT_ZERO = BigInt(0);
export const BIGINT_ONE = BigInt(1);
export const MAX_VIRTUAL_ITEM_COUNT = 100_000;
export const MAX_VIRTUAL_ITEM_COUNT_BIGINT = BigInt(MAX_VIRTUAL_ITEM_COUNT);
export const EMPTY_METADATA_MAP = new Map<string, TokenMetadata>();

export function getTotalCount(ranges: TokenRange[], tokens?: readonly { tokenId: bigint }[]): number {
  if (tokens) {
    return tokens.length;
  }
  let total = BIGINT_ZERO;
  for (const range of ranges) {
    const size = range.end - range.start + BIGINT_ONE;
    total += size;
    if (total >= MAX_VIRTUAL_ITEM_COUNT_BIGINT) {
      return MAX_VIRTUAL_ITEM_COUNT;
    }
  }
  return Number(total);
}

export function toDecimalString(value: bigint): string {
  return value.toString(10);
}

export function getVisibleWindowBounds(virtualItems: Array<{ index: number }>) {
  if (virtualItems.length === 0) {
    return { firstVisibleIndex: 0, lastVisibleIndex: -1 };
  }

  const firstVisibleIndex = virtualItems[0]?.index;
  const lastItem = virtualItems.at(-1)!;
  const lastVisibleIndex = lastItem.index;

  return { firstVisibleIndex, lastVisibleIndex };
}
