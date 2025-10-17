"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface HighlightDropWrapperProps {
  readonly active: boolean;
  readonly scrollContainer?: HTMLElement | null;
  readonly children: ReactNode;
  readonly className?: string;
  readonly highlightMs?: number;
  readonly fadeMs?: number;
  readonly visibilityThreshold?: number;
}

export default function HighlightDropWrapper({
  active,
  scrollContainer,
  children,
  className = "",
  highlightMs = 3500,
  fadeMs = 500,
  visibilityThreshold = 0.6,
}: HighlightDropWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [highlightUntil, setHighlightUntil] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const rafRef = useRef<number | null>(null);
  const fadeTimeoutRef = useRef<number | null>(null);
  const lastExtendedRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    setIsFading(false);
    lastExtendedRef.current = false;
    setHighlightUntil(Date.now() + highlightMs);

    const checkVisibility = () => {
      const el = ref.current;
      if (el) {
        const er = el.getBoundingClientRect();
        const cr = scrollContainer
          ? scrollContainer.getBoundingClientRect()
          : new DOMRect(0, 0, window.innerWidth, window.innerHeight);

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
          return;
        }
      }
      rafRef.current = requestAnimationFrame(checkVisibility);
    };

    rafRef.current = requestAnimationFrame(checkVisibility);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, highlightMs, scrollContainer, visibilityThreshold]);

  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => {
      if (Date.now() >= highlightUntil && highlightUntil !== 0) {
        setHighlightUntil(0);
        setIsFading(true);
        if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = window.setTimeout(() => {
          setIsFading(false);
        }, fadeMs);
        clearInterval(interval);
      }
    }, 150);

    return () => {
      clearInterval(interval);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [active, highlightUntil, fadeMs]);

  const isHighlighted = Date.now() < highlightUntil;

  const classes = [
    className,
    isHighlighted ? "tw-bg-[#25263f] tw-transition-colors tw-duration-500" : "",
    !isHighlighted && isFading
      ? "tw-bg-transparent tw-transition-colors tw-duration-500"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes}>
      {children}
    </div>
  );
}
