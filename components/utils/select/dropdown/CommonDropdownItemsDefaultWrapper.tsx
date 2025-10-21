"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, RefObject, useEffect, useRef } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";

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
  readonly buttonPosition?: { readonly bottom: number; readonly right: number };
  readonly dynamicPosition?: boolean;
  readonly children: ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, (e) => {
    const target = e.target as Node | null;
    if (!buttonRef.current?.contains(target)) {
      setOpen(false);
    }
  });
  useKeyPressEvent("Escape", () => setOpen(false));

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dynamicPosition) return;
    if (buttonPosition?.right && dropdownRef.current) {
      const { right } = buttonPosition;
      const el = dropdownRef.current;
      const left = Math.max(0, right - el.offsetWidth);
      el.style.left = `${left}px`;
    }
  }, [buttonPosition, dropdownRef, dynamicPosition]);

  return (
    <div className="tw-absolute tw-z-50" ref={dropdownRef}>
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            ref={listRef}
            className="tw-mt-2 tw-w-72 tw-min-w-[12rem] tw-rounded-lg tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-white/10 focus:tw-outline-none"
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
