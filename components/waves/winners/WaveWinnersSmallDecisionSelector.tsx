"use client";

import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useAnimate } from "framer-motion";

interface DecisionPoint {
  id: string;
  date: string;
  winnersCount?: number | undefined; // Optional count of winners
}

interface WaveWinnersSmallDecisionSelectorProps {
  readonly decisionPoints: DecisionPoint[];
  readonly activeDecisionPoint: string | null;
  readonly onChange: (decisionPointId: string) => void;
}

export const WaveWinnersSmallDecisionSelector: React.FC<
  WaveWinnersSmallDecisionSelectorProps
> = ({ decisionPoints, activeDecisionPoint, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [iconScope, animateIcon] = useAnimate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      animateIcon(iconScope.current, { rotate: 0 });
    } else {
      animateIcon(iconScope.current, { rotate: -90 });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getCurrentLabel = () => {
    const currentPoint = decisionPoints.find(
      (point) => point.id === activeDecisionPoint
    );
    if (!currentPoint) return "Select decision point";

    return `${format(new Date(currentPoint.date), "MMM d, yyyy h:mm a")}${
      currentPoint.winnersCount !== undefined
        ? ` (${currentPoint.winnersCount} winner${
            currentPoint.winnersCount !== 1 ? "s" : ""
          })`
        : ""
    }`;
  };

  return (
    <div className="tw-mt-2 tw-mb-3 tw-relative" ref={dropdownRef}>
      <button
        type="button"
        aria-haspopup="true"
        onClick={() => setIsOpen(!isOpen)}
        className="tw-w-full tw-text-sm tw-text-left tw-relative tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-py-2.5 tw-pl-3.5 tw-pr-10 tw-font-medium tw-text-iron-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-bg-iron-800/80 hover:tw-ring-iron-600 tw-transition tw-duration-300 tw-ease-out">
        {getCurrentLabel()}
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center -tw-mr-1 tw-pr-3.5">
          <svg
            ref={iconScope}
            className="tw-h-5 tw-w-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="tw-absolute tw-z-10 tw-mt-1 tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-lg tw-ring-1 tw-ring-iron-700 tw-max-h-60 tw-overflow-auto">
          <ul className="tw-py-1 tw-list-none tw-pl-0 tw-mb-0 tw-text-sm tw-text-iron-300">
            {decisionPoints.map((point) => (
              <li
                key={point.id}
                onClick={() => {
                  onChange(point.id);
                  setIsOpen(false);
                }}
                className={`tw-px-3 tw-py-2 tw-cursor-pointer hover:tw-bg-iron-700/50 tw-transition-colors tw-duration-150 tw-ease-out ${
                  point.id === activeDecisionPoint
                    ? "tw-bg-iron-700 tw-text-primary-400"
                    : ""
                }`}>
                {format(new Date(point.date), "MMM d, yyyy h:mm a")}
                {point.winnersCount !== undefined && (
                  <span className="tw-ml-1 tw-text-iron-400">
                    ({point.winnersCount} winner
                    {point.winnersCount !== 1 ? "s" : ""})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
