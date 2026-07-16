"use client";

import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { useId, useRef, useState } from "react";
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
  const toggleOpen = () => setIsOpen((open) => !open);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => {
    if (isOpen) {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  });

  const onClassification = (value: ApiProfileClassification) => {
    onSelect(value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const classifications = Object.values(ApiProfileClassification);
  const title = CLASSIFICATIONS[selected].title;
  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const optionsId = `${id}-options`;

  return (
    <div className="tw-relative tw-max-w-full" ref={listRef}>
      <div
        id={labelId}
        className="tw-block tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-200"
      >
        Profile classification
      </div>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? optionsId : undefined}
        className="tw-mt-2 tw-flex tw-w-full tw-items-center tw-justify-between tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-left tw-text-base tw-font-normal tw-text-iron-50 tw-shadow-inner tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-200 tw-ease-out hover:tw-ring-white/15 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400/60"
      >
        <span id={valueId}>{title}</span>
        <svg
          className={`tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300 tw-transition-transform tw-duration-200 ${
            isOpen ? "tw-rotate-0" : "-tw-rotate-90"
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
      </button>

      <LazyMotion features={domAnimation}>
        <AnimatePresence mode="wait" initial={false}>
          {isOpen && (
            <m.div
              className="tw-absolute tw-right-0 tw-z-30 tw-mt-2 tw-w-full tw-origin-top-right tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-shadow-2xl tw-shadow-black/50"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="tw-max-h-[calc(280px_-_5vh)] tw-overflow-y-auto tw-overflow-x-hidden tw-p-1.5 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
                <ul
                  id={optionsId}
                  className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-p-0"
                >
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
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
}
