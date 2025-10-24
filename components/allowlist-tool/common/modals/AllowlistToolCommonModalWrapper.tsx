"use client";

import React, { useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import AllowlistToolAnimationOpacity from "../animation/AllowlistToolAnimationOpacity";
import AllowlistToolAnimationWrapper from "../animation/AllowlistToolAnimationWrapper";
import { createPortal } from "react-dom";

export enum AllowlistToolModalSize {
  SMALL = "SMALL",
  LARGE = "LARGE",
  X_LARGE = "X_LARGE",
}

interface AllowlistToolCommonModalWrapperProps {
  readonly children: React.ReactNode;
  readonly showModal: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly modalSize?: AllowlistToolModalSize;
  readonly showTitle?: boolean;
}

export default function AllowlistToolCommonModalWrapper({
  children,
  showModal,
  onClose,
  title,
  modalSize = AllowlistToolModalSize.SMALL,
  showTitle = true,
}: AllowlistToolCommonModalWrapperProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, () => onClose());
  useKeyPressEvent("Escape", () => onClose());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const modalSizeClasses: Record<AllowlistToolModalSize, string> = {
    [AllowlistToolModalSize.SMALL]: "sm:tw-max-w-lg",
    [AllowlistToolModalSize.LARGE]: "sm:tw-max-w-xl",
    [AllowlistToolModalSize.X_LARGE]: "sm:tw-max-w-2xl",
  };

  const modalSizeClass = modalSizeClasses[modalSize];

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <AllowlistToolAnimationWrapper mode="sync" initial={true}>
      {showModal && (
        <AllowlistToolAnimationOpacity
          key="modal"
          elementClasses="tailwind-scope tw-fixed tw-inset-0 tw-z-[1000]"
          elementRole="dialog"
          onClicked={(e) => e.stopPropagation()}>
          <div className="tw-relative tw-flex tw-h-full tw-w-full">
            <div className="tw-absolute tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px]" />
            <div className="tw-relative tw-flex tw-min-h-full tw-w-full tw-items-start tw-justify-center tw-overflow-y-auto tw-px-4 tw-pt-10 tw-pb-20 tw-text-center sm:tw-px-0">
              <div
                ref={modalRef}
                className={`tw-relative tw-w-full tw-transform tw-rounded-lg tw-bg-neutral-900 tw-text-left tw-shadow-xl tw-transition-all sm:tw-my-8 sm:tw-w-full ${modalSizeClass}`}>
                {showTitle && (
                  <div className="tw-absolute tw-right-4 tw-top-6 tw-flex tw-justify-between tw-items-center">
                    <p className="tw-max-w-sm tw-text-lg tw-text-white tw-font-medium tw-mb-0">
                      {title}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                      type="button"
                      className="tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-neutral-900 tw-border-0 tw-text-neutral-400 hover:tw-text-neutral-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out">
                      <span className="sr-only tw-text-sm">Close</span>
                      <svg
                        className="tw-h-6 tw-w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                {children}
              </div>
            </div>
          </div>
        </AllowlistToolAnimationOpacity>
      )}
    </AllowlistToolAnimationWrapper>,
    document.body
  );
}
