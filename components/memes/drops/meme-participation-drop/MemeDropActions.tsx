import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import WaveDropActions from "../../../waves/drops/WaveDropActions";

interface MemeDropActionsProps {
  readonly drop: ExtendedDrop;
  readonly isMobile: boolean;
  readonly showReplyAndQuote: boolean;
  readonly onReply: () => void;
  readonly onQuote: () => void;
}

export default function MemeDropActions({
  drop,
  isMobile,
  showReplyAndQuote,
  onReply,
  onQuote,
}: MemeDropActionsProps) {
  if (isMobile || !showReplyAndQuote) {
    return null;
  }

  return (
    <WaveDropActions
        drop={drop}
        activePartIndex={0}
        onReply={onReply}
        onQuote={onQuote}
      />
  );
}
