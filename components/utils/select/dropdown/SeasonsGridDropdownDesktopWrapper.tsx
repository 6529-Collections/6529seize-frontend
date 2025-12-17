"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";

export default function SeasonsGridDropdownDesktopWrapper({
  isOpen,
  setOpen,
  buttonRef,
  children,
}: {
  readonly isOpen: boolean;
  readonly setOpen: (isOpen: boolean) => void;
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
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
    if (!isOpen) return;
    if (!buttonRef.current || !dropdownRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownEl = dropdownRef.current;

    const width = listRef.current?.offsetWidth ?? dropdownEl.offsetWidth ?? 288;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const top = buttonRect.bottom + scrollY;

    let left = buttonRect.left + scrollX;

    if (buttonRect.left + width > window.innerWidth - 16) {
      left = buttonRect.right + scrollX - width;
    }

    left = Math.max(16, left);

    dropdownEl.style.top = `${top}px`;
    dropdownEl.style.left = `${left}px`;
  }, [isOpen, buttonRef]);

  useLayoutEffect(() => {
    position();
  }, [position]);

  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => position();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [isOpen, position]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="tw-absolute tw-z-[100]"
      ref={dropdownRef}
      style={{ left: 0, top: 0 }}>
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            ref={listRef}
            role="menu"
            tabIndex={-1}
            className="tw-mt-2 tw-w-72 tw-rounded-lg tw-bg-iron-900 tw-p-2 tw-shadow-lg tw-ring-1 tw-ring-white/10 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}>
            <div className="tw-grid tw-grid-cols-4 tw-gap-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
