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

  // Extract metadata
  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value ||
    drop.title ||
    "Artwork Title";
  const description =
    drop.metadata?.find((m) => m.data_key === "description")?.data_value || "";

  // Get artwork media URL if available
  const artworkMedia = drop.parts?.at(0)?.media?.at(0)?.url;

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
        <div className="tw-flex tw-flex-col tw-gap-y-4">
          {/* Title and rank badge side by side */}
          <div className="tw-flex tw-flex-row tw-items-center tw-gap-x-3 tw-px-6">
            {/* Show either position badge or trophy-only based on winning context */}
            <SingleWaveDropPosition rank={drop.rank || 1} drop={drop} />
            {/* Title */}
            <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">
              {title}
            </h3>
          </div>

          {/* Votes and voters info right below the title */}
          <div className="tw-px-6">
            <SingleWaveDropVotes drop={drop} />
          </div>

          <div>
            {/* Description if available */}
            {description && (
              <p className="tw-text-iron-300 tw-text-md tw-px-6">
                {description}
              </p>
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
                      <FontAwesomeIcon
                        icon={faExpand}
                        className="tw-w-4 tw-h-4"
                      />
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
            <SingleWaveDropInfoAuthorSection drop={drop} wave={wave} />
            <SingleWaveDropInfoActions
              drop={drop}
              wave={wave}
              showBadge={false}
            />
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
