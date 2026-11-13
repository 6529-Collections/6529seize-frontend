"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  getDesktopLinkAction,
  getDesktopNavigationTarget,
} from "@/helpers/desktop-navigation";
import { getDesktopShellApi } from "@/helpers/desktop-shell";

/**
 * Inside 6529 Desktop: follows deep links the shell delivers
 * (`core6529://navigate/…`, `core6529://share-connection…`), and keeps links
 * that would open a second window in this one (own pages) or in the system
 * browser (other sites). Renders nothing and does nothing on the web.
 */
export default function DesktopNavigationBridge() {
  const router = useRouter();

  useEffect(() => {
    const api = getDesktopShellApi();
    if (!api) return undefined;

    const handleNavigate = (_event: unknown, path: string) => {
      if (typeof path !== "string") return;
      const target = getDesktopNavigationTarget(
        path,
        window.location.origin,
        window.location.pathname
      );
      if (!target) return;
      if (target.replace) {
        router.replace(target.url, { scroll: false });
      } else {
        router.push(target.url);
      }
    };

    // Listen first, then ask the shell for links it queued before the page
    // loaded, so none are delivered before anyone listens.
    api.onNavigate(handleNavigate);
    api.navigationReady().catch(() => {
      console.error("Desktop navigation readiness could not be reported");
    });
    return () => {
      api.offNavigate(handleNavigate);
    };
  }, [router]);

  useEffect(() => {
    const api = getDesktopShellApi();
    if (!api) return undefined;

    const handleLinkClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a");
      if (!link) return;
      const action = getDesktopLinkAction(link, event, window.location.origin);
      if (!action) return;
      event.preventDefault();
      if (action.kind === "navigate") {
        router.push(action.url);
      } else {
        api.openExternal(action.url);
      }
    };

    document.addEventListener("click", handleLinkClick);
    document.addEventListener("auxclick", handleLinkClick);
    return () => {
      document.removeEventListener("click", handleLinkClick);
      document.removeEventListener("auxclick", handleLinkClick);
    };
  }, [router]);

  return null;
}
