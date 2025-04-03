import React from "react";

interface DropdownToggleButtonProps {
  readonly label: string;
  readonly onToggle: () => void;
}

const DropdownToggleButton: React.FC<DropdownToggleButtonProps> = ({
  label,
  onToggle,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-justify-between tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400 hover:tw-text-primary-400 tw-bg-iron-950 tw-rounded-lg focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-border-primary-400 tw-transition-colors tw-duration-300 tw-ease-out tw-px-2 tw-py-2 -tw-ml-2"
    >
      <span>{label}</span>
      <svg
        className="tw-size-4 tw-flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </button>
  );
};

export default DropdownToggleButton;