"use client";

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
      animateIcon(iconScope.current, { rotate: 0 });
    } else {
      animateIcon(iconScope.current, { rotate: -90 });
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
      <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
        Select window length
      </label>
      <div className="tw-relative tw-mt-1.5">
        <button
          type="button"
          className="tw-relative tw-flex tw-items-center tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3.5 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-neutral-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby="listbox-label"
          onClick={(e) => {
            e.stopPropagation();
            toggleOpen();
          }}>
          <span className="tw-block tw-truncate">{title}</span>
          <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3.5">
            <svg
              ref={iconScope}
              className="tw-h-5 tw-w-5 tw-text-zinc-400"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
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
              className="tw-origin-top-right tw-absolute tw-right-0 tw-mt-1 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-neutral-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}>
              <div className="tw-rounded-lg tw-overflow-hidden">
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
