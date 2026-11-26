"use client";

import LazyEmojiPicker, {
  type EmojiPickerSelection,
} from "@/components/waves/LazyEmojiPicker";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropReaction } from "@/hooks/drops/useDropReaction";

export default function WaveDropMobileMenuReactionPicker({
  drop,
  onDismiss,
  onReactionSuccess,
}: {
  readonly drop: ExtendedDrop;
  readonly onDismiss: () => void;
  readonly onReactionSuccess: () => void;
}) {
  const { react, hasReactionSession } = useDropReaction(drop, {
    source: "picker",
    onSuccess: onReactionSuccess,
  });

  const handleEmojiSelect = (emoji: EmojiPickerSelection) => {
    void react(`:${emoji.id ?? ""}:`);
    onDismiss();
  };

  if (!hasReactionSession) return null;

  return (
    <div
      className="tw-flex tw-size-full tw-items-center tw-justify-center"
      onTouchMove={(event) => event.stopPropagation()}
    >
      <LazyEmojiPicker onEmojiSelect={handleEmojiSelect} autoFocus />
    </div>
  );
}
