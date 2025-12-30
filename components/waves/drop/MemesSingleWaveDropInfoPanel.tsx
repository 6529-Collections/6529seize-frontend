"use client";

import { useCallback, useMemo, useState, type MouseEvent } from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiWave } from "@/generated/models/ApiWave";
import { SingleWaveDropInfoDetails } from "./SingleWaveDropInfoDetails";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import { SingleWaveDropVotes } from "./SingleWaveDropVotes";
import { faCompress } from "@fortawesome/free-solid-svg-icons";
import { faAddressCard, faStar } from "@fortawesome/free-regular-svg-icons";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { SingleWaveDropTraits } from "./SingleWaveDropTraits";
import { SingleWaveDropPosition } from "./SingleWaveDropPosition";
import { ApiDropType } from "@/generated/models/ApiDropType";
import WaveDropDeleteButton from "@/components/utils/button/WaveDropDeleteButton";
import { ImageScale } from "@/helpers/image.helpers";
import Download from "@/components/download/Download";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import { ApiWaveOutcomeCredit } from "@/generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeType } from "@/generated/models/ApiWaveOutcomeType";
import { VotingModal, MobileVotingModal } from "@/components/voting";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { WaveDropVoteSummary } from "./WaveDropVoteSummary";
import { WaveDropMetaRow } from "./WaveDropMetaRow";

interface MemesSingleWaveDropInfoPanelProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
}

const calculateOutcomes = (drop: ExtendedDrop, wave: ApiWave | null) => {
  if (!wave || !drop.rank)
    return { nicTotal: 0, repTotal: 0, manualOutcomes: [] as string[] };

  const rank = drop.rank;
  const outcomes = wave.outcomes;

  const nicTotal = outcomes
    .filter((o) => o.credit === ApiWaveOutcomeCredit.Cic)
    .reduce((acc, o) => acc + (o.distribution?.[rank - 1]?.amount ?? 0), 0);

  const repTotal = outcomes
    .filter((o) => o.credit === ApiWaveOutcomeCredit.Rep)
    .reduce((acc, o) => acc + (o.distribution?.[rank - 1]?.amount ?? 0), 0);

  const manualOutcomes = outcomes
    .filter(
      (o) =>
        o.type === ApiWaveOutcomeType.Manual &&
        o.distribution?.[rank - 1]?.amount
    )
    .map((o) => o.distribution?.[rank - 1]?.description ?? "");

  return { nicTotal, repTotal, manualOutcomes };
};

export const MemesSingleWaveDropInfoPanel = ({
  drop,
  wave,
}: MemesSingleWaveDropInfoPanelProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const isMobileScreen = useIsMobileScreen();
  const { isWinner, canDelete, canShowVote, isVotingEnded } = useDropInteractionRules(drop);

  const { nicTotal, repTotal, manualOutcomes } = useMemo(
    () => calculateOutcomes(drop, wave),
    [drop, wave]
  );

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

  const toggleFullscreen = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <>
      <div className="tw-w-full">
        <div className="tw-w-full tw-min-h-screen tw-flex tw-flex-col">
          <div className="tw-flex-1 tw-flex tw-items-center tw-justify-center tw-px-4 sm:tw-px-6 xl:tw-px-20 tw-py-6 lg:tw-py-8">
            {artworkMedia && (
              <div className="tw-w-full md:tw-max-w-4xl tw-mx-auto tw-flex tw-items-center tw-justify-center">
                <div className="tw-relative tw-w-full tw-h-[60vh] md:tw-h-[80vh] lg:tw-h-[95vh]">
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

          <div className="tw-px-4 sm:tw-px-6 xl:tw-px-20 tw-mt-4 md:tw-mt-6">
            <div className="tw-max-w-3xl tw-mx-auto tw-w-full">
              <div className="tw-flex tw-justify-center tw-mb-8">
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
                <h1 className="tw-text-lg sm:tw-text-2xl tw-font-bold tw-text-white tw-mb-4 tw-tracking-tight">
                  {title}
                </h1>
                {description && (
                  <p className="tw-text-sm lg:tw-text-md tw-text-white/60 tw-mb-0">
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
                      className="tw-w-4 tw-h-4 tw-text-white/40"
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
                      className="tw-w-4 tw-h-4 tw-text-white/40"
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

        <div className="tw-w-full tw-h-px tw-bg-white/10 tw-my-8 md:tw-my-10"></div>

        <div className="tw-px-4 sm:tw-px-6 xl:tw-px-20 tw-pb-8 md:tw-pb-10">
          <div className="tw-max-w-3xl tw-mx-auto tw-space-y-8">
            <SingleWaveDropTraits drop={drop} />

            <SingleWaveDropInfoDetails drop={drop} />

            {artworkMedia && fileInfo && (
              <div className="tw-flex tw-gap-x-3 tw-items-center">
                <span className="tw-text-xs tw-font-medium tw-text-iron-600">
                  Media Type:{" "}
                  <span className="tw-text-iron-400">
                    {fileInfo.extension.toUpperCase()}
                  </span>
                </span>
                <Download
                  href={artworkMedia.url}
                  name={fileName ?? fileInfo.name}
                  extension={fileInfo.extension}
                  variant="text"
                  alwaysShowText
                />
              </div>
            )}

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
