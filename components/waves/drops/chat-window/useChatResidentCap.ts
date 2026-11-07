"use client";

import { useMyStreamActions } from "@/contexts/wave/MyStreamContext";
import type { Drop } from "@/helpers/waves/drop.helpers";
import type { Virtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef } from "react";
import type { ChatItem } from "./chatItems";
import {
  CHAT_RESIDENT_CAP,
  CHAT_RESIDENT_SLACK,
  planChatTrim,
} from "./chatTrim";

/** Trimming waits for scrolling to have stopped this long. */
export const CHAT_TRIM_IDLE_MS = 150;

/** The first and last drop in the rendered item range, as drop indices. */
export const toReaderDropRange = (
  items: readonly ChatItem[],
  range: { readonly startIndex: number; readonly endIndex: number }
): { readonly first: number; readonly last: number } | null => {
  let first: number | null = null;
  for (let index = range.startIndex; index < items.length; index++) {
    const item = items[index];
    if (item?.kind === "drop") {
      first = item.dropIndex;
      break;
    }
  }
  let last: number | null = null;
  for (
    let index = Math.min(range.endIndex, items.length - 1);
    index >= 0;
    index--
  ) {
    const item = items[index];
    if (item?.kind === "drop") {
      last = item.dropIndex;
      break;
    }
  }
  return first === null || last === null ? null : { first, last };
};

/**
 * Keeps at most `CHAT_RESIDENT_CAP` drops loaded for the wave (WAVES-PLAN
 * C5). Once scrolling has stopped for `CHAT_TRIM_IDLE_MS`, the far end is
 * released as its own update, so trimming never moves rows under a scroll.
 * Returns the virtualizer change handler that drives it.
 */
export function useChatResidentCap({
  waveId,
  orderedDrops,
  items,
  pinnedSerials,
}: {
  readonly waveId: string | undefined;
  readonly orderedDrops: readonly Drop[];
  readonly items: readonly ChatItem[];
  readonly pinnedSerials: ReadonlySet<number>;
}): (instance: Virtualizer<HTMLDivElement, HTMLDivElement>) => void {
  const { trimWaveDrops } = useMyStreamActions();
  const latestRef = useRef({
    waveId,
    orderedDrops,
    items,
    pinnedSerials,
    trimWaveDrops,
  });
  useEffect(() => {
    latestRef.current = {
      waveId,
      orderedDrops,
      items,
      pinnedSerials,
      trimWaveDrops,
    };
  }, [waveId, orderedDrops, items, pinnedSerials, trimWaveDrops]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    },
    []
  );

  return useCallback(
    (instance: Virtualizer<HTMLDivElement, HTMLDivElement>) => {
      if (instance.isScrolling) {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
      if (
        timerRef.current !== null ||
        latestRef.current.orderedDrops.length <=
          CHAT_RESIDENT_CAP + CHAT_RESIDENT_SLACK
      ) {
        return;
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const latest = latestRef.current;
        const range = instance.range;
        if (instance.isScrolling || !latest.waveId || !range) {
          return;
        }
        const readerRange = toReaderDropRange(latest.items, range);
        if (!readerRange) {
          return;
        }
        const plan = planChatTrim({
          orderedDrops: latest.orderedDrops,
          readerRange,
          pinnedSerials: latest.pinnedSerials,
        });
        if (plan) {
          latest.trimWaveDrops(latest.waveId, plan);
        }
      }, CHAT_TRIM_IDLE_MS);
    },
    []
  );
}
