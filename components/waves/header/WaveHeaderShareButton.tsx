"use client";

import { CheckIcon, LinkIcon, ShareIcon } from "@heroicons/react/24/outline";
import Button from "@/components/utils/button/Button";
import {
  COMPACT_ACTION_BUTTON_SIZE_CLASS,
  COMPACT_ACTION_ICON_CLASS,
  COMPACT_ACTION_ICON_STROKE_WIDTH,
  COMPACT_ACTION_TOUCH_TARGET_CLASS,
} from "@/components/utils/button/compactActionButtonStyles";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveShareCopyAction } from "@/hooks/waves/useWaveShareCopyAction";

export default function WaveHeaderShareButton({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const isDirectMessage = wave.chat.scope.group?.is_direct_message ?? false;
  const { mode, actionLabel, label, feedbackState, isSharing, onClick } =
    useWaveShareCopyAction({
      waveId: wave.id,
      waveName: wave.name,
      isDirectMessage,
    });
  let Icon = mode === "share" ? ShareIcon : LinkIcon;
  if (feedbackState !== "idle") {
    Icon = CheckIcon;
  }
  if (isDirectMessage) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="tertiaryStrong"
        size={null}
        onClick={onClick}
        disabled={isSharing}
        aria-label={actionLabel}
        data-wave-link-action-mode={mode}
        className={`${COMPACT_ACTION_TOUCH_TARGET_CLASS} ${COMPACT_ACTION_BUTTON_SIZE_CLASS}`}
      >
        <Icon
          aria-hidden="true"
          className={COMPACT_ACTION_ICON_CLASS}
          strokeWidth={COMPACT_ACTION_ICON_STROKE_WIDTH}
        />
        <span aria-hidden="true" className="tw-font-medium">
          {label}
        </span>
      </Button>
      <span role="status" className="tw-sr-only">
        {feedbackState === "idle" ? "" : label}
      </span>
    </>
  );
}
