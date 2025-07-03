"use client";

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

import { AnimatePresence, motion } from "framer-motion";
import { SingleWaveDropVotes } from "./SingleWaveDropVotes";
import { faCompress } from "@fortawesome/free-solid-svg-icons";
import DropListItemContentMedia from "../../drops/view/item/content/media/DropListItemContentMedia";
import { useDropInteractionRules } from "../../../hooks/drops/useDropInteractionRules";
import { WinnerBadge } from "./WinnerBadge";
import { SingleWaveDropTraits } from "./SingleWaveDropTraits";
import { ApiDropType } from "../../../generated/models/ApiDropType";
import WaveDropDeleteButton from "../../utils/button/WaveDropDeleteButton";

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
  const { isWinner, canDelete } = useDropInteractionRules(drop);
  // Extract metadata
  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value ??
    drop.title ??
    "Artwork Title";
  const description =
    drop.metadata?.find((m) => m.data_key === "description")?.data_value ?? "";

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
        <div className="tw-hidden lg:tw-block">
          <SingleWaveDropClose onClose={onClose} />
        </div>
        <div className="tw-flex tw-flex-col">
          <div className="tw-px-6 tw-pb-3">
            {drop?.drop_type === ApiDropType.Participatory && (
              <SingleWaveDropPosition rank={drop.rank} />
            )}
            {isWinner && <WinnerBadge drop={drop} showBadge={true} />}
          </div>
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3 tw-px-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">
              {title}
            </h3>
          </div>
          {description && (
            <div className="tw-px-6 tw-mt-2">
              <p className="!tw-text-iron-400 tw-text-md tw-mb-0">
                {description}
              </p>
            </div>
          )}

          <div className="tw-mt-4">
            {artworkMedia && (
              <div className="tw-flex tw-justify-center tw-h-96">
                <DropListItemContentMedia
                  media_mime_type={artworkMedia.mime_type}
                  media_url={artworkMedia.url}
                />
              </div>
            )}
            <div className="tw-px-6 tw-mt-4">
              <SingleWaveDropTraits drop={drop} />
            </div>
            <div className="tw-px-6 tw-mt-4">
              <SingleWaveDropVotes drop={drop} />
            </div>
            <div className="tw-px-6 tw-mt-4">
              <SingleWaveDropInfoAuthorSection drop={drop} wave={wave} />
            </div>

            <SingleWaveDropInfoActions drop={drop} wave={wave} />
          </div>

          <SingleWaveDropInfoDetails drop={drop} />

          {canDelete && drop.drop_type !== ApiDropType.Winner && (
            <div className="tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0 tw-pt-4 tw-px-6 tw-pb-6">
              <WaveDropDeleteButton drop={drop} />
            </div>
          )}
        </div>
      </SingleWaveDropInfoContainer>

      <AnimatePresence>
        {isFullscreen && artworkMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="tw-fixed tw-inset-0 tw-z-50 tw-bg-iron-950/90 tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-4">
            {/* Header bar with title, badge, and close button */}
            <div className="tw-w-full tw-max-w-5xl tw-flex tw-justify-between tw-items-center tw-mb-4">
              <div className="tw-flex tw-flex-col">
                <div className="tw-flex tw-items-center tw-gap-x-3">
                  <SingleWaveDropPosition rank={drop.rank ?? 1} drop={drop} />
                  <h3 className="tw-text-xl tw-font-semibold tw-text-iron-100">
                    {title}
                  </h3>
                </div>
                {description && (
                  <p className="tw-text-iron-400 tw-text-md tw-mt-1 tw-ml-10">
                    {description}
                  </p>
                )}
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
                aria-label="Exit fullscreen view">
                <FontAwesomeIcon icon={faCompress} className="tw-w-5 tw-h-5" />
              </button>
            </div>

            {/* Main artwork display */}
            <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
              <img
                src={artworkMedia.url}
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
