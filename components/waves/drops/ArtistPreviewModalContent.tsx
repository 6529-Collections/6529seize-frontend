"use client";

import React from "react";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
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
  const hasActiveSubmissions = submissionCount > 0;

  const showTabs = hasActiveSubmissions && hasTrophyArtworks;

  // Extract nested ternary for better readability
  let currentContentType: "active" | "winners";
  if (showTabs) {
    currentContentType = activeTab;
  } else if (hasTrophyArtworks) {
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
        user={user}
        onClose={onClose}
        isApp={isApp}
        currentContentType={currentContentType}
        submissionCount={submissionCount}
        trophyCount={trophyCount}
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
          // Extract nested ternary logic for better readability
          if (showTabs) {
            return activeTab === "active" ? (
              <ArtistActiveSubmissionContent
                user={user}
                isOpen={isOpen}
                onClose={onClose}
                isApp={isApp}
              />
            ) : (
              <ArtistWinningArtworksContent
                user={user}
                isOpen={isOpen}
                onDropClick={handleDropClick}
              />
            );
          }

          if (hasTrophyArtworks) {
            return (
              <ArtistWinningArtworksContent
                user={user}
                isOpen={isOpen}
                onDropClick={handleDropClick}
              />
            );
          }

          return (
            <ArtistActiveSubmissionContent
              user={user}
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
