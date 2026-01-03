"use client";

import React, { useEffect, useRef, useState } from "react";
import BrainContentPinnedWave from "./BrainContentPinnedWave";
import { usePinnedWaves } from "@/hooks/usePinnedWaves";
import { useRouter, useSearchParams } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveHomeRoute } from "@/helpers/navigation.helpers";
import { useMyStream } from "@/contexts/wave/MyStreamContext";

const BrainContentPinnedWaves: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pinnedIds, addId, removeId } = usePinnedWaves();
  const { isApp } = useDeviceInfo();
  const { directMessages } = useMyStream();
  const directMessagesList = directMessages?.list ?? [];
  const [onHoverWaveId, setOnHoverWaveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftArrowRef = useRef<HTMLButtonElement>(null);
  const rightArrowRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const scrollHorizontally = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const checkScrollArrows = () => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      setShowLeftArrow(false);
      setShowRightArrow(false);
      return;
    }

    const container = containerRef.current;
    if (container) {
      const scrollableWidth = container.scrollWidth;
      const viewportWidth = container.offsetWidth;
      const currentScroll = container.scrollLeft;
      const maxScroll = scrollableWidth - viewportWidth;

      const isAtEnd = Math.abs(currentScroll - maxScroll) < 1;

      setShowLeftArrow(currentScroll > 0);
      setShowRightArrow(maxScroll > 0 && !isAtEnd);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    checkScrollArrows();

    const timeoutId = setTimeout(checkScrollArrows, 100);

    const mutationObserver = new MutationObserver(checkScrollArrows);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    const resizeObserver = new ResizeObserver(checkScrollArrows);
    resizeObserver.observe(container);

    container.addEventListener("scroll", checkScrollArrows);
    window.addEventListener("resize", checkScrollArrows);

    const images = container.getElementsByTagName("img");
    Array.from(images).forEach((img) => {
      img.addEventListener("load", checkScrollArrows);
    });

    return () => {
      clearTimeout(timeoutId);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener("scroll", checkScrollArrows);
      window.removeEventListener("resize", checkScrollArrows);
      Array.from(images).forEach((img) => {
        img.removeEventListener("load", checkScrollArrows);
      });
    };
  }, [pinnedIds]);

  useEffect(() => {
    const wave = searchParams?.get("wave") ?? undefined;
    if (wave && typeof wave === "string") {
      addId(wave);
    }
  }, [searchParams, addId]);

  if (!pinnedIds.length) {
    return null;
  }

  const onRemove = async (waveId: string) => {
    const currentWaveId = searchParams?.get("wave") ?? undefined;
    if (currentWaveId === waveId) {
      const isDirectMessage = directMessagesList.some((w) => w.id === waveId);
      router.replace(getWaveHomeRoute({ isDirectMessage, isApp }));
    }
    removeId(waveId);
  };

  return (
    <div className="tw-relative tw-mb-2 tw-mr-2 tw-h-8">
      {showLeftArrow && (
        <button
          ref={leftArrowRef}
          aria-label="Scroll left"
          onClick={() => scrollHorizontally("left")}
          className="tw-group tw-absolute tw-left-0 tw-top-0 tw-z-10 tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-border-none tw-bg-iron-700 tw-p-0 tw-ring-1 tw-ring-inset tw-ring-white/10 sm:tw-top-0.5 sm:tw-size-7"
        >
          <svg
            className="tw-size-5 tw-rotate-90 tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-iron-400 sm:tw-size-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      {showRightArrow && (
        <button
          ref={rightArrowRef}
          aria-label="Scroll right"
          onClick={() => scrollHorizontally("right")}
          className="tw-group tw-absolute tw-right-0 tw-top-0 tw-z-10 tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-border-none tw-bg-iron-700 tw-p-0 tw-ring-1 tw-ring-inset tw-ring-white/10 sm:tw-top-0.5 sm:tw-size-7"
        >
          <svg
            className="tw-size-5 -tw-rotate-90 tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-iron-400 sm:tw-size-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      <div
        ref={containerRef}
        className="no-scrollbar tw-absolute tw-inset-0 tw-flex tw-items-center tw-overflow-x-auto tw-overflow-y-hidden tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300"
      >
        <div className="tw-flex tw-gap-x-3">
          {pinnedIds.map((id) => (
            <BrainContentPinnedWave
              key={id}
              waveId={id}
              active={
                (searchParams?.get("wave") ?? undefined) === id ||
                onHoverWaveId === id
              }
              onMouseEnter={setOnHoverWaveId}
              onMouseLeave={() => setOnHoverWaveId(null)}
              onRemove={onRemove}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrainContentPinnedWaves;
