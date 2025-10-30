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

const ATTRIBUTE_PATCH_FLAG = Symbol("ipfsAttributePatched");

type ElementCtor = { prototype: Element } | undefined;

const patchElementAttributeWrites = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (window.__ipfsRewritePatched) {
    return;
  }

  window.__ipfsRewritePatched = true;

  const transform = (value: string) => replaceIpfsScheme(value);

  const patchAttributeMethods = (Ctor: ElementCtor) => {
    if (!Ctor) {
      return;
    }

    const proto = Ctor.prototype as Element & {
      [ATTRIBUTE_PATCH_FLAG]?: boolean;
    };

    if (!proto || proto[ATTRIBUTE_PATCH_FLAG]) {
      return;
    }

    const originalSetAttribute = proto.setAttribute;
    if (typeof originalSetAttribute === "function") {
      proto.setAttribute = function (name: string, value: string) {
        if (typeof value === "string" && ATTRIBUTES_TO_REWRITE.includes(name)) {
          return originalSetAttribute.call(this, name, transform(value));
        }
        return originalSetAttribute.call(this, name, value);
      };
    }

    const originalSetAttributeNS = proto.setAttributeNS;
    if (typeof originalSetAttributeNS === "function") {
      proto.setAttributeNS = function (
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
    }

    Object.defineProperty(proto, ATTRIBUTE_PATCH_FLAG, {
      value: true,
      configurable: false,
      writable: false,
    });
  };

  patchAttributeMethods(window.HTMLImageElement);
  patchAttributeMethods(window.HTMLSourceElement);
  patchAttributeMethods(window.HTMLVideoElement);
  patchAttributeMethods(window.HTMLAudioElement);
  patchAttributeMethods(window.HTMLLinkElement);
  patchAttributeMethods(window.HTMLAnchorElement);
  patchAttributeMethods(window.SVGImageElement as unknown as { prototype: Element });

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

export default function IpfsImageSetup() {
  useIpfsImageSetup();
  return null;
}

function useIpfsImageSetup() {
  useEffect(() => {
    patchElementAttributeWrites();

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
          const target = mutation.target as Element;
          const attrName = mutation.attributeName;
          if (attrName) {
            const attrValue = target.getAttribute(attrName);
            if (!attrValue || !attrValue.includes("ipfs://")) {
              continue;
            }
          }
          applyToNode(target);
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
