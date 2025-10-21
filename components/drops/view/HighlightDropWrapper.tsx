"use client";

import {
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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
    const [phase, setPhase] = useState<"idle" | "highlight" | "fading">(
      "idle"
    );
    const rafRef = useRef<number | null>(null);
    const highlightTimeoutRef = useRef<number | null>(null);
    const fadeTimeoutRef = useRef<number | null>(null);

    const lastExtendedRef = useRef(false);
    const prevActiveRef = useRef(false);

    const setNode = (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef)
        (
          forwardedRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = node;
    };

    const stopRAF = useCallback(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }, []);

    const clearTimers = useCallback(() => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
    }, []);

    const runHighlightWindow = useCallback(() => {
      clearTimers();
      setPhase("highlight");

      highlightTimeoutRef.current = globalThis.setTimeout(() => {
        setPhase("fading");

        fadeTimeoutRef.current = globalThis.setTimeout(() => {
          setPhase("idle");
        }, fadeMs) as unknown as number;
      }, highlightMs) as unknown as number;
    }, [clearTimers, fadeMs, highlightMs]);

    const trackVisibilityOnce = useCallback(() => {
      stopRAF();

      const checkVisibility = () => {
        const el = innerRef.current;
        if (el) {
          const elRect = el.getBoundingClientRect();
          const containerRect = scrollContainer
            ? scrollContainer.getBoundingClientRect()
            : ({
                left: 0,
                top: 0,
                right: globalThis.innerWidth,
                bottom: globalThis.innerHeight,
                width: globalThis.innerWidth,
                height: globalThis.innerHeight,
              } as DOMRect);

          const interLeft = Math.max(elRect.left, containerRect.left);
          const interTop = Math.max(elRect.top, containerRect.top);
          const interRight = Math.min(elRect.right, containerRect.right);
          const interBottom = Math.min(elRect.bottom, containerRect.bottom);

          const interWidth = Math.max(0, interRight - interLeft);
          const interHeight = Math.max(0, interBottom - interTop);
          const interArea = interWidth * interHeight;
          const ratio =
            interArea / Math.max(1, elRect.width * elRect.height);

          if (ratio >= visibilityThreshold && !lastExtendedRef.current) {
            lastExtendedRef.current = true;
            runHighlightWindow();
            stopRAF();
            return;
          }
        }

        rafRef.current = requestAnimationFrame(checkVisibility);
      };

      rafRef.current = requestAnimationFrame(checkVisibility);
    }, [runHighlightWindow, scrollContainer, stopRAF, visibilityThreshold]);

    useEffect(() => {
      return () => {
        stopRAF();
        clearTimers();
      };
    }, [clearTimers, stopRAF]);

    useEffect(() => {
      if (phase === "idle") {
        stopRAF();
      }
    }, [phase, stopRAF]);

    useEffect(() => {
      const wasActive = prevActiveRef.current;
      prevActiveRef.current = active;

      if (active && !wasActive) {
        lastExtendedRef.current = false;
        runHighlightWindow();
        trackVisibilityOnce();
      }
    }, [active, runHighlightWindow, trackVisibilityOnce]);

    const isHighlighted = phase === "highlight";
    const isFading = phase === "fading";

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
