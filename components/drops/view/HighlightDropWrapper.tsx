"use client";

import {
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIntersectionObserver } from "@/hooks/scroll/useIntersectionObserver";
import { classNames } from "@/helpers/Helpers";

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

const MAX_VISIBILITY_WAIT_MS = 4000;

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
    const phaseRef = useRef(phase);
    const highlightTimeoutRef =
      useRef<ReturnType<typeof setTimeout> | null>(null);
    const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafRef = useRef<number | null>(null);
    const visibilityStartTimeRef = useRef<number | null>(null);

    const lastExtendedRef = useRef(false);
    const prevActiveRef = useRef(false);

    const setNode = (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    useEffect(() => {
      phaseRef.current = phase;
    }, [phase]);

    const stopRAF = useCallback(() => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      visibilityStartTimeRef.current = null;
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

      highlightTimeoutRef.current = setTimeout(() => {
        setPhase("fading");

        fadeTimeoutRef.current = setTimeout(() => {
          setPhase("idle");
        }, fadeMs);
      }, highlightMs);
    }, [clearTimers, fadeMs, highlightMs]);

    const trackVisibilityOnce = useCallback(() => {
      stopRAF();

      const getNow =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? () => performance.now()
          : () => Date.now();

      const startTimestamp = getNow();
      visibilityStartTimeRef.current = startTimestamp;

      const checkVisibility = () => {
        const currentTimestamp = getNow();
        const startTime = visibilityStartTimeRef.current ?? startTimestamp;
        const elapsed = currentTimestamp - startTime;
        if (elapsed >= MAX_VISIBILITY_WAIT_MS) {
          stopRAF();
          return;
        }

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
            if (phaseRef.current !== "highlight") {
              runHighlightWindow();
            }
            stopRAF();
            return;
          }
        }

        rafRef.current = globalThis.requestAnimationFrame(checkVisibility);
      };

      rafRef.current = globalThis.requestAnimationFrame(checkVisibility);
    }, [runHighlightWindow, scrollContainer, stopRAF, visibilityThreshold]);

    const handleIntersection = useCallback(
      (entry: IntersectionObserverEntry) => {
        if (!active) {
          return;
        }

        if (
          entry.intersectionRatio >= visibilityThreshold &&
          !lastExtendedRef.current
        ) {
          lastExtendedRef.current = true;
          if (phaseRef.current !== "highlight") {
            runHighlightWindow();
          }
          stopRAF();
        }
      },
      [active, runHighlightWindow, stopRAF, visibilityThreshold]
    );

    useIntersectionObserver(
      innerRef,
      {
        root: scrollContainer ?? undefined,
        threshold: visibilityThreshold,
        freezeOnceVisible: true,
      },
      handleIntersection,
      active
    );

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
      if (!active) {
        stopRAF();
      }
    }, [active, stopRAF]);

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

    const transitionClasses =
      isHighlighted || isFading ? "tw-transition-colors" : "";
    const transitionStyle = useMemo(() => {
      if (isHighlighted || isFading) {
        return { transitionDuration: `${fadeMs}ms` };
      }
      return undefined;
    }, [fadeMs, isHighlighted, isFading]);
    const classes = classNames(
      className,
      transitionClasses,
      isHighlighted ? "tw-bg-[#25263f]" : "",
      !isHighlighted && isFading ? "tw-bg-transparent" : ""
    );

    return (
      <div ref={setNode} id={id} className={classes} style={transitionStyle}>
        {children}
      </div>
    );
  }
);

HighlightDropWrapper.displayName = "HighlightDropWrapper";
export default HighlightDropWrapper;
