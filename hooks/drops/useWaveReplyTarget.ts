"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { isDropReplyTargetAvailable } from "@/helpers/waves/drop-reply-eligibility";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  ActiveDropAction,
  type ActiveDropState,
} from "@/types/dropInteractionTypes";
import { useCallback, useState } from "react";
import { useDropReplyAccess } from "./useDropReplyAccess";

/** Reply ownership follows the actor and wave; text drafts keep their own lifecycle. */
export function useWaveReplyTarget(
  wave: ApiWave,
  initialDrop: ApiDrop | null = null
) {
  const { canReply, canReplyToDrop, identityKey } = useDropReplyAccess(
    wave.id,
    wave
  );
  const scopeKey = JSON.stringify([wave.id, identityKey, initialDrop?.id]);
  const initialTarget: ActiveDropState | null =
    initialDrop && isDropReplyTargetAvailable(initialDrop, wave.id)
      ? { action: ActiveDropAction.REPLY, drop: initialDrop, partId: 1 }
      : null;
  const [selection, setSelection] = useState({
    scopeKey,
    activeDrop: initialTarget,
    accessWasAvailable: canReply,
  });

  // Reconcile before children render so a blocked composer never leaves a green
  // selection for a frame. Initial single-drop replies wait for access to load.
  if (selection.scopeKey !== scopeKey) {
    setSelection({
      scopeKey,
      activeDrop: initialTarget,
      accessWasAvailable: canReply,
    });
  } else if (
    selection.accessWasAvailable &&
    !canReply &&
    selection.activeDrop
  ) {
    setSelection({ ...selection, activeDrop: null });
  } else if (canReply && !selection.accessWasAvailable) {
    setSelection({ ...selection, accessWasAvailable: true });
  }

  const activeDrop =
    selection.scopeKey === scopeKey && canReply ? selection.activeDrop : null;
  const setActiveDrop = useCallback(
    (target: ActiveDropState | null) => {
      if (target && !canReplyToDrop(target.drop)) return;
      setSelection((current) =>
        current.scopeKey === scopeKey
          ? { scopeKey, activeDrop: target, accessWasAvailable: canReply }
          : current
      );
    },
    [canReply, canReplyToDrop, scopeKey]
  );

  return { activeDrop, setActiveDrop };
}
