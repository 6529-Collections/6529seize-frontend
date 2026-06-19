"use client";

import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Leaderboard.module.scss";

const SCROLL_EDGE_TOLERANCE_PX = 2;
const SCROLL_STEP_RATIO = 0.75;
const MIN_SCROLL_STEP_PX = 240;

interface Props {
  children: ReactNode;
}

export default function LeaderboardTableScrollShell({
  children,
}: Readonly<Props>) {
  const scrollElementRef = useRef<HTMLDivElement>(null);
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

  const scrollTable = useCallback(
    (direction: -1 | 1) => {
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
    },
    []
  );

  useEffect(() => {
    const scrollElement = scrollElementRef.current;

    if (!scrollElement) {
      return;
    }

    const tableElement = scrollElement.firstElementChild;
    const animationFrame = window.requestAnimationFrame(updateScrollState);
    const handleScroll = () => updateScrollState();
    const handleResize = () => updateScrollState();
    const resizeObserver =
      "ResizeObserver" in window
        ? new ResizeObserver(updateScrollState)
        : undefined;

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    resizeObserver?.observe(scrollElement);

    if (tableElement) {
      resizeObserver?.observe(tableElement);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      scrollElement.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    };
  }, [updateScrollState]);

  const hasVisibleScrollCue =
    scrollState.canScrollLeft || scrollState.canScrollRight;

  return (
    <div
      className={clsx(
        styles["leaderboardTableFrame"],
        hasVisibleScrollCue && styles["leaderboardTableFrameWithCue"]
      )}
    >
      {scrollState.canScrollLeft && (
        <button
          aria-label="Scroll table left"
          className={clsx(styles["scrollCue"], styles["scrollCueLeft"])}
          onClick={() => scrollTable(-1)}
          type="button"
        >
          <ChevronDoubleLeftIcon aria-hidden="true" />
        </button>
      )}
      {scrollState.canScrollRight && (
        <button
          aria-label="Scroll table right"
          className={clsx(styles["scrollCue"], styles["scrollCueRight"])}
          onClick={() => scrollTable(1)}
          type="button"
        >
          <ChevronDoubleRightIcon aria-hidden="true" />
        </button>
      )}
      <div className={styles["leaderboardTableShell"]} ref={scrollElementRef}>
        {children}
      </div>
    </div>
  );
}
