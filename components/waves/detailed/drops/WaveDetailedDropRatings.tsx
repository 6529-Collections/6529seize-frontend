import React, { useState, useEffect, useRef } from "react";
import { Drop } from "../../../../generated/models/Drop";
import Tippy from "@tippyjs/react";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { motion, AnimatePresence } from "framer-motion";

interface WaveDetailedDropRatingsProps {
  readonly drop: Drop;
}

const WaveDetailedDropRatings: React.FC<WaveDetailedDropRatingsProps> = ({
  drop,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

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
    <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2">
      <div className="tw-flex tw-items-center tw-gap-x-2">


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
              className="tw-p-0 tw-bg-transparent tw-border-0 tw-flex tw-items-center tw-gap-x-1.5 tw-text-iron-500 hover:tw-text-iron-50 tw-text-xs tw-font-normal"
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
                className="tw-absolute tw-bottom-full tw-right-0 tw-mb-2 tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-md tw-shadow-lg tw-z-10 tw-min-w-52 tw-max-w-72 tw-w-max"
              >
                <div className="tw-flex tw-flex-wrap tw-gap-x-1.5 tw-py-2 tw-px-2 tw-text-xs tw-text-iron-300">
                  <div className="tw-truncate tw-whitespace-nowrap">
                    <span className="tw-font-semibold">Artist:</span> Ragne,
                  </div>
                  <div className="tw-truncate tw-whitespace-nowrap">
                    <span className="tw-font-semibold">Age:</span> 22,
                  </div>
                  <div className="tw-truncate tw-whitespace-nowrap">
                    <span className="tw-font-semibold">Style:</span> Comics,
                  </div>
                  <div className="tw-truncate tw-whitespace-nowrap">
                    <span className="tw-font-semibold">Style:</span> Comics,
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-flex tw-items-center -tw-space-x-2">
          {drop.top_raters.map((rater) => (
            <Tippy
              key={rater.profile.id}
              content={
                <span className="tw-text-xs">
                  {rater.profile.handle} - {rater.rating}
                </span>
              }
            >
              {rater.profile.pfp ? (
                <img
                  src={getScaledImageUri(
                    rater.profile.pfp,
                    ImageScale.W_AUTO_H_50
                  )}
                  alt="Profile Picture"
                  className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black tw-bg-iron-700"
                />
              ) : (
                <div className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black tw-bg-iron-700" />
              )}
            </Tippy>
          ))}
        </div>
        <span className="tw-text-iron-500 tw-text-xs tw-font-normal">
          {formatNumberWithCommas(drop.raters_count)}{" "}
          {drop.raters_count === 1 ? "rater" : "raters"}
        </span>
        <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
      </div>
      <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-500 tw-text-xs tw-font-normal">
        {!!drop.rating && (
          <Tippy content={<span className="tw-text-xs">Total</span>}>
            <span>
              {formatNumberWithCommas(drop.rating)} <span>ratings</span>
            </span>
          </Tippy>
        )}
        {!!drop.context_profile_context?.rating && (
          <div
            className={`${
              drop.context_profile_context.rating > 0
                ? "tw-bg-green/20"
                : "tw-bg-red/20"
            } tw-ml-2 tw-rounded-full tw-h-4 tw-min-w-4 tw-flex tw-items-center tw-justify-center tw-transition tw-ease-out tw-duration-300`}
          >
            <Tippy
              content={<span className="tw-text-xs">Your given ratings</span>}
            >
              <span
                className={`${
                  drop.context_profile_context.rating > 0
                    ? "tw-text-green"
                    : "tw-text-error"
                }`}
              >
                {formatNumberWithCommas(drop.context_profile_context.rating)}
              </span>
            </Tippy>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaveDetailedDropRatings;
