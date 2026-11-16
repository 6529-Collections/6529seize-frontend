"use client";

import {
  DROPDOWN_TRIGGER_CLASSES,
  DROPDOWN_CHEVRON_CLASSES,
} from "@/components/utils/select/dropdown/dropdownTriggerStyles";

import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { useId, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import UserSettingsClassificationItem from "./UserSettingsClassificationItem";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { CLASSIFICATIONS } from "@/entities/IProfile";
import clsx from "clsx";

export default function UserSettingsClassification({
  selected,
  onSelect,
  inlineOptions,
  compact = false,
}: {
  readonly compact?: boolean;
  readonly selected: ApiProfileClassification;
  readonly onSelect: (selected: ApiProfileClassification) => void;
  readonly inlineOptions?: boolean | undefined;
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
        className={`tw-block tw-text-sm tw-font-medium tw-leading-5 ${compact ? "tw-text-iron-100" : "tw-text-iron-200"}`}
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
        className={`${DROPDOWN_TRIGGER_CLASSES} tw-mt-2 tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-text-left ${compact ? "tw-min-h-11 tw-px-3 tw-py-2.5 tw-text-base sm:tw-text-sm" : "tw-px-4 tw-py-3 tw-text-base"}`}
      >
        <span id={valueId}>{title}</span>
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
      </button>

      <LazyMotion features={domAnimation}>
        <AnimatePresence mode="wait" initial={false}>
          {isOpen && (
            <m.div
              className={clsx(
                "tw-right-0 tw-z-30 tw-mt-2 tw-w-full tw-origin-top-right tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-shadow-2xl tw-shadow-black/50",
                inlineOptions ? "tw-relative" : "tw-absolute",
                compact && !inlineOptions && "tw-top-full"
              )}
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
