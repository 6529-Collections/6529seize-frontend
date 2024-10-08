import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateDropInputOptionsProps {
  dropdownRef: React.RefObject<HTMLDivElement>;
  isRequiredMetadataMissing: boolean;
  isRequiredMediaMissing: boolean;
  submitting: boolean;
  toggleDropdown: () => void;
  isDropdownOpen: boolean;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddMetadataClick: () => void;
  setIsDropdownOpen: (isOpen: boolean) => void;
}

const CreateDropInputOptions: React.FC<CreateDropInputOptionsProps> = ({
  dropdownRef,
  isRequiredMetadataMissing,
  isRequiredMediaMissing,
  submitting,
  toggleDropdown,
  isDropdownOpen,
  handleFileChange,
  onAddMetadataClick,
  setIsDropdownOpen,
}) => {
  return (
    <div ref={dropdownRef}>
      <button
        className={`tw-flex tw-items-center tw-justify-center tw-p-2 tw-group tw-absolute tw-top-0.5 tw-right-2 tw-rounded-lg tw-border-none tw-bg-transparent tw-ease-out tw-transition tw-duration-300 ${
          isRequiredMetadataMissing || isRequiredMediaMissing
            ? "tw-text-yellow hover:tw-text-opacity-80"
            : "tw-text-iron-400 hover:tw-text-iron-50"
        } ${
          submitting
            ? "tw-opacity-50 tw-cursor-default"
            : "tw-cursor-pointer"
        }`}
        onClick={toggleDropdown}
        disabled={submitting}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className={`tw-size-6 tw-flex-shrink-0 ${submitting ? "tw-opacity-50" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </button>
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="tw-absolute tw-right-0 tw-bottom-10 tw-z-10 tw-w-40 tw-origin-bottom-right tw-rounded-lg tw-bg-iron-950 tw-py-2 tw-px-1 tw-shadow-lg tw-ring-1 tw-ring-white/10 tw-focus:tw-outline-none tw-space-y-1"
          >
            <label
              className={`tw-px-2 tw-py-1.5 tw-text-sm tw-flex tw-items-center tw-gap-x-2 ${
                isRequiredMediaMissing
                  ? "tw-text-yellow hover:tw-bg-[#FDB022]/50"
                  : "tw-text-iron-400 hover:tw-bg-primary-500 hover:tw-text-iron-50"
              } tw-rounded-md tw-cursor-pointer tw-transition-all tw-duration-300 tw-ease-out hover:tw-font-medium`}
            >
              <svg
                className="tw-flex-shrink-0 tw-h-5 tw-w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                aria-hidden="true"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              <input
                type="file"
                className="tw-hidden"
                accept="image/*,video/*,audio/*"
                multiple
                onChange={handleFileChange}
              />
              <span>Upload a file</span>
            </label>

            <button
              className={`tw-bg-transparent tw-border-none tw-px-2 tw-py-1.5 tw-text-sm tw-flex tw-items-center tw-gap-x-2 tw-w-full tw-text-left ${
                isRequiredMetadataMissing
                  ? "tw-text-yellow hover:tw-bg-[#FDB022]/40"
                  : "tw-text-iron-400 hover:tw-bg-primary-500 hover:tw-text-iron-50"
              } tw-rounded-md tw-cursor-pointer tw-transition-all tw-duration-300 tw-ease-out hover:tw-font-medium`}
              onClick={() => {
                onAddMetadataClick();
                setIsDropdownOpen(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="tw-flex-shrink-0 tw-h-5 tw-w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                />
              </svg>
              <span>Add metadata</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateDropInputOptions;