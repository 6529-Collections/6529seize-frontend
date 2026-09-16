"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import styles from "./Leaderboard.module.css";

const SCROLL_EDGE_TOLERANCE_PX = 2;
const SCROLL_STEP_RATIO = 0.7;
const MIN_SCROLL_STEP_PX = 160;

export default function LeaderboardFilterScroll({
  children,
}: Readonly<{ children: ReactNode }>) {
  const locale = useBrowserLocale();
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const contentElementRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  const updateScrollState = useCallback(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) {
      return;
    }

    const maxScrollLeft = scrollElement.scrollWidth - scrollElement.clientWidth;
    const nextScrollState = {
      canScrollLeft: scrollElement.scrollLeft > SCROLL_EDGE_TOLERANCE_PX,
      canScrollRight:
        maxScrollLeft - scrollElement.scrollLeft > SCROLL_EDGE_TOLERANCE_PX,
    };

    setScrollState((currentScrollState) =>
      currentScrollState.canScrollLeft === nextScrollState.canScrollLeft &&
      currentScrollState.canScrollRight === nextScrollState.canScrollRight
        ? currentScrollState
        : nextScrollState
    );
  }, []);

  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(updateScrollState);
    const resizeObserver =
      "ResizeObserver" in window
        ? new ResizeObserver(updateScrollState)
        : undefined;

    scrollElement.addEventListener("scroll", updateScrollState, {
      passive: true,
    });
    window.addEventListener("resize", updateScrollState);
    resizeObserver?.observe(scrollElement);
    if (contentElementRef.current) {
      resizeObserver?.observe(contentElementRef.current);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      scrollElement.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      resizeObserver?.disconnect();
    };
  }, [updateScrollState]);

  const scrollFilters = (direction: -1 | 1) => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) {
      return;
    }

    scrollElement.scrollBy({
      behavior: "smooth",
      left:
        direction *
        Math.max(
          scrollElement.clientWidth * SCROLL_STEP_RATIO,
          MIN_SCROLL_STEP_PX
        ),
    });
  };

  return (
    <div className={styles["networkFiltersFrame"]}>
      <div className={styles["networkFilters"]} ref={scrollElementRef}>
        <div
          className={styles["networkFiltersContent"]}
          ref={contentElementRef}
        >
          {children}
        </div>
      </div>

      {scrollState.canScrollLeft && (
        <>
          <div
            aria-hidden="true"
            className={`${styles["networkFiltersFade"]!} ${styles["networkFiltersFadeLeft"]!}`}
          />
          <button
            aria-label={t(locale, "user.collected.filters.scrollLeft")}
            className={`${styles["networkFiltersScrollButton"]!} ${styles["networkFiltersScrollButtonLeft"]!}`}
            onClick={() => scrollFilters(-1)}
            type="button"
          >
            <ChevronLeftIcon aria-hidden="true" />
          </button>
        </>
      )}

      {scrollState.canScrollRight && (
        <>
          <div
            aria-hidden="true"
            className={`${styles["networkFiltersFade"]!} ${styles["networkFiltersFadeRight"]!}`}
          />
          <button
            aria-label={t(locale, "user.collected.filters.scrollRight")}
            className={`${styles["networkFiltersScrollButton"]!} ${styles["networkFiltersScrollButtonRight"]!}`}
            onClick={() => scrollFilters(1)}
            type="button"
          >
            <ChevronRightIcon aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
