import React from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import WinnerDropBadge from "../drops/winner/WinnerDropBadge";

interface WinnerBadgeProps {
  readonly drop: ApiDrop;
  readonly showBadge?: boolean | undefined;
  readonly variant?: "default" | "simple" | undefined;
}

export const WinnerBadge: React.FC<WinnerBadgeProps> = ({
  drop,
  showBadge = true,
  variant = "default",
}) => {
  const { winningRank } = useDropInteractionRules(drop);
  const winningTime = drop.winning_context?.decision_time || null;

  if (!winningRank || !showBadge) return null;

  return (
    <div className="tw-flex">
      <WinnerDropBadge rank={winningRank} decisionTime={winningTime} variant={variant} />
    </div>
  );
};
