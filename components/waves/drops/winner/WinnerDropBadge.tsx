import React from "react";

interface WinnerDropBadgeProps {
  rank: number | null;
  round?: number;
  position?: number; // Position within the same rank (e.g., 2nd #1 place winner)
}

const WinnerDropBadge: React.FC<WinnerDropBadgeProps> = ({ 
  rank, 
  round = 1,
  position = 1
}) => {
  // If rank is null or undefined, use position as fallback
  const effectiveRank = rank !== null && rank !== undefined ? rank : position;
  if (!effectiveRank) return null;
  
  // Convert rank to a number to ensure proper comparison
  const rankNumber = typeof effectiveRank === 'string' ? parseInt(effectiveRank as string, 10) : effectiveRank;
  
  // Colors for each rank
  let accentColor = "";
  let bgColor = "";
  let rankText = "";
  
  switch (rankNumber) {
    case 1:
      accentColor = "#E8D48A"; // Gold
      bgColor = "rgba(232,212,138,0.1)";
      rankText = "1st";
      break;
    case 2:
      accentColor = "#DDDDDD"; // Silver
      bgColor = "rgba(221,221,221,0.1)";
      rankText = "2nd";
      break;
    case 3:
      accentColor = "#CD7F32"; // Bronze
      bgColor = "rgba(205,127,50,0.1)";
      rankText = "3rd";
      break;
    default:
      accentColor = "#7F8A93"; // Gray for all other ranks
      bgColor = "rgba(127,138,147,0.1)";
      rankText = `${rankNumber}th`;
  }
  
  return (
    <div className="tw-flex tw-items-center tw-gap-x-1.5">
      {/* Round indicator */}
      <div 
        className="tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-md tw-text-xs tw-font-medium"
        style={{ 
          backgroundColor: "rgba(60,60,70,0.5)",
          color: "#EEEEEE",
          border: "1px solid rgba(255,255,255,0.1)"
        }}
      >
        Round {round}
      </div>
      
      {/* Rank indicator */}
      <div 
        className="tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-md tw-text-xs tw-font-medium"
        style={{ 
          backgroundColor: bgColor,
          color: accentColor,
          border: `1px solid ${accentColor}40`
        }}
      >
        {rankText}
        {position > 1 && <span className="tw-ml-1">#{position}</span>}
      </div>
    </div>
  );
};

export default WinnerDropBadge;