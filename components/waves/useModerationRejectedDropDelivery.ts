import { useCallback, useEffect, useRef } from "react";

import type { useMyStream } from "@/contexts/wave/MyStreamContext";
import {
  DropClientDeliveryState,
  DropSize,
} from "@/helpers/waves/drop.helpers";

export const useModerationRejectedDropDelivery = ({
  applyOptimisticDropUpdate,
  processDropRemoved,
  waveId,
}: {
  readonly applyOptimisticDropUpdate: ReturnType<
    typeof useMyStream
  >["applyOptimisticDropUpdate"];
  readonly processDropRemoved: ReturnType<
    typeof useMyStream
  >["processDropRemoved"];
  readonly waveId: string;
}) => {
  const activeWaveIdRef = useRef<string | null>(waveId);
  const rejectedDropIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    activeWaveIdRef.current = waveId;
    const rejectedDropIds = rejectedDropIdsRef.current;

    return () => {
      activeWaveIdRef.current = null;
      const dropIds = Array.from(rejectedDropIds);
      rejectedDropIds.clear();
      dropIds.forEach((dropId) => processDropRemoved(waveId, dropId));
    };
  }, [processDropRemoved, waveId]);

  return useCallback(
    ({
      dropId,
      rejectedWaveId,
    }: {
      dropId: string;
      rejectedWaveId: string;
    }) => {
      if (activeWaveIdRef.current !== rejectedWaveId) {
        return false;
      }

      const updateResult = applyOptimisticDropUpdate({
        waveId: rejectedWaveId,
        dropId,
        update: (optimisticDrop) => {
          if (optimisticDrop.type !== DropSize.FULL) {
            return optimisticDrop;
          }

          return {
            ...optimisticDrop,
            clientDeliveryState: DropClientDeliveryState.MODERATION_REJECTED,
          };
        },
      });
      if (updateResult === null) {
        return false;
      }

      rejectedDropIdsRef.current.add(dropId);
      return true;
    },
    [applyOptimisticDropUpdate]
  );
};
