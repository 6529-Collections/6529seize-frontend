"use client";

import { CameraIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
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

const getFirstFile = (
  files: FileList | readonly File[] | null | undefined
): File | null => {
  if (!files) {
    return null;
  }

  if ("item" in files) {
    return files.item(0);
  }

  return files[0] ?? null;
};

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
        message: "This file type is not supported.",
      });
    } else if (file.size > FILE_SIZE_LIMIT) {
      setToast({
        type: "error",
        message: "Use a file smaller than 10 MB.",
      });
    } else {
      setFile(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = getFirstFile(e.dataTransfer.files);
    if (file !== null) {
      onFileChange(file);
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

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
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
              className="tw-h-14 tw-w-14 tw-flex-shrink-0 tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-object-cover sm:tw-h-20 sm:tw-w-20"
            />
          ) : (
            <div className="tw-flex tw-h-14 tw-w-14 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-object-cover tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out hover:tw-border-white/10 hover:tw-bg-iron-800 hover:tw-text-iron-300 sm:tw-h-20 sm:tw-w-20">
              <CameraIcon
                aria-hidden="true"
                className="tw-h-5 tw-w-5 sm:tw-h-6 sm:tw-w-6"
              />
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
              ? "tw-border-white/20 tw-bg-iron-900"
              : "tw-border-white/10 tw-bg-iron-900/60"
          } tw-flex tw-h-40 tw-w-full tw-cursor-pointer tw-flex-col tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-dashed tw-transition tw-duration-300 tw-ease-out hover:tw-border-white/20 hover:tw-bg-iron-900`}
        >
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-px-4 tw-py-5">
            <div className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out group-hover:tw-border-white/20">
              <div className="tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-iron-50">
                <svg
                  className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-white"
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const file = getFirstFile(e.target.files);
              if (file !== null) {
                onFileChange(file);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}
