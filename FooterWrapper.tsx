"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import useDeviceInfo from "./hooks/useDeviceInfo";
import Footer from "@/components/footer/Footer";
import { useSidebarController } from "./hooks/useSidebarController";

export default function FooterWrapper() {
  const { isApp } = useDeviceInfo();
  const pathname = usePathname();
  const [homeActiveTab, setHomeActiveTab] = useState<string>("latest");
  const { sidebarWidth, isMobile, isOffcanvasOpen } = useSidebarController();
  useEffect(() => {
    const win = typeof globalThis !== "undefined" ? globalThis.window : undefined;
    if (!win) return;

    const loadStoredTab = () => {
      try {
        const savedTab = win.localStorage.getItem("home.activeTab");
        if (savedTab) {
          setHomeActiveTab(savedTab);
        }
      } catch (error) {
        console.warn("Failed to read home.activeTab from storage", error);
      }
    };

    loadStoredTab();

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

  // Paths where footer should be hidden
  const hideFooter =
    isApp ||
    ["/waves", "/messages", "/notifications", "/open-mobile"].some((path) =>
      pathname?.startsWith(path)
    ) ||
    (pathname === "/" && homeActiveTab === "feed");

  if (hideFooter) return null;

  // App mode: no sidebar to respect
  if (isApp) return <Footer />;

  // WebLayout mode: match main content's sidebar spacing
  const footerStyle = isMobile && isOffcanvasOpen
    ? { transform: `translateX(${sidebarWidth})` }
    : { paddingLeft: sidebarWidth };

  return (
    <div style={footerStyle}>
      <Footer />
    </div>
  );
}
