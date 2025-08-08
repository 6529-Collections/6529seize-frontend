import React from "react";

interface ProfileWinnerRingProps {
  readonly winCount: number;
  readonly bestRank?: number;
  readonly children: React.ReactNode;
  readonly size?: "small" | "medium" | "large";
}

export const ProfileWinnerRing: React.FC<ProfileWinnerRingProps> = ({
  winCount,
  bestRank = 1,
  children,
  size = "medium"
}) => {
  if (winCount === 0) {
    return <>{children}</>;
  }

  // Determine ring properties based on win count and best rank
  const getRingColor = () => {
    switch (bestRank) {
      case 1:
        return "#fbbf24"; // Gold
      case 2:
        return "#CAD5E3"; // Silver
      case 3:
        return "#CD7F32"; // Bronze
      default:
        return "#848490"; // Iron
    }
  };

  const getRingThickness = () => {
    if (winCount === 1) return "tw-ring-2";
    if (winCount <= 3) return "tw-ring-[3px]";
    if (winCount <= 5) return "tw-ring-4";
    return "tw-ring-[5px]";
  };

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "tw-p-0.5";
      case "large":
        return "tw-p-1.5";
      default:
        return "tw-p-1";
    }
  };

  const ringColor = getRingColor();
  const ringThickness = getRingThickness();
  const sizeClasses = getSizeClasses();

  return (
    <div className="tw-relative tw-inline-block">
      {/* Main ring container */}
      <div 
        className={`tw-relative tw-rounded-full ${sizeClasses} ${ringThickness} tw-ring-inset`}
        style={{
          ringColor: `${ringColor}80`,
          background: `linear-gradient(135deg, ${ringColor}20, ${ringColor}10)`,
        }}
      >
        {/* Inner ring with gradient */}
        <div 
          className="tw-relative tw-rounded-full tw-p-[1px]"
          style={{
            background: `linear-gradient(135deg, ${ringColor}, ${ringColor}60)`,
          }}
        >
          <div className="tw-rounded-full tw-bg-iron-950">
            {children}
          </div>
        </div>
      </div>

    </div>
  );
};