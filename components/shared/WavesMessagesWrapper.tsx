"use client";

import useCreateModalState from "@/hooks/useCreateModalState";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { createBreakpoint } from "react-use";
import { ApiDrop } from "../../generated/models/ApiDrop";
import { DropSize, ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { useSidebarState } from "../../hooks/useSidebarState";
import { commonApiFetch } from "../../services/api/common-api";
import { useAuth } from "../auth/Auth";
import BrainDesktopDrop from "../brain/BrainDesktopDrop";
import WebBrainLeftSidebar from "../brain/left-sidebar/web/WebLeftSidebar";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import BrainRightSidebar, {
  SidebarTab,
} from "../brain/right-sidebar/BrainRightSidebar";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import CreateWaveModal from "../waves/create-wave/CreateWaveModal";

const useBreakpoint = createBreakpoint({ XL: 1400, LG: 1024, S: 0 });

interface WavesMessagesWrapperProps {
  readonly children: ReactNode;
  readonly defaultPath?: string; // "/waves" or "/messages"
  readonly showLeftSidebar?: boolean;
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

  const rawDropId = searchParams?.get("drop") ?? undefined;
  const waveId = searchParams?.get("wave") ?? undefined;

  // Validate drop ID format (assuming alphanumeric + hyphens)
  const dropId = rawDropId && /^[a-zA-Z0-9-_]+$/.test(rawDropId) ? rawDropId : undefined;

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
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${dropId}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!dropId,
  });

  const onDropClose = useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("drop");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname || defaultPath;
    router.push(newUrl, { scroll: false });
  }, [searchParams, pathname, defaultPath, router]);

  const onDropClick = useCallback(
    (drop: ExtendedDrop) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("drop", drop.id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const isDropOpen = useMemo(
    () => Boolean(dropId && drop?.id?.toLowerCase() === dropId?.toLowerCase()),
    [dropId, drop?.id]
  );

  // Clear logic for when to show each part
  const shouldShowLeftSidebar = showLeftSidebar && (!isMobile || !waveId);
  const shouldShowMainContent = !isMobile || waveId;
  const shouldShowDropOverlay = isDropOpen && drop && shouldShowMainContent;
  const shouldShowRightSidebar = Boolean(isRightSidebarOpen && waveId && !isDropOpen);
  const canInlineRight = !isMobile && (isLargeDesktop || breakpoint === "LG");
  let rightVariant: "inline" | "overlay" | null = null;
  if (shouldShowRightSidebar) {
    rightVariant = canInlineRight ? "inline" : "overlay";
  }

  // Handle error state for drop loading
  if (dropError && dropId) {
    console.error("Failed to load drop:", dropError);
  }

  return (
    <>
      <div className="tw-relative tw-flex tw-flex-col">
        <div className="tw-relative tw-flex tw-flex-grow">
          <div
            className="tw-relative tw-flex tw-flex-grow tw-w-full tw-max-w-full tw-mx-auto"
          >
            <div
              className="tw-relative tw-flex tw-w-full tw-overflow-hidden"
              style={contentContainerStyle}
            >
              {shouldShowLeftSidebar && (
                <WebBrainLeftSidebar isCollapsed={rightVariant === "inline"} />
              )}
              {shouldShowMainContent && (
                <div className="tw-flex-grow tw-flex tw-flex-col tw-h-full tw-min-w-0 tw-border-solid tw-border-r tw-border-iron-800 tw-border-y-0 tw-border-l-0">
                  {children}
                  {shouldShowDropOverlay && (
                    <div className="tw-fixed tw-inset-y-0 tw-right-0 tw-left-[var(--left-rail,0px)] tw-z-[60] lg:tw-absolute lg:tw-inset-0 lg:tw-z-[49]">
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
                <div className="tw-hidden lg:tw-block tw-flex-shrink-0 tw-pl-6 tw-pt-2">
                  <BrainRightSidebar
                    variant="inline"
                    waveId={waveId}
                    onDropClick={onDropClick}
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
          onDropClick={onDropClick}
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
    </>
  );
};

export default WavesMessagesWrapper;
