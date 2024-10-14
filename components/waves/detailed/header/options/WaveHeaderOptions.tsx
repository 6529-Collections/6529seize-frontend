import { useRef, useState } from "react";
import { ApiWave } from "../../../../../generated/models/ApiWave";
import { useClickAway, useKeyPressEvent } from "react-use";
import { AnimatePresence, motion } from "framer-motion";
import WaveDelete from "./delete/WaveDelete";

export default function WaveHeaderOptions({ wave }: { readonly wave: ApiWave }) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useClickAway(listRef, () => setIsOptionsOpen(false));
  useKeyPressEvent("Escape", () => setIsOptionsOpen(false));
  return (
    <div className="tw-relative tw-z-20" ref={listRef}>
      <button
        type="button"
        className="tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-py-2.5 tw-px-2.5 tw-border-0 tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out"
        id="options-menu-0-button"
        aria-expanded="false"
        aria-haspopup="true"
        onClick={(e) => {
          e.stopPropagation();
          setIsOptionsOpen(!isOptionsOpen);
        }}
      >
        <span className="tw-sr-only">Open options</span>
        <svg
          className="tw-size-5 tw-flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
        </svg>
      </button>
      <AnimatePresence mode="wait" initial={false}>
        {isOptionsOpen && (
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
              <WaveDelete wave={wave} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
