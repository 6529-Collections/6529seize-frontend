"use client";

import React from "react";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ArtistActiveSubmissionContent } from "./ArtistActiveSubmissionContent";
import { ArtistWinningArtworksContent } from "./ArtistWinningArtworksContent";
import { ArtistPreviewModalHeader } from "./ArtistPreviewModalHeader";
import { ArtistPreviewModalTabs } from "./ArtistPreviewModalTabs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ModalTab } from "./ArtistPreviewModal";
import { useCompactMode } from "@/contexts/CompactModeContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  getSubmissionCount,
  getTrophyArtworkCount,
} from "@/helpers/artist-activity.helpers";
import { useIdentity } from "@/hooks/useIdentity";

interface ArtistPreviewModalContentProps {
  readonly user: ApiProfileMin;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly isApp?: boolean | undefined;
  readonly activeTab: ModalTab;
  readonly onTabChange: (tab: ModalTab) => void;
  readonly hasTrophyArtworks: boolean;
}

export const ArtistPreviewModalContent: React.FC<
  ArtistPreviewModalContentProps
> = ({
  user,
  isOpen,
  onClose,
  isApp = false,
  activeTab,
  onTabChange,
  hasTrophyArtworks,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const compact = useCompactMode();
  const isSmallScreen = useMediaQuery("(max-width: 1023px)");

  const submissionCount = getSubmissionCount(user);
  const trophyCount = getTrophyArtworkCount(user);
  const knownSubmissionIdsCount = user.active_main_stage_submission_ids.length;
  const knownTrophyIdsCount =
    user.winner_main_stage_drop_ids.length +
    user.artist_of_prevote_cards.length;
  const identityKey = user.handle ?? user.primary_address;
  const shouldHydrateArtistActivity =
    isOpen &&
    !!identityKey &&
    (submissionCount > knownSubmissionIdsCount ||
      trophyCount > knownTrophyIdsCount);
  const { profile: hydratedIdentity, isLoading: isHydratingArtistActivity } =
    useIdentity({
      handleOrWallet: shouldHydrateArtistActivity ? identityKey : undefined,
      initialProfile: null,
    });
  const hydratedUser = React.useMemo(
    () => mergeArtistActivity(user, hydratedIdentity),
    [hydratedIdentity, user]
  );
  const hydratedSubmissionCount = getSubmissionCount(hydratedUser);
  const hydratedTrophyCount = getTrophyArtworkCount(hydratedUser);
  const hasActiveSubmissions = hydratedSubmissionCount > 0;
  const hasHydratedTrophyArtworks =
    hasTrophyArtworks || hydratedTrophyCount > 0;

  const showTabs = hasActiveSubmissions && hasHydratedTrophyArtworks;

  // Extract nested ternary for better readability
  let currentContentType: "active" | "winners";
  if (showTabs) {
    currentContentType = activeTab;
  } else if (hasHydratedTrophyArtworks) {
    currentContentType = "winners";
  } else {
    currentContentType = "active";
  }

  const handleDropClick = (drop: ExtendedDrop) => {
    if (searchParams) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("drop", drop.id);
      router.push(`${pathname}?${params.toString()}`);
    }
    if (compact && isSmallScreen && globalThis.window !== undefined) {
      globalThis.window.dispatchEvent(
        new CustomEvent("single-drop:close-chat")
      );
    }
    onClose();
  };

  return (
    <div className="tailwind-scope tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-white/5 tw-bg-[#0E1012] tw-shadow-[0_10px_40px_rgba(0,0,0,0.55)]">
      {currentContentType === "winners" && (
        <>
          {/* Top micro-gradient band for subtle luxe */}
          <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-h-12 tw-bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0)_70%)]" />
          {/* Faint glass film */}
          <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-backdrop-blur-[1px]" />
        </>
      )}

      {/* Header */}
      <ArtistPreviewModalHeader
        user={hydratedUser}
        onClose={onClose}
        isApp={isApp}
        currentContentType={currentContentType}
        submissionCount={hydratedSubmissionCount}
        trophyCount={hydratedTrophyCount}
      />

      {/* Tabs + content */}
      <div className="tw-relative tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300">
        {showTabs && (
          <ArtistPreviewModalTabs
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        )}

        {(() => {
          if (isHydratingArtistActivity) {
            return <ArtistActivityLoadingState />;
          }

          // Extract nested ternary logic for better readability
          if (showTabs) {
            return activeTab === "active" ? (
              <ArtistActiveSubmissionContent
                user={hydratedUser}
                isOpen={isOpen}
                onClose={onClose}
                isApp={isApp}
              />
            ) : (
              <ArtistWinningArtworksContent
                user={hydratedUser}
                isOpen={isOpen}
                onDropClick={handleDropClick}
              />
            );
          }

          if (hasHydratedTrophyArtworks) {
            return (
              <ArtistWinningArtworksContent
                user={hydratedUser}
                isOpen={isOpen}
                onDropClick={handleDropClick}
              />
            );
          }

          return (
            <ArtistActiveSubmissionContent
              user={hydratedUser}
              isOpen={isOpen}
              onClose={onClose}
              isApp={isApp}
            />
          );
        })()}
      </div>
    </div>
  );
};

const mergeArtistActivity = (
  user: ApiProfileMin,
  identity: ApiIdentity | null
): ApiProfileMin => {
  if (!identity) {
    return user;
  }

  return {
    ...user,
    active_main_stage_submission_ids: identity.active_main_stage_submission_ids,
    winner_main_stage_drop_ids: identity.winner_main_stage_drop_ids,
    artist_of_prevote_cards: identity.artist_of_prevote_cards,
    profile_wave_id: identity.profile_wave_id ?? user.profile_wave_id,
    is_wave_creator: identity.is_wave_creator || user.is_wave_creator,
  };
};

const ArtistActivityLoadingState = () => (
  <div className="tw-flex tw-h-96 tw-items-center tw-justify-center">
    <div className="tw-flex tw-flex-col tw-items-center tw-gap-4">
      <div className="tw-h-8 tw-w-8 tw-animate-spin tw-rounded-full tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-400"></div>
      <span className="tw-animate-fade-in-out tw-text-sm tw-text-iron-400">
        Loading artist activity...
      </span>
    </div>
  </div>
);
