"use client";

import {
  getDropdownTriggerClasses,
  getDropdownMenuMetrics,
  DROPDOWN_CHEVRON_CLASSES,
} from "@/components/utils/select/dropdown/dropdownTriggerStyles";

import { PROFILE_ACTIVITY_TYPE_TO_TEXT } from "@/entities/IProfile";
import dynamic from "next/dynamic";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ProfileActivityLogType } from "@/types/enums";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useMemo, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import ProfileActivityLogsFilterList from "./ProfileActivityLogsFilterList";
import ProfileActivityLogsFilterListItem from "./ProfileActivityLogsFilterListItem";

const CommonDropdownItemsMobileWrapper = dynamic(
  () =>
    import("@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper")
);

export default function ProfileActivityLogsFilter({
  user: _user,
  selected,
  options,
  setSelected,
  inline = false,
}: {
  readonly user: string | null;
  readonly selected: ProfileActivityLogType[];
  readonly options: ProfileActivityLogType[];
  readonly setSelected: (selected: ProfileActivityLogType) => void;
  readonly inline?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobileLayoutViewport();
  const locale = useBrowserLocale();
  const prefersReducedMotion = useReducedMotion();
  const listId = useId();
  const toggleOpen = () => setIsOpen((current) => !current);

  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useClickAway(listRef, () => {
    // The sheet is portaled outside this ref and owns its dismissal.
    if (!isMobile) setIsOpen(false);
  });
  useKeyPressEvent("Escape", () => {
    if (!isOpen || isMobile) {
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
          <div className={inline ? "tw-static" : "tw-relative"}>
            <button
              ref={triggerRef}
              type="button"
              aria-label={t(locale, "profileActivity.filterTypesLabel", {
                title,
              })}
              aria-expanded={isOpen}
              aria-haspopup={isMobile ? "dialog" : undefined}
              aria-controls={isOpen && !isMobile ? listId : undefined}
              className={`${getDropdownTriggerClasses({ variant: "compact", metrics: getDropdownMenuMetrics("compact") })} tw-group tw-relative tw-flex tw-w-fit tw-max-w-full tw-items-center ${inline ? "" : "tw-ml-auto"}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleOpen();
              }}
            >
              <span className="tw-block tw-truncate">{title}</span>
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
            {isMobile ? (
              <CommonDropdownItemsMobileWrapper
                isOpen={isOpen}
                setOpen={setIsOpen}
                label={t(locale, "profileActivity.types")}
                hideOnDesktopHover={false}
              >
                {options.map((itemType) => (
                  <ProfileActivityLogsFilterListItem
                    key={itemType}
                    itemType={itemType}
                    selectedItems={selected}
                    setSelected={setSelected}
                  />
                ))}
              </CommonDropdownItemsMobileWrapper>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                {isOpen && (
                  <motion.div
                    className={
                      inline
                        ? "tw-absolute tw-inset-x-0 tw-top-full tw-z-20"
                        : undefined
                    }
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
                      fitContainer={inline}
                      id={listId}
                      selected={selected}
                      options={options}
                      setSelected={setSelected}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
