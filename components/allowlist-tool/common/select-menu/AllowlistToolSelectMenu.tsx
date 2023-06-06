import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AllowlistToolSelectMenuList from "./AllowlistToolSelectMenuList";
import { useClickAway, useKeyPressEvent } from "react-use";

export interface AllowlistToolSelectMenuOption {
  title: string;
  subTitle: string | null;
  value: string;
}

export default function AllowlistToolSelectMenu({
  label,
  placeholder,
  selectedOption,
  setSelectedOption,
  options,
}: {
  label: string;
  placeholder: string;
  selectedOption: AllowlistToolSelectMenuOption | null;
  setSelectedOption: (option: AllowlistToolSelectMenuOption) => void;
  options: AllowlistToolSelectMenuOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen(!isOpen);
  const onSelect = (option: AllowlistToolSelectMenuOption) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const [title, setTitle] = useState("");

  useEffect(() => {
    if (selectedOption) {
      setTitle(selectedOption.title);
    } else {
      setTitle(placeholder);
    }
  }, [selectedOption, placeholder]);

  return (
    <div>
      <label
        id="listbox-label"
        className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100"
      >
        {label}
      </label>
      <div className="tw-relative tw-mt-2">
        <button
          type="button"
          className="tw-relative tw-flex tw-items-center tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-800 tw-text-white tw-font-light tw-caret-primary tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-800 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-focus tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby="listbox-label"
          onClick={(e) => {
            e.stopPropagation();
            toggleOpen();
          }}
        >
          <span className="tw-block tw-truncate">{title}</span>
          <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-2">
            <svg
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
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={listRef}
              className="tw-origin-top-right tw-absolute tw-right-0 tw-mt-2 tw-w-full tw-rounded-md tw-shadow-lg tw-bg-neutral-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <AllowlistToolSelectMenuList
                options={options}
                setSelectedOption={onSelect}
                selectedOption={selectedOption}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
