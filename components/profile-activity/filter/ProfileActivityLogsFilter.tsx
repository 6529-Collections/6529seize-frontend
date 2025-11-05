"use client";

import { PROFILE_ACTIVITY_TYPE_TO_TEXT } from "@/entities/IProfile";
import { ProfileActivityLogType } from "@/enums";
import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import ProfileActivityLogsFilterList from "./ProfileActivityLogsFilterList";

export default function ProfileActivityLogsFilter({
  user,
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
  const [iconScope, animateIcon] = useAnimate();
  const toggleOpen = () => setIsOpen(!isOpen);
  useEffect(() => {
    if (isOpen) {
      animateIcon(iconScope.current, { rotate: 0 });
    } else {
      animateIcon(iconScope.current, { rotate: -90 });
    }
  }, [isOpen]);

  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));
  const [title, setTitle] = useState("Select");

  useEffect(() => {
    if (selected.length === 0) {
      setTitle("Select");
    } else if (selected.length === 1) {
      setTitle(PROFILE_ACTIVITY_TYPE_TO_TEXT[selected[0]]);
    } else {
      setTitle(`${selected.length} Selected`);
    }
  }, [selected]);

  return (
    <div className="tw-flex tw-w-full tw-space-x-4 tw-items-center">
      <div className="tw-w-full">
        <div
          ref={listRef}
          className={`${
            user ? "tw-px-4 sm:tw-px-6" : ""
          } tw-w-full sm:tw-max-w-xs`}
        >
          <div className="tw-relative">
            <button
              type="button"
              className="tw-flex tw-items-center tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-px-3.5 tw-bg-iron-900 tw-text-iron-50 tw-font-light tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-950 focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-iron-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              onClick={(e) => {
                e.stopPropagation();
                toggleOpen();
              }}
            >
              <span className="tw-block tw-truncate tw-text-iron-400 tw-font-normal tw-text-base">
                {title}
              </span>
              <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3.5">
                <svg
                  ref={iconScope}
                  className="tw-h-5 tw-w-5 tw-text-iron-200"
                  viewBox="0 0 24 24"
                  fill="none"
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
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProfileActivityLogsFilterList
                    selected={selected}
                    options={options}
                    setSelected={setSelected}
                    user={user}
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
