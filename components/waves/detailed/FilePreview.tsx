import React from "react";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";

interface FileItem {
  file: File;
  label: string | null;
}

interface UploadingFile {
  file: File;
  isUploading: boolean;
  progress: number;
}

interface FilePreviewProps {
  readonly files: FileItem[];
  readonly uploadingFiles: UploadingFile[];
  readonly removeFile: (file: File) => void;
  readonly disabled: boolean;
}

const ProgressOverlay: React.FC<{ progress: number }> = ({ progress }) => (
  <div
    className="tw-absolute tw-inset-0 tw-bg-black tw-opacity-60 tw-transition-all tw-duration-300 tw-ease-out"
    style={{
      clipPath: `inset(0 0 0 ${progress}%)`,
    }}
  />
);

const FilePreview: React.FC<FilePreviewProps> = ({
  files,
  uploadingFiles,
  removeFile,
  disabled,
}) => {
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-2">
      {files.map((file, index) => {
        const uploadingFile = uploadingFiles.find(
          (uf) => uf.file === file.file
        );
        const isUploading = !!uploadingFile;
        const progress = uploadingFile?.progress ?? 0;
        return (
          <div key={file.file.name} className="tw-relative tw-group">
            <div className="tw-h-[16rem] tw-w-[16rem] tw-bg-iron-800 tw-rounded-lg tw-overflow-hidden">
              {file.file.type.startsWith("image/") ? (
                <div className="tw-relative tw-w-full tw-h-full">
                  <img
                    src={URL.createObjectURL(file.file)}
                    alt={`Preview ${index}`}
                    className="tw-w-full tw-h-full tw-object-cover"
                  />
                  <div className="tw-absolute tw-inset-0 tw-bg-iron-950 tw-opacity-0 group-hover:tw-opacity-30 tw-transition-opacity tw-duration-300"></div>
                </div>
              ) : (
                <div className="tw-flex tw-items-center tw-justify-center tw-w-full tw-h-full tw-text-iron-400">
                  {file.file.type.startsWith("video/") ? "🎥" : "📁"}
                </div>
              )}
              {isUploading && (
                <>
                  <ProgressOverlay progress={progress} />
                  <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center">
                    <CircleLoader size={CircleLoaderSize.XXLARGE} />
                    <span className="tw-text-white tw-font-medium tw-text-base tw-mt-1">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </>
              )}
            </div>
            {file.label && (
              <div className="tw-absolute tw-bottom-2 tw-left-2 tw-right-2 tw-bg-iron-800/80 tw-text-white tw-px-2 tw-py-1 tw-rounded tw-text-sm tw-truncate">
                {file.label}
              </div>
            )}
            {!isUploading && (
              <button
                onClick={() => removeFile(file.file)}
                disabled={disabled}
                className={`tw-border-0 tw-flex tw-items-center tw-justify-center tw-absolute tw-top-1 tw-right-1 tw-text-red tw-rounded-full tw-size-7 tw-transition-all tw-duration-300 tw-z-10 tw-cursor-pointer tw-bg-iron-800 hover:tw-bg-iron-700 ${
                  disabled ? "tw-pointer-events-none" : ""
                }`}
                aria-label="Remove file"
              >
                <svg
                  className="tw-size-5 tw-flex-shrink-0"
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
