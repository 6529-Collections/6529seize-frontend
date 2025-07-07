"use client";

import { useEffect } from "react";
import { resolveIpfsUrl } from "@/components/ipfs/IPFSContext";

export default function IpfsImageSetup() {
  useIpfsImageSetup();
  return null;
}

function useIpfsImageSetup() {
  useEffect(() => {
    const updateImagesSrc = async () => {
      const elementsWithSrc = document.querySelectorAll("[src]");
      Array.from(elementsWithSrc).forEach(async (el) => {
        const src = el.getAttribute("src");
        if (!src) return;
        const newSrc = await resolveIpfsUrl(src);
        if (newSrc !== src) {
          el.setAttribute("src", newSrc);
        }
      });
    };

    updateImagesSrc();

    const observer = new MutationObserver(() => {
      updateImagesSrc();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);
}
