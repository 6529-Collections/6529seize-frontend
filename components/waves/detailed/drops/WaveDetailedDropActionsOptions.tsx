import React, { useRef, useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import { useClickAway, useKeyPressEvent } from "react-use";
import { AnimatePresence, motion } from "framer-motion";
import DropsListItemDeleteDrop from "../../../drops/view/item/options/delete/DropsListItemDeleteDrop";

interface WaveDetailedDropActionsOptionsProps {
  drop: Drop;
}

const WaveDetailedDropActionsOptions: React.FC<
  WaveDetailedDropActionsOptionsProps
> = ({ drop }) => {
  const listRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  return (
    <div className="tw-relative" ref={listRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="tw-text-iron-500 icon tw-px-2 tw-py-1 tw-group tw-bg-transparent tw-rounded-full tw-border-0 tw-inline-flex tw-items-center tw-gap-x-2 tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
          />
        </svg>
      </button>
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            className="tw-absolute tw-right-0 tw-z-10 tw-mt-2 tw-w-40 tw-origin-top-right tw-rounded-lg tw-bg-iron-900 tw-py-2 tw-shadow-lg tw-ring-1 tw-ring-white/10 tw-focus:tw-outline-none"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu-0-button"
            tabIndex={-1}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <DropsListItemDeleteDrop drop={drop} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WaveDetailedDropActionsOptions;
