import React, { useCallback, useEffect, useRef, useState } from "react";
import BrainContentPinnedWave from "../../BrainContentPinnedWave";
import PinnedWavesScrollButton from "./PinnedWavesScrollButton";
import type { PinnedWaveSnapshot } from "@/hooks/usePinnedWaves";

interface PinnedWavesScrollerProps {
  readonly pinnedWaves: readonly PinnedWaveSnapshot[];
  readonly currentWaveId: string | null;
  readonly hoveredWaveId: string | null;
  readonly onHoverWave: (waveId: string) => void;
  readonly onHoverExit: () => void;
  readonly onRemove: (waveId: string) => void;
}

interface ScrollArrowVisibility {
  readonly left: boolean;
  readonly right: boolean;
}

const PinnedWavesScroller: React.FC<PinnedWavesScrollerProps> = ({
  pinnedWaves,
  currentWaveId,
  hoveredWaveId,
  onHoverWave,
  onHoverExit,
  onRemove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollArrowVisibility, setScrollArrowVisibility] =
    useState<ScrollArrowVisibility>({
      left: false,
      right: false,
    });

  const scrollHorizontally = useCallback((direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.scrollBy({
      left: direction === "left" ? -200 : 200,
      behavior: "smooth",
    });
  }, []);

  const checkScrollArrows = useCallback(() => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      setScrollArrowVisibility((current) =>
        current.left || current.right ? { left: false, right: false } : current
      );
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const scrollableWidth = container.scrollWidth;
    const viewportWidth = container.offsetWidth;
    const currentScroll = container.scrollLeft;
    const maxScroll = scrollableWidth - viewportWidth;
    const isAtEnd = Math.abs(currentScroll - maxScroll) < 1;
    const nextVisibility = {
      left: currentScroll > 0,
      right: maxScroll > 0 && !isAtEnd,
    };

    setScrollArrowVisibility((current) =>
      current.left === nextVisibility.left &&
      current.right === nextVisibility.right
        ? current
        : nextVisibility
    );
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const content = contentRef.current;
    let frameId: number | null = null;

    const scheduleCheckScrollArrows = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        checkScrollArrows();
      });
    };

    scheduleCheckScrollArrows();

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleCheckScrollArrows);

    resizeObserver?.observe(container);
    if (content) {
      resizeObserver?.observe(content);
    }

    container.addEventListener("scroll", scheduleCheckScrollArrows);
    container.addEventListener("load", scheduleCheckScrollArrows, true);
    window.addEventListener("resize", scheduleCheckScrollArrows);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      resizeObserver?.disconnect();
      container.removeEventListener("scroll", scheduleCheckScrollArrows);
      container.removeEventListener("load", scheduleCheckScrollArrows, true);
      window.removeEventListener("resize", scheduleCheckScrollArrows);
    };
  }, [checkScrollArrows]);

  const showLeftArrow = scrollArrowVisibility.left;
  const showRightArrow = scrollArrowVisibility.right;

  return (
    <div className="tw-relative tw-mb-2 tw-mr-2 tw-h-8">
      {showLeftArrow && (
        <PinnedWavesScrollButton
          direction="left"
          onClick={() => scrollHorizontally("left")}
        />
      )}
      {showRightArrow && (
        <PinnedWavesScrollButton
          direction="right"
          onClick={() => scrollHorizontally("right")}
        />
      )}
      <div
        ref={containerRef}
        className="no-scrollbar tw-absolute tw-inset-0 tw-flex tw-items-center tw-overflow-x-auto tw-overflow-y-hidden tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300"
      >
        <div ref={contentRef} className="tw-flex tw-gap-x-3">
          {pinnedWaves.map((wave) => (
            <BrainContentPinnedWave
              key={wave.id}
              wave={wave}
              currentWaveId={currentWaveId}
              active={currentWaveId === wave.id || hoveredWaveId === wave.id}
              onMouseEnter={onHoverWave}
              onMouseLeave={onHoverExit}
              onRemove={onRemove}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PinnedWavesScroller;
