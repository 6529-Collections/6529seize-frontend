"use client";

import React, { useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import BrainLeftSidebarSearchWaveDropdown from "../search-wave/BrainLeftSidebarSearchWaveDropdown";

interface WebBrainLeftSidebarSearchWaveProps {
  readonly listType: "waves" | "messages";
}

const WebBrainLeftSidebarSearchWave: React.FC<WebBrainLeftSidebarSearchWaveProps> = ({
  listType,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const onFocusChange = (newV: boolean) => {
    if (newV) {
      setIsOpen(true);
    }
  };

  const [searchCriteria, setSearchCriteria] = useState<string>("");

  const onSearchCriteriaChange = (newV: string | null) => {
    setSearchCriteria(newV ?? "");
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickAway(wrapperRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const handleClose = () => {
    setIsOpen(false);
    setSearchCriteria("");
  };

  return (
    <div className="tw-relative" ref={wrapperRef}>
      <svg
        className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3 sm:tw-top-2.5 tw-h-5 tw-w-5 tw-text-iron-300"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
          clipRule="evenodd"></path>
      </svg>
      <input
        type="text"
        id="web-brain-left-sidebar-search-wave"
        className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pl-12 tw-pr-4 tw-text-iron-50 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-400 focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-text-sm sm:tw-leading-6 tw-bg-iron-800 tw-font-normal"
        placeholder={`Search ${listType === "waves" ? "waves" : "messages"}...`}
        autoComplete="off"
        value={searchCriteria}
        onChange={(e) => onSearchCriteriaChange(e.target.value)}
        onFocus={() => onFocusChange(true)}
      />
      <BrainLeftSidebarSearchWaveDropdown
        open={isOpen}
        searchCriteria={searchCriteria}
        onClose={handleClose}
        listType={listType}
      />
    </div>
  );
};

export default WebBrainLeftSidebarSearchWave;