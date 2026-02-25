import WaveDropActions from "@/components/waves/drops/WaveDropActions";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface MemeDropActionsProps {
  readonly drop: ExtendedDrop;
  readonly isMobile: boolean;
  readonly showReplyAndQuote: boolean;
  readonly onReply: () => void;
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
