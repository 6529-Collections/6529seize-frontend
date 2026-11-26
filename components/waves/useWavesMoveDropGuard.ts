import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  useWaveMovedToChain,
  useWavesWritesPaused,
} from "@/hooks/useWavesMovePhase";
import { t, type MessageKey } from "@/i18n/messages";
import { WavesWritePausedError } from "@/lib/waves-move/writeGuard";
import type { DropMutationBody } from "./create-drop-content/drop-submission.types";
import { removeTemporaryThreadReply } from "./drops/reply-threads/pending-replies";

/**
 * The composer's part of the move to the 6529 Network: entries and polls
 * pause, chat keeps working. A draft in drop mode keeps its mode across the
 * freeze, so sending refuses it instead of posting it as chat.
 */
export function useWavesMoveDropGuard(
  processDropRemoved: (waveId: string, dropId: string) => void
) {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const queryClient = useQueryClient();
  // Entries open on the 6529 Network at the switch-on; new polls stay
  // closed until they open there too.
  const entriesPausedForMove = useWavesWritesPaused("entries");
  const pollsPausedForMove = useWavesWritesPaused();
  // In a wave that moved, a poll is refused because new polls aren't open
  // there yet, not because of a pause.
  const pollsNotOpenHere = useWaveMovedToChain() && pollsPausedForMove;

  const showPaused = useCallback(
    (key: MessageKey) => {
      setToast({ message: t(locale, key), type: "error" });
    },
    [locale, setToast]
  );

  /** True, with the paused toast, when drop mode can't open now. */
  const refuseDropMode = useCallback((): boolean => {
    if (!entriesPausedForMove) {
      return false;
    }
    showPaused("wavesMove.paused");
    return true;
  }, [entriesPausedForMove, showPaused]);

  /**
   * True when the move refuses this send. A sender that already showed the
   * post (curation, quorum) gets it taken back, as for a failed send.
   */
  const refusePausedDrop = useCallback(
    (dropRequest: DropMutationBody): boolean => {
      const { drop } = dropRequest;
      const isEntry = drop.drop_type !== ApiDropType.Chat;
      const entryRefused = entriesPausedForMove && isEntry;
      if (!entryRefused && !(pollsPausedForMove && !!drop.poll)) {
        return false;
      }
      const optimisticId = dropRequest.dropId;
      if (optimisticId) {
        setTimeout(() => {
          if (drop.reply_to) {
            removeTemporaryThreadReply(queryClient, drop.wave_id, optimisticId);
          }
          processDropRemoved(drop.wave_id, optimisticId);
        }, 0);
      }
      dropRequest.onError?.(new WavesWritePausedError());
      showPaused(
        !entryRefused && pollsNotOpenHere
          ? "wavesMove.pollsNotOpen"
          : "wavesMove.paused"
      );
      return true;
    },
    [
      entriesPausedForMove,
      pollsNotOpenHere,
      pollsPausedForMove,
      processDropRemoved,
      queryClient,
      showPaused,
    ]
  );

  return { entriesPausedForMove, refuseDropMode, refusePausedDrop };
}
