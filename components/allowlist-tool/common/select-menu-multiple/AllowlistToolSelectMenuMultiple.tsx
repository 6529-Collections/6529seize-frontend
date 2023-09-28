import { useEffect, useRef, useState } from "react";
import { motion, useAnimate } from "framer-motion";
import { useClickAway, useKeyPressEvent } from "react-use";
import AllowlistToolAnimationWrapper from "../animation/AllowlistToolAnimationWrapper";
import AllowlistToolSelectMenuMultipleList from "./AllowlistToolSelectMenuMultipleList";

export interface AllowlistToolSelectMenuMultipleOption {
  title: string;
  subTitle: string | null;
  value: string;
}

export default function AllowlistToolSelectMenuMultiple({
  label,
  placeholder,
  selectedOptions,
  toggleSelectedOption,
  options,
  allSelectedTitle,
  someSelectedTitleSuffix,
}: {
  label: string;
  placeholder: string;
  selectedOptions: AllowlistToolSelectMenuMultipleOption[];
  toggleSelectedOption: (option: AllowlistToolSelectMenuMultipleOption) => void;
  options: AllowlistToolSelectMenuMultipleOption[];
  allSelectedTitle: string;
  someSelectedTitleSuffix: string;
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

  const onSelect = (option: AllowlistToolSelectMenuMultipleOption) => {
    toggleSelectedOption(option);
  };

  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const [title, setTitle] = useState("");

  useEffect(
    () =>
      setTitle(
        !selectedOptions.length
          ? placeholder
          : selectedOptions.length === 1
          ? selectedOptions.at(0)!?.title
          : selectedOptions.length === options.length
          ? allSelectedTitle
          : `${selectedOptions.length} ${someSelectedTitleSuffix}`
      ),
    [
      selectedOptions,
      placeholder,
      options,
      allSelectedTitle,
      someSelectedTitleSuffix,
    ]
  );

  return (
    <div ref={listRef}>
      <label
        id="listbox-label"
        className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100"
      >
        {label}
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
          }}
        >
          <span className="tw-block tw-truncate">{title}</span>
          <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3.5">
            <svg
              ref={iconScope}
              className="tw-h-5 tw-w-5 tw-text-zinc-400"
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
              className="tw-origin-top-right tw-absolute tw-right-0 tw-mt-1 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-neutral-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <AllowlistToolSelectMenuMultipleList
                options={options}
                toggleSelectedOption={onSelect}
                selectedOptions={selectedOptions}
              />
            </motion.div>
          )}
        </AllowlistToolAnimationWrapper>
      </div>
    </div>
  );
}
