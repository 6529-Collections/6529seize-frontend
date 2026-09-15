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
  const { mode, label, feedbackState, isSharing, onClick } =
    useWaveShareCopyAction({
      waveId: wave.id,
      waveName: wave.name,
      isDirectMessage: false,
    });
  let Icon = mode === "share" ? ShareIcon : LinkIcon;
  if (feedbackState !== "idle") {
    Icon = CheckIcon;
  }

  return (
    <Button
      type="button"
      variant="tertiary"
      size="sm"
      onClick={onClick}
      disabled={isSharing}
      aria-label={label}
      data-wave-link-action-mode={mode}
      className="!tw-border-iron-700"
    >
      <Icon aria-hidden="true" className="tw-size-4 tw-shrink-0" />
      <span aria-live="polite">{label}</span>
    </Button>
  );
}
