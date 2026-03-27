"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface MemesQuickVoteDescriptionProps {
  readonly description: string;
}

export default function MemesQuickVoteDescription({
  description,
}: MemesQuickVoteDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const visibleDescriptionRef = useRef<HTMLParagraphElement | null>(null);
  const clampClass = isExpanded
    ? "tw-line-clamp-none"
    : "tw-line-clamp-1 md:tw-line-clamp-4";
  const descriptionClassName =
    "tw-mb-0 tw-whitespace-pre-line tw-text-sm tw-font-medium tw-leading-relaxed tw-text-iron-400 md:tw-text-md";

  const measureOverflow = useCallback(() => {
    const visibleDescription = visibleDescriptionRef.current;

    if (!visibleDescription) {
      return;
    }

    const computedStyles = globalThis.getComputedStyle(visibleDescription);
    const lineHeight = Number.parseFloat(computedStyles.lineHeight || "0");
    const collapsedLineCount = globalThis.matchMedia("(min-width: 768px)")
      .matches
      ? 4
      : 1;
    const collapsedHeight = lineHeight * collapsedLineCount;

    if (!Number.isFinite(collapsedHeight) || collapsedHeight <= 0) {
      return;
    }

    const previousDisplay = visibleDescription.style.display;
    const previousOverflow = visibleDescription.style.overflow;
    const previousWebkitLineClamp = visibleDescription.style.webkitLineClamp;

    visibleDescription.style.display = "block";
    visibleDescription.style.overflow = "visible";
    visibleDescription.style.webkitLineClamp = "unset";

    const fullHeight = visibleDescription.getBoundingClientRect().height;

    visibleDescription.style.display = previousDisplay;
    visibleDescription.style.overflow = previousOverflow;
    visibleDescription.style.webkitLineClamp = previousWebkitLineClamp;

    const nextIsOverflowing = fullHeight > collapsedHeight + 1;

    setIsOverflowing((current) =>
      current === nextIsOverflowing ? current : nextIsOverflowing
    );
  }, []);

  useEffect(() => {
    const frameId = globalThis.requestAnimationFrame(() => {
      measureOverflow();
    });

    if (typeof ResizeObserver === "undefined") {
      const handleResize = () => {
        measureOverflow();
      };

      globalThis.addEventListener("resize", handleResize);
      return () => {
        globalThis.removeEventListener("resize", handleResize);
        globalThis.cancelAnimationFrame(frameId);
      };
    }

    const observer = new ResizeObserver(() => {
      measureOverflow();
    });

    if (visibleDescriptionRef.current) {
      observer.observe(visibleDescriptionRef.current);
    }

    return () => {
      observer.disconnect();
      globalThis.cancelAnimationFrame(frameId);
    };
  }, [measureOverflow]);

  return (
    <div className="tw-space-y-1.5">
      <p
        ref={visibleDescriptionRef}
        className={`${descriptionClassName} ${clampClass}`}
      >
        {description}
      </p>
      {isOverflowing && (
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => {
            setIsExpanded((current) => !current);
          }}
          className="tw-inline-flex tw-w-fit tw-border-0 tw-bg-transparent tw-px-0 tw-py-1 tw-text-xs tw-font-medium tw-leading-none tw-text-iron-500 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white/15 desktop-hover:hover:tw-text-iron-300"
        >
          {isExpanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}
