import React from "react";
import Button from "@/components/utils/button/Button";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropVoteState } from "@/hooks/drops/types";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { useWavesPausedReason } from "@/hooks/useWavesMovePhase";

interface VotingModalButtonProps {
  readonly drop: ExtendedDrop;
  readonly onClick: () => void;
  readonly className?: string | undefined;
  readonly children?: React.ReactNode;
}

const VotingModalButton: React.FC<VotingModalButtonProps> = ({
  drop,
  onClick,
  className,
  children,
}) => {
  const { canShowVote, voteState } = useDropInteractionRules(drop);
  const pausedReason = useWavesPausedReason();

  if (!canShowVote) {
    return null;
  }

  if (voteState === DropVoteState.PAUSED && pausedReason) {
    return (
      <span className="tw-inline-flex" title={pausedReason}>
        <Button
          type="button"
          variant="action"
          size="sm"
          disabled
          className={className}
        >
          <span className="tw-truncate">{children ?? "Vote"}</span>
          <span className="tw-sr-only">{pausedReason}</span>
        </Button>
      </span>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <Button
      type="button"
      variant="action"
      size="sm"
      onClick={handleClick}
      className={className}
    >
      <span className="tw-truncate">{children ?? "Vote"}</span>
    </Button>
  );
};

export default VotingModalButton;
