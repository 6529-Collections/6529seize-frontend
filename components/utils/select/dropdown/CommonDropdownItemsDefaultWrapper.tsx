"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import type { ReactNode, RefObject } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useClickAway, useKeyPressEvent } from "react-use";

const VIEWPORT_PADDING = 16;
const MENU_GAP = 8;
const DEFAULT_MENU_MIN_WIDTH = 224;
const SCROLL_CUE_GUTTER_WIDTH = 28;
const MENU_ACTION_SELECTOR = "button, a[href]";
const PASSIVE_SCROLL_OPTIONS: AddEventListenerOptions = { passive: true };
const SCROLL_CUE_BUTTON_CLASS =
  "tw-absolute tw-right-1 tw-flex tw-size-6 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-iron-800 tw-p-0 tw-text-iron-200 hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:-tw-outline-offset-2 focus-visible:tw-outline-primary-400";
type DropdownHorizontalAlign = "auto" | "left" | "right";
type ScrollDirection = "up" | "down";
type DropdownScrollCue = {
  readonly downLabel: string;
  readonly upLabel: string;
};
const unsubscribeFromClientMount = () => undefined;
const subscribeToClientMount = (onStoreChange: () => void) => {
  onStoreChange();
  return unsubscribeFromClientMount;
};
const getClientMountSnapshot = () => true;
const getServerMountSnapshot = () => false;

export default function CommonDropdownItemsDefaultWrapper({
  isOpen,
  setOpen,
  buttonRef,
  dynamicPosition = true,
  closeOnFocusOutside = true,
  horizontalAlign = "auto",
  minWidth = DEFAULT_MENU_MIN_WIDTH,
  portalClassName = "tw-z-[999]",
  menuId,
  menuLabelledBy,
  scrollCue,
  children,
}: {
  readonly isOpen: boolean;
  readonly setOpen: (isOpen: boolean) => void;
  readonly buttonRef: RefObject<HTMLButtonElement | HTMLDivElement | null>;
  readonly dynamicPosition?: boolean | undefined;
  readonly closeOnFocusOutside?: boolean | undefined;
  readonly horizontalAlign?: DropdownHorizontalAlign | undefined;
  readonly minWidth?: number | undefined;
  readonly portalClassName?: string | undefined;
  readonly menuId?: string | undefined;
  readonly menuLabelledBy?: string | undefined;
  readonly scrollCue?: DropdownScrollCue | undefined;
  readonly children: ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLUListElement>(null);
  const upCueRef = useRef<HTMLButtonElement>(null);
  const downCueRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<{ from: HTMLElement; to: HTMLElement } | null>(
    null
  );
  const [scrollState, setScrollState] = useState({
    up: false,
    down: false,
  });
  const scrollCueEnabled = scrollCue !== undefined;
  const menuMinWidth =
    minWidth + (scrollCueEnabled ? SCROLL_CUE_GUTTER_WIDTH : 0);
  const mounted = useSyncExternalStore(
    subscribeToClientMount,
    getClientMountSnapshot,
    getServerMountSnapshot
  );
  useClickAway(listRef, (e) => {
    if (
      buttonRef.current &&
      e.target instanceof Node &&
      buttonRef.current.contains(e.target)
    ) {
      return;
    }
    setOpen(false);
  });
  useKeyPressEvent("Escape", () => setOpen(false));

  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateScrollCue = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const actions = Array.from(
      viewport.querySelectorAll<HTMLElement>(MENU_ACTION_SELECTOR)
    );
    const visible = viewport.getBoundingClientRect();
    const first = actions[0]?.getBoundingClientRect();
    const last = actions.at(-1)?.getBoundingClientRect();
    const up = first !== undefined && first.top < visible.top - 1;
    const down = last !== undefined && last.bottom > visible.bottom + 1;
    const canFocus = (action: HTMLElement) => {
      const bounds = action.getBoundingClientRect();
      return (
        !action.matches(":disabled") &&
        bounds.top >= visible.top - 1 &&
        bounds.bottom <= visible.bottom + 1
      );
    };
    const focus = pendingFocus.current;
    const active = document.activeElement;
    if (focus && (active !== focus.from || !viewport.contains(focus.to))) {
      pendingFocus.current = null;
    } else if (focus && canFocus(focus.to)) {
      pendingFocus.current = null;
      focus.to.focus({ preventScroll: true });
    } else if (
      (active === upCueRef.current && !up) ||
      (active === downCueRef.current && !down)
    ) {
      pendingFocus.current = null;
      const next =
        active === upCueRef.current
          ? actions.find(canFocus)
          : actions.findLast(canFocus);
      (next ?? listRef.current)?.focus({ preventScroll: true });
    }
    setScrollState((previous) =>
      previous.up === up && previous.down === down ? previous : { up, down }
    );
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const items = itemsRef.current;
    if (!isOpen || !scrollCueEnabled || !viewport || !items) return;
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateScrollCue);
    observer.observe(viewport);
    observer.observe(items);
    return () => {
      observer.disconnect();
      pendingFocus.current = null;
    };
  }, [isOpen, mounted, scrollCueEnabled, updateScrollCue]);

  const scrollToMoreActions = (
    direction: ScrollDirection,
    cue: HTMLElement
  ) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const visible = viewport.getBoundingClientRect();
    const actions = Array.from(
      viewport.querySelectorAll<HTMLElement>(MENU_ACTION_SELECTOR)
    );
    const clippedActions = actions.filter((action) => {
      const bounds = action.getBoundingClientRect();
      return direction === "up"
        ? bounds.top < visible.top - 1
        : bounds.bottom > visible.bottom + 1;
    });
    if (direction === "up") clippedActions.reverse();
    const focusTarget = clippedActions.find(
      (action) => !action.matches(":disabled")
    );
    const nextAction = focusTarget ?? clippedActions[0];
    if (!nextAction) return;

    const next = nextAction.getBoundingClientRect();
    cue.focus({ preventScroll: true });
    pendingFocus.current = focusTarget ? { from: cue, to: focusTarget } : null;
    const top =
      direction === "up"
        ? Math.floor(
            Math.min(next.top - visible.top, next.bottom - visible.bottom)
          )
        : Math.ceil(
            Math.max(next.top - visible.top, next.bottom - visible.bottom)
          );
    viewport.scrollBy({
      top,
      behavior: globalThis.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? "instant"
        : "smooth",
    });
  };

  const position = useCallback(() => {
    if (!dynamicPosition) return;
    if (!isOpen) return;
    if (!buttonRef.current || !dropdownRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownEl = dropdownRef.current;
    const width = Math.max(buttonRect.width, menuMinWidth);
    dropdownEl.style.width = `${width}px`;

    const height = listRef.current?.offsetHeight ?? dropdownEl.offsetHeight;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const viewportTop = scrollY + VIEWPORT_PADDING;
    const viewportLeft = scrollX + VIEWPORT_PADDING;
    const viewportRight = scrollX + window.innerWidth - VIEWPORT_PADDING;
    const viewportBottom = scrollY + window.innerHeight - VIEWPORT_PADDING;
    const availableAbove = buttonRect.top - VIEWPORT_PADDING;
    const availableBelow =
      window.innerHeight - buttonRect.bottom - VIEWPORT_PADDING;
    const shouldOpenAbove =
      height > 0 &&
      availableBelow < height + MENU_GAP &&
      availableAbove > availableBelow;

    const unclampedTop = shouldOpenAbove
      ? buttonRect.top + scrollY - height - MENU_GAP
      : buttonRect.bottom + scrollY + MENU_GAP;
    const maxTop = Math.max(viewportTop, viewportBottom - height);
    const top = Math.min(Math.max(unclampedTop, viewportTop), maxTop);

    const shouldRightAlign =
      horizontalAlign === "right" ||
      (horizontalAlign === "auto" &&
        buttonRect.left + width > window.innerWidth - VIEWPORT_PADDING);
    let left = shouldRightAlign
      ? buttonRect.right + scrollX - width
      : buttonRect.left + scrollX;

    const maxLeft = Math.max(viewportLeft, viewportRight - width);
    left = Math.min(Math.max(left, viewportLeft), maxLeft);

    dropdownEl.style.top = `${top}px`;
    dropdownEl.style.left = `${left}px`;
  }, [dynamicPosition, horizontalAlign, isOpen, buttonRef, menuMinWidth]);

  useLayoutEffect(() => {
    position();
  }, [mounted, position]);

  useEffect(() => {
    if (!dynamicPosition || !isOpen) return;
    const onResize = () => position();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, PASSIVE_SCROLL_OPTIONS);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, PASSIVE_SCROLL_OPTIONS);
    };
  }, [dynamicPosition, isOpen, position]);

  useEffect(() => {
    if (!isOpen || !closeOnFocusOutside) {
      return;
    }

    const handleFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (
        buttonRef.current?.contains(event.target) ||
        listRef.current?.contains(event.target)
      ) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [buttonRef, closeOnFocusOutside, isOpen, setOpen]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`tw-absolute ${portalClassName}`}
      ref={dropdownRef}
      style={{
        left: 0,
        top: 0,
        width: `${menuMinWidth}px`,
      }}
    >
      <LazyMotion features={domAnimation}>
        <AnimatePresence mode="wait" initial={false}>
          {isOpen && (
            <m.div
              id={menuId}
              ref={listRef}
              role="menu"
              aria-labelledby={menuLabelledBy}
              tabIndex={-1}
              className={`tw-w-full tw-rounded-lg tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-white/10 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20 ${scrollCueEnabled ? "tw-relative tw-pr-7" : ""}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div
                ref={viewportRef}
                onScroll={scrollCueEnabled ? updateScrollCue : undefined}
                className={`${
                  scrollCueEnabled
                    ? "tw-max-h-[min(20rem,calc(100dvh_-_2.5rem))] tw-overscroll-y-contain"
                    : "tw-max-h-80"
                } tw-overflow-y-auto tw-overflow-x-hidden [scrollbar-color:#3f3f46_#18181b] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb:hover]:tw-bg-iron-600 [&::-webkit-scrollbar-thumb]:tw-rounded-full [&::-webkit-scrollbar-thumb]:tw-bg-iron-700 [&::-webkit-scrollbar-track]:tw-bg-iron-900 [&::-webkit-scrollbar]:tw-w-2`}
              >
                <ul
                  ref={itemsRef}
                  role="none"
                  className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-0.5 tw-px-2"
                >
                  {children}
                </ul>
              </div>
              {scrollCue && scrollState.up && (
                <button
                  ref={upCueRef}
                  type="button"
                  role="menuitem"
                  aria-label={scrollCue.upLabel}
                  onClick={(event) => {
                    event.stopPropagation();
                    scrollToMoreActions("up", event.currentTarget);
                  }}
                  className={`${SCROLL_CUE_BUTTON_CLASS} tw-top-1`}
                >
                  <ChevronUpIcon aria-hidden="true" className="tw-size-3.5" />
                </button>
              )}
              {scrollCue && scrollState.down && (
                <button
                  ref={downCueRef}
                  type="button"
                  role="menuitem"
                  aria-label={scrollCue.downLabel}
                  onClick={(event) => {
                    event.stopPropagation();
                    scrollToMoreActions("down", event.currentTarget);
                  }}
                  className={`${SCROLL_CUE_BUTTON_CLASS} tw-bottom-1`}
                >
                  <ChevronDownIcon aria-hidden="true" className="tw-size-3.5" />
                </button>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </div>,
    document.body
  );
}
