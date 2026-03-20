"use client";

import { publicEnv } from "@/config/env";
import { useEffect } from "react";

function mainSiteBaseForRewrites(): string {
  const base = publicEnv.STANDALONE_MAIN_SITE_BASE?.trim();
  if (!base) {
    throw new Error("STANDALONE_MAIN_SITE_BASE is not set");
  }

  return base.replace(/\/+$/, "");
}

function resolveStandaloneClickUrl(absoluteUrl: URL, pageOrigin: string): URL {
  if (absoluteUrl.origin === pageOrigin) {
    return new URL(
      `${absoluteUrl.pathname}${absoluteUrl.search}${absoluteUrl.hash}`,
      mainSiteBaseForRewrites()
    );
  }

  return absoluteUrl;
}

export default function StandaloneAnchorInterceptor() {
  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      if (event.button !== 0) return;

      const node = event.target;
      if (!(node instanceof Element)) return;

      const anchor = node.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.getAttribute("data-standalone-skip-intercept") === "true")
        return;

      const hrefAttr = anchor.getAttribute("href");
      if (hrefAttr == null || hrefAttr === "") return;

      const trimmed = hrefAttr.trim();
      if (trimmed === "" || trimmed === "#") return;
      if (trimmed.startsWith("#")) return;

      const trimmedLower = trimmed.toLowerCase();
      if (trimmedLower.startsWith("javascript:")) return;

      let url: URL;
      try {
        url = new URL(hrefAttr, window.location.href);
      } catch {
        return;
      }

      if (url.protocol !== "http:" && url.protocol !== "https:") return;

      const nextUrl = resolveStandaloneClickUrl(url, window.location.origin);

      event.preventDefault();
      event.stopPropagation();
      window.open(nextUrl.toString(), "_blank", "noopener,noreferrer");
    };

    document.addEventListener("click", onClickCapture, true);

    return () => {
      document.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return null;
}
