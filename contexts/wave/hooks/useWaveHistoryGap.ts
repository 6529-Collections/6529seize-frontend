"use client";

import { useCallback, useRef } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DropSize } from "@/helpers/waves/drop.helpers";
import {
  fetchNewestWaveMessages,
  fetchWaveMessages,
} from "../utils/wave-messages-utils";
import { reconcileWaveSnapshot } from "../utils/wave-resume";
import type {
  WaveDataStoreUpdater,
  WaveHistoryGap,
  WaveHistoryGapDirection,
} from "./types";
import type { WaveAbortTrigger } from "./useWaveAbortController";

const GAP_PAGE_LIMIT = 50;

const fetchGapPage = async (
  waveId: string,
  gap: WaveHistoryGap,
  direction: WaveHistoryGapDirection,
  signal: AbortSignal
): Promise<ApiDrop[] | null> =>
  direction === "newer"
    ? (
        await fetchNewestWaveMessages(
          waveId,
          gap.newerThan,
          GAP_PAGE_LIMIT,
          signal
        )
      ).drops
    : fetchWaveMessages(waveId, gap.olderThan, signal, undefined, {
        limit: GAP_PAGE_LIMIT,
      });

/**
 * Returns what is left of a gap after one page, undefined when the page does
 * not belong to the gap, or null when the page exhausted it. Successful empty
 * pages exhaust the interval; request failures never reach this.
 */
const getRemainingHistoryGap = (
  gap: WaveHistoryGap,
  serialNos: readonly number[],
  direction: WaveHistoryGapDirection
): WaveHistoryGap | null | undefined => {
  if (serialNos.length === 0) return null;
  const isFullPage = serialNos.length === GAP_PAGE_LIMIT;
  if (direction === "newer") {
    const newest = Math.max(...serialNos);
    if (newest <= gap.newerThan) return undefined;
    return isFullPage && newest < gap.olderThan
      ? { ...gap, newerThan: newest }
      : null;
  }
  const oldest = Math.min(...serialNos);
  if (oldest >= gap.olderThan) return undefined;
  return isFullPage && oldest > gap.newerThan
    ? { ...gap, olderThan: oldest }
    : null;
};

export function useWaveHistoryGap({
  getData,
  updateData,
  createController,
  cleanupController,
  cancelFetch,
}: Pick<WaveDataStoreUpdater, "getData" | "updateData"> & {
  readonly createController: (key: string) => AbortController;
  readonly cleanupController: (
    key: string,
    controller: AbortController
  ) => void;
  readonly cancelFetch: (key: string, trigger: WaveAbortTrigger) => void;
}) {
  const inFlight = useRef(
    new Map<
      string,
      {
        controller: AbortController;
        waveId: string;
        promise: Promise<ApiDrop[] | null>;
      }
    >()
  );
  const fetchHistoryGap = useCallback(
    (
      waveId: string,
      gap: WaveHistoryGap,
      direction: WaveHistoryGapDirection = "older"
    ) => {
      const key = `${waveId}-gap-${gap.newerThan}-${gap.olderThan}-${direction}`;
      const pending = inFlight.current.get(key);
      if (pending && !pending.controller.signal.aborted) return pending.promise;
      const before = getData(waveId);
      if (!before) return Promise.resolve(null);
      const controller = createController(key);
      const promise = (async () => {
        try {
          const drops = await fetchGapPage(
            waveId,
            gap,
            direction,
            controller.signal
          );
          if (controller.signal.aborted || drops === null) return null;
          const current = getData(waveId);
          if (
            !current?.historyGaps?.some(
              (item) =>
                item.olderThan === gap.olderThan &&
                item.newerThan === gap.newerThan
            )
          )
            return null;
          const remaining = getRemainingHistoryGap(
            gap,
            drops.map((drop) => drop.serial_no),
            direction
          );
          if (remaining === undefined) return null;
          const historyGaps = current.historyGaps.filter(
            (item) =>
              item.olderThan !== gap.olderThan ||
              item.newerThan !== gap.newerThan
          );
          if (remaining) {
            historyGaps.push(remaining);
          }
          const gapDrops = drops.filter(
            (drop) =>
              drop.serial_no > gap.newerThan && drop.serial_no < gap.olderThan
          );
          updateData({
            key: waveId,
            historyGaps,
            drops: reconcileWaveSnapshot(
              gapDrops,
              before.drops,
              current.drops
            ).map((drop) => ({
              ...drop,
              type: DropSize.FULL,
              stableKey: drop.id,
              stableHash: drop.id,
            })),
          });
          return gapDrops;
        } catch {
          return null;
        } finally {
          cleanupController(key, controller);
          if (inFlight.current.get(key)?.controller === controller) {
            inFlight.current.delete(key);
          }
        }
      })();
      inFlight.current.set(key, { controller, promise, waveId });
      return promise;
    },
    [cleanupController, createController, getData, updateData]
  );
  const cancelHistoryGaps = useCallback(
    (waveId: string) => {
      for (const [key, request] of inFlight.current) {
        if (request.waveId === waveId) cancelFetch(key, "pagination_cancelled");
      }
    },
    [cancelFetch]
  );
  return { fetchHistoryGap, cancelHistoryGaps };
}
