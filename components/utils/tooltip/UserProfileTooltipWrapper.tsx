"use client";

import React, { useCallback, useState } from "react";
import HoverCard from "./HoverCard";
import UserProfileTooltip from "@/components/user/utils/profile/UserProfileTooltip";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { ArtistPreviewModal } from "@/components/waves/drops/ArtistPreviewModal";
import { WaveCreatorPreviewModal } from "@/components/waves/drops/WaveCreatorPreviewModal";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ArtistPreviewTab } from "@/hooks/useArtistPreviewModal";

interface UserProfileTooltipWrapperProps {
  readonly user: string;
  readonly children: React.ReactElement;
  readonly placement?: "top" | "bottom" | "left" | "right" | "auto" | undefined;
}

export default function UserProfileTooltipWrapper({
  user,
  children,
  placement = "auto",
}: UserProfileTooltipWrapperProps) {
  const { hasTouchScreen } = useDeviceInfo();
  const trimmedUser = user.trim();
  const ariaLabel = trimmedUser
    ? `User profile for ${trimmedUser}`
    : "User profile";
  const [artistPreview, setArtistPreview] = useState<{
    readonly user: ApiProfileMin;
    readonly activeTab: ArtistPreviewTab;
  } | null>(null);
  const [waveCreatorUser, setWaveCreatorUser] = useState<ApiProfileMin | null>(
    null
  );

  const handleArtistPreviewOpen = useCallback(
    (params: {
      readonly user: ApiProfileMin;
      readonly initialTab: ArtistPreviewTab;
    }) => {
      setWaveCreatorUser(null);
      setArtistPreview({
        user: params.user,
        activeTab: params.initialTab,
      });
    },
    []
  );

  const handleArtistPreviewTabChange = useCallback((tab: ArtistPreviewTab) => {
    setArtistPreview((current) => {
      if (current === null || current.activeTab === tab) {
        return current;
      }

      return {
        ...current,
        activeTab: tab,
      };
    });
  }, []);

  const handleArtistPreviewClose = useCallback(() => {
    setArtistPreview(null);
  }, []);

  const handleWaveCreatorPreviewOpen = useCallback(
    (modalUser: ApiProfileMin) => {
      setArtistPreview(null);
      setWaveCreatorUser(modalUser);
    },
    []
  );

  const handleWaveCreatorPreviewClose = useCallback(() => {
    setWaveCreatorUser(null);
  }, []);

  // If it's a touch device, just render the children without the tooltip
  if (hasTouchScreen) {
    return <>{children}</>;
  }

  return (
    <>
      <HoverCard
        content={
          <UserProfileTooltip
            user={user}
            onArtistPreviewOpen={handleArtistPreviewOpen}
            onWaveCreatorPreviewOpen={handleWaveCreatorPreviewOpen}
          />
        }
        ariaLabel={ariaLabel}
        placement={placement}
        delayShow={500}
        delayHide={0}
      >
        {children}
      </HoverCard>
      {artistPreview && (
        <ArtistPreviewModal
          isOpen
          onClose={handleArtistPreviewClose}
          user={artistPreview.user}
          activeTab={artistPreview.activeTab}
          onTabChange={handleArtistPreviewTabChange}
        />
      )}
      {waveCreatorUser && (
        <WaveCreatorPreviewModal
          isOpen
          onClose={handleWaveCreatorPreviewClose}
          user={waveCreatorUser}
        />
      )}
    </>
  );
}
