"use client";

import React, { useCallback, useState } from "react";
import { isDropReplyTargetAvailable } from "@/helpers/waves/drop-reply-eligibility";
import { useDropReplyAccess } from "@/hooks/drops/useDropReplyAccess";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import BrainContent from "../content/BrainContent";
import Notifications from "./index";

const NotificationsContainer: React.FC = () => {
  const [selection, setSelection] = useState<{
    readonly identityKey: string;
    readonly target: ActiveDropState;
  } | null>(null);
  const waveId = selection?.target.drop.wave.id ?? "";
  const { canReply, identityKey } = useDropReplyAccess(waveId);
  const activeDrop =
    selection?.identityKey === identityKey &&
    canReply &&
    isDropReplyTargetAvailable(selection.target.drop, waveId)
      ? selection.target
      : null;

  // Notification cards establish access before handing off a target. Retire
  // that handoff when its actor or access changes, without touching drafts.
  if (selection && !activeDrop) setSelection(null);

  const setActiveDrop = useCallback(
    (target: ActiveDropState | null) => {
      setSelection((current) => {
        if (current && current.identityKey !== identityKey) return current;
        return target ? { identityKey, target } : null;
      });
    },
    [identityKey]
  );
  const onCancelReplyQuote = useCallback(() => {
    setActiveDrop(null);
  }, [setActiveDrop]);

  return (
    <BrainContent
      activeDrop={activeDrop}
      onCancelReplyQuote={onCancelReplyQuote}
    >
      <Notifications activeDrop={activeDrop} setActiveDrop={setActiveDrop} />
    </BrainContent>
  );
};

export default NotificationsContainer;
