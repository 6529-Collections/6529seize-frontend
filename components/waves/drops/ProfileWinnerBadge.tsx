import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faAward, faCrown } from "@fortawesome/free-solid-svg-icons";

interface ProfileWinnerBadgeProps {
  readonly winCount: number;
  readonly bestRank?: number;
  readonly variant?: "trophy" | "award" | "crown";
  readonly size?: "small" | "medium" | "large";
  readonly showCount?: boolean;
}

export const ProfileWinnerBadge: React.FC<ProfileWinnerBadgeProps> = ({
  winCount,
  bestRank = 1,
  variant = "trophy",
  size = "medium",
  showCount = true
}) => {
  if (winCount === 0) return null;

  // Get appropriate icon
  const getIcon = () => {
    switch (variant) {
      case "award":
        return faAward;
      case "crown":
        return faCrown;
      default:
        return faTrophy;
    }
  };

  // Determine colors based on best rank
  const getColors = () => {
    switch (bestRank) {
      case 1:
        return {
          bg: "rgba(251,191,36,0.1)", // Gold background
          border: "#fbbf2440",
          text: "#fbbf24",
          icon: "#fbbf24"
        };
      case 2:
        return {
          bg: "rgba(202,213,227,0.1)", // Silver background
          border: "#CAD5E340",
          text: "#CAD5E3",
          icon: "#CAD5E3"
        };
      case 3:
        return {
          bg: "rgba(205,127,50,0.1)", // Bronze background
          border: "#CD7F3240",
          text: "#CD7F32",
          icon: "#CD7F32"
        };
      default:
        return {
          bg: "rgba(132,132,144,0.2)", // Iron background
          border: "#84849040",
          text: "#848490",
          icon: "#848490"
        };
    }
  };

  // Size variations
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return {
          container: "tw-px-1.5 tw-py-0.5 tw-text-xs",
          icon: "tw-size-2.5",
          gap: "tw-gap-1"
        };
      case "large":
        return {
          container: "tw-px-3 tw-py-1.5 tw-text-sm",
          icon: "tw-size-4",
          gap: "tw-gap-2"
        };
      default:
        return {
          container: "tw-px-2 tw-py-1 tw-text-xs",
          icon: "tw-size-3",
          gap: "tw-gap-1.5"
        };
    }
  };

  const colors = getColors();
  const sizeClasses = getSizeClasses();
  const icon = getIcon();

  return (
    <div
      className={`tw-inline-flex tw-items-center tw-rounded-full tw-font-medium tw-whitespace-nowrap tw-border ${sizeClasses.container}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      <FontAwesomeIcon 
        icon={icon} 
        className={sizeClasses.icon}
        style={{ color: colors.icon }}
      />
    </div>
  );
};