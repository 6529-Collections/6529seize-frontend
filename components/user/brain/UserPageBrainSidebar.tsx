"use client";

import { useMemo } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useFavouriteWavesOfIdentity } from "@/hooks/useFavouriteWavesOfIdentity";
import { useWaves } from "@/hooks/useWaves";
import { useWaveCreatorPreviewModal } from "@/hooks/useWaveCreatorPreviewModal";
import { WaveCreatorPreviewModal } from "@/components/waves/drops/WaveCreatorPreviewModal";
import UserPageBrainSidebarCreated from "./UserPageBrainSidebarCreated";
import UserPageBrainSidebarMobileStrip from "./UserPageBrainSidebarMobileStrip";
import UserPageBrainSidebarMostActive from "./UserPageBrainSidebarMostActive";
import { getProfileWaveIdentity } from "./userPageBrainSidebar.helpers";

export default function UserPageBrainSidebar({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const identity = getProfileWaveIdentity(profile);
  const hasIdentity = identity.length > 0;
  const {
    waves: createdWaves,
    status: createdStatus,
    error: createdError,
  } = useWaves({
    identity,
    waveName: null,
    enabled: hasIdentity,
    directMessage: false,
    limit: 20,
  });
  const {
    waves: mostActiveWaves,
    status: mostActiveStatus,
    error: mostActiveError,
  } = useFavouriteWavesOfIdentity({
    identityKey: identity,
    limit: 3,
    enabled: hasIdentity,
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
  const shouldShowCreated =
    createdStatus === "pending" || createdWaves.length > 0;
  const shouldShowMostActive =
    mostActiveStatus === "pending" || mostActiveWaves.length > 0;

  if (!shouldShowCreated && !shouldShowMostActive) {
    return null;
  }

  return (
    <aside
      className="tw-order-1 tw-min-w-0 tw-self-start lg:tw-sticky lg:tw-top-8 lg:tw-order-2"
      data-testid="brain-sidebar"
    >
      <UserPageBrainSidebarMobileStrip
        createdWaves={createdWaves}
        createdStatus={createdStatus}
        createdError={createdError}
        mostActiveWaves={mostActiveWaves}
        mostActiveStatus={mostActiveStatus}
        mostActiveError={mostActiveError}
        onOpenCreatedWaves={handleBadgeClick}
      />

      <div
        className="tw-hidden tw-space-y-6 lg:tw-block"
        data-testid="brain-sidebar-desktop"
      >
        <UserPageBrainSidebarCreated
          identity={identity}
          waves={createdWaves}
          status={createdStatus}
          error={createdError}
        />
        <UserPageBrainSidebarMostActive
          waves={mostActiveWaves}
          status={mostActiveStatus}
          error={mostActiveError}
        />
      </div>

      <WaveCreatorPreviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={modalUser}
      />
    </aside>
  );
}
