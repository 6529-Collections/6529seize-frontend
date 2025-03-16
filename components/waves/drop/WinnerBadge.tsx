import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";
import WinnerDropBadge from "../../waves/drops/winner/WinnerDropBadge";

interface WinnerBadgeProps {
  readonly drop: ApiDrop;
}

export const WinnerBadge: React.FC<WinnerBadgeProps> = ({ drop }) => {
  const { winningRank } = useDropInteractionRules(drop);
  const winningTime = drop.winning_context?.decision_time;
  
  if (!winningRank) return null;

  return (
    <div className="tw-flex tw-flex-col tw-w-full tw-gap-y-2">
      <div className="tw-py-2">
        <WinnerDropBadge
          rank={winningRank}
          decisionTime={winningTime}
        />
      </div>
    </div>
  );
};
