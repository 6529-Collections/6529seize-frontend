"use client";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import WaveDropPartContentMarkdown from "@/components/waves/drops/WaveDropPartContentMarkdown";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import { ImageScale } from "@/helpers/image.helpers";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { startDropOpen } from "@/utils/monitoring/dropOpenTiming";
import React, {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import WaveLeaderboardGalleryItemVotes from "../gallery/WaveLeaderboardGalleryItemVotes";
import type { WaveLeaderboardGridMode } from "./WaveLeaderboardGrid";

interface WaveLeaderboardGridItemProps {
  readonly drop: ExtendedDrop;
  readonly mode: WaveLeaderboardGridMode;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveLeaderboardGridItem: React.FC<
  WaveLeaderboardGridItemProps
> = ({ drop, mode, onDropClick }) => {
  const isMobileScreen = useIsMobileScreen();
  const [viewportEl, setViewportEl] = useState<HTMLDivElement | null>(null);
  const [innerEl, setInnerEl] = useState<HTMLDivElement | null>(null);

  const previewImageUrl = useMemo(
    () => getDropPreviewImageUrl(drop.metadata),
    [drop.metadata]
  );

  const activePart = drop.parts[0];
  const primaryMedia = activePart?.media[0];

  const mediaUrl = primaryMedia?.url ?? previewImageUrl ?? null;
  const mediaMimeType = primaryMedia?.mime_type ?? "image/jpeg";

  const getOverflowSnapshot = useCallback(() => {
    if (!viewportEl || !innerEl) {
      return false;
    }

    return innerEl.scrollHeight > viewportEl.clientHeight + 1;
  }, [innerEl, viewportEl]);

  const subscribeToOverflow = useCallback(
    (onStoreChange: () => void) => {
      if (!viewportEl || !innerEl) {
        return () => {};
      }

      if (typeof ResizeObserver === "undefined") {
        window.addEventListener("resize", onStoreChange);
        return () => {
          window.removeEventListener("resize", onStoreChange);
        };
      }

      const observer = new ResizeObserver(() => {
        onStoreChange();
      });
      observer.observe(viewportEl);
      observer.observe(innerEl);

      return () => {
        observer.disconnect();
      };
    },
    [innerEl, viewportEl]
  );

  const showGradient = useSyncExternalStore(
    subscribeToOverflow,
    getOverflowSnapshot,
    () => false
  );

  const openDrop = () => {
    startDropOpen({
      dropId: drop.id,
      waveId: drop.wave.id,
      source: "leaderboard_grid",
      isMobile: isMobileScreen,
    });
    onDropClick(drop);
  };

  const onCardClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button")) {
      return;
    }
    openDrop();
  };

  const onCardKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDrop();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`wave-leaderboard-grid-item-${drop.id}`}
      onClick={onCardClick}
      onKeyDown={onCardKeyDown}
      className={`tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3 tw-transition desktop-hover:hover:tw-border-iron-700 ${
        mode === "compact" ? "tw-h-[26rem]" : "tw-h-[23rem]"
      }`}
    >
      <div
        ref={setViewportEl}
        className={`tw-relative tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/50 tw-p-3 ${
          mode === "compact" ? "tw-h-[19rem]" : "tw-h-[20rem]"
        }`}
      >
        <div ref={setInnerEl} className="tw-space-y-3">
          {mediaUrl && (
            <div className="tw-overflow-hidden tw-rounded-lg tw-bg-iron-900">
              <MediaDisplay
                media_mime_type={mediaMimeType}
                media_url={mediaUrl}
                disableMediaInteraction={true}
                imageScale={ImageScale.AUTOx450}
                previewImageUrl={previewImageUrl}
              />
            </div>
          )}
          {activePart && (
            <WaveDropPartContentMarkdown
              mentionedUsers={drop.mentioned_users}
              mentionedWaves={drop.mentioned_waves}
              referencedNfts={drop.referenced_nfts}
              part={activePart}
              wave={drop.wave}
              onQuoteClick={() => {}}
              marketplaceImageOnly={mode === "content_only"}
            />
          )}
        </div>
        {showGradient && (
          <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-14 tw-bg-gradient-to-t tw-from-iron-900 tw-via-iron-900/90 tw-to-transparent" />
        )}
      </div>

      {mode === "compact" && (
        <div
          data-testid={`wave-leaderboard-grid-item-footer-${drop.id}`}
          className="tw-mt-3 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-3"
        >
          <div className="tw-flex tw-items-center">
            {typeof drop.rank === "number" ? (
              <WinnerDropBadge
                rank={drop.rank}
                decisionTime={drop.winning_context?.decision_time ?? null}
              />
            ) : (
              <div className="tw-flex tw-h-6 tw-min-w-6 tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-800 tw-px-2 tw-text-xs tw-font-semibold tw-text-iron-400">
                -
              </div>
            )}
          </div>
          <WaveLeaderboardGalleryItemVotes drop={drop} />
        </div>
      )}
    </div>
  );
};
