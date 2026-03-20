"use client";

import { publicEnv } from "@/config/env";
import { useEffect } from "react";

function trimTrailingSlashes(value: string): string {
  let end = value.length;

  while (end > 0 && value[end - 1] === "/") {
    end -= 1;
  }

  return value.slice(0, end);
}

function mainSiteBaseForRewrites(): string {
  const base = publicEnv.STANDALONE_MAIN_SITE_BASE?.trim();
  if (!base) {
    throw new Error("STANDALONE_MAIN_SITE_BASE is not set");
  }

  return trimTrailingSlashes(base);
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
    const getRewrittenAnchorTarget = (target: EventTarget | null) => {
      const node = target;
      if (!(node instanceof Element)) return;

      const anchor = node.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.dataset["standaloneSkipIntercept"] === "true") return;

      const hrefAttr = anchor.getAttribute("href");
      if (hrefAttr == null || hrefAttr === "") return;

      const trimmed = hrefAttr.trim();
      if (trimmed === "" || trimmed === "#") return;
      if (trimmed.startsWith("#")) return;

      const trimmedLower = trimmed.toLowerCase();
      if (
        trimmedLower.startsWith("javascript:") ||
        trimmedLower.startsWith("data:") ||
        trimmedLower.startsWith("vbscript:")
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(hrefAttr, globalThis.location.href);
      } catch {
        return;
      }

      if (url.protocol !== "http:" && url.protocol !== "https:") return;

      const nextUrl = resolveStandaloneClickUrl(
        url,
        globalThis.location.origin
      );
      anchor.href = nextUrl.toString();

      return { anchor, nextUrl };
    };

    const onPointerDownCapture = (event: PointerEvent) => {
      getRewrittenAnchorTarget(event.target);
    };

    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return;

      const rewrittenTarget = getRewrittenAnchorTarget(event.target);
      if (!rewrittenTarget) return;

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      globalThis.open(
        rewrittenTarget.nextUrl.toString(),
        "_blank",
        "noopener,noreferrer"
      );
    };

    globalThis.document.addEventListener(
      "pointerdown",
      onPointerDownCapture,
      true
    );
    globalThis.document.addEventListener("click", onClickCapture, true);

    return () => {
      globalThis.document.removeEventListener(
        "pointerdown",
        onPointerDownCapture,
        true
      );
      globalThis.document.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return null;
}
