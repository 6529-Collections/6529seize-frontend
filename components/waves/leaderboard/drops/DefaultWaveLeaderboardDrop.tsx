import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { WaveLeaderboardDropHeader } from "./header/WaveLeaderboardDropHeader";
import { WaveLeaderboardDropContent } from "../content/WaveLeaderboardDropContent";
import { WaveLeaderboardDropFooter } from "./footer/WaveLeaderboardDropFooter";
import { ApiWave } from "../../../../generated/models/ObjectSerializer";
import { useDropInteractionRules } from "../../../../hooks/drops/useDropInteractionRules";
import { WaveLeaderboardDropRaters } from "./header/WaveleaderboardDropRaters";
import WaveDropActionsOptions from "../../drops/WaveDropActionsOptions";
import WaveDropActionsOpen from "../../drops/WaveDropActionsOpen";
import WaveDropMobileMenuOpen from "../../drops/WaveDropMobileMenuOpen";
import WaveDropMobileMenuDelete from "../../drops/WaveDropMobileMenuDelete";
import { VotingModal, MobileVotingModal } from "../../../../components/voting";
import VotingModalButton from "../../../../components/voting/VotingModalButton";
import useIsMobileScreen from "../../../../hooks/isMobileScreen";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";
import CommonDropdownItemsMobileWrapper from "../../../utils/select/dropdown/CommonDropdownItemsMobileWrapper";

interface DefaultWaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const DefaultWaveLeaderboardDrop: React.FC<
  DefaultWaveLeaderboardDropProps
> = ({ drop, wave, onDropClick }) => {
  const { canShowVote, canDelete } = useDropInteractionRules(drop);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const isMobileScreen = useIsMobileScreen();
  const isMobileDevice = useIsMobileDevice();
  
  // For long press detection
  const LONG_PRESS_DURATION = 500; // milliseconds
  const MOVE_THRESHOLD = 10; // pixels
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  
  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileDevice) return;
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    
    longPressTimeout.current = setTimeout(() => {
      setLongPressTriggered(true);
      setIsSlideUp(true);
    }, LONG_PRESS_DURATION);
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!longPressTimeout.current) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    const deltaX = Math.abs(touchX - touchStartX.current);
    const deltaY = Math.abs(touchY - touchStartY.current);
    
    if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
    }
  };
  
  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    setLongPressTriggered(false);
  };

  const getBorderClasses = () => {
    const rank = drop.rank && drop.rank <= 3 ? drop.rank : "default";

    // Base classes with consistent border styling for ongoing competition items
    const baseClasses =
      "tw-rounded-xl tw-bg-iron-950 tw-p-4 md:tw-px-5 tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden";

    // Match the hover effects from the other component
    if (rank === 1) {
      return `${baseClasses} desktop-hover:hover:tw-border-[#fbbf24]/40`;
    } else if (rank === 2) {
      return `${baseClasses} desktop-hover:hover:tw-border-[#94a3b8]/40`;
    } else if (rank === 3) {
      return `${baseClasses} desktop-hover:hover:tw-border-[#CD7F32]/40`;
    } else {
      // More subtle hover effect for ranks 4+
      return `${baseClasses} desktop-hover:hover:tw-border-iron-700`;
    }
  };

  return (
    <div
      onClick={() => onDropClick(drop)}
      className="tw-@container tw-group tw-cursor-pointer tw-rounded-xl tw-transition tw-duration-300 tw-ease-out tw-w-full tw-relative"
    >
      <div 
        className={getBorderClasses()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className="tw-flex tw-flex-col">
          <div className="tw-flex tw-flex-col tw-gap-3">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
              <WaveLeaderboardDropHeader drop={drop} />
              <div className="tw-flex tw-items-center">
                <div className="tw-h-8 tw-hidden lg:tw-block">
                  <WaveDropActionsOpen drop={drop} />
                </div>
                <div className="tw-h-8 tw-hidden lg:tw-block">
                  {canDelete && <WaveDropActionsOptions drop={drop} />}
                </div>
              </div>
            </div>
          </div>

          <div className="tw-space-y-2">
            <div className="tw-ml-[3.35rem]">
              <WaveLeaderboardDropContent drop={drop} />
            </div>
          </div>
          <div className="tw-mt-3 tw-inline-flex tw-flex-col @[700px]:tw-flex-row tw-justify-between @[700px]:tw-items-center sm:tw-ml-[3.25rem] tw-space-y-3 @[700px]:tw-space-y-0 tw-gap-x-2">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-y-2 tw-gap-x-4">
              <WaveLeaderboardDropRaters drop={drop} />
              <WaveLeaderboardDropFooter drop={drop} wave={wave} />
            </div>
            {canShowVote && (
              <div
                className="tw-flex tw-justify-center tw-pt-4 @[700px]:tw-pt-0 @[700px]:tw-ml-auto tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0 @[700px]:tw-border-t-0"
                onClick={(e) => e.stopPropagation()}
              >
                <VotingModalButton
                  drop={drop}
                  onClick={() => setIsVotingModalOpen(true)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Voting modal */}
      {isMobileScreen ? (
        <MobileVotingModal
          drop={drop}
          isOpen={isVotingModalOpen}
          onClose={() => setIsVotingModalOpen(false)}
        />
      ) : (
        <VotingModal
          drop={drop}
          isOpen={isVotingModalOpen}
          onClose={() => setIsVotingModalOpen(false)}
        />
      )}
      
      {/* Mobile menu slide-up */}
      {isMobileDevice && createPortal(
        <CommonDropdownItemsMobileWrapper isOpen={isSlideUp} setOpen={setIsSlideUp}>
          <div className="tw-grid tw-grid-cols-1 tw-gap-y-2">
            {/* Open drop option */}
            <WaveDropMobileMenuOpen 
              drop={{
                ...drop,
                stableHash: drop.id,
                stableKey: drop.id,
              }} 
              onOpenChange={() => setIsSlideUp(false)} 
            />
            
            {/* Delete option - only if user can delete */}
            {canDelete && (
              <WaveDropMobileMenuDelete 
                drop={drop} 
                onDropDeleted={() => setIsSlideUp(false)} 
              />
            )}
          </div>
        </CommonDropdownItemsMobileWrapper>,
        document.body
      )}
    </div>
  );
};
