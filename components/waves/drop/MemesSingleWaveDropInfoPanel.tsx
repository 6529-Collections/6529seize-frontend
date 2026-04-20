"use client";

import { MobileVotingModal, VotingModal } from "@/components/voting";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import {
  getDropPreviewImageUrl,
  getDropPromoVideoUrl,
} from "@/helpers/waves/drop.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useWaveRankReward } from "@/hooks/waves/useWaveRankReward";
import { useCallback, useMemo, useState } from "react";
import { MemesDropArtworkHero } from "./MemesDropArtworkHero";
import { MemesDropDetailsSection } from "./MemesDropDetailsSection";
import { MemesDropFullscreenOverlay } from "./MemesDropFullscreenOverlay";
import { MemesDropSummarySection } from "./MemesDropSummarySection";

interface MemesSingleWaveDropInfoPanelProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
  readonly onClose?: (() => void) | undefined;
}

export const MemesSingleWaveDropInfoPanel = ({
  drop,
  wave,
  onClose,
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

  const promoVideoData = useMemo(() => {
    const url = getDropPromoVideoUrl(drop.metadata);
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

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);
  const handleOpenFullscreen = useCallback(() => {
    setIsFullscreen(true);
  }, []);
  const handleOpenVoting = useCallback(() => {
    setIsVotingOpen(true);
  }, []);
  const handleCloseVoting = useCallback(() => {
    setIsVotingOpen(false);
  }, []);

  return (
    <>
      <div className="tw-w-full">
        <MemesDropArtworkHero
          artworkMedia={artworkMedia}
          onOpenFullscreen={handleOpenFullscreen}
        />
        <MemesDropSummarySection
          drop={drop}
          title={title}
          description={description}
          artworkMimeType={artworkMedia?.mime_type}
          isWinner={isWinner}
          isVotingEnded={isVotingEnded}
          canShowVote={canShowVote}
          manualOutcomes={manualOutcomes}
          nicTotal={nicTotal}
          repTotal={repTotal}
          onVoteClick={handleOpenVoting}
        />

        <div className="tw-my-8 tw-h-px tw-w-full tw-bg-white/10 md:tw-my-10"></div>

        <MemesDropDetailsSection
          drop={drop}
          wave={wave}
          artworkMedia={artworkMedia}
          fileInfo={fileInfo}
          previewImageData={previewImageData}
          promoVideoData={promoVideoData}
          fileName={fileName}
          canDelete={canDelete}
          onClose={onClose}
        />
      </div>

      <MemesDropFullscreenOverlay
        isOpen={isFullscreen}
        artworkMedia={artworkMedia}
        drop={drop}
        title={title}
        description={description}
        onClose={handleCloseFullscreen}
      />

      {isMobileScreen ? (
        <MobileVotingModal
          drop={drop}
          isOpen={isVotingOpen}
          onClose={handleCloseVoting}
        />
      ) : (
        <VotingModal
          drop={drop}
          isOpen={isVotingOpen}
          onClose={handleCloseVoting}
        />
      )}
    </>
  );
};
