"use client";

import { useCallback, useRef, useState } from "react";
import GroupCardConfig from "./GroupCardConfig";
import type { GroupCardConfigProps } from "./GroupCardConfigs";

export default function GroupCardConfigsScroller({
  configs,
}: {
  readonly configs: readonly GroupCardConfigProps[];
}) {
  const [isLeftHidden, setIsLeftHidden] = useState(false);
  const [isRightHidden, setIsRightHidden] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const checkForHiddenContent = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setIsLeftHidden(scrollLeft > 0);
      setIsRightHidden(scrollLeft < scrollWidth - clientWidth);
    }
  }, []);

  const setContainerRef = useCallback(
    (container: HTMLDivElement | null) => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      window.removeEventListener("resize", checkForHiddenContent);
      containerRef.current = container;

      if (!container) {
        return;
      }

      checkForHiddenContent();
      if (typeof ResizeObserver !== "undefined") {
        resizeObserverRef.current = new ResizeObserver(checkForHiddenContent);
        resizeObserverRef.current.observe(container);
      } else {
        window.addEventListener("resize", checkForHiddenContent);
      }
    },
    [checkForHiddenContent]
  );

  const scrollContainer = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = direction === "left" ? -200 : 200;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="tw-relative tw-flex tw-items-start tw-text-xs tw-text-iron-200 sm:tw-text-sm">
      <div className="tw-w-full tw-overflow-x-hidden">
        {isLeftHidden ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              scrollContainer("left");
            }}
            aria-label="Scroll left"
            className="tw-absolute tw-left-0 tw-top-1/2 tw-z-30 tw-inline-flex tw-h-7 tw-w-7 -tw-translate-x-3 tw-translate-y-[-50%] tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-iron-800 tw-text-white tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500 desktop-hover:hover:tw-bg-iron-700"
          >
            <svg
              className="tw-h-4 tw-w-4 tw-rotate-90 tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out desktop-hover:hover:tw-text-white"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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
        ) : null}
        <div
          className="tw-no-scrollbar tw-flex tw-items-center tw-gap-x-4 tw-gap-y-2 tw-overflow-x-auto tw-py-0.5"
          ref={setContainerRef}
          onScroll={checkForHiddenContent}
        >
          {configs.map((config) => (
            <GroupCardConfig config={config} key={config.key} />
          ))}
        </div>
        {isRightHidden ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              scrollContainer("right");
            }}
            aria-label="Scroll right"
            className="tw-absolute tw-right-0 tw-top-1/2 tw-z-30 tw-inline-flex tw-h-7 tw-w-7 tw-translate-x-3 tw-translate-y-[-50%] tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-iron-800 tw-text-white tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500 desktop-hover:hover:tw-bg-iron-700"
          >
            <svg
              className="tw-h-4 tw-w-4 -tw-rotate-90 tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out desktop-hover:hover:tw-text-white"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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
        ) : null}
      </div>
    </div>
  );
}
