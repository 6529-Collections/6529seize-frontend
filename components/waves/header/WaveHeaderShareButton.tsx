"use client";

import { CheckIcon, LinkIcon, ShareIcon } from "@heroicons/react/24/outline";
import Button from "@/components/utils/button/Button";
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
        variant="tertiary"
        size="sm"
        onClick={onClick}
        disabled={isSharing}
        aria-label={actionLabel}
        data-wave-link-action-mode={mode}
        className="!tw-border-iron-700"
      >
        <Icon aria-hidden="true" className="tw-size-4 tw-shrink-0" />
        <span aria-hidden="true">{label}</span>
      </Button>
      <span role="status" className="tw-sr-only">
        {feedbackState === "idle" ? "" : label}
      </span>
    </>
  );
}
