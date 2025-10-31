"use client";

import Footer from "@/components/footer/Footer";
import {
  HOME_TAB_EVENT,
  getStoredHomeTab,
  type HomeTab,
} from "@/components/home/useHomeTabs";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import useDeviceInfo from "./hooks/useDeviceInfo";

const HOME_TAB_QUERY_PARAM = "tab";

const isHomeTab = (value: unknown): value is HomeTab =>
  value === "feed" || value === "latest";

export default function FooterWrapper() {
  const { isApp } = useDeviceInfo();
  const pathname = usePathname();
  const [homeActiveTab, setHomeActiveTab] = useState<HomeTab>(() =>
    getStoredHomeTab()
  );
  useEffect(() => {
    const win = (globalThis as typeof globalThis & { window?: Window }).window;
    if (win === undefined) {
      return;
    }

    const params = new URLSearchParams(win.location?.search ?? "");
    const tabFromQuery = params.get(HOME_TAB_QUERY_PARAM);
    const nextTab = isHomeTab(tabFromQuery)
      ? tabFromQuery
      : getStoredHomeTab();
    setHomeActiveTab((current) =>
      current === nextTab ? current : nextTab
    );

    const handleTabChange = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: HomeTab }>).detail;
      if (!detail?.tab || !isHomeTab(detail.tab)) {
        return;
      }
      setHomeActiveTab(detail.tab);
    };

    win.addEventListener(HOME_TAB_EVENT, handleTabChange as EventListener);

    return () => {
      win.removeEventListener(HOME_TAB_EVENT, handleTabChange as EventListener);
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

  return <Footer />;
}
