"use client";

import Download from "@/components/download/Download";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import WaveDropDeleteButton from "@/components/utils/button/WaveDropDeleteButton";
import { MobileVotingModal, VotingModal } from "@/components/voting";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import { ImageScale } from "@/helpers/image.helpers";
import {
  ExtendedDrop,
  getDropPreviewImageUrl,
} from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useWaveRankReward } from "@/hooks/waves/useWaveRankReward";
import { faAddressCard, faStar } from "@fortawesome/free-regular-svg-icons";
import { faCompress } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState, type MouseEvent } from "react";
import { SingleWaveDropInfoDetails } from "./SingleWaveDropInfoDetails";
import { SingleWaveDropPosition } from "./SingleWaveDropPosition";
import { SingleWaveDropTraits } from "./SingleWaveDropTraits";
import { SingleWaveDropVotes } from "./SingleWaveDropVotes";
import { WaveDropAdditionalInfo } from "./WaveDropAdditionalInfo";
import { WaveDropMetaRow } from "./WaveDropMetaRow";
import { WaveDropVoteSummary } from "./WaveDropVoteSummary";

interface MemesSingleWaveDropInfoPanelProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
}

export const MemesSingleWaveDropInfoPanel = ({
  drop,
  wave,
}: MemesSingleWaveDropInfoPanelProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const isMobileScreen = useIsMobileScreen();
  const { isWinner, canDelete, canShowVote, isVotingEnded } =
    useDropInteractionRules(drop);

  const { nicTotal, repTotal, manualOutcomes } = useWaveRankReward({
    waveId: drop.wave.id,
    rank: drop.rank,
    enabled: true,
  });

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

  const previewImageData = useMemo(() => {
    const url = getDropPreviewImageUrl(drop.metadata);
    if (!url) return null;

    const info = getFileInfoFromUrl(url);
    if (!info) return null;

    return { url, fileInfo: info };
  }, [drop.metadata]);

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

  const toggleFullscreen = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <>
      <div className="tw-w-full">
        <div className="tw-flex tw-min-h-screen tw-w-full tw-flex-col">
          <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center tw-px-4 tw-py-6 sm:tw-px-6 lg:tw-py-8 xl:tw-px-20">
            {artworkMedia && (
              <div className="tw-mx-auto tw-flex tw-w-full tw-items-center tw-justify-center md:tw-max-w-4xl">
                <div className="tw-relative tw-h-[60vh] tw-w-full md:tw-h-[80vh] lg:tw-h-[95vh]">
                  <DropListItemContentMedia
                    media_mime_type={artworkMedia.mime_type}
                    media_url={artworkMedia.url}
                    isCompetitionDrop={true}
                    imageScale={ImageScale.AUTOx1080}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="tw-mt-4 tw-px-4 sm:tw-px-6 md:tw-mt-6 xl:tw-px-20">
            <div className="tw-mx-auto tw-w-full tw-max-w-3xl">
              <div className="tw-mb-8 tw-flex tw-justify-center">
                <WaveDropVoteSummary
                  drop={drop}
                  isWinner={isWinner}
                  isVotingEnded={isVotingEnded}
                  canShowVote={canShowVote}
                  onVoteClick={() => setIsVotingOpen(true)}
                  variant="memes"
                />
              </div>

              <div className="tw-mb-6">
                <h1 className="tw-mb-4 tw-text-lg tw-font-bold tw-tracking-tight tw-text-white sm:tw-text-2xl">
                  {title}
                </h1>
                {description && (
                  <p className="tw-mb-0 tw-text-sm tw-text-white/60 lg:tw-text-md">
                    {description}
                  </p>
                )}
              </div>

              <WaveDropMetaRow drop={drop} isWinner={isWinner}>
                {manualOutcomes.length > 0 && (
                  <>
                    <span className="tw-text-white/40">·</span>
                    {manualOutcomes.map((outcome) => (
                      <span
                        key={outcome}
                        className="tw-text-sm tw-text-amber-400/70"
                      >
                        {outcome}
                      </span>
                    ))}
                  </>
                )}
                {!!nicTotal && (
                  <>
                    <span className="tw-text-white/40">·</span>
                    <FontAwesomeIcon
                      icon={faAddressCard}
                      className="tw-h-4 tw-w-4 tw-text-white/40"
                    />
                    <span className="tw-text-sm tw-text-white/60">
                      {nicTotal} NIC
                    </span>
                  </>
                )}
                {!!repTotal && (
                  <>
                    <span className="tw-text-white/40">·</span>
                    <FontAwesomeIcon
                      icon={faStar}
                      className="tw-h-4 tw-w-4 tw-text-white/40"
                    />
                    <span className="tw-text-sm tw-text-white/60">
                      {repTotal} Rep
                    </span>
                  </>
                )}
              </WaveDropMetaRow>
            </div>
          </div>
        </div>

        <div className="tw-my-8 tw-h-px tw-w-full tw-bg-white/10 md:tw-my-10"></div>

        <div className="tw-px-4 tw-pb-8 sm:tw-px-6 md:tw-pb-10 xl:tw-px-20">
          <div className="tw-mx-auto tw-max-w-3xl tw-space-y-8">
            <SingleWaveDropTraits drop={drop} />
            <SingleWaveDropInfoDetails drop={drop} />
            <WaveDropAdditionalInfo drop={drop} />

            {(artworkMedia && fileInfo) || previewImageData ? (
              <div className="tw-mt-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8">
                <div className="tw-inline-grid tw-grid-cols-[auto_auto_auto] tw-items-center tw-gap-x-3 tw-gap-y-2">
                  {artworkMedia && fileInfo && (
                    <>
                      <span className="tw-text-xs tw-font-medium tw-text-iron-600">
                        Media Type:
                      </span>
                      <span className="tw-text-xs tw-font-medium tw-text-iron-400">
                        {fileInfo.extension.toUpperCase()}
                      </span>
                      <Download
                        href={artworkMedia.url}
                        name={fileName ?? fileInfo.name}
                        extension={fileInfo.extension}
                        variant="text"
                        alwaysShowText
                      />
                    </>
                  )}
                  {previewImageData && (
                    <>
                      <span className="tw-text-xs tw-font-medium tw-text-iron-600">
                        Preview:
                      </span>
                      <span className="tw-text-xs tw-font-medium tw-text-iron-400">
                        {previewImageData.fileInfo.extension.toUpperCase()}
                      </span>
                      <Download
                        href={previewImageData.url}
                        name={`${fileName ?? "preview"}-preview`}
                        extension={previewImageData.fileInfo.extension}
                        variant="text"
                        alwaysShowText
                      />
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {canDelete && drop.drop_type !== ApiDropType.Winner && (
              <WaveDropDeleteButton drop={drop} />
            )}
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
            className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-iron-950/90 tw-p-4"
          >
            <div className="tw-mb-4 tw-flex tw-w-full tw-max-w-5xl tw-items-center tw-justify-between">
              <div className="tw-flex tw-flex-col">
                <div className="tw-flex tw-items-center tw-gap-x-3">
                  <SingleWaveDropPosition rank={drop.rank ?? 1} drop={drop} />
                  <h3 className="tw-text-xl tw-font-semibold tw-text-iron-100">
                    {title}
                  </h3>
                </div>
                {description && (
                  <p className="tw-ml-10 tw-mt-1 tw-text-md tw-text-iron-400">
                    {description}
                  </p>
                )}
              </div>

              <div className="tw-mx-auto">
                <SingleWaveDropVotes drop={drop} />
              </div>

              <button
                onClick={toggleFullscreen}
                className="tw-rounded-lg tw-bg-iron-900/80 tw-p-3 tw-text-iron-100 tw-transition-colors tw-duration-200 hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
                aria-label="Exit fullscreen view"
              >
                <FontAwesomeIcon icon={faCompress} className="tw-h-5 tw-w-5" />
              </button>
            </div>

            <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
              <img
                src={artworkMedia.url}
                alt={title}
                className="tw-max-h-full tw-max-w-full tw-object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isMobileScreen ? (
        <MobileVotingModal
          drop={drop}
          isOpen={isVotingOpen}
          onClose={() => setIsVotingOpen(false)}
        />
      ) : (
        <VotingModal
          drop={drop}
          isOpen={isVotingOpen}
          onClose={() => setIsVotingOpen(false)}
        />
      )}
    </>
  );
};
