"use client";

import { useEffect, useRef, type ReactNode } from "react";

// The right edge fades while more of a line is hidden there, so a phone
// shows that the code scrolls; it stops fading once the end is in view.
const FADE = "linear-gradient(to right, #000 calc(100% - 48px), transparent)";

/** A code block's `<pre>`, scrolling sideways rather than breaking lines. */
export default function AiCodeScroll({
  children,
}: {
  readonly children: ReactNode;
}) {
  const pre = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const element = pre.current;
    if (!element) {
      return undefined;
    }
    // The fade is a style on the element itself, set as it scrolls or
    // resizes; nothing else on the page depends on it.
    const measure = () => {
      const more =
        element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
      element.style.maskImage = more ? FADE : "";
      element.style.setProperty("-webkit-mask-image", more ? FADE : "");
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", measure);
    };
  }, []);

  return (
    <pre
      ref={pre}
      className="tw-m-0 tw-overflow-x-auto tw-whitespace-pre tw-px-3.5 tw-py-3 tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-100"
    >
      {children}
    </pre>
  );
}
