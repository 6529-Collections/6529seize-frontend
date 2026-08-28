"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileWaveActivityType } from "@/generated/models/ApiProfileWaveActivityType";
import { shortenAddress } from "@/helpers/address.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useProfileWaveActivityWaves } from "@/hooks/useProfileWaveActivityWaves";
import { useWaveCreatorPreviewModal } from "@/hooks/useWaveCreatorPreviewModal";
import UserPageBrainSidebarCreated from "./UserPageBrainSidebarCreated";
import UserPageBrainSidebarCreatedModal from "./UserPageBrainSidebarCreatedModal";
import UserPageBrainSidebarMobileStrip from "./UserPageBrainSidebarMobileStrip";
import UserPageBrainSidebarRecentlyActive from "./UserPageBrainSidebarRecentlyActive";
import { getProfileWaveIdentity } from "./userPageBrainSidebar.helpers";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";

const CREATED_PAGE_SIZE = 20;
const RECENT_PAGE_SIZE = 5;

export default function UserPageBrainSidebar({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const locale = useBrowserLocale();
  const identity = getProfileWaveIdentity(profile).trim();
  const hasIdentity = identity.length > 0;
  const createdState = useProfileWaveActivityWaves({
    identity: hasIdentity ? identity : null,
    activityType: ApiProfileWaveActivityType.Created,
    limit: CREATED_PAGE_SIZE,
  });
  const recentState = useProfileWaveActivityWaves({
    identity: hasIdentity ? identity : null,
    activityType: ApiProfileWaveActivityType.Recent,
    limit: RECENT_PAGE_SIZE,
  });
  const { isModalOpen, handleBadgeClick, handleModalClose } =
    useWaveCreatorPreviewModal();
  const profileDisplayName =
    profile.handle ?? shortenAddress(profile.primary_wallet);
  const isInitiallyLoading =
    createdState.isInitialLoading || recentState.isInitialLoading;
  const isLoadingMore =
    createdState.isFetchingNextPage || recentState.isFetchingNextPage;
  let liveMessage = "";
  if (isInitiallyLoading) {
    liveMessage = getUserPageBrainSidebarMessage(
      locale,
      "user.brain.sidebar.loadingWaveActivity"
    );
  } else if (isLoadingMore) {
    liveMessage = getUserPageBrainSidebarMessage(
      locale,
      "user.brain.sidebar.loadingMoreWaveActivity"
    );
  }

  if (!hasIdentity) {
    return null;
  }

  return (
    <aside
      className="tw-order-1 tw-min-w-0 tw-self-start lg:tw-sticky lg:tw-top-8 lg:tw-order-2"
      data-testid="brain-sidebar"
    >
      <output className="tw-sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </output>

      <UserPageBrainSidebarMobileStrip
        createdState={createdState}
        recentState={recentState}
        onOpenCreatedWaves={handleBadgeClick}
      />

      <div
        className="tw-hidden tw-space-y-6 lg:tw-block"
        data-testid="brain-sidebar-desktop"
      >
        <UserPageBrainSidebarCreated identity={identity} state={createdState} />
        <UserPageBrainSidebarRecentlyActive state={recentState} />
      </div>

      <UserPageBrainSidebarCreatedModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        profileDisplayName={profileDisplayName}
        state={createdState}
      />
    </aside>
  );
}
