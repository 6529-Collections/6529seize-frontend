"use client";

import {
  DROPDOWN_FIELD_CLASSES,
  DROPDOWN_CHEVRON_CLASSES,
} from "@/components/utils/select/dropdown/dropdownTriggerStyles";

import { PROFILE_ACTIVITY_TYPE_TO_TEXT } from "@/entities/IProfile";
import type { ProfileActivityLogType } from "@/types/enums";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useMemo, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import ProfileActivityLogsFilterList from "./ProfileActivityLogsFilterList";

export default function ProfileActivityLogsFilter({
  user: _user,
  selected,
  options,
  setSelected,
}: {
  readonly user: string | null;
  readonly selected: ProfileActivityLogType[];
  readonly options: ProfileActivityLogType[];
  readonly setSelected: (selected: ProfileActivityLogType) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const listId = useId();
  const toggleOpen = () => setIsOpen((current) => !current);

  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => {
    if (!isOpen) {
      return;
    }

    setIsOpen(false);
    triggerRef.current?.focus();
  });
  const title = useMemo(() => {
    if (selected.length === 0) {
      return "Select";
    }

    if (selected.length === 1) {
      return PROFILE_ACTIVITY_TYPE_TO_TEXT[selected[0]!];
    }

    return `${selected.length} Selected`;
  }, [selected]);

  return (
    <div className="tw-flex tw-w-full tw-items-center tw-space-x-4">
      <div className="tw-w-full">
        <div ref={listRef} className="tw-w-full">
          <div className="tw-relative">
            <button
              ref={triggerRef}
              type="button"
              aria-label={`Filter activity types: ${title}`}
              aria-expanded={isOpen}
              aria-controls={isOpen ? listId : undefined}
              className={`${DROPDOWN_FIELD_CLASSES} tw-group tw-flex tw-min-h-11 tw-w-full tw-items-center tw-px-3.5 tw-py-2.5`}
              onClick={(e) => {
                e.stopPropagation();
                toggleOpen();
              }}
            >
              <span className="tw-block tw-truncate tw-text-sm">{title}</span>
              <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3.5">
                <svg
                  className={`${DROPDOWN_CHEVRON_CLASSES} tw-transition-transform tw-duration-150 motion-reduce:tw-transition-none ${
                    isOpen ? "tw-rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <AnimatePresence mode="wait" initial={false}>
              {isOpen && (
                <motion.div
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -6 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -6 }
                  }
                  transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                >
                  <ProfileActivityLogsFilterList
                    id={listId}
                    selected={selected}
                    options={options}
                    setSelected={setSelected}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
