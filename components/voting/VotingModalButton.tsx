import React from "react";
import { ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { useDropInteractionRules } from "../../hooks/drops/useDropInteractionRules";

interface VotingModalButtonProps {
  readonly drop: ExtendedDrop;
  readonly onClick: () => void;
  readonly variant?: "default" | "subtle"; // Add variant prop for styling flexibility
}

export const VotingModalButton: React.FC<VotingModalButtonProps> = ({
  drop,
  onClick,
  variant = "default",
}) => {
  const { canShowVote } = useDropInteractionRules(drop);

  if (!canShowVote) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const baseClasses = "tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-px-3 tw-py-1.5 tw-rounded-md tw-border tw-border-solid tw-shadow-sm tw-text-xs tw-whitespace-nowrap tw-transition-all tw-duration-150 tw-ease-in-out active:tw-transform active:tw-translate-y-0.5 active:tw-shadow-sm";
  
  const variantClasses = variant === "subtle"
    ? "tw-bg-iron-900 tw-border-iron-700 tw-text-iron-200 tw-font-medium hover:tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600 hover:tw-shadow-md group"
    : "tw-bg-primary-500 tw-border-primary-500 tw-text-white tw-font-semibold hover:tw-bg-primary-600 hover:tw-shadow-md";
    
  const buttonClasses = `${baseClasses} ${variantClasses}`;

  return (
    <button type="button" onClick={handleClick} className={buttonClasses}>
      <span>Vote for this!</span>
    </button>
  );
};

export default VotingModalButton;
