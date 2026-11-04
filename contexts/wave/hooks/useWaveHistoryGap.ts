"use client";

import { useCallback, useRef } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { fetchWaveMessages } from "../utils/wave-messages-utils";
import { reconcileWaveSnapshot } from "../utils/wave-resume";
import type { WaveDataStoreUpdater, WaveHistoryGap } from "./types";

const GAP_PAGE_LIMIT = 50;

export function useWaveHistoryGap({
  getData,
  updateData,
  createController,
  cleanupController,
}: Pick<WaveDataStoreUpdater, "getData" | "updateData"> & {
  readonly createController: (key: string) => AbortController;
  readonly cleanupController: (
    key: string,
    controller: AbortController
  ) => void;
}) {
  const inFlight = useRef(
    new Map<
      string,
      {
        controller: AbortController;
        promise: Promise<ApiDrop[] | null>;
      }
    >()
  );
  return useCallback(
    (waveId: string, gap: WaveHistoryGap) => {
      const key = `${waveId}-gap`;
      const pending = inFlight.current.get(key);
      if (pending && !pending.controller.signal.aborted) return pending.promise;
      const before = getData(waveId);
      if (!before) return Promise.resolve(null);
      const controller = createController(key);
      const promise = (async () => {
        try {
          const drops = await fetchWaveMessages(
            waveId,
            gap.olderThan,
            controller.signal,
            undefined,
            { limit: GAP_PAGE_LIMIT }
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
          const oldest = Math.min(...drops.map((drop) => drop.serial_no));
          if (drops.length > 0 && oldest >= gap.olderThan) return null;
          const historyGaps = current.historyGaps.filter(
            (item) =>
              item.olderThan !== gap.olderThan ||
              item.newerThan !== gap.newerThan
          );
          if (drops.length === GAP_PAGE_LIMIT && oldest > gap.newerThan) {
            historyGaps.push({ ...gap, olderThan: oldest });
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
      inFlight.current.set(key, { controller, promise });
      return promise;
    },
    [cleanupController, createController, getData, updateData]
  );
}
