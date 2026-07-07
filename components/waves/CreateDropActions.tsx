"use client";

import { publicEnv } from "@/config/env";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import React, { memo, useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import CreateDropGifPicker from "./CreateDropGifPicker";
import StormButton from "./StormButton";

interface CreateDropActionsProps {
  readonly isStormMode: boolean;
  readonly isDropMode: boolean;
  readonly canAddPart: boolean;
  readonly submitting: boolean;
  readonly showOptions: boolean;
  readonly animateOptions: boolean;
  readonly isRequiredMetadataMissing: boolean;
  readonly isRequiredMediaMissing: boolean;
  readonly canCreatePoll: boolean;
  readonly isPollActive: boolean;
  readonly handleFileChange: (files: File[]) => void;
  readonly onAddMetadataClick: () => void;
  readonly onTogglePoll: () => void;
  readonly breakIntoStorm: () => void;
  readonly setShowOptions: (showOptions: boolean) => void;
  readonly onGifDrop: (gif: string) => void;
}

const CreateDropActions: React.FC<CreateDropActionsProps> = memo(
  ({
    isStormMode,
    isDropMode,
    canAddPart,
    submitting,
    showOptions,
    animateOptions,
    isRequiredMediaMissing,
    isRequiredMetadataMissing,
    canCreatePoll,
    isPollActive,
    handleFileChange,
    onAddMetadataClick,
    onTogglePoll,
    breakIntoStorm,
    setShowOptions,
    onGifDrop,
  }) => {
    const isMobile = useIsMobileScreen();
    const gifPickerKey = publicEnv.GIPHY_API_KEY;
    const gifPickerEnabled = !!gifPickerKey;
    const [showGifPicker, setShowGifPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isUploadPickerOpen, setIsUploadPickerOpen] = useState(false);

    const onSetShowIconsClick = () => {
      setShowOptions(true);
    };

    const onUploadClick = () => {
      if (isUploadPickerOpen) {
        setIsUploadPickerOpen(false);
        return;
      }

      setIsUploadPickerOpen(true);
      fileInputRef.current?.click();
    };

    const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsUploadPickerOpen(false);
      if (e.target.files) {
        const files: File[] = Array.from(e.target.files);
        handleFileChange(files);
      }
      e.target.value = "";
    };

    useEffect(() => {
      if (!showGifPicker || !gifPickerEnabled) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowGifPicker(false);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showGifPicker, gifPickerEnabled]);

    useEffect(() => {
      if (!isUploadPickerOpen) {
        return;
      }

      const resetUploadPicker = () => setIsUploadPickerOpen(false);
      window.addEventListener("focus", resetUploadPicker, { once: true });

      return () => window.removeEventListener("focus", resetUploadPicker);
    }, [isUploadPickerOpen]);

    const optionMotionTransition = {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1],
    };

    const shellMotionProps = animateOptions
      ? {
          initial: false,
          animate: { width: showOptions ? "auto" : "32px" },
          transition: optionMotionTransition,
        }
      : {
          initial: false,
          animate: { width: showOptions ? "auto" : "32px" },
          transition: { duration: 0 },
        };

    const actionGroupMotionProps = animateOptions
      ? {
          initial: { opacity: 0, x: -4 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -4 },
          transition: optionMotionTransition,
        }
      : {
          initial: false,
          animate: { opacity: 1, x: 0 },
          transition: { duration: 0 },
        };

    const chevronMotionProps = animateOptions
      ? {
          initial: { opacity: 0, scale: 0.92 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.92 },
          transition: optionMotionTransition,
        }
      : {
          initial: false,
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0 },
        };

    const pollAction = canCreatePoll ? (
      <>
        <button
          type="button"
          aria-label={isPollActive ? "Remove poll" : "Add poll"}
          aria-pressed={isPollActive}
          onClick={onTogglePoll}
          className={`tw-flex tw-size-8 tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-transition tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 desktop-hover:hover:tw-bg-iron-700/70 lg:tw-size-7 ${
            isPollActive
              ? "tw-text-primary-200 tw-bg-primary-500/20"
              : "tw-bg-iron-700 tw-text-iron-300"
          }`}
          data-tooltip-id="add-poll-tooltip"
        >
          <ChartBarIcon
            className="tw-size-5 tw-flex-shrink-0 lg:tw-size-4"
            aria-hidden="true"
          />
        </button>
        {!isMobile && (
          <Tooltip
            id="add-poll-tooltip"
            place="top"
            offset={8}
            opacity={1}
            positionStrategy="fixed"
            style={TOOLTIP_STYLES}
          >
            <span className="tw-text-xs">
              {isPollActive ? "Remove poll" : "Add poll"}
            </span>
          </Tooltip>
        )}
      </>
    ) : null;

    return (
      <LayoutGroup>
        <div className="tw-relative">
          <motion.div
            data-testid="drop-actions-motion-shell"
            {...shellMotionProps}
            className="tw-relative tw-flex tw-h-8 tw-items-center tw-overflow-hidden"
          >
            <AnimatePresence mode="sync" initial={false}>
              {showOptions ? (
                <motion.div
                  key="default-buttons"
                  data-testid="drop-actions-expanded-motion"
                  {...actionGroupMotionProps}
                  className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-x-2 tw-overflow-hidden"
                >
                  {isDropMode && (
                    <>
                      <button
                        aria-label="Add metadata"
                        onClick={onAddMetadataClick}
                        className={`tw-flex-shrink-0 ${
                          isRequiredMetadataMissing
                            ? "tw-text-[#FEDF89]"
                            : "tw-text-iron-300"
                        } tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-700 tw-transition tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 desktop-hover:hover:tw-bg-iron-700/80 lg:tw-size-7`}
                        data-tooltip-id="add-metadata-tooltip"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="tw-size-5 tw-flex-shrink-0 lg:tw-size-4"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                          />
                        </svg>
                      </button>
                      {!isMobile && (
                        <Tooltip
                          id="add-metadata-tooltip"
                          place="top"
                          offset={8}
                          opacity={1}
                          positionStrategy="fixed"
                          style={TOOLTIP_STYLES}
                        >
                          <span className="tw-text-xs">Add metadata</span>
                        </Tooltip>
                      )}
                    </>
                  )}
                  <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-x-2">
                    <>
                      <button
                        type="button"
                        aria-label={
                          isUploadPickerOpen
                            ? "Close upload picker"
                            : "Upload a file"
                        }
                        onClick={onUploadClick}
                        className={`tw-flex-shrink-0 ${
                          isRequiredMediaMissing
                            ? "tw-text-[#FEDF89]"
                            : "tw-text-iron-300"
                        } tw-flex tw-size-8 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-700 tw-transition tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 desktop-hover:hover:tw-bg-iron-700/70 lg:tw-size-7`}
                        data-tooltip-id="upload-file-tooltip"
                      >
                        <FontAwesomeIcon
                          icon={faPlus}
                          aria-hidden="true"
                          className={`tw-size-5 tw-flex-shrink-0 tw-transform tw-transition-transform tw-duration-300 tw-ease-out lg:tw-size-4 ${
                            isUploadPickerOpen ? "tw-rotate-45" : "tw-rotate-0"
                          }`}
                        />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="tw-hidden"
                        accept="image/*,video/*,audio/*,application/pdf,text/csv,.pdf,.csv"
                        multiple
                        onChange={onFiles}
                      />
                      {!isMobile && (
                        <Tooltip
                          id="upload-file-tooltip"
                          place="top-start"
                          offset={8}
                          opacity={1}
                          positionStrategy="fixed"
                          style={TOOLTIP_STYLES}
                        >
                          <span className="tw-text-xs">Upload a file</span>
                        </Tooltip>
                      )}
                    </>
                    {gifPickerEnabled && (
                      <>
                        <button
                          onClick={() => setShowGifPicker(true)}
                          aria-label="Add GIF"
                          className={`tw-flex tw-size-8 tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-700 tw-text-iron-300 tw-transition tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 desktop-hover:hover:tw-bg-iron-700/70 lg:tw-size-7`}
                          data-tooltip-id="add-gif-tooltip"
                        >
                          <svg
                            className="tw-size-5 tw-flex-shrink-0"
                            viewBox="0 0 24 24"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                          >
                            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                            <g
                              id="SVGRepo_tracerCarrier"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            ></g>
                            <g id="SVGRepo_iconCarrier">
                              <g
                                stroke="none"
                                strokeWidth="1"
                                fill="none"
                                fillRule="evenodd"
                              >
                                <g
                                  id="ic_fluent_gif_24_filled"
                                  fill="currentColor"
                                  fillRule="nonzero"
                                >
                                  <path d="M18.75,3.50054297 C20.5449254,3.50054297 22,4.95561754 22,6.75054297 L22,17.2531195 C22,19.048045 20.5449254,20.5031195 18.75,20.5031195 L5.25,20.5031195 C3.45507456,20.5031195 2,19.048045 2,17.2531195 L2,6.75054297 C2,4.95561754 3.45507456,3.50054297 5.25,3.50054297 L18.75,3.50054297 Z M8.01459972,8.87193666 C6.38839145,8.87193666 5.26103525,10.2816525 5.26103525,11.9943017 C5.26103525,13.707564 6.38857781,15.1202789 8.01459972,15.1202789 C8.90237918,15.1202789 9.71768065,14.6931811 10.1262731,13.9063503 L10.2024697,13.7442077 L10.226,13.674543 L10.2440163,13.5999276 L10.2440163,13.5999276 L10.2516169,13.5169334 L10.2518215,11.9961937 L10.2450448,11.9038358 C10.2053646,11.6359388 9.99569349,11.4234501 9.72919932,11.3795378 L9.62682145,11.3711937 L8.62521827,11.3711937 L8.53286035,11.3779703 C8.26496328,11.4176506 8.05247466,11.6273217 8.00856234,11.8938159 L8.00021827,11.9961937 L8.00699487,12.0885517 C8.0466751,12.3564487 8.25634623,12.5689373 8.5228404,12.6128497 L8.62521827,12.6211937 L9.00103525,12.6209367 L9.00103525,13.3549367 L8.99484486,13.3695045 C8.80607251,13.6904125 8.44322427,13.8702789 8.01459972,13.8702789 C7.14873038,13.8702789 6.51103525,13.0713011 6.51103525,11.9943017 C6.51103525,10.9182985 7.14788947,10.1219367 8.01459972,10.1219367 C8.43601415,10.1219367 8.67582824,10.1681491 8.97565738,10.3121334 C9.28681641,10.4615586 9.6601937,10.3304474 9.80961888,10.0192884 C9.95904407,9.70812933 9.82793289,9.33475204 9.51677386,9.18532686 C9.03352891,8.95326234 8.61149825,8.87193666 8.01459972,8.87193666 Z M12.6289445,8.99393497 C12.3151463,8.99393497 12.0553614,9.22519285 12.0107211,9.52657705 L12.0039445,9.61893497 L12.0039445,14.381065 L12.0107211,14.4734229 C12.0553614,14.7748072 12.3151463,15.006065 12.6289445,15.006065 C12.9427427,15.006065 13.2025276,14.7748072 13.2471679,14.4734229 L13.2539445,14.381065 L13.2539445,9.61893497 L13.2471679,9.52657705 C13.2025276,9.22519285 12.9427427,8.99393497 12.6289445,8.99393497 Z M17.6221579,9.00083497 L15.6247564,8.99393111 C15.3109601,8.99285493 15.0503782,9.22321481 15.0046948,9.52444312 L14.9975984,9.61677709 L14.9975984,14.3649711 L15.0043751,14.4573291 C15.0440553,14.7252261 15.2537265,14.9377148 15.5202206,14.9816271 L15.6225985,14.9899711 L15.7149564,14.9831945 C15.9828535,14.9435143 16.1953421,14.7338432 16.2392544,14.467349 L16.2475985,14.3649711 L16.2470353,13.2499367 L17.37,13.2504012 L17.4623579,13.2436246 C17.730255,13.2039444 17.9427436,12.9942732 17.9866559,12.7277791 L17.995,12.6254012 L17.9882234,12.5330433 C17.9485432,12.2651462 17.738872,12.0526576 17.4723779,12.0087453 L17.37,12.0004012 L16.2470353,11.9999367 L16.2470353,10.2449367 L17.6178421,10.2508313 L17.7102229,10.2443727 C18.0117595,10.2007704 18.2439132,9.94178541 18.2450039,9.62798912 C18.24608,9.31419284 18.0157202,9.05361096 17.7144919,9.00793041 L17.6221579,9.00083497 L15.6247564,8.99393111 L17.6221579,9.00083497 Z"></path>
                                </g>
                              </g>
                            </g>
                          </svg>
                        </button>
                        {!isMobile && (
                          <Tooltip
                            id="add-gif-tooltip"
                            place="top"
                            offset={8}
                            opacity={1}
                            positionStrategy="fixed"
                            style={TOOLTIP_STYLES}
                          >
                            <span className="tw-text-xs">Add GIF</span>
                          </Tooltip>
                        )}
                      </>
                    )}
                    {pollAction}
                    <StormButton
                      isStormMode={isStormMode}
                      canAddPart={canAddPart}
                      submitting={submitting}
                      breakIntoStorm={breakIntoStorm}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="chevron-button"
                  data-testid="drop-actions-chevron-motion"
                  {...chevronMotionProps}
                  onClick={onSetShowIconsClick}
                  type="button"
                  aria-label="Show drop actions"
                  className={`tw-absolute tw-inset-y-0 tw-left-0 tw-my-auto tw-flex-shrink-0 ${
                    (isDropMode && isRequiredMetadataMissing) ||
                    isRequiredMediaMissing ||
                    isPollActive
                      ? "tw-text-[#FEDF89]"
                      : "tw-text-iron-400"
                  } tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-700 tw-transition tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 desktop-hover:hover:tw-bg-iron-700/70`}
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
          </motion.div>
        </div>
        {gifPickerEnabled && (
          <CreateDropGifPicker
            giphyApiKey={gifPickerKey}
            show={showGifPicker}
            setShow={setShowGifPicker}
            onSelect={(gif) => {
              onGifDrop(gif);
              setShowGifPicker(false);
            }}
          />
        )}
      </LayoutGroup>
    );
  }
);

CreateDropActions.displayName = "CreateDropActions";

export default CreateDropActions;
