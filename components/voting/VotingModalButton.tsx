import React from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";

interface VotingModalButtonProps {
  readonly drop: ExtendedDrop;
  readonly onClick: () => void;
  readonly variant?: "default" | "subtle"; // Add variant prop for styling flexibility
}

const VotingModalButton: React.FC<VotingModalButtonProps> = ({
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

  const baseClasses = "tw-flex tw-items-center tw-justify-center tw-gap-x-1 tw-px-3 tw-py-1.5 tw-rounded-md tw-border tw-border-solid tw-text-xs tw-whitespace-nowrap tw-transition-all tw-duration-300 tw-ease-out";

  const variantClasses = variant === "subtle"
    ? "tw-bg-white tw-border-white tw-text-black tw-font-semibold desktop-hover:hover:tw-bg-iron-300 tw-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
    : "tw-bg-primary-500 tw-border-primary-500 tw-text-white tw-font-medium desktop-hover:hover:tw-bg-primary-600";

  const buttonClasses = `${baseClasses} ${variantClasses}`;

  return (
    <button type="button" onClick={handleClick} className={buttonClasses}>
      <span>Vote</span>
    </button>
  );
};

export default VotingModalButton;
