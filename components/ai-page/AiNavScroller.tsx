"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The /ai pages' menu on a phone: a row that scrolls sideways, opened on
 * the current page's tab, with its edges fading while more is hidden.
 */
export default function AiNavScroller({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !current) {
      return;
    }
    const left =
      current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
    nav.scrollLeft = Math.max(0, left);
  }, []);
  return (
    <nav
      ref={ref}
      aria-label={label}
      className="-tw-mx-4 tw-mb-10 tw-overflow-x-auto tw-px-4 [scrollbar-width:none] max-sm:[mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)] sm:tw-mx-0 sm:tw-overflow-visible sm:tw-px-0 [&::-webkit-scrollbar]:tw-hidden"
    >
      {children}
    </nav>
  );
}
