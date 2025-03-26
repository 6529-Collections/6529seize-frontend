import React, { useState } from "react";
import { SingleWaveDropClose } from "./SingleWaveDropClose";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { SingleWaveDropTab } from "./SingleWaveDrop";
import { ApiWave } from "../../../generated/models/ApiWave";
import { SingleWaveDropInfoContainer } from "./SingleWaveDropInfoContainer";
import { SingleWaveDropInfoDetails } from "./SingleWaveDropInfoDetails";
import { SingleWaveDropInfoAuthorSection } from "./SingleWaveDropInfoAuthorSection";
import { SingleWaveDropInfoActions } from "./SingleWaveDropInfoActions";
import { SingleWaveDropPosition } from "./SingleWaveDropPosition";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-regular-svg-icons";

import { AnimatePresence, motion } from "framer-motion";
import { SingleWaveDropVotes } from "./SingleWaveDropVotes";
import { faCompress, faExpand } from "@fortawesome/free-solid-svg-icons";
import DropListItemContentMedia from "../../drops/view/item/content/media/DropListItemContentMedia";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";
import { WinnerBadge } from "./WinnerBadge";
import { SingleWaveDropTime } from "./SingleWaveDropTime";

interface MemesSingleWaveDropInfoPanelProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
  readonly activeTab: SingleWaveDropTab;
  readonly onClose: () => void;
}

export const MemesSingleWaveDropInfoPanel: React.FC<
  MemesSingleWaveDropInfoPanelProps
> = ({ drop, wave, activeTab, onClose }) => {
  // State for fullscreen artwork view
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isWinner } = useDropInteractionRules(drop);
  // Extract metadata
  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value ||
    drop.title ||
    "Artwork Title";

  // Get artwork media URL if available
  const artworkMedia = drop.parts?.at(0)?.media?.at(0);

  // Handler for toggling fullscreen view
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <SingleWaveDropInfoContainer activeTab={activeTab}>
        {/* Close button for desktop view */}
        <div className="tw-hidden lg:tw-block">
          <SingleWaveDropClose onClose={onClose} />
        </div>

        {/* Content area with title, description and artwork */}
        <div className="tw-flex tw-flex-col">
          {/* Title and rank badge side by side */}
          <div className="tw-flex tw-flex-row tw-items-center tw-gap-x-3 tw-px-6">
            {/* Show either position badge or trophy-only based on winning context */}
            {isWinner ? (
              <WinnerBadge drop={drop} showBadge={true} />
            ) : (
              wave && <SingleWaveDropTime wave={wave} />
            )}
            {/* Title */}
            <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">
              {title}
            </h3>
          </div>

          {/* Votes and voters info right below the title */}
          <div className="tw-px-6 tw-pt-4 tw-pb-4">
            <SingleWaveDropVotes drop={drop} />
          </div>

          <div>
            {/* Full width artwork with fullscreen toggle */}
            {artworkMedia && (
              <div className="tw-flex tw-justify-center">
                <DropListItemContentMedia
                  media_mime_type={artworkMedia.mime_type}
                  media_url={artworkMedia.url}
                />
              </div>
            )}
            <div className="tw-px-6 tw-mt-4">
              <SingleWaveDropInfoAuthorSection drop={drop} wave={wave} />
            </div>
            <div className="tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0 tw-pt-4 tw-mt-4">
              <SingleWaveDropInfoActions
                drop={drop}
                wave={wave}
                showBadge={false}
                showVotes={false}
              />
            </div>
          </div>

          <SingleWaveDropInfoDetails drop={drop} />
        </div>
      </SingleWaveDropInfoContainer>

      <AnimatePresence>
        {isFullscreen && artworkMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="tw-fixed tw-inset-0 tw-z-50 tw-bg-iron-950/90 tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-4"
          >
            {/* Header bar with title, badge, and close button */}
            <div className="tw-w-full tw-max-w-5xl tw-flex tw-justify-between tw-items-center tw-mb-4">
              <div className="tw-flex tw-items-center tw-gap-x-3">
                <SingleWaveDropPosition rank={drop.rank || 1} drop={drop} />
                <h3 className="tw-text-xl tw-font-semibold tw-text-iron-100">
                  {title}
                </h3>
              </div>

              {/* Votes info */}
              <div className="tw-mx-auto">
                <SingleWaveDropVotes drop={drop} />
              </div>

              <button
                onClick={toggleFullscreen}
                className="tw-bg-iron-900/80 tw-text-iron-100 tw-p-3 tw-rounded-lg 
                        tw-transition-colors tw-duration-200 hover:tw-bg-iron-800 
                        focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
                aria-label="Exit fullscreen view"
              >
                <FontAwesomeIcon icon={faCompress} className="tw-w-5 tw-h-5" />
              </button>
            </div>

            {/* Main artwork display */}
            <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
              <img
                src={artworkMedia}
                alt={title}
                className="tw-max-w-full tw-max-h-full tw-object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
