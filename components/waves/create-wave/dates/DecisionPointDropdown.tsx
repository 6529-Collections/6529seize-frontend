"use client";

import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faCheck } from "@fortawesome/free-solid-svg-icons";
import { Period } from "../../../../helpers/Types";
import { useAnimate } from "framer-motion";

interface DecisionPointDropdownProps {
  readonly value: Period;
  readonly onChange: (value: Period) => void;
}

export default function DecisionPointDropdown({
  value,
  onChange,
}: DecisionPointDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [iconScope, animateIcon] = useAnimate();

  const options = [
    { value: Period.WEEKS, label: "Weeks" },
    { value: Period.DAYS, label: "Days" },
    { value: Period.HOURS, label: "Hours" },
  ];

  const selectedOption =
    options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (isOpen) {
      animateIcon(iconScope.current, { rotate: 180 });
    } else {
      animateIcon(iconScope.current, { rotate: 0 });
    }
  }, [isOpen, animateIcon]);

  const handleSelect = (option: (typeof options)[0]) => {
    onChange(option.value);
    setIsOpen(false);
  };

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

  return (
    <div className="tw-relative tw-w-full" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        onClick={() => setIsOpen(!isOpen)}
        className="tw-flex tw-items-center tw-justify-between tw-w-full tw-bg-iron-800 lg:tw-bg-iron-900 tw-border-0 tw-rounded-r-lg tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-iron-300 tw-px-3 tw-py-4 tw-text-sm tw-transition tw-duration-300 tw-ease-out">
        <span>{selectedOption.label}</span>
        <div className="tw-pointer-events-none tw-flex tw-items-center">
          <FontAwesomeIcon
            ref={iconScope}
            icon={faChevronDown}
            className="tw-ml-2 tw-size-4 tw-transition-transform tw-duration-200"
          />
        </div>
      </button>

      {isOpen && (
        <div className="tw-absolute tw-z-10 tw-mt-1 tw-w-full tw-bg-iron-800 tw-border tw-border-iron-700 tw-rounded-lg tw-shadow-lg">
          <ul className="tw-list-none tw-mb-0 tw-py-2 tw-px-2">
            {options.map((option) => (
              <li key={option.value} className="tw-h-full">
                <button
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="tw-flex tw-items-center tw-justify-between tw-w-full tw-px-3 tw-py-2.5 tw-text-sm tw-text-left hover:tw-bg-iron-700 tw-bg-transparent tw-border-none tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                  <div className="tw-flex tw-items-center">
                    <span className="tw-text-sm tw-font-medium tw-text-white">
                      {option.label}
                    </span>
                  </div>
                  {option.value === value && (
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
