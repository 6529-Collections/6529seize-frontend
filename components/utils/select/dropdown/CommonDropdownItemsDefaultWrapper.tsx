"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
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
const MENU_ACTION_SELECTOR = "button, a[href]";
const PASSIVE_SCROLL_OPTIONS: AddEventListenerOptions = { passive: true };
type DropdownHorizontalAlign = "auto" | "left" | "right";
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
  scrollCueLabel,
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
  readonly scrollCueLabel?: string | undefined;
  readonly children: ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLUListElement>(null);
  const scrollCueRef = useRef<HTMLButtonElement>(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const showScrollCue = Boolean(scrollCueLabel) && hasMoreBelow;
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

    const actions = viewport.querySelectorAll(MENU_ACTION_SELECTOR);
    const lastAction = actions[actions.length - 1];
    // Ignore trailing padding and subpixel rounding at the bottom of the list.
    const moreBelow =
      lastAction !== undefined &&
      lastAction.getBoundingClientRect().bottom >
        viewport.getBoundingClientRect().bottom + 1;
    if (!moreBelow && document.activeElement === scrollCueRef.current) {
      listRef.current?.focus({ preventScroll: true });
    }
    setHasMoreBelow(moreBelow);
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const items = itemsRef.current;
    if (!isOpen || !scrollCueLabel || !viewport || !items) return;
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateScrollCue);
    observer.observe(viewport);
    observer.observe(items);
    return () => observer.disconnect();
  }, [isOpen, mounted, scrollCueLabel, updateScrollCue]);

  const scrollToMoreActions = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const visibleBottom = viewport.getBoundingClientRect().bottom;
    const nextAction = Array.from(
      viewport.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]")
    ).find((action) => action.getBoundingClientRect().bottom > visibleBottom);
    viewport.scrollTop += Math.round(viewport.clientHeight * 0.75);
    // Keep keyboard focus in the menu when the cue disappears.
    (nextAction ?? listRef.current)?.focus({ preventScroll: true });
    updateScrollCue();
  };

  const position = useCallback(() => {
    if (!dynamicPosition) return;
    if (!isOpen) return;
    if (!buttonRef.current || !dropdownRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownEl = dropdownRef.current;
    const width = Math.max(buttonRect.width, minWidth);
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
  }, [dynamicPosition, horizontalAlign, isOpen, buttonRef, minWidth]);

  useLayoutEffect(() => {
    position();
  }, [mounted, position, showScrollCue]);

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
        width: `${minWidth}px`,
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
              className="tw-w-full tw-rounded-lg tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-white/10 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div
                ref={viewportRef}
                onScroll={scrollCueLabel ? updateScrollCue : undefined}
                className={`${
                  scrollCueLabel
                    ? "tw-max-h-[min(20rem,calc(100dvh_-_4.5rem))]"
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
              {showScrollCue && (
                <button
                  ref={scrollCueRef}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    scrollToMoreActions();
                  }}
                  className="-tw-mb-1 tw-flex tw-min-h-8 tw-w-full tw-cursor-pointer tw-items-center tw-justify-center tw-gap-2 tw-rounded-b-lg tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-200 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:-tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                >
                  {scrollCueLabel}
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="tw-size-4 tw-shrink-0"
                  />
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
