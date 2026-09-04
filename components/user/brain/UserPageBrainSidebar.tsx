"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileWaveActivityType } from "@/generated/models/ApiProfileWaveActivityType";
import { shortenAddress } from "@/helpers/address.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useProfileWaveActivityWaves } from "@/hooks/useProfileWaveActivityWaves";
import { useWaveCreatorPreviewModal } from "@/hooks/useWaveCreatorPreviewModal";
import { useEffect, useRef, type KeyboardEvent } from "react";
import UserPageBrainSidebarCreated from "./UserPageBrainSidebarCreated";
import UserPageBrainSidebarCreatedModal from "./UserPageBrainSidebarCreatedModal";
import UserPageBrainSidebarMobileStrip from "./UserPageBrainSidebarMobileStrip";
import UserPageBrainSidebarRecentlyActive from "./UserPageBrainSidebarRecentlyActive";
import styles from "./UserPageBrainSidebar.module.css";
import { getProfileWaveIdentity } from "./userPageBrainSidebar.helpers";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";

const CREATED_PAGE_SIZE = 20;
const RECENT_PAGE_SIZE = 5;
const SCROLL_BOUNDARY_TOLERANCE_PX = 1;
const KEYBOARD_SCROLL_STEP_PX = 40;

const canScrollVertically = (element: HTMLDivElement): boolean =>
  element.scrollHeight - element.clientHeight > SCROLL_BOUNDARY_TOLERANCE_PX;

const isAtVerticalScrollBoundary = (
  element: HTMLDivElement,
  direction: -1 | 1
): boolean => {
  if (direction < 0) {
    return element.scrollTop <= SCROLL_BOUNDARY_TOLERANCE_PX;
  }

  const remainingScroll =
    element.scrollHeight - element.clientHeight - element.scrollTop;
  return remainingScroll <= SCROLL_BOUNDARY_TOLERANCE_PX;
};

const getKeyboardScrollTop = (
  event: KeyboardEvent<HTMLDivElement>
): number | null => {
  const sidebar = event.currentTarget;
  const pageScrollDistance = sidebar.clientHeight * 0.8;

  switch (event.key) {
    case "ArrowUp":
      return sidebar.scrollTop - KEYBOARD_SCROLL_STEP_PX;
    case "ArrowDown":
      return sidebar.scrollTop + KEYBOARD_SCROLL_STEP_PX;
    case "PageUp":
      return sidebar.scrollTop - pageScrollDistance;
    case "PageDown":
      return sidebar.scrollTop + pageScrollDistance;
    case "Home":
      return 0;
    case "End":
      return sidebar.scrollHeight - sidebar.clientHeight;
    case " ":
      if (event.target === sidebar) {
        return (
          sidebar.scrollTop +
          (event.shiftKey ? -pageScrollDistance : pageScrollDistance)
        );
      }
      return null;
    default:
      return null;
  }
};

export default function UserPageBrainSidebar({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const locale = useBrowserLocale();
  const desktopSidebarRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const sidebar = desktopSidebarRef.current;
    if (!sidebar) {
      return;
    }

    // React delegates wheel events passively, so the boundary guard needs a
    // native listener to keep Chromium from handing the gesture to the feed.
    const handleWheel = (event: WheelEvent) => {
      if (!canScrollVertically(sidebar) || event.deltaY === 0) {
        return;
      }

      const direction = event.deltaY < 0 ? -1 : 1;
      if (isAtVerticalScrollBoundary(sidebar, direction)) {
        event.preventDefault();
      }
    };

    sidebar.addEventListener("wheel", handleWheel, { passive: false });
    return () => sidebar.removeEventListener("wheel", handleWheel);
  }, [hasIdentity]);

  const handleDesktopSidebarKeyDown = (
    event: KeyboardEvent<HTMLDivElement>
  ) => {
    const sidebar = event.currentTarget;
    const nextScrollTop = getKeyboardScrollTop(event);
    if (nextScrollTop === null || !canScrollVertically(sidebar)) {
      return;
    }

    const maxScrollTop = sidebar.scrollHeight - sidebar.clientHeight;
    event.preventDefault();
    sidebar.scrollTop = Math.min(Math.max(nextScrollTop, 0), maxScrollTop);
  };

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

      <section
        aria-label={getUserPageBrainSidebarMessage(
          locale,
          "user.brain.sidebar.desktopScrollRegionLabel"
        )}
        className={`${styles["desktopScrollRegion"] ?? ""} tw-hidden tw-space-y-6 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 lg:tw-block lg:tw-max-h-[calc(100dvh-4rem)] lg:tw-overflow-y-auto lg:tw-overflow-x-hidden lg:tw-overscroll-y-contain lg:tw-pb-1 lg:tw-pr-1 lg:tw-scrollbar-thin lg:tw-scrollbar-track-transparent lg:tw-scrollbar-thumb-iron-700/70 desktop-hover:hover:lg:tw-scrollbar-thumb-iron-500`}
        data-brain-sidebar-scroll-region
        data-testid="brain-sidebar-desktop"
        onKeyDown={handleDesktopSidebarKeyDown}
        ref={desktopSidebarRef}
        tabIndex={0}
      >
        <UserPageBrainSidebarCreated identity={identity} state={createdState} />
        <UserPageBrainSidebarRecentlyActive state={recentState} />
      </section>

      <UserPageBrainSidebarCreatedModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        profileDisplayName={profileDisplayName}
        state={createdState}
      />
    </aside>
  );
}
