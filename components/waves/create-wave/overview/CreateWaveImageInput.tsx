"use client";

import Image from "next/image";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "@/components/auth/Auth";

const ACCEPTED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

const ACCEPTED_FORMATS_DISPLAY = ACCEPTED_FORMATS.map(
  (format) => `.${format.replace("image/", "")}`
).join(", ");

const FILE_SIZE_LIMIT = 10485760;

export default function CreateWaveImageInput({
  imageToShow,
  setFile,
  allowRemove = true,
}: {
  readonly imageToShow: File | null;
  readonly setFile: (file: File | null) => void;
  readonly allowRemove?: boolean;
}) {
  const { setToast } = useContext(AuthContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const onFileChange = (file: File) => {
    if (ACCEPTED_FORMATS.indexOf(file.type) === -1) {
      setToast({
        type: "error",
        message: "Invalid file type",
      });
    } else if (file.size > FILE_SIZE_LIMIT) {
      setToast({
        type: "error",
        message: "File size must be less than 10MB",
      });
    } else {
      setFile(file);
    }
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e?.dataTransfer?.files?.length) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const [dragging, setDragging] = useState(false);

  const previewUrl = useMemo(
    () => (imageToShow ? URL.createObjectURL(imageToShow) : null),
    [imageToShow]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragging(true);
    } else if (e.type === "dragleave") {
      setDragging(false);
    } else if (e.type === "drop") {
      setDragging(false);
    }
  };

  return (
    <div className="tw-flex tw-items-center tw-gap-x-5">
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-1.5">
        <div className="tw-flex-shrink-0">
          {imageToShow ? (
            <Image
              src={previewUrl ?? ""}
              alt="Profile image"
              width={80}
              height={80}
              unoptimized
              loader={({ src }) => src}
              className="tw-flex-shrink-0 tw-h-16 tw-w-16 tw-rounded-full tw-bg-iron-700 tw-object-cover tw-ring-1 tw-ring-iron-700 sm:tw-h-20 sm:tw-w-20"
            />
          ) : (
            <div className="tw-flex tw-flex-shrink-0 tw-h-16 tw-w-16 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-object-cover tw-text-iron-500 tw-ring-1 tw-ring-iron-700 sm:tw-h-20 sm:tw-w-20">
              <svg
                aria-hidden="true"
                className="tw-h-7 tw-w-7 sm:tw-h-8 sm:tw-w-8"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 7.75C4 6.7835 4.7835 6 5.75 6H8.5L9.7 4.4C10.0302 3.95973 10.5485 3.7 11.0988 3.7H12.9012C13.4515 3.7 13.9698 3.95973 14.3 4.4L15.5 6H18.25C19.2165 6 20 6.7835 20 7.75V17.25C20 18.2165 19.2165 19 18.25 19H5.75C4.7835 19 4 18.2165 4 17.25V7.75Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 15.25C13.7949 15.25 15.25 13.7949 15.25 12C15.25 10.2051 13.7949 8.75 12 8.75C10.2051 8.75 8.75 10.2051 8.75 12C8.75 13.7949 10.2051 15.25 12 15.25Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
              </svg>
            </div>
          )}
        </div>
        {imageToShow && allowRemove && (
          <button
            onClick={() => setFile(null)}
            type="button"
            aria-label="Remove file"
            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-sm tw-font-semibold tw-text-red tw-transition tw-duration-200 tw-ease-out hover:tw-bg-red/10"
          >
            Delete
          </button>
        )}
      </div>
      <div
        onDrop={handleDrop}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        className="tw-group tw-relative tw-flex tw-w-full tw-items-center tw-justify-center"
      >
        <label
          className={` ${
            dragging
              ? "tw-border-iron-600 tw-bg-iron-800"
              : "tw-border-iron-700 tw-bg-iron-900"
          } tw-flex tw-min-h-28 tw-w-full tw-cursor-pointer tw-flex-col tw-items-center tw-justify-center tw-rounded-lg tw-border-2 tw-border-dashed tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-600 hover:tw-bg-iron-800`}
        >
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-px-4 tw-py-5">
            <div className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-transition tw-duration-300 tw-ease-out group-hover:tw-bg-iron-800">
              <div className="tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-iron-50">
                <svg
                  className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-50"
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
            </div>
            <p className="tw-mb-1 tw-mt-3 tw-text-xs tw-font-normal tw-text-iron-400 sm:tw-text-sm">
              <span className="tw-font-medium tw-text-white">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="tw-mb-0 tw-text-xs tw-font-normal tw-text-iron-500">
              JPEG, JPG, PNG, GIF, WEBP
            </p>
          </div>
          <input
            id="pfp-upload-input"
            ref={inputRef}
            type="file"
            className="tw-hidden"
            accept={ACCEPTED_FORMATS_DISPLAY}
            onChange={(e: any) => {
              if (e.target.files) {
                const f = e.target.files[0];
                onFileChange(f);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}
