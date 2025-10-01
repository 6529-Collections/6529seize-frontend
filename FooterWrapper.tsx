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
    if (typeof window === "undefined") return;

    // Load initial tab from localStorage
    try {
      const savedTab = window.localStorage.getItem("home.activeTab");
      if (savedTab) {
        setHomeActiveTab(savedTab);
      }
    } catch (error) {
      // Ignore localStorage errors
    }

    // Listen for tab changes
    const handleTabChange = (event: CustomEvent) => {
      setHomeActiveTab(event.detail.tab);
    };

    window.addEventListener("homeTabChange", handleTabChange as EventListener);
    return () => {
      window.removeEventListener("homeTabChange", handleTabChange as EventListener);
    };
  }, []);

  // Paths where footer should be hidden
  const hideFooter =
    isApp ||
    [
      "/waves",
      "/messages",
      "/notifications",
      "/my-stream",
      "/open-mobile"
    ].some((path) => pathname?.startsWith(path)) ||
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
