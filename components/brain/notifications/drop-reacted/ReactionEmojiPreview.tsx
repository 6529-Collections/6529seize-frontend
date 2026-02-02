"use client";

import { useEmoji } from "@/contexts/EmojiContext";

interface ReactionEmojiPreviewProps {
  readonly rawId: string;
}

export default function ReactionEmojiPreview({
  rawId,
}: ReactionEmojiPreviewProps) {
  const { findCustomEmoji, findNativeEmoji } = useEmoji();

  const circleClass =
    "tw-relative tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-iron-950 tw-p-1.5 tw-ring-1 tw-ring-inset tw-ring-iron-800";

  const custom = findCustomEmoji(rawId);
  if (custom) {
    return (
      <div className={circleClass}>
        <img
          src={custom.skins[0]?.src}
          alt={rawId}
          className="tw-max-h-5 tw-max-w-5 tw-object-contain"
        />
      </div>
    );
  }

  const native = findNativeEmoji(rawId);
  if (native) {
    return (
      <div className={circleClass}>
        <span className="tw-flex tw-max-h-5 tw-max-w-5 tw-items-center tw-justify-center tw-text-xl tw-leading-none">
          {native.skins[0]?.native}
        </span>
      </div>
    );
  }

  return null;
}
