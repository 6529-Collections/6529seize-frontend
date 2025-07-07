"use client";

import { useContext } from "react";
import { AuthContext } from "../../../auth/Auth";
import { MAX_DROP_UPLOAD_FILES } from "../../../../helpers/Helpers";

export default function CreateDropActionsRow({
  canAddPart,
  isStormMode,
  setFiles,
  breakIntoStorm,
}: {
  readonly canAddPart: boolean;
  readonly isStormMode: boolean;
  readonly setFiles: (files: File[]) => void;
  readonly breakIntoStorm: () => void;
}) {
  const { setToast } = useContext(AuthContext);
  return (
    <div className="tw-mt-3 tw-flex tw-items-center tw-gap-x-6">
      <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
        <label>
          <div
            role="button"
            aria-label="Select audio file"
            className="tw-cursor-pointer tw-flex tw-items-center tw-gap-x-2 tw-text-iron-300 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300">
            <svg
              className="tw-flex-shrink-0 tw-h-5 tw-w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor">
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
              onChange={(e: any) => {
                if (e.target.files) {
                  const files: File[] = Array.from(e.target.files);
                  if (files.length > MAX_DROP_UPLOAD_FILES) {
                    setToast({
                      message: "You can only upload up to 4 files at a time",
                      type: "error",
                    });
                    return;
                  }
                  setFiles(files);
                }
              }}
            />
            <span className="tw-text-sm tw-font-medium">Upload Media</span>
          </div>
        </label>
      </div>
      {canAddPart && (
        <button
          onClick={breakIntoStorm}
          disabled={!canAddPart}
          type="button"
          className="tw-border-0 tw-bg-transparent tw-cursor-pointer tw-flex tw-items-center tw-text-iron-300 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300">
          <svg
            className="tw-h-4 tw-w-4 tw-flex-shrink-0 -tw-mr-0.5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            className="tw-h-[1.15rem] tw-w-[1.15rem] tw-flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 4H3M20 8L6 8M18 12L9 12M15 16L8 16M17 20H12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="tw-ml-2 tw-text-sm tw-font-medium">
            {isStormMode ? "Continue storm" : "Break into storm"}
          </span>
        </button>
      )}
    </div>
  );
}
