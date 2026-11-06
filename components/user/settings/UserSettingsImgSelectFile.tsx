"use client";

import { getUserProfileHeaderMessage as message } from "../user-page-header/user-page-header.messages";

import Image from "next/image";
import { useImageUpload } from "./useImageUpload";
import { ACCEPTED_FORMATS_DISPLAY } from "./imageValidation";

export default function UserSettingsImgSelectFile({
  imageToShow,
  setFile,
  compact = false,
}: {
  readonly compact?: boolean;
  readonly imageToShow: string | null;
  readonly setFile: (file: File) => void;
}) {
  const { error, shake, dragging, onFileChange, dragHandlers } = useImageUpload(
    {
      maxSizeBytes: 2097152,
      maxSizeLabel: "2MB",
      setFile,
    }
  );

  const restingSurfaceClass = compact
    ? "tw-border-white/[0.06] tw-bg-transparent"
    : "tw-border-white/10 tw-bg-iron-900";

  return (
    <label
      {...dragHandlers}
      className={`tw-group ${
        dragging
          ? "tw-border-primary-400/60 tw-bg-primary-500/10"
          : restingSurfaceClass
      } tw-relative tw-flex ${compact ? "tw-min-h-24 tw-items-stretch tw-rounded-lg tw-border tw-border-solid desktop-hover:hover:tw-bg-white/[0.025]" : "tw-h-64 tw-items-center tw-rounded-xl tw-border-2 tw-border-dashed hover:tw-bg-iron-800"} tw-w-full tw-cursor-pointer tw-flex-col tw-justify-center tw-transition tw-duration-200 tw-ease-out focus-within:tw-ring-2 focus-within:tw-ring-primary-400/60 hover:tw-border-white/20 motion-reduce:tw-transition-none ${
        shake ? "tw-animate-shake motion-reduce:tw-animate-none" : ""
      }`}
    >
      <div
        className={`tw-flex tw-items-center ${compact ? "tw-flex-wrap tw-justify-start tw-gap-3 tw-p-3" : "tw-flex-col tw-justify-center tw-pb-6 tw-pt-5"}`}
      >
        {imageToShow && !compact && (
          <div className="tw-relative tw-size-40 tw-shrink-0 tw-overflow-hidden tw-rounded-xl tw-bg-black/20 tw-ring-1 tw-ring-inset tw-ring-white/10">
            <Image
              src={imageToShow}
              alt={message("user.profileHeader.edit.picturePreview")}
              fill
              sizes="10rem"
              className="tw-object-contain"
            />
          </div>
        )}
        {(compact || !imageToShow) && (
          <>
            <div
              className={`tw-flex tw-h-10 tw-w-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-text-iron-50 ${compact ? "tw-bg-white/[0.04]" : "tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/80 tw-transition tw-duration-200 tw-ease-out group-hover:tw-border-white/15 group-hover:tw-bg-iron-900"}`}
            >
              <svg
                className="tw-size-6 tw-flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 16.2422C2.79401 15.435 2 14.0602 2 12.5C2 10.1564 3.79151 8.23129 6.07974 8.01937C6.54781 5.17213 9.02024 3 12 3C14.9798 3 17.4522 5.17213 17.9203 8.01937C20.2085 8.23129 22 10.1564 22 12.5C22 14.0602 21.206 15.435 20 16.2422M8 16L12 12M12 12L16 16M12 12V21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p
                className={`${compact ? "tw-mb-1" : "tw-mb-2"} tw-mt-0 tw-text-sm tw-font-normal tw-text-iron-400`}
              >
                <span className="tw-font-medium tw-text-white">
                  {message(
                    compact
                      ? "user.profileHeader.edit.uploadPictureFile"
                      : "user.profileHeader.edit.upload"
                  )}
                </span>{" "}
                {message("user.profileHeader.edit.dragDrop")}
              </p>
              <p
                className={`${compact ? "tw-m-0" : ""} tw-text-xs tw-font-normal tw-text-iron-400`}
              >
                {message("user.profileHeader.edit.pictureFormats")}
              </p>
            </div>
          </>
        )}
        {error && (
          <p
            id="pfp-upload-error"
            role="alert"
            className={`${compact ? "tw-m-0 tw-basis-full" : "tw-absolute tw-bottom-2 tw-left-0 tw-w-full tw-text-center"} tw-text-xs tw-font-medium tw-text-error`}
          >
            {error}
          </p>
        )}
      </div>
      <input
        id="pfp-upload-input"
        type="file"
        aria-label={message(
          compact
            ? "user.profileHeader.edit.uploadPictureFile"
            : "user.profileHeader.edit.uploadPicture"
        )}
        aria-describedby={error ? "pfp-upload-error" : undefined}
        className="tw-sr-only"
        accept={ACCEPTED_FORMATS_DISPLAY}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const f = e.target.files?.[0];
          if (f) onFileChange(f);
          e.target.value = ""; // allow selecting same file again
        }}
      />
    </label>
  );
}
