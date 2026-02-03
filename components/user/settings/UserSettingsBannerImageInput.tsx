"use client";

import Image from "next/image";
import { ACCEPTED_FORMATS_DISPLAY } from "./UserSettingsImgSelectFile";
import { useImageUpload } from "./useImageUpload";

export default function UserSettingsBannerImageInput({
  imageToShow,
  setFile,
}: {
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

  return (
    <div
      {...dragHandlers}
      className="tw-group tw-flex tw-w-full tw-items-center tw-justify-center"
    >
      <label
        className={` ${
          dragging
            ? "tw-border-iron-600 tw-bg-iron-800"
            : "tw-border-iron-700 tw-bg-iron-900"
        } tw-relative tw-flex tw-h-64 tw-w-full tw-cursor-pointer tw-flex-col tw-items-center tw-justify-center tw-rounded-lg tw-border-2 tw-border-dashed tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-600 hover:tw-bg-iron-800 ${
          shake ? "tw-animate-shake" : ""
        } `}
      >
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-px-4">
          {imageToShow ? (
            <div className="tw-relative tw-h-40 tw-w-40">
              <Image
                src={imageToShow}
                alt="Banner preview"
                fill
                className="tw-rounded-sm tw-object-contain"
              />
            </div>
          ) : (
            <>
              <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-transition tw-duration-300 tw-ease-out group-hover:tw-bg-iron-800">
                <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-iron-50">
                  <svg
                    className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-text-iron-50"
                    viewBox="0 0 24 24"
                    fill="none"
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
              </div>
              <div className="tw-flex tw-flex-col tw-items-center tw-justify-center">
                <p className="tw-mb-1 tw-text-sm tw-font-normal tw-text-iron-400">
                  <span className="tw-font-medium tw-text-white">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="tw-text-xs tw-font-normal tw-text-iron-400">
                  JPEG, JPG, PNG, GIF, WEBP — max 2MB
                </p>
              </div>
            </>
          )}
          {error && (
            <p className="tw-text-xs tw-font-medium tw-text-red">{error}</p>
          )}
        </div>
        <input
          id="banner-upload-input"
          type="file"
          className="tw-hidden"
          accept={ACCEPTED_FORMATS_DISPLAY}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) onFileChange(f);
            e.target.value = ""; // allow selecting same file again
          }}
        />
      </label>
    </div>
  );
}
