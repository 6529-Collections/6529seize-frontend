"use client";

import { useEffect } from "react";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";

const IPFS_URL_PATTERN = /ipfs:\/\/[^\s"'`]+/g;
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
  value.replaceAll(IPFS_URL_PATTERN, (match) => resolveIpfsUrlSync(match));

const rewriteAttributeValue = (value: string | null) => {
  if (!value?.includes("ipfs://")) {
    return value;
  }

  return replaceIpfsScheme(value);
};

export default function IpfsImageSetup() {
  useIpfsImageSetup();
  return null;
}

function useIpfsImageSetup() {
  useEffect(() => {
    const applyToNode = (node: Element) => {
      for (const attr of ATTRIBUTES_TO_REWRITE) {
        const currentValue = node.getAttribute(attr);
        if (!currentValue) continue;

        const rewritten = rewriteAttributeValue(currentValue);
        if (rewritten && rewritten !== currentValue) {
          node.setAttribute(attr, rewritten);
        }
      }
    };

    const processNode = (node: Node) => {
      if (!(node instanceof Element)) {
        return;
      }

      applyToNode(node);
      for (const child of Array.from(
        node.querySelectorAll(ATTRIBUTES_SELECTOR),
      )) {
        applyToNode(child);
      }
    };

    const applyToTree = () => {
      for (const el of Array.from(
        document.querySelectorAll(ATTRIBUTES_SELECTOR),
      )) {
        applyToNode(el);
      }
    };

    applyToTree();

    let pendingMutations: MutationRecord[] = [];
    let rafId: number | null = null;

    const flushMutations = () => {
      const records = pendingMutations;
      pendingMutations = [];
      rafId = null;

      for (const mutation of records) {
        if (mutation.type === "attributes") {
          const attrName = mutation.attributeName;
          if (!attrName) {
            continue;
          }

          const target = mutation.target;
          if (!(target instanceof Element)) {
            continue;
          }

          const attrValue = target.getAttribute(attrName);
          if (
            attrValue === mutation.oldValue ||
            !attrValue?.includes("ipfs://")
          ) {
            continue;
          }

          applyToNode(target);
          continue;
        }

        for (const node of Array.from(mutation.addedNodes)) {
          processNode(node);
        }
      }
    };

    const scheduleMutationFlush = (mutations: MutationRecord[]) => {
      pendingMutations.push(...mutations);
      if (rafId !== null) {
        return;
      }

      if (typeof globalThis.requestAnimationFrame === "function") {
        rafId = globalThis.requestAnimationFrame(flushMutations);
        return;
      }

      flushMutations();
    };

    const observer = new MutationObserver((mutations) => {
      const relevantMutations = mutations.filter((mutation) => {
        if (mutation.type !== "attributes") {
          return true;
        }

        const attrName = mutation.attributeName;
        if (!attrName) {
          return false;
        }

        const target = mutation.target;
        if (!(target instanceof Element)) {
          return false;
        }

        const attrValue = target.getAttribute(attrName);
        return attrValue?.includes("ipfs://") ?? false;
      });

      if (relevantMutations.length === 0) {
        return;
      }

      scheduleMutationFlush(relevantMutations);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ATTRIBUTES_TO_REWRITE,
      attributeOldValue: true,
    });

    return () => {
      if (rafId !== null) {
        globalThis.cancelAnimationFrame?.(rafId);
      }
      pendingMutations = [];
      observer.disconnect();
    };
  }, []);
}
