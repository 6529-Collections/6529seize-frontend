import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDropVote } from "./SingleWaveDropVote";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";

interface SingleWaveDropInfoActionsProps {
  readonly drop: ExtendedDrop;
  readonly className?: string | undefined;
}

export const SingleWaveDropInfoActions: React.FC<
  SingleWaveDropInfoActionsProps
> = ({ drop, className = "" }) => {
  const { canShowVote } = useDropInteractionRules(drop);

  return (
    <div
      className={`tw-flex tw-flex-col tw-gap-y-2 tw-mt-4 ${className}`}
    >
      {canShowVote && <SingleWaveDropVote drop={drop} />}
    </div>
  );
};
