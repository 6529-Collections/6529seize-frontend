import React, { useState } from "react";
import { SingleWaveDropClose } from "./SingleWaveDropClose";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { SingleWaveDropTab } from "./SingleWaveDrop";
import { ApiWave } from "../../../generated/models/ApiWave";
import { SingleWaveDropInfoContainer } from "./SingleWaveDropInfoContainer";
import { SingleWaveDropInfoDetails } from "./SingleWaveDropInfoDetails";
import { SingleWaveDropInfoAuthorSection } from "./SingleWaveDropInfoAuthorSection";
import { SingleWaveDropInfoActions } from "./SingleWaveDropInfoActions";
import { ApiDropType } from "../../../generated/models/ObjectSerializer";
import { SingleWaveDropPosition } from "./SingleWaveDropPosition";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faExpand, faCompress } from "@fortawesome/free-solid-svg-icons";
import { AnimatePresence, motion } from "framer-motion";

interface MemesSingleWaveDropInfoPanelProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
  readonly activeTab: SingleWaveDropTab;
  readonly onClose: () => void;
}

export const MemesSingleWaveDropInfoPanel: React.FC<MemesSingleWaveDropInfoPanelProps> = ({
  drop,
  wave,
  activeTab,
  onClose,
}) => {
  // State for fullscreen artwork view
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Extract metadata
  const title = drop.metadata?.find((m) => m.data_key === "title")?.data_value || drop.title || "Artwork Title";
  const description = drop.metadata?.find((m) => m.data_key === "description")?.data_value || "";
  
  // Get artwork media URL if available
  const artworkMedia = drop.parts.at(0)?.media?.at(0)?.url;
  
  // Handler for toggling fullscreen view
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
  };

  return (
    <SingleWaveDropInfoContainer activeTab={activeTab}>
      {/* Close button for desktop view */}
      <div className="tw-hidden lg:tw-block">
        <SingleWaveDropClose onClose={onClose} />
      </div>

      {/* Content area with title, description and artwork */}
      <div className="tw-flex tw-flex-col tw-px-6 tw-gap-y-2 tw-mt-2">
        {/* Title and rank badge side by side */}
        <div className="tw-flex tw-flex-row tw-items-center tw-gap-x-3 tw-mb-2">
          {/* Always show position/rank badge for Memes wave */}
          <SingleWaveDropPosition rank={drop.rank || 1} />

          {/* Title */}
          <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">
            {title}
          </h3>
        </div>

        {/* Description if available */}
        {description && (
          <p className="tw-text-iron-300 tw-mb-4 tw-text-sm lg:tw-text-md">{description}</p>
        )}

        {/* Full width artwork with fullscreen toggle */}
        <div className="tw-relative tw-bg-iron-900/30 tw-w-full tw-rounded-lg tw-overflow-hidden tw-group">
          <div className="tw-aspect-video tw-w-full tw-flex tw-items-center tw-justify-center">
            {artworkMedia ? (
              <>
                <img
                  src={artworkMedia}
                  alt={title}
                  className="tw-max-w-full tw-max-h-full tw-object-contain"
                />
                {/* Fullscreen toggle button */}
                <button 
                  onClick={toggleFullscreen}
                  className="tw-absolute tw-top-3 tw-right-3 tw-bg-iron-900/80 tw-text-iron-100 tw-p-2 tw-rounded-lg 
                            tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-200 
                            hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
                  aria-label="Toggle fullscreen view"
                >
                  <FontAwesomeIcon icon={faExpand} className="tw-w-4 tw-h-4" />
                </button>
              </>
            ) : (
              <div className="tw-text-center tw-text-iron-400 tw-px-6">
                <FontAwesomeIcon
                  icon={faImage}
                  className="tw-w-14 tw-h-14 tw-mx-auto tw-mb-3 tw-text-iron-700"
                />
                <p className="tw-text-sm">Artwork preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom section with actions, author and details */}
      <div className="tw-border-t tw-border-iron-800 tw-pt-3 tw-border-solid tw-border-x-0 tw-border-b-0 tw-mt-6">
        <SingleWaveDropInfoActions
          drop={drop}
          wave={wave}
        />

        <SingleWaveDropInfoAuthorSection drop={drop} wave={wave} />

        <SingleWaveDropInfoDetails drop={drop} />
      </div>

      {/* Fullscreen artwork modal */}
      <AnimatePresence>
        {isFullscreen && artworkMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="tw-fixed tw-inset-0 tw-z-50 tw-bg-iron-950/95 tw-flex tw-items-center tw-justify-center"
            onClick={toggleFullscreen}
          >
            <div className="tw-relative tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-p-4">
              {/* Close button */}
              <button 
                onClick={toggleFullscreen}
                className="tw-absolute tw-top-4 tw-right-4 tw-bg-iron-900/80 tw-text-iron-100 tw-p-2 tw-rounded-lg 
                          hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 tw-z-10"
                aria-label="Close fullscreen view"
              >
                <FontAwesomeIcon icon={faCompress} className="tw-w-4 tw-h-4" />
              </button>
              
              {/* Fullscreen artwork */}
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
                src={artworkMedia}
                alt={title}
                className="tw-max-w-full tw-max-h-full tw-object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Metadata overlay at bottom */}
              <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-bg-iron-950/80 tw-p-4 tw-text-center">
                <div className="tw-flex tw-items-center tw-justify-center tw-gap-x-3">
                  <SingleWaveDropPosition rank={drop.rank || 1} />
                  <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">{title}</h3>
                </div>
                {description && (
                  <p className="tw-text-iron-300 tw-mt-2 tw-text-sm tw-max-w-2xl tw-mx-auto">{description}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SingleWaveDropInfoContainer>
  );
};