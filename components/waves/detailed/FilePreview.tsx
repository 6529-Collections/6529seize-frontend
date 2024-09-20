import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faTimes } from "@fortawesome/free-solid-svg-icons";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";

interface UploadingFile {
  file: File;
  isUploading: boolean;
}

interface FilePreviewProps {
  readonly files: File[];
  readonly uploadingFiles: UploadingFile[];
  readonly removeFile: (index: number) => void;
  readonly disabled: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  files,
  uploadingFiles,
  removeFile,
  disabled,
}) => {
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-2">
      {files.map((file, index) => {
        const isUploading =
           uploadingFiles.some((uf) => uf.file === file);
        return (
          <div
            key={index}
            className={`tw-relative tw-group ${
              disabled ? "tw-opacity-50" : ""
            }`}
          >
            <div className="tw-h-[16rem] tw-w-[16rem] tw-bg-iron-800 tw-rounded-lg tw-overflow-hidden">
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index}`}
                  className="tw-w-full tw-h-full tw-object-cover"
                />
              ) : (
                <div className="tw-flex tw-items-center tw-justify-center tw-w-full tw-h-full tw-text-iron-400">
                  {file.type.startsWith("video/") ? "🎥" : "📁"}
                </div>
              )}
              {isUploading && (
                <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black tw-bg-opacity-50">
                  <CircleLoader size={CircleLoaderSize.XXLARGE} />
                </div>
              )}
            </div>
            {!isUploading && (
              <button
                onClick={() => removeFile(index)}
                disabled={disabled}
                className={`tw-border-0 tw-flex tw-items-center tw-justify-center tw-absolute tw-top-1 tw-right-1 tw-text-red-500 tw-rounded-full tw-size-7 tw-opacity-0 group-hover:tw-opacity-100 hover:tw-bg-iron-800/80 tw-transition-all tw-duration-300 tw-z-10 tw-cursor-pointer tw-bg-iron-800 ${
                  disabled ? "tw-pointer-events-none" : ""
                }`}
                aria-label="Remove file"
              >
                <svg
                  className="tw-size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FilePreview;
