"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type {
  ReactNode,
  RefObject} from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useClickAway, useKeyPressEvent } from "react-use";

export default function CommonDropdownItemsDefaultWrapper({
  isOpen,
  setOpen,
  buttonRef,
  dynamicPosition = true,
  children,
}: {
  readonly isOpen: boolean;
  readonly setOpen: (isOpen: boolean) => void;
  readonly buttonRef: RefObject<HTMLButtonElement | HTMLDivElement | null>;
  readonly dynamicPosition?: boolean | undefined;
  readonly children: ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
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

  const position = useCallback(() => {
    if (!dynamicPosition) return;
    if (!isOpen) return;
    if (!buttonRef.current || !dropdownRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownEl = dropdownRef.current;

    // Get width from the list element if possible, otherwise the wrapper
    const width = listRef.current?.offsetWidth ?? dropdownEl.offsetWidth ?? 288;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Vertical position: below the button
    const top = buttonRect.bottom + scrollY;

    // Horizontal position: default to left align
    let left = buttonRect.left + scrollX;

    // Check if it overflows right edge of viewport
    if (buttonRect.left + width > window.innerWidth - 16) {
      // Switch to right align (align right edge of dropdown with right edge of button)
      left = buttonRect.right + scrollX - width;
    }

    // Ensure it doesn't overflow left edge
    left = Math.max(16, left);

    dropdownEl.style.top = `${top}px`;
    dropdownEl.style.left = `${left}px`;
  }, [dynamicPosition, isOpen, buttonRef]);

  useLayoutEffect(() => {
    position();
  }, [position]);

  useEffect(() => {
    if (!dynamicPosition || !isOpen) return;
    const onResize = () => position();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize); // Also update on scroll
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [dynamicPosition, isOpen, position]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="tw-absolute tw-z-[100]"
      ref={dropdownRef}
      style={{ left: 0, top: 0 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            ref={listRef}
            role="menu"
            tabIndex={-1}
            className="tw-mt-2 tw-w-72 tw-rounded-lg tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-white/10 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tw-max-h-80 tw-overflow-y-auto tw-overflow-x-hidden">
              <ul className="tw-flex tw-flex-col tw-gap-0.5 tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                {children}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
