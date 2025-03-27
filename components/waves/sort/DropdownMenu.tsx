import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import DropdownOption from "./DropdownOption";

interface DropdownMenuProps<T> {
  readonly isOpen: boolean;
  readonly options: T[];
  readonly selectedOption: T;
  readonly getLabel: (option: T) => string;
  readonly onSelect: (option: T) => void;
}

function DropdownMenu<T>({
  isOpen,
  options,
  selectedOption,
  getLabel,
  onSelect,
}: DropdownMenuProps<T>): React.ReactElement {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="tw-absolute tw-z-20 tw-w-56 tw-left-0 lg:tw-right-0 tw-top-full tw-mb-1 tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-rounded-lg tw-shadow-lg tw-shadow-iron-950/50"
        >
          <div className="tw-py-2 tw-px-2 tw-space-y-1.5">
            {options.map((option) => (
              <DropdownOption
                key={getLabel(option)}
                label={getLabel(option)}
                isSelected={selectedOption === option}
                onClick={() => onSelect(option)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DropdownMenu;