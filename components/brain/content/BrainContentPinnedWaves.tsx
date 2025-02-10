import React, { useEffect, useRef, useState } from "react";
import BrainContentPinnedWave from "./BrainContentPinnedWave";
import { usePinnedWaves } from "../../../hooks/usePinnedWaves";
import { useRouter } from "next/router";

const BrainContentPinnedWaves: React.FC = () => {
  const router = useRouter();
  const { pinnedIds, addId, removeId } = usePinnedWaves();
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
    if (container) {
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
    }
  }, [pinnedIds]);

  useEffect(() => {
    const { wave } = router.query;
    if (wave && typeof wave === "string") {
      addId(wave);
    }
  }, [router.query, addId]);

  if (!pinnedIds.length) {
    return null;
  }

  const onRemove = async (waveId: string) => {
    if (router.query.wave === waveId) {
      await router.replace("/my-stream", undefined, { shallow: true });
    }
    removeId(waveId);
  };

  return (
    <div className="tw-relative tw-h-8 tw-mb-2 tw-mr-2">
      {showLeftArrow && (
        <button
          ref={leftArrowRef}
          onClick={() => scrollHorizontally("left")}
          className="tw-inline-flex tw-items-center tw-justify-center tw-group tw-absolute tw-z-10 tw-top-0 sm:tw-top-0.5 tw-p-0 tw-size-8 sm:tw-size-7 tw-left-0 tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-rounded-md tw-border-none"
        >
          <svg
            className="tw-size-5 sm:tw-size-4 tw-text-iron-200 group-hover:tw-text-iron-400 tw-rotate-90 tw-transition tw-duration-300 tw-ease-out"
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
          onClick={() => scrollHorizontally("right")}
          className="tw-inline-flex tw-items-center tw-justify-center tw-group tw-absolute tw-z-10 tw-right-0 tw-top-0 sm:tw-top-0.5 tw-p-0 tw-size-8 sm:tw-size-7 tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-rounded-md tw-border-none"
        >
          <svg
            className="tw-size-5 sm:tw-size-4 tw-text-iron-200 group-hover:tw-text-iron-400 -tw-rotate-90 tw-transition tw-duration-300 tw-ease-out"
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
        className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-overflow-x-auto tw-overflow-y-hidden no-scrollbar tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300"
      >
        <div className="tw-flex tw-gap-x-3">
          {pinnedIds.map((id) => (
            <BrainContentPinnedWave
              key={id}
              waveId={id}
              active={router.query.wave === id || onHoverWaveId === id}
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
