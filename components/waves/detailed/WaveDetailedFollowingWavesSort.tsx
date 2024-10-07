import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { WavesOverviewType } from "../../../generated/models/WavesOverviewType";

interface WaveDetailedFollowingWavesSortProps {
  readonly selectedOption: WavesOverviewType;
  readonly setSelectedOption: (option: WavesOverviewType) => void;
}

const WaveDetailedFollowingWavesSort: React.FC<
  WaveDetailedFollowingWavesSortProps
> = ({ selectedOption, setSelectedOption }) => {
  const LABELS: Record<WavesOverviewType, string> = {
    [WavesOverviewType.Latest]: "Latest",
    [WavesOverviewType.MostSubscribed]: "Most Subscribed",
    [WavesOverviewType.HighLevelAuthor]: "High Level Author",
    [WavesOverviewType.AuthorYouHaveRepped]: "Author You Have Repped",
    [WavesOverviewType.MostDropped]: "Most Dropped",
    [WavesOverviewType.MostDroppedByYou]: "Most Dropped By You",
    [WavesOverviewType.RecentlyDroppedTo]: "Recently Dropped",
    [WavesOverviewType.RecentlyDroppedToByYou]: "Recently Dropped By You",
  };
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOptionSelect = (option: WavesOverviewType) => {
    setSelectedOption(option);
      setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="tw-relative" ref={dropdownRef}>
      <div className="tw-group">
        <button
          type="button"
          onClick={toggleDropdown}
          className="tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-justify-between tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400 hover:tw-text-primary-400 tw-bg-iron-950 tw-rounded-lg focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-border-primary-400 tw-transition-colors tw-duration-300 tw-ease-out tw-px-2 tw-py-2 -tw-ml-2"
        >
          <span>{LABELS[selectedOption] || "Sort by"}</span>
          <svg
            className="tw-size-4 tw-flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="tw-absolute tw-z-10 tw-w-56 tw-right-0 tw-bottom-full tw-mb-1 tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-lg tw-shadow-lg tw-shadow-iron-950/50"
            >
              <div className="tw-py-2 tw-px-2 tw-space-y-1.5">
                {Object.values(WavesOverviewType).map((option) => (
                  <div
                    key={option}
                    onClick={() => handleOptionSelect(option)}
                    className={`tw-px-4 tw-py-2 tw-text-xs tw-rounded-xl tw-transition-colors tw-duration-300 tw-cursor-pointer tw-whitespace-nowrap ${
                      selectedOption === option
                        ? "tw-text-iron-100 tw-bg-iron-700"
                        : "tw-text-iron-200 hover:tw-bg-iron-800 hover:tw-text-iron-100"
                    }`}
                  >
                    {LABELS[option]}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WaveDetailedFollowingWavesSort;
