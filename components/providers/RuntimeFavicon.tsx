"use client";

import {
  getBrowserAppEnvironment,
  getProductionAppEnvironment,
  type AppEnvironment,
} from "@/config/appEnvironment";
import { useEffect } from "react";

const RUNTIME_FAVICON_ATTRIBUTE = "data-runtime-favicon";
const ICON_LINK_SELECTOR = 'link[rel~="icon"]';

type FaviconKind = "png" | "svg";

type FaviconDefinition = {
  readonly href: string;
  readonly kind: FaviconKind;
  readonly sizes: string;
  readonly type: string;
};

function setAttribute(link: HTMLLinkElement, name: string, value: string) {
  if (link.getAttribute(name) !== value) {
    link.setAttribute(name, value);
  }
}

function ensureFaviconLink(
  head: HTMLHeadElement,
  definition: FaviconDefinition
): HTMLLinkElement {
  const selector = `link[${RUNTIME_FAVICON_ATTRIBUTE}="${definition.kind}"]`;
  const matches = Array.from(head.querySelectorAll<HTMLLinkElement>(selector));
  const link = matches.shift() ?? head.ownerDocument.createElement("link");

  matches.forEach((duplicate) => duplicate.remove());
  setAttribute(link, RUNTIME_FAVICON_ATTRIBUTE, definition.kind);
  setAttribute(link, "rel", "icon");
  setAttribute(link, "href", definition.href);
  setAttribute(link, "type", definition.type);
  setAttribute(link, "sizes", definition.sizes);

  if (link.parentElement !== head) {
    head.appendChild(link);
  }

  return link;
}

function reconcileRuntimeFavicons(
  head: HTMLHeadElement,
  environment: AppEnvironment
) {
  const pngLink = ensureFaviconLink(head, {
    href: environment.faviconFallback,
    kind: "png",
    sizes: "96x96",
    type: "image/png",
  });
  const svgLink = ensureFaviconLink(head, {
    href: environment.favicon,
    kind: "svg",
    sizes: "any",
    type: "image/svg+xml",
  });
  const managedLinks = new Set([pngLink, svgLink]);

  head.querySelectorAll<HTMLLinkElement>(ICON_LINK_SELECTOR).forEach((link) => {
    if (!managedLinks.has(link)) {
      link.remove();
    }
  });

  const iconLinks = Array.from(
    head.querySelectorAll<HTMLLinkElement>(ICON_LINK_SELECTOR)
  );
  if (iconLinks.indexOf(pngLink) > iconLinks.indexOf(svgLink)) {
    head.insertBefore(pngLink, svgLink);
  }
}

export default function RuntimeFavicon() {
  useEffect(() => {
    const head = document.head;
    const reconcileFavicon = () => {
      try {
        reconcileRuntimeFavicons(head, getBrowserAppEnvironment());
      } catch {
        try {
          reconcileRuntimeFavicons(head, getProductionAppEnvironment());
        } catch {
          // The production links rendered by RootLayout remain the fallback.
        }
      }
    };

    reconcileFavicon();

    const MutationObserverConstructor = (
      globalThis as {
        readonly MutationObserver?: typeof MutationObserver;
      }
    ).MutationObserver;
    if (MutationObserverConstructor === undefined) {
      return;
    }

    let isActive = true;
    const observerOptions: MutationObserverInit = {
      attributeFilter: [
        "href",
        "rel",
        "sizes",
        "type",
        RUNTIME_FAVICON_ATTRIBUTE,
      ],
      attributes: true,
      childList: true,
      subtree: true,
    };
    const observer = new MutationObserverConstructor(() => {
      observer.disconnect();
      reconcileFavicon();
      if (isActive) {
        observer.observe(head, observerOptions);
      }
    });
    observer.observe(head, observerOptions);

    return () => {
      isActive = false;
      observer.disconnect();
    };
  }, []);

  return null;
}
