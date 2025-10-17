// HighlightDropWrapper.tsx (minimal patch)
"use client";

import { forwardRef, ReactNode, useEffect, useRef, useState } from "react";

interface HighlightDropWrapperProps {
  readonly active: boolean;
  readonly scrollContainer?: HTMLElement | null;
  readonly children: ReactNode;
  readonly className?: string;
  readonly highlightMs?: number;
  readonly fadeMs?: number;
  readonly visibilityThreshold?: number;
  readonly id?: string;
}

const HighlightDropWrapper = forwardRef<
  HTMLDivElement,
  HighlightDropWrapperProps
>(
  (
    {
      active,
      scrollContainer,
      children,
      className = "",
      highlightMs = 3500,
      fadeMs = 500,
      visibilityThreshold = 0.6,
      id,
    },
    forwardedRef
  ) => {
    const innerRef = useRef<HTMLDivElement>(null);
    const [highlightUntil, setHighlightUntil] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const rafRef = useRef<number | null>(null);
    const fadeTimeoutRef = useRef<number | null>(null);

    // NEW: end-time timeout (replaces polling interval)
    const endTimeoutRef = useRef<number | null>(null);

    const lastExtendedRef = useRef(false);

    const setNode = (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef)
        (
          forwardedRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = node;
    };

    const stopRAF = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    useEffect(() => {
      if (!active) return;

      setIsFading(false);
      lastExtendedRef.current = false;
      setHighlightUntil(Date.now() + highlightMs);

      const checkVisibility = () => {
        const el = innerRef.current;
        if (el) {
          const er = el.getBoundingClientRect();
          const cr = scrollContainer
            ? scrollContainer.getBoundingClientRect()
            : ({
                left: 0,
                top: 0,
                right: window.innerWidth,
                bottom: window.innerHeight,
                width: window.innerWidth,
                height: window.innerHeight,
              } as DOMRect);

          const interLeft = Math.max(er.left, cr.left);
          const interTop = Math.max(er.top, cr.top);
          const interRight = Math.min(er.right, cr.right);
          const interBottom = Math.min(er.bottom, cr.bottom);

          const interW = Math.max(0, interRight - interLeft);
          const interH = Math.max(0, interBottom - interTop);
          const interArea = interW * interH;
          const ratio = interArea / Math.max(1, er.width * er.height);

          if (ratio >= visibilityThreshold && !lastExtendedRef.current) {
            setHighlightUntil(Date.now() + highlightMs);
            lastExtendedRef.current = true;

            // NEW: we’re done extending once; stop the rAF loop
            stopRAF();
            return;
          }
        }
        rafRef.current = requestAnimationFrame(checkVisibility);
      };

      rafRef.current = requestAnimationFrame(checkVisibility);

      return () => {
        stopRAF();
      };
    }, [active, highlightMs, scrollContainer, visibilityThreshold]);

    // REPLACEMENT: remove the polling interval; use one precise timeout
    useEffect(() => {
      if (!active) return;

      // clear any pending end/fade timers
      if (endTimeoutRef.current) {
        clearTimeout(endTimeoutRef.current);
        endTimeoutRef.current = null;
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }

      if (highlightUntil === 0) return;

      const remaining = Math.max(0, highlightUntil - Date.now());

      endTimeoutRef.current = window.setTimeout(() => {
        // end highlight, start fade
        setHighlightUntil(0);
        setIsFading(true);

        // finish fade
        fadeTimeoutRef.current = window.setTimeout(() => {
          setIsFading(false);
        }, fadeMs) as unknown as number;
      }, remaining) as unknown as number;

      return () => {
        if (endTimeoutRef.current) {
          clearTimeout(endTimeoutRef.current);
          endTimeoutRef.current = null;
        }
        if (fadeTimeoutRef.current) {
          clearTimeout(fadeTimeoutRef.current);
          fadeTimeoutRef.current = null;
        }
      };
    }, [active, highlightUntil, fadeMs]);

    const isHighlighted = Date.now() < highlightUntil;

    const classes = [
      className,
      isHighlighted
        ? "tw-bg-[#25263f] tw-transition-colors tw-duration-500"
        : "",
      !isHighlighted && isFading
        ? "tw-bg-transparent tw-transition-colors tw-duration-500"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div ref={setNode} id={id} className={classes}>
        {children}
      </div>
    );
  }
);

HighlightDropWrapper.displayName = "HighlightDropWrapper";
export default HighlightDropWrapper;
