import { useState, useRef } from "react";
import Tippy from "@tippyjs/react";
import { AnimatePresence, motion } from "framer-motion";
import { DropMetadata } from "../../../../entities/IDrop";
import { useClickAway, useKeyPressEvent } from "react-use";

interface WaveDetailedDropMetadataProps {
  readonly metadata: DropMetadata[];
}

export default function WaveDetailedDropMetadata({
  metadata,
}: WaveDetailedDropMetadataProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useClickAway(dropdownRef, () => setIsDropdownOpen(false));
  useKeyPressEvent("Escape", () => setIsDropdownOpen(false));

  return (
    <div className="tw-relative" ref={dropdownRef}>
      <Tippy
        content={
          <div className="tw-text-center">
            <span className="tw-text-xs tw-font-normal tw-text-center tw-w-full tw-transition tw-duration-300 tw-ease-out">
              View metadata
            </span>
          </div>
        }
      >
        <button
          type="button"
          onClick={toggleDropdown}
          className="tw-p-0 tw-bg-transparent tw-border-0 tw-flex tw-items-center tw-gap-x-1.5 tw-text-iron-400 hover:tw-text-iron-500 tw-text-xs tw-font-normal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="tw-size-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
            />
          </svg>
        </button>
      </Tippy>
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="tw-absolute tw-bottom-full tw-right-0 tw-mb-2 tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-md tw-shadow-lg tw-z-10 tw-min-w-52 tw-max-w-72 tw-w-max"
          >
            <div className="tw-flex tw-flex-col tw-gap-y-1 tw-py-2 tw-px-2 tw-text-xs tw-text-iron-300">
              {metadata.map((item) => (
                <div key={item.data_key} className="tw-truncate">
                  <span className="tw-font-semibold">{item.data_key}:</span>{" "}
                  {item.data_value}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
