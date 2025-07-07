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
    if (e.target !== buttonRef.current) {
      setOpen(false);
    }
  });
  useKeyPressEvent("Escape", () => setOpen(false));

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dynamicPosition) return;
    if (buttonPosition?.right && dropdownRef.current) {
      const { right } = buttonPosition;
      dropdownRef.current.style.left = `${
        right - dropdownRef.current.offsetWidth
      }px`;
    }
  }, [buttonPosition, dropdownRef, dynamicPosition]);

  return (
    <div className="tw-absolute" ref={dropdownRef}>
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            className="tw-z-10 tw-mt-1 tw-min-w-[18rem] tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}>
            <div
              className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10"
              ref={listRef}>
              <div className="tw-py-1 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
                <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                  {children}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
