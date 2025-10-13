"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import useDeviceInfo from "./hooks/useDeviceInfo";
import Footer from "@/components/footer/Footer";
import { useSidebarController } from "./hooks/useSidebarController";
import { SIDEBAR_WIDTHS } from "@/constants/sidebar";

export default function FooterWrapper() {
  const { isApp } = useDeviceInfo();
  const pathname = usePathname();
  const [homeActiveTab, setHomeActiveTab] = useState<string>("latest");
  const { sidebarWidth, isMobile, isNarrow } = useSidebarController();
  useEffect(() => {
    const win = (globalThis as typeof globalThis & { window?: Window }).window;
    if (win === undefined) {
      return;
    }

    const determineInitialTab = () => {
      try {
        const params = new URLSearchParams(win.location?.search ?? "");
        const tabFromQuery = params.get("tab");
        const savedTab = win.localStorage.getItem("home.activeTab");
        const resolvedTab = tabFromQuery ?? savedTab;
        if (resolvedTab) {
          setHomeActiveTab(resolvedTab);
        }
      } catch (error) {
        console.warn("Failed to determine active home tab", error);
      }
    };

    determineInitialTab();

    const handleTabChange = (event: CustomEvent<{ tab?: string }>) => {
      if (event.detail?.tab) {
        setHomeActiveTab(event.detail.tab);
      }
    };

    win.addEventListener("homeTabChange", handleTabChange as EventListener);

    return () => {
      win.removeEventListener("homeTabChange", handleTabChange as EventListener);
    };
  }, []);

  const homeFeedTabActive = pathname === "/" && homeActiveTab === "feed";
  const myFeedRoutes = ["/my-feed", "/feed"];

  const hideFooter =
    isApp ||
    homeFeedTabActive ||
    myFeedRoutes.some((path) => pathname?.startsWith(path)) ||
    ["/waves", "/messages", "/notifications", "/open-mobile"].some((path) =>
      pathname?.startsWith(path)
    );

  if (hideFooter) return null;

  // App mode or small-screen web: no left-rail spacing
  if (isApp || isMobile) return <Footer />;

  // Desktop WebLayout: match main content's sidebar spacing
  const sidebarSpacing = isNarrow ? SIDEBAR_WIDTHS.COLLAPSED : sidebarWidth;

  return (
    <div
      className="tw-w-full tw-max-w-[1300px] tw-mx-auto"
      style={{ paddingLeft: sidebarSpacing }}
    >
      <Footer />
    </div>
  );
}
