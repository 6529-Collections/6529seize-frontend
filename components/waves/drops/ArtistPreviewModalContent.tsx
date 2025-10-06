"use client"

import React from "react";
import { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { ArtistActiveSubmissionContent } from "./ArtistActiveSubmissionContent";
import { ArtistWinningArtworksContent } from "./ArtistWinningArtworksContent";
import { ArtistPreviewModalHeader } from "./ArtistPreviewModalHeader";
import { ArtistPreviewModalTabs } from "./ArtistPreviewModalTabs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ModalTab } from "./ArtistPreviewModal";

interface ArtistPreviewModalContentProps {
  readonly user: ApiProfileMin;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly isApp?: boolean;
  readonly activeTab: ModalTab;
  readonly onTabChange: (tab: ModalTab) => void;
  readonly hasWinningArtworks: boolean;
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
  hasWinningArtworks,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const submissionCount = user.active_main_stage_submission_ids?.length || 0;
  const winnerCount = user.winner_main_stage_drop_ids?.length || 0;
  const hasActiveSubmissions = submissionCount > 0;

  const showTabs = hasActiveSubmissions && hasWinningArtworks;
  
  // Extract nested ternary for better readability
  let currentContentType: "active" | "winners";
  if (showTabs) {
    currentContentType = activeTab;
  } else if (hasWinningArtworks) {
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
    onClose();
  };

  return (
    <div className="tailwind-scope tw-relative tw-rounded-xl tw-overflow-hidden tw-bg-[#0E1012] tw-border tw-border-white/5 tw-shadow-[0_10px_40px_rgba(0,0,0,0.55)]">
      {currentContentType === "winners" && (
        <>
          {/* Top micro-gradient band for subtle luxe */}
          <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-h-12 tw-pointer-events-none tw-bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0)_70%)]" />
          {/* Faint glass film */}
          <div className="tw-absolute tw-inset-0 tw-pointer-events-none tw-backdrop-blur-[1px]" />
        </>
      )}
      
      {/* Header */}
      <ArtistPreviewModalHeader
        user={user}
        onClose={onClose}
        isApp={isApp}
        currentContentType={currentContentType}
        submissionCount={submissionCount}
        winnerCount={winnerCount}
      />

      {/* Tabs + content */}
      <div className="tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-relative">
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
              <ArtistActiveSubmissionContent user={user} isOpen={isOpen} onClose={onClose} isApp={isApp} />
            ) : (
              <ArtistWinningArtworksContent user={user} isOpen={isOpen} onDropClick={handleDropClick} />
            );
          }
          
          if (hasWinningArtworks) {
            return <ArtistWinningArtworksContent user={user} isOpen={isOpen} onDropClick={handleDropClick} />;
          }
          
          return <ArtistActiveSubmissionContent user={user} isOpen={isOpen} onClose={onClose} isApp={isApp} />;
        })()}
      </div>
    </div>
  );
};