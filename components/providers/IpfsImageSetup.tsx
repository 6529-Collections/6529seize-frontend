"use client";

import { useEffect } from "react";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";

declare global {
  interface Window {
    __ipfsRewritePatched?: boolean;
  }
}

const IPFS_URL_PATTERN = /ipfs:\/\/[^\s"'`]+/gi;
const ATTRIBUTES_TO_REWRITE = [
  "src",
  "srcset",
  "poster",
  "href",
  "data-src",
  "data-srcset",
];
const ATTRIBUTES_SELECTOR = ATTRIBUTES_TO_REWRITE.map((attr) => `[${attr}]`).join(",");

const replaceIpfsScheme = (value: string) =>
  value.replace(IPFS_URL_PATTERN, (match) => resolveIpfsUrlSync(match));

const rewriteAttributeValue = (value: string | null) => {
  if (!value || !value.includes("ipfs://")) {
    return value;
  }

  return replaceIpfsScheme(value);
};

const patchElementAttributeWrites = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (window.__ipfsRewritePatched) {
    return;
  }

  window.__ipfsRewritePatched = true;

  const transform = (value: string) => replaceIpfsScheme(value);

  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name: string, value: string) {
    if (typeof value === "string" && ATTRIBUTES_TO_REWRITE.includes(name)) {
      return originalSetAttribute.call(this, name, transform(value));
    }
    return originalSetAttribute.call(this, name, value);
  };

  const originalSetAttributeNS = Element.prototype.setAttributeNS;
  Element.prototype.setAttributeNS = function (
    namespace: string | null,
    name: string,
    value: string
  ) {
    if (typeof value === "string" && ATTRIBUTES_TO_REWRITE.includes(name)) {
      return originalSetAttributeNS.call(
        this,
        namespace,
        name,
        transform(value)
      );
    }
    return originalSetAttributeNS.call(this, namespace, name, value);
  };

  const patchProperty = (Ctor: { prototype: any } | undefined, prop: string) => {
    if (!Ctor) return;
    const descriptor = Object.getOwnPropertyDescriptor(Ctor.prototype, prop);
    if (!descriptor || !descriptor.set) {
      return;
    }

    Object.defineProperty(Ctor.prototype, prop, {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable ?? false,
      get: descriptor.get,
      set(value: unknown) {
        if (typeof value !== "string") {
          descriptor.set!.call(this, value);
          return;
        }

        descriptor.set!.call(this, transform(value));
      },
    });
  };

  patchProperty(window.HTMLImageElement, "src");
  patchProperty(window.HTMLImageElement, "srcset");
  patchProperty(window.HTMLSourceElement, "src");
  patchProperty(window.HTMLSourceElement, "srcset");
  patchProperty(window.HTMLVideoElement, "poster");
  patchProperty(window.HTMLVideoElement, "src");
  patchProperty(window.HTMLAudioElement, "src");
  patchProperty(window.HTMLLinkElement, "href");
};

patchElementAttributeWrites();

export default function IpfsImageSetup() {
  useIpfsImageSetup();
  return null;
}

function useIpfsImageSetup() {
  useEffect(() => {
    const applyToNode = (node: Element) => {
      ATTRIBUTES_TO_REWRITE.forEach((attr) => {
        const currentValue = node.getAttribute(attr);
        if (!currentValue) return;

        const rewritten = rewriteAttributeValue(currentValue);
        if (rewritten && rewritten !== currentValue) {
          node.setAttribute(attr, rewritten);
        }
      });
    };

    const processNode = (node: Node) => {
      if (!(node instanceof Element)) {
        return;
      }

      applyToNode(node);
      node.querySelectorAll(ATTRIBUTES_SELECTOR).forEach((child) => {
        applyToNode(child as Element);
      });
    };

    const applyToTree = () => {
      document
        .querySelectorAll(ATTRIBUTES_SELECTOR)
        .forEach((el) => applyToNode(el as Element));
    };

    applyToTree();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          applyToNode(mutation.target as Element);
          continue;
        }

        mutation.addedNodes.forEach((node) => {
          processNode(node);
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ATTRIBUTES_TO_REWRITE,
    });

    return () => {
      observer.disconnect();
    };
  }, []);
}
