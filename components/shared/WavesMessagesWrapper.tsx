"use client";

import useCreateModalState from "@/hooks/useCreateModalState";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createBreakpoint } from "react-use";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import type { ApiDrop } from "../../generated/models/ApiDrop";
import { DropSize } from "../../helpers/waves/drop.helpers";
import { useSidebarState } from "../../hooks/useSidebarState";
import { useAuth } from "../auth/Auth";
import BrainDesktopDrop from "../brain/BrainDesktopDrop";
import WebBrainLeftSidebar from "../brain/left-sidebar/web/WebLeftSidebar";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import BrainRightSidebar, {
  SidebarTab,
} from "../brain/right-sidebar/BrainRightSidebar";
import CreateWaveModal from "../waves/create-wave/CreateWaveModal";
import { WaveChatScrollProvider } from "@/contexts/wave/WaveChatScrollContext";
import { useClosingDropId } from "@/hooks/useClosingDropId";
import {
  DROP_DETAIL_STALE_TIME_MS,
  fetchDropByIdBatched,
  getDropQueryKey,
} from "@/services/api/drop-api";

const useBreakpoint = createBreakpoint({ XL: 1400, LG: 1024, S: 0 });

interface WavesMessagesWrapperProps {
  readonly children: ReactNode;
  readonly defaultPath?: string | undefined; // "/waves" or "/messages"
  readonly showLeftSidebar?: boolean | undefined;
}

const WavesMessagesWrapper: React.FC<WavesMessagesWrapperProps> = ({
  children,
  defaultPath = "/waves",
  showLeftSidebar = true,
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const breakpoint = useBreakpoint();

  // Access layout context for pre-calculated styles
  const { contentContainerStyle } = useLayout();

  // Get global sidebar state
  const { isRightSidebarOpen, closeRightSidebar } = useSidebarState();
  const { connectedProfile } = useAuth();
  const { isWaveModalOpen, close } = useCreateModalState();

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(SidebarTab.ABOUT);

  const rawDropId = searchParams.get("drop") ?? undefined;
  const waveId =
    getActiveWaveIdFromUrl({ pathname, searchParams }) ?? undefined;

  // Validate drop ID format (assuming alphanumeric + hyphens)
  const dropId =
    rawDropId && /^[a-zA-Z0-9-_]+$/.test(rawDropId) ? rawDropId : undefined;
  const { effectiveDropId, beginClosingDrop } = useClosingDropId(dropId);

  // Check if we're on mobile (below LG breakpoint)
  const isMobile = breakpoint === "S";
  const isLargeDesktop = breakpoint === "XL";

  // Auto-close right sidebar when no wave is selected
  useEffect(() => {
    if (!waveId && isRightSidebarOpen) {
      closeRightSidebar();
    }
  }, [waveId, isRightSidebarOpen, closeRightSidebar]);

  const { data: drop, error: dropError } = useQuery<ApiDrop>({
    queryKey: getDropQueryKey(effectiveDropId),
    queryFn: () => {
      if (!effectiveDropId) {
        throw new Error("Cannot fetch drop without a drop id");
      }

      return fetchDropByIdBatched(effectiveDropId);
    },
    placeholderData: keepPreviousData,
    enabled: !!effectiveDropId,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
  });

  const onDropClose = useCallback(() => {
    if (dropId) {
      beginClosingDrop(dropId);
    }
    const params = new URLSearchParams(searchParams.toString() || "");
    params.delete("drop");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname || defaultPath;
    router.replace(newUrl, { scroll: false });
  }, [dropId, beginClosingDrop, searchParams, pathname, defaultPath, router]);

  const isDropOpen = useMemo(
    () =>
      Boolean(
        effectiveDropId &&
        drop?.id.toLowerCase() === effectiveDropId.toLowerCase()
      ),
    [effectiveDropId, drop?.id]
  );

  // Clear logic for when to show each part
  const hasWave = waveId !== undefined;
  // The create route has no waveId but IS the main content; without this it
  // is unreachable on mobile (the wave list renders instead of the form).
  const isCreateRoute = pathname === "/waves/create";
  const canShowMainContent = !isMobile || hasWave || isCreateRoute;
  const showProfileFeedShortcut = !isMobile;
  const shouldShowLeftSidebar =
    showLeftSidebar && (!isMobile || (!hasWave && !canShowMainContent));
  const shouldShowMainContent = canShowMainContent;
  const shouldShowDropOverlay =
    isDropOpen && drop !== undefined && shouldShowMainContent;
  const shouldShowRightSidebar = Boolean(
    isRightSidebarOpen && waveId && !isDropOpen
  );
  const canInlineRight = !isMobile && (isLargeDesktop || breakpoint === "LG");
  let rightVariant: "inline" | "overlay" | null = null;
  if (shouldShowRightSidebar) {
    rightVariant = canInlineRight ? "inline" : "overlay";
  }

  // Handle error state for drop loading
  if (dropError && effectiveDropId) {
    console.error("Failed to load drop:", dropError);
  }

  return (
    <WaveChatScrollProvider>
      <div className="tw-relative tw-flex tw-min-h-0 tw-flex-col">
        <div className="tw-relative tw-flex tw-min-h-0 tw-flex-grow">
          <div className="tw-relative tw-mx-auto tw-flex tw-min-h-0 tw-w-full tw-max-w-full tw-flex-grow">
            <div
              className="tw-relative tw-flex tw-min-h-0 tw-w-full tw-overflow-hidden"
              style={contentContainerStyle}
            >
              {shouldShowLeftSidebar && (
                <WebBrainLeftSidebar
                  isCollapsed={rightVariant === "inline"}
                  showProfileFeedShortcut={showProfileFeedShortcut}
                />
              )}
              {shouldShowMainContent && (
                <div className="tw-flex tw-h-full tw-min-h-0 tw-min-w-0 tw-flex-grow tw-flex-col tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-800">
                  {children}
                  {shouldShowDropOverlay && (
                    <div className="tw-fixed tw-inset-y-0 tw-left-[var(--left-rail,0px)] tw-right-0 tw-z-[1010] lg:tw-absolute lg:tw-inset-0 lg:tw-z-[1010]">
                      <BrainDesktopDrop
                        drop={{
                          type: DropSize.FULL,
                          ...drop,
                          stableKey: drop.id,
                          stableHash: drop.id,
                        }}
                        onClose={onDropClose}
                      />
                    </div>
                  )}
                </div>
              )}
              {rightVariant === "inline" && (
                <div className="tw-hidden tw-flex-shrink-0 tw-pl-6 tw-pt-2 lg:tw-block">
                  <BrainRightSidebar
                    variant="inline"
                    waveId={waveId}
                    activeTab={sidebarTab}
                    setActiveTab={setSidebarTab}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {rightVariant === "overlay" && (
        <BrainRightSidebar
          variant="overlay"
          waveId={waveId}
          activeTab={sidebarTab}
          setActiveTab={setSidebarTab}
        />
      )}

      {connectedProfile && (
        <CreateWaveModal
          isOpen={isWaveModalOpen}
          onClose={close}
          profile={connectedProfile}
        />
      )}
    </WaveChatScrollProvider>
  );
};

export default WavesMessagesWrapper;
