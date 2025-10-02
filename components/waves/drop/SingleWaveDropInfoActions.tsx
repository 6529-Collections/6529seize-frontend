import React from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDropVote } from "./SingleWaveDropVote";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";

interface SingleWaveDropInfoActionsProps {
  readonly drop: ExtendedDrop;
  readonly className?: string;
}

export const SingleWaveDropInfoActions: React.FC<
  SingleWaveDropInfoActionsProps
> = ({ drop, className = "tw-px-6" }) => {
  const { canShowVote } = useDropInteractionRules(drop);

  return (
    <div
      className={`tw-flex tw-flex-col tw-gap-y-2 tw-mt-4 tw-pt-4 tw-border-t tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-b-0 ${className}`}
    >
      {canShowVote && <SingleWaveDropVote drop={drop} />}
    </div>
  );
};
