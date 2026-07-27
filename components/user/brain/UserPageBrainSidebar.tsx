"use client";

import { useMemo } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useFavouriteWavesOfIdentity } from "@/hooks/useFavouriteWavesOfIdentity";
import { useProfileWaveActivity } from "@/hooks/useProfileWaveActivity";
import { useWaves } from "@/hooks/useWaves";
import { useWaveCreatorPreviewModal } from "@/hooks/useWaveCreatorPreviewModal";
import { WaveCreatorPreviewModal } from "@/components/waves/drops/WaveCreatorPreviewModal";
import UserPageBrainSidebarCreated from "./UserPageBrainSidebarCreated";
import UserPageBrainSidebarMobileStrip from "./UserPageBrainSidebarMobileStrip";
import UserPageBrainSidebarMostActive from "./UserPageBrainSidebarMostActive";
import { getProfileWaveIdentity } from "./userPageBrainSidebar.helpers";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";

function UserPageBrainSidebarLoading() {
  const loadingLabel = getUserPageBrainSidebarMessage(
    "user.brain.sidebar.loadingWaveContext"
  );

  return (
    <>
      <div
        aria-label={loadingLabel}
        className="tw-mb-4 lg:tw-hidden"
        role="status"
      >
        <div className="tw-mb-2 tw-h-2.5 tw-w-24 tw-animate-pulse tw-rounded tw-bg-white/[0.06] motion-reduce:tw-animate-none" />
        <div className="tw-flex tw-gap-2 tw-overflow-hidden">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="tw-flex tw-h-9 tw-w-32 tw-shrink-0 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950/70 tw-p-1 tw-pr-3"
            >
              <div className="tw-h-7 tw-w-7 tw-shrink-0 tw-animate-pulse tw-rounded-full tw-bg-white/[0.07] motion-reduce:tw-animate-none" />
              <div className="tw-h-3 tw-flex-1 tw-animate-pulse tw-rounded tw-bg-white/[0.07] motion-reduce:tw-animate-none" />
            </div>
          ))}
        </div>
      </div>

      <div
        aria-label={loadingLabel}
        className="tw-hidden lg:tw-block"
        role="status"
      >
        <div className="tw-mb-3 tw-h-3 tw-w-28 tw-animate-pulse tw-rounded tw-bg-white/[0.06] motion-reduce:tw-animate-none" />
        <div className="tw-space-y-2.5">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="tw-flex tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-white/5 tw-p-3 tw-shadow-inner"
            >
              <div className="tw-h-10 tw-w-10 tw-shrink-0 tw-animate-pulse tw-rounded-full tw-bg-white/[0.06] motion-reduce:tw-animate-none" />
              <div className="tw-min-w-0 tw-flex-1 tw-space-y-1.5">
                <div className="tw-h-3 tw-w-2/3 tw-animate-pulse tw-rounded tw-bg-white/[0.06] motion-reduce:tw-animate-none" />
                <div className="tw-h-2.5 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-white/[0.05] motion-reduce:tw-animate-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function UserPageBrainSidebar({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const identity = getProfileWaveIdentity(profile);
  const hasIdentity = identity.length > 0;
  const { waves: createdWaves, status: createdStatus } = useWaves({
    identity,
    waveName: null,
    enabled: hasIdentity,
    directMessage: false,
    limit: 20,
  });
  const { waves: mostActiveWaves, status: mostActiveStatus } =
    useFavouriteWavesOfIdentity({
      identityKey: identity,
      limit: 5,
      enabled: hasIdentity,
    });
  const mostActiveWaveIds = useMemo(
    () => mostActiveWaves.map((wave) => wave.id),
    [mostActiveWaves]
  );
  const latestProfileActivityByWaveId = useProfileWaveActivity({
    identity,
    waveIds: mostActiveWaveIds,
    enabled: hasIdentity && mostActiveStatus === "success",
  });
  const { isModalOpen, handleBadgeClick, handleModalClose } =
    useWaveCreatorPreviewModal();
  const modalUser = useMemo(
    () => ({
      handle: profile.handle,
      primary_address: profile.primary_wallet,
    }),
    [profile.handle, profile.primary_wallet]
  );
  const hasCreatedWaves = createdWaves.length > 0;
  const hasMostActiveWaves = mostActiveWaves.length > 0;
  const isLoading =
    hasIdentity &&
    (createdStatus === "pending" || mostActiveStatus === "pending");

  if (!isLoading && !hasCreatedWaves && !hasMostActiveWaves) {
    return null;
  }

  return (
    <aside
      className="tw-order-1 tw-min-w-0 tw-self-start lg:tw-sticky lg:tw-top-8 lg:tw-order-2"
      data-testid="brain-sidebar"
    >
      {isLoading ? (
        <UserPageBrainSidebarLoading />
      ) : (
        <>
          <UserPageBrainSidebarMobileStrip
            createdWaves={createdWaves}
            mostActiveWaves={mostActiveWaves}
            onOpenCreatedWaves={handleBadgeClick}
          />

          <div
            className="tw-hidden tw-space-y-6 lg:tw-block"
            data-testid="brain-sidebar-desktop"
          >
            <UserPageBrainSidebarCreated
              identity={identity}
              waves={createdWaves}
            />
            <UserPageBrainSidebarMostActive
              latestProfileActivityByWaveId={latestProfileActivityByWaveId}
              waves={mostActiveWaves}
            />
          </div>
        </>
      )}

      <WaveCreatorPreviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={modalUser}
      />
    </aside>
  );
}
