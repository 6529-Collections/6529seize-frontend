import Tippy from "@tippyjs/react";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import React, { memo } from "react";
import StormButton from "./StormButton";
import useIsMobileDevice from "../../hooks/isMobileDevice";

interface CreateDropActionsProps {
  readonly isStormMode: boolean;
  readonly canAddPart: boolean;
  readonly submitting: boolean;
  readonly showOptions: boolean;
  readonly isRequiredMetadataMissing: boolean;
  readonly isRequiredMediaMissing: boolean;
  readonly handleFileChange: (files: File[]) => void;
  readonly onAddMetadataClick: () => void;
  readonly breakIntoStorm: () => void;
  readonly setShowOptions: (showOptions: boolean) => void;
}

const CreateDropActions: React.FC<CreateDropActionsProps> = memo(
  ({
    isStormMode,
    canAddPart,
    submitting,
    showOptions,
    isRequiredMediaMissing,
    isRequiredMetadataMissing,
    handleFileChange,
    onAddMetadataClick,
    breakIntoStorm,
    setShowOptions,
  }) => {
    const isMobile = useIsMobileDevice();

    const onSetShowIconsClick = () => {
      setShowOptions(true);
    };

    const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files: File[] = Array.from(e.target.files);
        handleFileChange(files);
      }
    };

    return (
      <LayoutGroup>
        <div className="tw-relative">
          <AnimatePresence mode="wait" initial={false}>
            {showOptions ? (
              <motion.div
                key="default-buttons"
                initial={{ width: "32px" }}
                animate={{ width: "auto" }}
                exit={{ width: "32px" }}
                transition={{ 
                  duration: 0.3,
                  ease: "easeInOut"
                }}
                className="tw-flex tw-items-center tw-gap-x-2 tw-overflow-hidden"
              >
                <Tippy
                  content={<span className="tw-text-xs">Add metadata</span>}
                  disabled={isMobile}
                >
                  <button
                    onClick={onAddMetadataClick}
                    className={`tw-flex-shrink-0 ${
                      isRequiredMetadataMissing
                        ? "tw-text-yellow"
                        : "tw-text-iron-400"
                    } tw-bg-iron-700 desktop-hover:hover:tw-bg-iron-700/80 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-transition tw-duration-300 tw-size-8 lg:tw-size-7 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-iron-500 tw-border-0`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="tw-flex-shrink-0 tw-size-5 lg:tw-size-4"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                      />
                    </svg>
                  </button>
                </Tippy>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="tw-flex tw-items-center tw-gap-x-2"
                >
                  <Tippy
                    content={<span className="tw-text-xs">Upload a file</span>}
                    disabled={isMobile}
                  >
                    <label
                      aria-label="Upload a file"
                      className={`tw-flex-shrink-0 ${
                        isRequiredMediaMissing
                          ? "tw-text-yellow"
                          : "tw-text-iron-400"
                      } tw-bg-iron-700 desktop-hover:hover:tw-bg-iron-700/70 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-transition tw-duration-300 tw-size-8 lg:tw-size-7 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-iron-500 tw-border-0 tw-cursor-pointer`}
                    >
                      <input
                        type="file"
                        className="tw-hidden"
                        accept="image/*,video/*,audio/*"
                        multiple
                        onChange={onFiles}
                      />
                      <svg
                        className="tw-flex-shrink-0 tw-size-5 lg:tw-size-4"
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
                    </label>
                  </Tippy>
                  <StormButton
                    isStormMode={isStormMode}
                    canAddPart={canAddPart}
                    submitting={submitting}
                    breakIntoStorm={breakIntoStorm}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <motion.button
                key="chevron-button"
                onClick={onSetShowIconsClick}
                className={`tw-flex-shrink-0 ${
                  isRequiredMetadataMissing || isRequiredMediaMissing
                    ? "tw-text-yellow"
                    : "tw-text-iron-400"
                } tw-bg-iron-700 desktop-hover:hover:tw-bg-iron-700/70 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-transition tw-duration-300 tw-size-7 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-iron-500 tw-border-0`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                  className="tw-size-4 tw-flex-shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    );
  }
);

CreateDropActions.displayName = "CreateDropActions";

export default CreateDropActions;
