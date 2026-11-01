"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/explained/marks/glyphs";
import { EX_FOCUS } from "@/components/explained/tokens";

/**
 * On a phone the page is long, so once the row of jumps under the header
 * has scrolled away, a round 44 px button sits at the bottom right and
 * takes the reader back to it. It holds only an arrow, so it covers little
 * of the reading column; its name ("On this page") is its label. Wider
 * screens have the room to scroll.
 *
 * It reads where the jumps are on each scroll, at most once a frame,
 * rather than waiting for them to cross the screen: a tap on a jump or a
 * link to a section moves past them in one step, and an observer would
 * never see them leave. It sets `data-shown` on the button itself; nothing
 * re-renders.
 */
export default function BackToJumps({ label }: { readonly label: string }) {
  const button = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const jumps = document.getElementById("jumps");
    const el = button.current;
    if (!jumps || !el) {
      return undefined;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const gone = jumps.getBoundingClientRect().bottom < 0;
      el.dataset["shown"] = gone ? "true" : "false";
    };
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div className="lg:tw-hidden">
      <a
        ref={button}
        href="#jumps"
        data-back-to-jumps=""
        data-shown="false"
        aria-label={label}
        title={label}
        className={`tw-fixed tw-right-3 tw-z-40 tw-hidden tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/95 tw-text-iron-50 tw-no-underline tw-shadow-[0_12px_32px_-12px_rgba(0,0,0,0.8)] data-[shown=true]:tw-inline-flex ${EX_FOCUS}`}
        style={{ bottom: "calc(16px + env(safe-area-inset-bottom))" }}
      >
        <Icon kind="arrow" className="tw-size-[18px] tw--rotate-90" />
      </a>
    </div>
  );
}
