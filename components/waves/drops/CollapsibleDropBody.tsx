"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

interface CollapsibleDropBodyProps {
  readonly children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, object, embed, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
const DROP_BODY_TEXT_SELECTOR = '[data-drop-body-text="true"]';

export default function CollapsibleDropBody({
  children,
}: CollapsibleDropBodyProps) {
  const locale = useBrowserLocale();
  const contentId = useId();
  const thresholdRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const managedTabIndexesRef = useRef(new Map<HTMLElement, string | null>());
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const restoreManagedTabIndexes = useCallback(() => {
    managedTabIndexesRef.current.forEach((tabIndex, element) => {
      if (tabIndex === null) {
        element.removeAttribute("tabindex");
      } else {
        element.setAttribute("tabindex", tabIndex);
      }
    });
    managedTabIndexesRef.current.clear();
  }, []);

  const syncClippedFocusableElements = useCallback(() => {
    restoreManagedTabIndexes();

    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content || !isOverflowing || isExpanded) {
      return;
    }

    const viewportBottom = viewport.getBoundingClientRect().bottom;
    const clippedElements = Array.from(
      content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter(
      (element) => element.getBoundingClientRect().bottom > viewportBottom + 1
    );

    if (
      clippedElements.includes(globalThis.document.activeElement as HTMLElement)
    ) {
      setIsExpanded(true);
      return;
    }

    clippedElements.forEach((element) => {
      managedTabIndexesRef.current.set(
        element,
        element.getAttribute("tabindex")
      );
      element.setAttribute("tabindex", "-1");
    });
  }, [isExpanded, isOverflowing, restoreManagedTabIndexes]);

  const measureOverflow = useCallback(() => {
    const threshold = thresholdRef.current;
    const content = contentRef.current;
    if (!threshold || !content) {
      return;
    }

    const maxHeight = threshold.getBoundingClientRect().height;
    if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
      return;
    }

    const contentTop = content.getBoundingClientRect().top;
    const textBlocks = content.querySelectorAll<HTMLElement>(
      DROP_BODY_TEXT_SELECTOR
    );
    const measuredBodyHeight =
      textBlocks.length > 0
        ? Math.max(
            ...Array.from(textBlocks, (element) =>
              Math.max(0, element.getBoundingClientRect().bottom - contentTop)
            )
          )
        : 0;
    const nextIsOverflowing = measuredBodyHeight > maxHeight + 1;
    setIsOverflowing((current) =>
      current === nextIsOverflowing ? current : nextIsOverflowing
    );
  }, []);

  useLayoutEffect(() => {
    measureOverflow();
  }, [children, measureOverflow]);

  useLayoutEffect(() => {
    syncClippedFocusableElements();
  }, [children, syncClippedFocusableElements]);

  const handleResize = useCallback(() => {
    measureOverflow();
    syncClippedFocusableElements();
  }, [measureOverflow, syncClippedFocusableElements]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }

    const ResizeObserverConstructor = Reflect.get(
      globalThis,
      "ResizeObserver"
    ) as typeof ResizeObserver | undefined;
    if (ResizeObserverConstructor === undefined) {
      globalThis.addEventListener("resize", handleResize);
      return () => {
        globalThis.removeEventListener("resize", handleResize);
      };
    }

    const observer = new ResizeObserverConstructor(handleResize);
    observer.observe(content);
    if (thresholdRef.current) {
      observer.observe(thresholdRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [handleResize]);

  useEffect(
    () => () => {
      restoreManagedTabIndexes();
    },
    [restoreManagedTabIndexes]
  );

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsExpanded((current) => !current);
  };

  return (
    <div className="tw-relative tw-w-full">
      <div
        ref={thresholdRef}
        aria-hidden="true"
        className="tw-pointer-events-none tw-invisible tw-absolute tw-h-[7.5rem] sm:tw-h-[10.5rem]"
      />
      <div className="tw-relative">
        <div
          id={contentId}
          ref={viewportRef}
          aria-hidden={isOverflowing && !isExpanded ? true : undefined}
          className={
            isOverflowing && !isExpanded
              ? "tw-max-h-[7.5rem] tw-overflow-hidden sm:tw-max-h-[10.5rem]"
              : "tw-overflow-visible"
          }
        >
          <div ref={contentRef}>{children}</div>
        </div>
        {isOverflowing && !isExpanded && (
          <div
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-12 tw-bg-gradient-to-b tw-from-transparent tw-to-iron-950"
          />
        )}
      </div>
      {isOverflowing && (
        <button
          type="button"
          aria-controls={contentId}
          aria-expanded={isExpanded}
          onClick={handleToggle}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.stopPropagation();
            }
          }}
          className="tw-mt-1 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-x-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-py-2 tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-200"
        >
          {t(
            locale,
            isExpanded
              ? "waves.drop.content.showLess"
              : "waves.drop.content.showMore"
          )}
          <ChevronDownIcon
            aria-hidden="true"
            className={`tw-size-3.5 tw-transition-transform tw-duration-200 motion-reduce:tw-transition-none ${
              isExpanded ? "tw-rotate-180" : ""
            }`}
          />
        </button>
      )}
    </div>
  );
}
