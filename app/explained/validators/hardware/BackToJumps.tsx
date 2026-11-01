"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/explained/marks/glyphs";
import { EX_FOCUS } from "@/components/explained/tokens";

/**
 * On a phone the page is long, so once the row of jumps under the header
 * has scrolled away, a small "On this page" button sits at the bottom right
 * and takes the reader back to it. Wider screens have the room to scroll.
 * The observer sets `data-shown` on the button itself; nothing re-renders.
 */
export default function BackToJumps({ label }: { readonly label: string }) {
  const button = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const jumps = document.getElementById("jumps");
    const el = button.current;
    if (!jumps || !el || typeof IntersectionObserver === "undefined") {
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      const shown = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      el.dataset["shown"] = shown ? "true" : "false";
    });
    observer.observe(jumps);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="lg:tw-hidden">
      <a
        ref={button}
        href="#jumps"
        data-back-to-jumps=""
        data-shown="false"
        className={`tw-fixed tw-right-4 tw-z-40 tw-hidden tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/95 tw-px-4 tw-text-[15px] tw-font-semibold tw-text-iron-50 tw-no-underline tw-shadow-[0_12px_32px_-12px_rgba(0,0,0,0.8)] data-[shown=true]:tw-inline-flex ${EX_FOCUS}`}
        style={{ bottom: "calc(16px + env(safe-area-inset-bottom))" }}
      >
        <Icon kind="arrow" className="tw-size-[15px] tw--rotate-90" />
        {label}
      </a>
    </div>
  );
}
