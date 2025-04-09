import React from "react";
import { ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { useDropInteractionRules } from "../../hooks/drops/useDropInteractionRules";

interface VotingModalButtonProps {
  readonly drop: ExtendedDrop;
  readonly onClick: () => void;
  readonly className?: string;
}

export const VotingModalButton: React.FC<VotingModalButtonProps> = ({
  drop,
  onClick,
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
    <button
      type="button"
      onClick={handleClick}
      className="tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-px-3 tw-py-1.5 
        tw-rounded-md tw-bg-primary-500 tw-border tw-border-solid tw-border-primary-500 tw-text-white tw-shadow-sm tw-text-xs tw-font-semibold
        hover:tw-bg-primary-600 hover:tw-shadow-md tw-transition-all tw-duration-150 tw-ease-in-out
        active:tw-transform active:tw-translate-y-0.5 active:tw-shadow-sm tw-whitespace-nowrap"
    >
      Vote for this!
    </button>
  );
};

export default VotingModalButton;
