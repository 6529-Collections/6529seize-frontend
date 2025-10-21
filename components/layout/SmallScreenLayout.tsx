"use client";

import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import SmallScreenHeader from "./SmallScreenHeader";
import WebSidebar from "./sidebar/WebSidebar";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import { useSearchParams } from "next/navigation";
import { SidebarProvider } from "../../hooks/useSidebarState";
import ClientOnly from "../client-only/ClientOnly";
import { useHeaderContext } from "@/contexts/HeaderContext";

interface Props {
  readonly children: ReactNode;
}

export default function SmallScreenLayout({ children }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { registerRef } = useLayout();
  const { setHeaderRef } = useHeaderContext();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "latest";

  const headerWrapperRef = useCallback(
    (node: HTMLDivElement | null) => {
      registerRef("header", node);
      setHeaderRef(node);
    },
    [registerRef, setHeaderRef]
  );

  useEffect(() => {
    return () => {
      registerRef("header", null);
      setHeaderRef(null);
    };
  }, [registerRef, setHeaderRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (container && activeTab) {
      requestAnimationFrame(() => {
        container.scrollTop = 0;
      });
    }
  }, [activeTab]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <SidebarProvider>
      <ClientOnly
        fallback={
          <div className="tailwind-scope tw-min-h-[100dvh] tw-bg-black tw-flex tw-items-center tw-justify-center tw-px-6">
            <div className="tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-gap-8 tw-text-center md:tw-text-left">
              <img
                src="https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/279.WEBP"
                alt="Brain"
                className="tw-rounded-md tw-shadow-lg tw-max-w-[40vw] md:tw-max-w-[180px] tw-h-auto"
                width={220}
                height={326}
                loading="eager"
              />
              <h1 className="tw-text-xl tw-font-bold tw-text-white">
                Loading...
              </h1>
            </div>
          </div>
        }
      >
        <div
          ref={containerRef}
          className={`tw-bg-black ${
            activeTab === "feed" ? "tw-overflow-hidden" : "tw-overflow-auto"
          }`}
        >
          <div ref={headerWrapperRef}>
            <SmallScreenHeader
              onMenuToggle={toggleMenu}
              isMenuOpen={isMenuOpen}
            />
          </div>

          <div className="tailwind-scope">
            <WebSidebar
              isCollapsed={false}
              onToggle={toggleMenu}
              isMobile={true}
              isOffcanvasOpen={isMenuOpen}
              onCloseOffcanvas={closeMenu}
              sidebarWidth={SIDEBAR_WIDTHS.EXPANDED}
            />
          </div>

          <main className="tw-transition-opacity tw-duration-300">
            {children}
          </main>
        </div>
      </ClientOnly>
    </SidebarProvider>
  );
}
