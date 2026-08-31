"use client";

import {
  useCallback,
  useRef,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { getWaveTabsScrollLabel } from "./my-stream-wave-tabs.messages";

const OVERFLOW_TOLERANCE_PX = 2;
const CAN_SCROLL_LEFT = 1;
const CAN_SCROLL_RIGHT = 2;
const NO_OVERFLOW = 0;

type ScrollDirection = "left" | "right";
type FocusTarget = ScrollDirection | "active-tab";

const DIRECTION_STYLES: Record<
  ScrollDirection,
  {
    readonly button: string;
    readonly gradient: string;
    readonly icon: string;
  }
> = {
  left: {
    button: "tw-left-0",
    gradient:
      "tw-left-0 tw-bg-gradient-to-r tw-from-iron-950 tw-via-iron-950/80 tw-to-transparent",
    icon: "-tw-translate-x-1.5 group-active:-tw-translate-x-2",
  },
  right: {
    button: "tw-right-0",
    gradient:
      "tw-right-0 tw-bg-gradient-to-l tw-from-iron-950 tw-via-iron-950/80 tw-to-transparent",
    icon: "tw-translate-x-1.5 group-active:tw-translate-x-2",
  },
};

const getOverflowSnapshot = (scroller: HTMLDivElement | null): number => {
  if (!scroller) {
    return NO_OVERFLOW;
  }

  const maxScrollLeft = Math.max(
    0,
    scroller.scrollWidth - scroller.clientWidth
  );
  const canScrollLeft = scroller.scrollLeft > OVERFLOW_TOLERANCE_PX;
  const canScrollRight =
    scroller.scrollLeft < maxScrollLeft - OVERFLOW_TOLERANCE_PX;

  return (
    (canScrollLeft ? CAN_SCROLL_LEFT : NO_OVERFLOW) |
    (canScrollRight ? CAN_SCROLL_RIGHT : NO_OVERFLOW)
  );
};

const getServerSnapshot = (): number => NO_OVERFLOW;

interface ScrollControlProps {
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
  readonly direction: ScrollDirection;
  readonly isAvailable: boolean;
  readonly label: string;
  readonly onClick: () => void;
}

function ScrollControl({
  buttonRef,
  direction,
  isAvailable,
  label,
  onClick,
}: ScrollControlProps) {
  const styles = DIRECTION_STYLES[direction];
  const ChevronIcon = direction === "left" ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <>
      <div
        aria-hidden="true"
        className={`tw-pointer-events-none tw-absolute tw-inset-y-0 tw-z-10 tw-w-12 tw-transition-opacity tw-duration-150 motion-reduce:tw-transition-none ${styles.gradient} ${
          isAvailable ? "tw-opacity-100" : "tw-opacity-0"
        }`}
      />
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        tabIndex={isAvailable ? 0 : -1}
        onClick={onClick}
        className={`tw-group tw-absolute tw-inset-y-0 tw-z-20 tw-flex tw-w-11 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition-opacity tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none ${styles.button} ${
          isAvailable
            ? "tw-opacity-100"
            : "tw-pointer-events-none tw-invisible tw-opacity-0"
        }`}
      >
        <ChevronIcon
          aria-hidden="true"
          className={`tw-size-5 tw-drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] motion-reduce:tw-transform-none ${styles.icon}`}
        />
      </button>
    </>
  );
}

export default function MobileTabsScrollControls({
  scrollerRef,
}: {
  readonly scrollerRef: RefObject<HTMLDivElement | null>;
}) {
  const locale = useBrowserLocale();
  const leftButtonRef = useRef<HTMLButtonElement | null>(null);
  const rightButtonRef = useRef<HTMLButtonElement | null>(null);

  const readSnapshot = useCallback(
    () => getOverflowSnapshot(scrollerRef.current),
    [scrollerRef]
  );
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const scroller = scrollerRef.current;
      if (!scroller) {
        return () => undefined;
      }

      let focusFrame: number | null = null;
      const getFocusTarget = (): FocusTarget | null => {
        const nextSnapshot = getOverflowSnapshot(scroller);
        const activeElement = globalThis.document.activeElement;

        if (
          activeElement === rightButtonRef.current &&
          !(nextSnapshot & CAN_SCROLL_RIGHT)
        ) {
          if (nextSnapshot & CAN_SCROLL_LEFT) {
            return "left";
          }

          return "active-tab";
        }

        if (
          activeElement === leftButtonRef.current &&
          !(nextSnapshot & CAN_SCROLL_LEFT)
        ) {
          if (nextSnapshot & CAN_SCROLL_RIGHT) {
            return "right";
          }

          return "active-tab";
        }

        return null;
      };
      const notify = () => {
        const focusTarget = getFocusTarget();
        onStoreChange();
        if (focusTarget) {
          if (focusFrame !== null) {
            globalThis.window.cancelAnimationFrame(focusFrame);
          }
          focusFrame = globalThis.window.requestAnimationFrame(() => {
            if (focusTarget === "left") {
              leftButtonRef.current?.focus();
            } else if (focusTarget === "right") {
              rightButtonRef.current?.focus();
            } else {
              scroller
                .querySelector<HTMLElement>(
                  '[role="tab"][aria-selected="true"]'
                )
                ?.focus();
            }
          });
        }
      };
      const content = scroller.firstElementChild;
      const resizeObserver =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(notify);

      scroller.addEventListener("scroll", notify, { passive: true });
      globalThis.window.addEventListener("resize", notify);
      resizeObserver?.observe(scroller);
      if (content) {
        resizeObserver?.observe(content);
      }

      return () => {
        if (focusFrame !== null) {
          globalThis.window.cancelAnimationFrame(focusFrame);
        }
        scroller.removeEventListener("scroll", notify);
        globalThis.window.removeEventListener("resize", notify);
        resizeObserver?.disconnect();
      };
    },
    [scrollerRef]
  );
  const overflowSnapshot = useSyncExternalStore(
    subscribe,
    readSnapshot,
    getServerSnapshot
  );
  const canScrollLeft = Boolean(overflowSnapshot & CAN_SCROLL_LEFT);
  const canScrollRight = Boolean(overflowSnapshot & CAN_SCROLL_RIGHT);

  const scrollTabs = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const prefersReducedMotion = globalThis.window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    scroller.scrollBy({
      left: direction * Math.max(160, scroller.clientWidth * 0.8),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <>
      <ScrollControl
        buttonRef={leftButtonRef}
        direction="left"
        isAvailable={canScrollLeft}
        label={getWaveTabsScrollLabel(locale, "left")}
        onClick={() => scrollTabs(-1)}
      />
      <ScrollControl
        buttonRef={rightButtonRef}
        direction="right"
        isAvailable={canScrollRight}
        label={getWaveTabsScrollLabel(locale, "right")}
        onClick={() => scrollTabs(1)}
      />
    </>
  );
}
