"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { useClickAway, useKeyPressEvent } from "react-use";
import UserSettingsClassificationItem from "./UserSettingsClassificationItem";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { CLASSIFICATIONS } from "@/entities/IProfile";

export default function UserSettingsClassification({
  selected,
  onSelect,
}: {
  readonly selected: ApiProfileClassification;
  readonly onSelect: (selected: ApiProfileClassification) => void;
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
  });
  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const onClassification = (value: ApiProfileClassification) => {
    onSelect(value);
    setIsOpen(false);
  };

  const classifications = Object.values(ApiProfileClassification);
  const title = CLASSIFICATIONS[selected].title;

  return (
    <div className="tw-relative tw-max-w-full" ref={listRef}>
      <label className="tw-block tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-300">
        Profile classification
      </label>
      <div className="tw-relative tw-mt-2">
        <button
          type="button"
          onClick={toggleOpen}
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-3 tw-text-left tw-text-base tw-font-normal tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-400 hover:tw-ring-iron-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
        >
          <span className="tw-text-iron-50">{title}</span>
        </button>
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
          <svg
            ref={iconScope}
            className="tw-h-5 tw-w-5 tw-text-white"
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
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            className="tw-absolute tw-right-0 tw-z-10 tw-mt-1 tw-w-full tw-origin-top-right tw-rounded-lg tw-bg-iron-900 tw-shadow-xl tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tw-absolute tw-z-10 tw-mt-1 tw-w-full tw-max-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
              <div className="tw-flow-root tw-max-h-[calc(280px+_-5vh)] tw-overflow-y-auto tw-overflow-x-hidden tw-py-1 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
                <ul className="tw-mx-0 tw-mb-0 tw-flex tw-list-none tw-flex-col tw-px-2">
                  {classifications.map((classification) => (
                    <UserSettingsClassificationItem
                      key={classification}
                      classification={classification}
                      selected={selected}
                      onClassification={onClassification}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
