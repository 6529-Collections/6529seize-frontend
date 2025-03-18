import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";
import { SingleWaveDropVote } from "../drop/SingleWaveDropVote";
import { WaveLeaderboardDropRaters } from "../leaderboard/drops/header/WaveleaderboardDropRaters";

interface MemesLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly onViewLarger?: (drop: ExtendedDrop) => void;
}

export const MemesLeaderboardDrop: React.FC<MemesLeaderboardDropProps> = ({
  drop,
  wave,
  onDropClick,
  onViewLarger = () => onDropClick(drop), // Default to regular click if no specific handler
}) => {
  const { canShowVote } = useDropInteractionRules(drop);
  
  // Function to get border styling based on ranking
  const getBorderClasses = () => {
    const rank = drop.rank && drop.rank <= 3 ? drop.rank : null;
    
    const baseClasses = "tw-rounded-xl tw-bg-iron-950 tw-border tw-border-solid tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden";
    
    if (rank === 1) {
      return `${baseClasses} tw-border-[#fbbf24]/30`;
    } else if (rank === 2) {
      return `${baseClasses} tw-border-[#94a3b8]/30`;
    } else if (rank === 3) {
      return `${baseClasses} tw-border-[#CD7F32]/30`;
    } else {
      return `${baseClasses} tw-border-iron-800/50`;
    }
  };

  // Function to get rank display
  const getRankDisplay = () => {
    if (!drop.rank) return null;
    
    const rankColors: Record<number, string> = {
      1: "tw-bg-[#fbbf24]/10 tw-text-[#fbbf24]",
      2: "tw-bg-[#94a3b8]/10 tw-text-[#94a3b8]",
      3: "tw-bg-[#CD7F32]/10 tw-text-[#CD7F32]",
    };
    
    const rankColor = drop.rank <= 3 ? rankColors[drop.rank] : "tw-bg-iron-800/30 tw-text-iron-400";
    
    return (
      <div className={`tw-inline-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-rounded-full ${rankColor} tw-font-bold`}>
        {drop.rank}
      </div>
    );
  };
  
  // Extract metadata
  const title = drop.metadata?.find(m => m.key === "title")?.value || "Untitled Artwork";
  const description = drop.metadata?.find(m => m.key === "description")?.value || 
    "This is an artwork submission for The Memes collection.";
  const artistName = drop.profile?.name || "Anonymous Artist";
  
  // Get artwork media URL if available
  const artworkMedia = drop.media && drop.media.length > 0 ? drop.media[0].url : null;

  return (
    <div className="tw-rounded-xl tw-transition tw-duration-300 tw-ease-out tw-w-full">
      <div className={getBorderClasses()}>
        {/* Two-column layout */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-12 tw-gap-5">
          {/* Left column - Metadata */}
          <div className="tw-col-span-1 md:tw-col-span-5 tw-p-5">
            {/* Header with rank and votes */}
            <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
              {getRankDisplay()}
              
              <div className="tw-flex-1">
                <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0.5">
                  {title}
                </h3>
                <p className="tw-text-sm tw-text-iron-400 tw-mb-0">
                  By {artistName}
                </p>
              </div>
              
              <div className="tw-flex tw-items-center tw-gap-2">
                <WaveLeaderboardDropRaters drop={drop} />
              </div>
            </div>
            
            {/* Description */}
            <div className="tw-mb-5">
              <p className="tw-text-iron-300">
                {description}
              </p>
            </div>
            
            {/* Artist info */}
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center tw-text-iron-300">
                {artistName[0].toUpperCase()}
              </div>
              <div>
                <p className="tw-text-sm tw-font-medium tw-text-iron-200 tw-mb-0">{artistName}</p>
                <p className="tw-text-xs tw-text-iron-400 tw-mb-0">Artist</p>
              </div>
            </div>
          </div>
          
          {/* Right column - Artwork */}
          <div className="tw-col-span-1 md:tw-col-span-7 tw-relative tw-bg-iron-900/30 tw-cursor-pointer" onClick={() => onViewLarger(drop)}>
            <div className="tw-aspect-video tw-w-full tw-flex tw-items-center tw-justify-center tw-bg-iron-900/50">
              {artworkMedia ? (
                <img 
                  src={artworkMedia} 
                  alt={title}
                  className="tw-max-w-full tw-max-h-full tw-object-contain"
                />
              ) : (
                <div className="tw-text-center tw-text-iron-400 tw-px-6">
                  <svg className="tw-w-16 tw-h-16 tw-mx-auto tw-mb-3 tw-text-iron-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.5 21C3.67157 21 3 20.3284 3 19.5V4.5C3 3.67157 3.67157 3 4.5 3H19.5C20.3284 3 21 3.67157 21 4.5V19.5C21 20.3284 20.3284 21 19.5 21H4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 16.5L8.25 11.25C8.66421 10.8358 9.33579 10.8358 9.75 11.25L15 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.25 15.75L15.75 14.25C16.1642 13.8358 16.8358 13.8358 17.25 14.25L21 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="tw-text-sm">Artwork preview</p>
                </div>
              )}
              
              {/* View larger button */}
              <div className="tw-absolute tw-bottom-3 tw-right-3">
                <button 
                  className="tw-flex tw-items-center tw-gap-1.5 tw-bg-iron-950/80 tw-text-iron-300 tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewLarger(drop);
                  }}
                >
                  <svg className="tw-w-4 tw-h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 10L20 5M20 5V9M20 5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 14V17C4 18.6569 5.34315 20 7 20H17C18.6569 20 20 18.6569 20 17V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  View larger
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Voting section */}
        {canShowVote && (
          <div className="tw-p-5 tw-border-t tw-border-iron-800/50">
            <div className="tw-flex tw-items-center tw-justify-between">
              <h4 className="tw-text-sm tw-font-medium tw-text-iron-300 tw-uppercase tw-tracking-wider">
                Vote for this artwork
              </h4>
              <SingleWaveDropVote drop={drop} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemesLeaderboardDrop;