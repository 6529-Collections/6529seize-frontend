"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import clsx from "clsx";
import {
  type TouchEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface MemesQuickVoteDescriptionProps {
  readonly allowToggle?: boolean | undefined;
  readonly constrainHeight?: boolean | undefined;
  readonly description: string;
}

export default function MemesQuickVoteDescription({
  allowToggle = true,
  constrainHeight = false,
  description,
}: MemesQuickVoteDescriptionProps) {
  const locale = useBrowserLocale();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const collapsedMeasureRef = useRef<HTMLParagraphElement | null>(null);
  const expandedMeasureRef = useRef<HTMLParagraphElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const clampClass = isExpanded
    ? "tw-line-clamp-none"
    : "tw-line-clamp-2 md:tw-line-clamp-4";
  const descriptionClassName =
    "tw-mb-0 tw-whitespace-pre-line tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-300 md:tw-text-md";

  const measureOverflow = useCallback(() => {
    const collapsedDescription = collapsedMeasureRef.current;
    const expandedDescription = expandedMeasureRef.current;

    if (!collapsedDescription || !expandedDescription) {
      return;
    }

    const collapsedHeight = collapsedDescription.offsetHeight;
    const fullHeight = expandedDescription.offsetHeight;
    if (collapsedHeight <= 0 || fullHeight <= 0) {
      return;
    }

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

    if (collapsedMeasureRef.current) {
      observer.observe(collapsedMeasureRef.current);
    }
    if (expandedMeasureRef.current) {
      observer.observe(expandedMeasureRef.current);
    }

    return () => {
      observer.disconnect();
      globalThis.cancelAnimationFrame(frameId);
    };
  }, [measureOverflow]);

  const stopExpandedDescriptionTouch: TouchEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (isExpanded) {
      event.stopPropagation();
    }
  };

  return (
    <div
      className={clsx(
        "tw-relative",
        constrainHeight
          ? "tw-flex tw-min-h-0 tw-flex-1 tw-flex-col"
          : "tw-space-y-1.5"
      )}
    >
      <div
        aria-hidden="true"
        className="tw-pointer-events-none tw-invisible tw-absolute tw-inset-x-0 tw-top-0"
      >
        <p
          ref={collapsedMeasureRef}
          className={`${descriptionClassName} tw-line-clamp-2 md:tw-line-clamp-4`}
        >
          {description}
        </p>
        <p
          ref={expandedMeasureRef}
          className={`${descriptionClassName} tw-line-clamp-none`}
        >
          {description}
        </p>
      </div>

      <div
        ref={scrollAreaRef}
        className={clsx(
          constrainHeight && isExpanded
            ? "tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overscroll-contain tw-pr-1 [scrollbar-color:rgba(255,255,255,0.22)_transparent] [scrollbar-width:thin]"
            : "tw-shrink-0"
        )}
        style={isExpanded ? { touchAction: "pan-y" } : undefined}
        onTouchStart={stopExpandedDescriptionTouch}
        onTouchMove={stopExpandedDescriptionTouch}
        onTouchEnd={stopExpandedDescriptionTouch}
        onTouchCancel={stopExpandedDescriptionTouch}
      >
        <p className={`${descriptionClassName} ${clampClass}`}>{description}</p>
      </div>
      {allowToggle && isOverflowing && (
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => {
            setIsExpanded((current) => {
              if (current && scrollAreaRef.current) {
                scrollAreaRef.current.scrollTop = 0;
              }
              return !current;
            });
          }}
          className="-tw-ml-2 tw-inline-flex tw-min-h-11 tw-w-fit tw-shrink-0 tw-items-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-2 tw-text-xs tw-font-medium tw-leading-none tw-text-iron-400 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-200"
        >
          {isExpanded
            ? t(locale, "memes.quickVote.collapseDescription")
            : t(locale, "memes.quickVote.expandDescription")}
        </button>
      )}
    </div>
  );
}
