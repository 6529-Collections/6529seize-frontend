"use client";

import React, { ReactNode, useEffect, useState, useCallback } from "react";
import BrainRightSidebar, {
  SidebarTab,
} from "../brain/right-sidebar/BrainRightSidebar";
import WebBrainLeftSidebar from "../brain/left-sidebar/web/WebLeftSidebar";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import BrainDesktopDrop from "../brain/BrainDesktopDrop";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiDrop } from "../../generated/models/ApiDrop";
import { commonApiFetch } from "../../services/api/common-api";
import { DropSize, ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { useSidebarState } from "../../hooks/useSidebarState";
import { createBreakpoint } from "react-use";

// Breakpoint for mobile responsiveness (lg = 1024px)
const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

interface WavesMessagesLayoutProps {
  readonly children: ReactNode;
  readonly defaultPath?: string; // "/waves" or "/messages"
  readonly showLeftSidebar?: boolean;
}

const WavesMessagesLayout: React.FC<WavesMessagesLayoutProps> = ({
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

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(SidebarTab.ABOUT);

  const dropId = searchParams?.get("drop") ?? undefined;
  const waveId = searchParams?.get("wave") ?? undefined;

  // Check if we're on mobile (below LG breakpoint)
  const isMobile = breakpoint === "S";

  // Auto-close right sidebar when no wave is selected
  useEffect(() => {
    if (!waveId && isRightSidebarOpen) {
      closeRightSidebar();
    }
  }, [waveId, isRightSidebarOpen, closeRightSidebar]);

  const { data: drop } = useQuery<ApiDrop>({
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

  const isDropOpen = Boolean(dropId && drop?.id?.toLowerCase() === dropId?.toLowerCase());

  const contentClasses =
    "tw-relative tw-flex tw-flex-grow tw-w-full tw-max-w-full tw-mx-auto";

  return (
    <>
      <div className="tw-relative tw-flex tw-flex-col">
        <div className="tw-relative tw-flex tw-flex-grow">
          <div
            className={isDropOpen ? "tw-w-full xl:tw-pl-6" : contentClasses}
          >
            <div
              className="tw-flex tw-flex-row tw-justify-between tw-w-full tw-overflow-hidden"
              style={contentContainerStyle}
            >
              {showLeftSidebar && (!isMobile || !waveId) && (
                <WebBrainLeftSidebar />
              )}
              {(!isMobile || waveId) && (
                <div className="tw-flex-grow tw-flex tw-flex-col tw-h-full tw-min-w-0">
                  {children}
                  {isDropOpen && drop && (
                    <div className="tw-absolute tw-inset-0 tw-z-[49]">
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
            </div>
          </div>
        </div>
      </div>

      {/* Overlay backdrop when right sidebar is open - moved outside motion container */}
      {isRightSidebarOpen && !isDropOpen && waveId && (
        <>
          <div
            className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-50 tw-z-[49]"
            onClick={closeRightSidebar}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                closeRightSidebar();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close sidebar overlay"
          />
          <BrainRightSidebar
            key="right-sidebar"
            waveId={waveId}
            onDropClick={onDropClick}
            activeTab={sidebarTab}
            setActiveTab={setSidebarTab}
          />
        </>
      )}
    </>
  );
};

export default WavesMessagesLayout;
