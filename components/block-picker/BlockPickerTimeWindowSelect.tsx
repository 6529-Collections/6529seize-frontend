"use client";

import { DROPDOWN_TRIGGER_CLASSES, DROPDOWN_CHEVRON_CLASSES } from "@/components/utils/select/dropdown/dropdownTriggerStyles";
import { BlockPickerTimeWindow } from "@/app/tools/block-finder/page.client";
import { motion, useAnimate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import AllowlistToolAnimationWrapper from "../allowlist-tool/common/animation/AllowlistToolAnimationWrapper";
import BlockPickerTimeWindowSelectList from "./BlockPickerTimeWindowSelectList";

export default function BlockPickerTimeWindowSelect({
  timeWindow,
  setTimeWindow,
}: {
  timeWindow: BlockPickerTimeWindow;
  setTimeWindow: (timeWindow: BlockPickerTimeWindow) => void;
}) {
  const options: {
    readonly title: string;
    readonly value: BlockPickerTimeWindow;
  }[] = [
    { title: "None", value: BlockPickerTimeWindow.NONE },
    { title: "1 minute", value: BlockPickerTimeWindow.ONE_MINUTE },
    { title: "5 minutes", value: BlockPickerTimeWindow.FIVE_MINUTES },
    { title: "10 minutes", value: BlockPickerTimeWindow.TEN_MINUTES },
    { title: "30 minutes", value: BlockPickerTimeWindow.HALF_HOUR },
    { title: "1 hour", value: BlockPickerTimeWindow.ONE_HOUR },
    { title: "2 hours", value: BlockPickerTimeWindow.TWO_HOURS },
    { title: "4 hours", value: BlockPickerTimeWindow.FOUR_HOURS },
    { title: "6 hours", value: BlockPickerTimeWindow.SIX_HOURS },
    { title: "12 hours", value: BlockPickerTimeWindow.TWELVE_HOURS },
    { title: "1 day", value: BlockPickerTimeWindow.ONE_DAY },
    { title: "2 days", value: BlockPickerTimeWindow.TWO_DAYS },
  ];
  const [isOpen, setIsOpen] = useState(false);
  const [iconScope, animateIcon] = useAnimate();
  const toggleOpen = () => setIsOpen(!isOpen);
  useEffect(() => {
    if (isOpen) {
      animateIcon(iconScope.current, { rotate: 180 });
    } else {
      animateIcon(iconScope.current, { rotate: 0 });
    }
  });
  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const [title, setTitle] = useState<string>(
    options.find((o) => o.value === timeWindow)?.title ?? "Select time window"
  );

  const onTimeWindowSelect = (tw: BlockPickerTimeWindow) => {
    setTitle(
      options.find((o) => o.value === tw)?.title ?? "Select time window"
    );
    setTimeWindow(tw);
    setIsOpen(false);
  };

  return (
    <div ref={listRef} className="tw-w-full">
      <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-300">
        Select window length
      </label>
      <div className="tw-relative tw-mt-1.5">
        <button
          type="button"
          className={`${DROPDOWN_TRIGGER_CLASSES} tw-relative tw-flex tw-w-full tw-items-center tw-px-3.5 tw-py-3 tw-pr-9 tw-text-base tw-caret-primary-400 sm:tw-leading-6`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby="listbox-label"
          onClick={(e) => {
            e.stopPropagation();
            toggleOpen();
          }}
        >
          <span className="tw-block tw-truncate">{title}</span>
          <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3.5">
            <svg
              ref={iconScope}
              className={DROPDOWN_CHEVRON_CLASSES}
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
        <AllowlistToolAnimationWrapper>
          {isOpen && (
            <motion.div
              className="tw-absolute tw-right-0 tw-z-20 tw-mt-1 tw-w-full tw-origin-top-right tw-rounded-lg tw-bg-iron-900 tw-shadow-xl tw-ring-1 tw-ring-iron-700/60"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="tw-overflow-hidden tw-rounded-lg">
                <BlockPickerTimeWindowSelectList
                  setTimeWindow={onTimeWindowSelect}
                  timeWindow={timeWindow}
                  options={options}
                />
              </div>
            </motion.div>
          )}
        </AllowlistToolAnimationWrapper>
      </div>
    </div>
  );
}
