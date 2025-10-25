"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { useClickAway, useKeyPressEvent } from "react-use";

function calculateDropdownLeft(
  buttonRight: number,
  dropdownWidth: number,
  offsetParentLeft: number
): number {
  const referenceRight = buttonRight - offsetParentLeft;
  return Math.max(0, referenceRight - dropdownWidth);
}

export default function CommonDropdownItemsDefaultWrapper<T>({
  isOpen,
  setOpen,
  buttonRef,
  buttonPosition,
  dynamicPosition = true,
  children,
}: {
  readonly isOpen: boolean;
  readonly setOpen: (isOpen: boolean) => void;
  readonly buttonRef: RefObject<HTMLButtonElement | HTMLDivElement | null>;
  readonly buttonPosition?: { readonly right: number };
  readonly dynamicPosition?: boolean;
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

  const buttonRight = buttonPosition?.right ?? null;

  const position = useCallback(() => {
    if (!dynamicPosition) return;
    if (!isOpen) return;
    const el = dropdownRef.current;
    const width = listRef.current?.offsetWidth ?? el?.offsetWidth ?? 0;
    if (el && typeof buttonRight === "number") {
      const offsetParent = el.offsetParent;
      const offsetLeft =
        offsetParent instanceof HTMLElement
          ? offsetParent.getBoundingClientRect().left
          : 0;
      const left = calculateDropdownLeft(buttonRight, width, offsetLeft);
      el.style.left = `${left}px`;
    }
  }, [dynamicPosition, isOpen, buttonRight]);

  useLayoutEffect(() => {
    position();
  }, [position]);

  useEffect(() => {
    if (!dynamicPosition || !isOpen) return;
    const onResize = () => position();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [dynamicPosition, isOpen, position]);

  return (
    <div className="tw-absolute tw-z-50" ref={dropdownRef}>
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            ref={listRef}
            role="menu"
            tabIndex={-1}
            className="tw-mt-2 tw-w-72 tw-rounded-lg tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-white/10 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}>
            <div className="tw-max-h-80 tw-overflow-y-auto tw-overflow-x-hidden">
              <ul className="tw-flex tw-flex-col tw-gap-0.5 tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                {children}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
