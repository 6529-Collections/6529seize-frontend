"use client";

import { useRef } from "react";

export default function UserSettingsBackground({
  bgColor1,
  bgColor2,
  setBgColor1,
  setBgColor2,
  compact = false,
}: {
  readonly compact?: boolean;
  readonly bgColor1: string;
  readonly bgColor2: string;
  readonly setBgColor1: (color: string) => void;
  readonly setBgColor2: (color: string) => void;
}) {
  const bgColor1Ref = useRef<HTMLInputElement>(null);
  const bgColor2Ref = useRef<HTMLInputElement>(null);

  const onBgColor1Click = () => {
    if (bgColor1Ref.current) {
      bgColor1Ref.current.click();
    }
  };

  const onBgColor2Click = () => {
    if (bgColor2Ref.current) {
      bgColor2Ref.current.click();
    }
  };

  return (
    <div
      className={
        compact
          ? "tw-grid tw-grid-cols-2 tw-gap-4"
          : "tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-6 md:tw-flex-nowrap"
      }
    >
      <div className="tw-w-full tw-cursor-pointer md:tw-flex-1">
        <label
          htmlFor="bgColor1"
          className="tw-block tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-300"
        >
          Background Color 1
        </label>
        <div className="tw-relative tw-mt-2">
          <input
            ref={bgColor1Ref}
            type="color"
            id="bgColor1"
            name="bgColor1"
            value={bgColor1}
            onChange={(e) => setBgColor1(e.target.value)}
            className="tw-block tw-h-12 tw-w-full tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-3 tw-pr-10 tw-text-base tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out hover:tw-ring-iron-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-leading-6"
          />
          <div
            onClick={onBgColor1Click}
            className="tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3"
          >
            <svg
              className="tw-h-4 tw-w-4 tw-text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 10L14 6M2.49997 21.5L5.88434 21.124C6.29783 21.078 6.50457 21.055 6.69782 20.9925C6.86926 20.937 7.03242 20.8586 7.18286 20.7594C7.35242 20.6475 7.49951 20.5005 7.7937 20.2063L21 7C22.1046 5.89543 22.1046 4.10457 21 3C19.8954 1.89543 18.1046 1.89543 17 3L3.7937 16.2063C3.49952 16.5005 3.35242 16.6475 3.24061 16.8171C3.1414 16.9676 3.06298 17.1307 3.00748 17.3022C2.94493 17.4954 2.92195 17.7021 2.87601 18.1156L2.49997 21.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="tw-w-full tw-cursor-pointer md:tw-flex-1">
        <label
          htmlFor="bgColor2"
          className="tw-block tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-300"
        >
          Background Color 2
        </label>
        <div className="tw-relative tw-mt-2">
          <input
            ref={bgColor2Ref}
            type="color"
            id="bgColor2"
            name="bgColor2"
            value={bgColor2}
            onChange={(e) => setBgColor2(e.target.value)}
            className="tw-block tw-h-12 tw-w-full tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-3 tw-pr-10 tw-text-base tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out hover:tw-ring-iron-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-leading-6"
          />
          <div
            onClick={onBgColor2Click}
            className="tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3"
          >
            <svg
              className="tw-h-4 tw-w-4 tw-text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 10L14 6M2.49997 21.5L5.88434 21.124C6.29783 21.078 6.50457 21.055 6.69782 20.9925C6.86926 20.937 7.03242 20.8586 7.18286 20.7594C7.35242 20.6475 7.49951 20.5005 7.7937 20.2063L21 7C22.1046 5.89543 22.1046 4.10457 21 3C19.8954 1.89543 18.1046 1.89543 17 3L3.7937 16.2063C3.49952 16.5005 3.35242 16.6475 3.24061 16.8171C3.1414 16.9676 3.06298 17.1307 3.00748 17.3022C2.94493 17.4954 2.92195 17.7021 2.87601 18.1156L2.49997 21.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
