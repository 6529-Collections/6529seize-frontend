import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";

interface WinnerBadgeProps {
  readonly drop: ApiDrop;
}

/**
 * Component that displays a badge indicating a drop is a winner.
 * Shows different badges based on ranking position (1st, 2nd, 3rd, etc.)
 * with appropriate styling for each rank, and displays when the drop won.
 */
export const WinnerBadge: React.FC<WinnerBadgeProps> = ({ drop }) => {
  const { winningRank } = useDropInteractionRules(drop);
  const winningTime = drop.winning_context?.decision_time;

  // Format the decision time as a readable date
  const formatDecisionTime = (timestamp: number | undefined) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    
    // Format: "Month Day, Year"
    return date.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get badge styling based on rank
  const getBadgeStyles = (rank: number | undefined) => {
    // Default styles for ranks beyond top 3
    let background = "tw-bg-gradient-to-r tw-from-zinc-800 tw-to-zinc-900";
    let border = "tw-border tw-border-zinc-700/40";
    let text = "tw-bg-gradient-to-r tw-from-zinc-300 tw-to-zinc-400";
    let secondaryText = "tw-text-zinc-400";
    let icon = "🎖️";
    let label = rank ? `Winner #${rank}` : "Winner";
    
    // Specialized styles for top 3 places
    if (rank === 1) {
      background = "tw-bg-gradient-to-r tw-from-amber-900/40 tw-to-amber-800/30";
      border = "tw-border tw-border-amber-500/40";
      text = "tw-bg-gradient-to-r tw-from-amber-300 tw-to-amber-500";
      secondaryText = "tw-text-amber-500/70";
      icon = "🏆";
      label = "First Place Winner";
    } else if (rank === 2) {
      background = "tw-bg-gradient-to-r tw-from-slate-900/40 tw-to-slate-800/30";
      border = "tw-border tw-border-slate-400/40";
      text = "tw-bg-gradient-to-r tw-from-slate-300 tw-to-slate-400";
      secondaryText = "tw-text-slate-400/70";
      icon = "🥈";
      label = "Second Place Winner";
    } else if (rank === 3) {
      background = "tw-bg-gradient-to-r tw-from-[#5E3A27]/40 tw-to-[#7E5A47]/30";
      border = "tw-border tw-border-[#CD7F32]/40";
      text = "tw-bg-gradient-to-r tw-from-[#CD7F32] tw-to-[#DDAF62]";
      secondaryText = "tw-text-[#CD7F32]/70";
      icon = "🥉";
      label = "Third Place Winner";
    }
    
    return { background, border, text, secondaryText, icon, label };
  };
  
  const styles = getBadgeStyles(winningRank);
  const formattedDate = formatDecisionTime(winningTime);

  return (
    <div className={`${styles.background} ${styles.border} tw-rounded-lg tw-p-3 tw-flex tw-flex-col tw-items-center tw-justify-center tw-shadow-inner tw-shadow-black/20`}>
      <span className={`tw-text-base tw-font-semibold ${styles.text} tw-bg-clip-text tw-text-transparent`}>
        {styles.icon} {styles.label}
      </span>
      {formattedDate && (
        <span className={`tw-text-xs tw-mt-1 ${styles.secondaryText}`}>
          Won on {formattedDate}
        </span>
      )}
    </div>
  );
};
