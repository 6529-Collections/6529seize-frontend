import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import WaveDropActions from "@/components/waves/drops/WaveDropActions";

interface MemeDropActionsProps {
  readonly drop: ExtendedDrop;
  readonly isMobile: boolean;
  readonly showReplyAndQuote: boolean;
  readonly onReply: () => void;
  /** @deprecated Quote functionality has been removed - this prop is ignored */
  readonly onQuote?: (() => void) | undefined;
}

export default function MemeDropActions({
  drop,
  isMobile,
  showReplyAndQuote,
  onReply,
}: MemeDropActionsProps) {
  if (isMobile || !showReplyAndQuote) {
    return null;
  }

  return (
    <WaveDropActions
      drop={drop}
      activePartIndex={0}
      onReply={onReply}
      // No need to set showVoting=false here as WaveDropActions already has logic
      // to hide voting for memes participation drops
    />
  );
}
