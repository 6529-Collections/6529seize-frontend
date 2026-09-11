import React from "react";
import Button from "@/components/utils/button/Button";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";

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
  const { canShowVote } = useDropInteractionRules(drop);

  if (!canShowVote) {
    return null;
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
