"use client";

import React, { useCallback, useMemo, useState } from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiWave } from "@/generated/models/ApiWave";
import { SingleWaveDropInfoDetails } from "./SingleWaveDropInfoDetails";
import { SingleWaveDropInfoAuthorSection } from "./SingleWaveDropInfoAuthorSection";
import { SingleWaveDropInfoActions } from "./SingleWaveDropInfoActions";
import { SingleWaveDropPosition } from "./SingleWaveDropPosition";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import { SingleWaveDropVotes } from "./SingleWaveDropVotes";
import { faCompress } from "@fortawesome/free-solid-svg-icons";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { WinnerBadge } from "./WinnerBadge";
import { SingleWaveDropTraits } from "./SingleWaveDropTraits";
import { ApiDropType } from "@/generated/models/ApiDropType";
import WaveDropDeleteButton from "@/components/utils/button/WaveDropDeleteButton";
import { ImageScale } from "@/helpers/image.helpers";
import Download from "@/components/download/Download";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import { WaveSmallLeaderboardItemOutcomes } from "../small-leaderboard/WaveSmallLeaderboardItemOutcomes";

interface MemesSingleWaveDropInfoPanelProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
  readonly isChatOpen: boolean;
  readonly onToggleChat: () => void;
}

export const MemesSingleWaveDropInfoPanel: React.FC<
  MemesSingleWaveDropInfoPanelProps
> = ({ drop, wave, isChatOpen, onToggleChat }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isWinner, canDelete } = useDropInteractionRules(drop);

  const title = useMemo(
    () =>
      drop.metadata?.find((m) => m.data_key === "title")?.data_value ??
      drop.title ??
      "Artwork Title",
    [drop.metadata, drop.title]
  );

  const description = useMemo(
    () =>
      drop.metadata?.find((m) => m.data_key === "description")?.data_value ??
      "",
    [drop.metadata]
  );

  const artworkMedia = useMemo(
    () => drop.parts?.at(0)?.media?.at(0),
    [drop.parts]
  );

  const fileInfo = useMemo(
    () => (artworkMedia?.url ? getFileInfoFromUrl(artworkMedia.url) : null),
    [artworkMedia?.url]
  );

  const fileName = useMemo(() => {
    let name = title;
    if (wave?.name) {
      name += ` for ${wave.name}`;
    }
    if (drop.author?.handle) {
      name += ` by @${drop.author.handle}`;
    }
    return name;
  }, [title, wave?.name, drop.author?.handle]);

  const toggleFullscreen = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <>
      <div className="tw-w-full tw-h-full tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
        <div className="tw-w-full tw-pt-20 lg:tw-pt-24 tw-px-6 lg:tw-px-16 tw-pb-8">
          <div className="tw-flex tw-flex-col tw-gap-3 tw-mb-6">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
              <div className="tw-flex tw-items-center tw-gap-3">
                {drop?.drop_type === ApiDropType.Participatory && (
                  <SingleWaveDropPosition rank={drop.rank} />
                )}
                {isWinner && <WinnerBadge drop={drop} showBadge={true} />}
                <h1 className="tw-text-2xl lg:tw-text-3xl tw-font-semibold tw-text-white tw-mb-0 tw-tracking-tight">
                  {title}
                </h1>
              </div>
              <button
                onClick={onToggleChat}
                className="tw-hidden lg:tw-flex tw-items-center tw-gap-2 tw-text-[10px] lg:tw-text-xs tw-text-white/40 hover:tw-text-white tw-transition-colors tw-font-medium tw-uppercase tw-tracking-wider tw-bg-transparent tw-border-0 tw-flex-shrink-0"
              >
                <ChatBubbleLeftRightIcon className="tw-w-4 tw-h-4" />
                <span>{isChatOpen ? "Hide" : "Show"} Chat</span>
              </button>
            </div>
            <div className="tw-flex tw-items-center tw-gap-3">
              <SingleWaveDropInfoAuthorSection drop={drop} />
            </div>
          </div>

          {/* Container query wrapper */}
          <div className="tw-@container tw-w-full">
            <div className="tw-grid tw-grid-cols-1 @[800px]:tw-grid-cols-12 tw-gap-6 lg:tw-gap-10">
              {/* Left column */}
              <div className="@[800px]:tw-col-span-7">
                {artworkMedia && (
                  <div className="tw-relative tw-w-full tw-aspect-[4/5]">
                    <DropListItemContentMedia
                      media_mime_type={artworkMedia.mime_type}
                      media_url={artworkMedia.url}
                      isCompetitionDrop={true}
                      imageScale={ImageScale.AUTOx1080}
                    />
                  </div>
                )}
                {artworkMedia && fileInfo && (
                  <div className="tw-flex tw-justify-between tw-items-center tw-mt-4">
                    <span className="tw-text-sm tw-font-medium tw-text-white/70">
                      Media Type: {fileInfo.extension.toUpperCase()}
                    </span>
                    <Download
                      href={artworkMedia.url}
                      name={fileName ?? fileInfo.name}
                      extension={fileInfo.extension}
                    />
                  </div>
                )}
                <div className="tw-mt-6">
                  <SingleWaveDropTraits drop={drop} />
                </div>
              </div>

              {/* Right column */}
              <div className="@[800px]:tw-col-span-5 tw-flex tw-flex-col tw-gap-6 lg:tw-gap-8">
                {/* Description */}
                {description && (
                  <div>
                    <div className="tw-text-xs tw-text-white/40 tw-mb-3 lg:tw-mb-4 tw-uppercase tw-tracking-widest">
                      About
                    </div>
                    <p className="tw-text-sm lg:tw-text-base tw-leading-relaxed tw-text-white/70 tw-mb-0">
                      {description}
                    </p>
                  </div>
                )}

                {/* Voting Status */}
                <div>
                  <div className="tw-text-xs tw-text-white/40 tw-mb-4 lg:tw-mb-6 tw-uppercase tw-tracking-widest">
                    Voting Status
                  </div>
                  <SingleWaveDropVotes drop={drop} />
                </div>

                {/* Outcome Section */}
                {wave && (
                  <div>
                    <div className="tw-text-xs tw-text-white/40 tw-mb-4 lg:tw-mb-6 tw-uppercase tw-tracking-widest">
                      Outcome
                    </div>
                    <WaveSmallLeaderboardItemOutcomes drop={drop} wave={wave} />
                  </div>
                )}

                {/* Voting Interface */}
                <div className="tw-pt-6 tw-border-t tw-border-solid tw-border-white/10 tw-border-x-0 tw-border-b-0">
                  <SingleWaveDropInfoActions drop={drop} />
                </div>

                <SingleWaveDropInfoDetails drop={drop} />

                {canDelete && drop.drop_type !== ApiDropType.Winner && (
                  <div className="tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0 tw-pt-4">
                    <WaveDropDeleteButton drop={drop} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFullscreen && artworkMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="tw-fixed tw-inset-0 tw-z-50 tw-bg-iron-950/90 tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-4"
          >
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
