import React from "react";

interface DropdownOptionProps {
  readonly label: string;
  readonly isSelected: boolean;
  readonly onClick: () => void;
}

const DropdownOption: React.FC<DropdownOptionProps> = ({
  label,
  isSelected,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tw-border-0 tw-w-full tw-text-left tw-px-4 tw-py-2 tw-text-xs tw-rounded-xl tw-transition-colors tw-duration-300 tw-cursor-pointer tw-whitespace-nowrap ${
        isSelected
          ? "tw-text-iron-100 tw-bg-iron-700"
          : "tw-text-iron-200 hover:tw-bg-iron-800 hover:tw-text-iron-100 tw-bg-iron-900"
      }`}
    >
      {label}
    </button>
  );
};

export default DropdownOption;