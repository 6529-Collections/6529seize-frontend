import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";
import WinnerDropBadge from "../drops/winner/WinnerDropBadge";

interface SingleWaveDropPositionProps {
  readonly rank: number | null;
  readonly drop?: ExtendedDrop;
  readonly isFinalWinner?: boolean;
  readonly variant?: "default" | "simple";
}

const TrophyOnlyBadge: FC<{ rank: number }> = ({ rank }) => {
  let accentColor = "";
  let bgColor = "";

  switch (rank) {
    case 1: // Gold
      accentColor = "#fbbf24";
      bgColor = "rgba(251,191,36,0.1)";
      break;
    case 2: // Silver
      accentColor = "#CAD5E3";
      bgColor = "rgba(202, 213, 227,0.1)";
      break;
    case 3: // Bronze
      accentColor = "#CD7F32";
      bgColor = "rgba(205,127,50,0.1)";
      break;
    default:
      accentColor = "#848490";
      bgColor = "rgba(96,96,108,0.1)";
  }

  return (
    <div
      className="tw-flex tw-items-center tw-rounded-md tw-font-medium tw-whitespace-nowrap -tw-mt-0.5"
      style={{
        backgroundColor: bgColor,
        color: accentColor,
        border: `1px solid ${accentColor}30`,
      }}
    >
      <span className="tw-px-2 tw-py-1 tw-text-xs tw-flex tw-items-center">
        <FontAwesomeIcon
          icon={faTrophy}
          className="tw-size-2.5 tw-flex-shrink-0"
        />
      </span>
    </div>
  );
};

const SimpleRankDisplay: FC<{ rank: number }> = ({ rank }) => {
  let color = "";
  switch (rank) {
    case 1:
      color = "tw-text-amber-400";
      break;
    case 2:
      color = "tw-text-iron-300";
      break;
    case 3:
      color = "tw-text-amber-600";
      break;
    default:
      color = "tw-text-iron-500";
  }

  const formatRank = (r: number) => {
    switch (r) {
      case 1:
        return "1st";
      case 2:
        return "2nd";
      case 3:
        return "3rd";
      default:
        return `#${r}`;
    }
  };

  return (
    <div className={`tw-flex tw-items-center tw-gap-1.5 ${color}`}>
      <FontAwesomeIcon icon={faTrophy} className="tw-w-3.5 tw-h-3.5" />
      <span className="tw-text-sm tw-font-semibold">{formatRank(rank)}</span>
    </div>
  );
};

export const SingleWaveDropPosition: FC<SingleWaveDropPositionProps> = ({
  rank,
  drop,
  isFinalWinner = false,
  variant = "default",
}) => {
  if (!rank) return null;

  if (variant === "simple") {
    return <SimpleRankDisplay rank={rank} />;
  }

  const isWinner = isFinalWinner || drop?.winning_context;

  if (isWinner) {
    return (
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-2">
        <TrophyOnlyBadge rank={rank} />
      </div>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-2">
      <WinnerDropBadge rank={rank} decisionTime={null} />
    </div>
  );
};
