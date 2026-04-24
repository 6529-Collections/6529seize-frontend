import React from "react";
import CircleLoader, {
  CircleLoaderSize,
} from "../distribution-plan-tool/common/CircleLoader";
import {
  faFile,
  faFileAudio,
  faFileCsv,
  faFilePdf,
  faFileVideo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

const getFileExtension = (file: File): string => {
  const extension = file.name.split(".").pop();
  if (extension && extension !== file.name) {
    return extension.toUpperCase();
  }

  const mimeSubtype = file.type.split("/")[1];
  return mimeSubtype?.split(";")[0]?.toUpperCase() || "FILE";
};

const getFileIcon = (file: File) => {
  if (file.type.startsWith("video/")) {
    return faFileVideo;
  }

  if (file.type.startsWith("audio/")) {
    return faFileAudio;
  }

  if (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  ) {
    return faFilePdf;
  }

  if (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) {
    return faFileCsv;
  }

  return faFile;
};

const FileTypePreview: React.FC<{ file: File }> = ({ file }) => (
  <div
    className="tw-relative tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-px-3 tw-text-iron-300"
    aria-label={`${getFileExtension(file)} file`}
  >
    <FontAwesomeIcon icon={getFileIcon(file)} className="tw-size-7" />
    <span className="tw-sr-only">{getFileExtension(file)}</span>
    <div
      title={file.name}
      dir="rtl"
      className="tw-absolute tw-bottom-2 tw-left-3 tw-right-3 tw-truncate tw-text-right tw-text-[11px] tw-text-iron-500"
    >
      {file.name}
    </div>
  </div>
);

const FilePreview: React.FC<FilePreviewProps> = ({
  files,
  uploadingFiles,
  removeFile,
  disabled,
}) => {
  return (
    <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
      {files.map((file, index) => {
        const uploadingFile = uploadingFiles.find(
          (uf) => uf.file === file.file
        );
        const isUploading = !!uploadingFile;
        const progress = uploadingFile?.progress ?? 0;
        const fileKey = `${file.file.name}-${file.file.size}-${file.file.lastModified}-${index}`;
        return (
          <div key={fileKey} className="tw-group tw-relative">
            <div className="tw-size-24 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
              {file.file.type.startsWith("image/") ? (
                <div className="tw-relative tw-h-full tw-w-full">
                  <img
                    src={URL.createObjectURL(file.file)}
                    alt={`Preview ${index}`}
                    className="tw-h-full tw-w-full tw-object-cover"
                  />
                  <div className="tw-absolute tw-inset-0 tw-bg-iron-950 tw-opacity-0 tw-transition-opacity tw-duration-300 group-hover:tw-opacity-30"></div>
                </div>
              ) : (
                <FileTypePreview file={file.file} />
              )}
              {isUploading && (
                <>
                  <ProgressOverlay progress={progress} />
                  <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center">
                    <CircleLoader size={CircleLoaderSize.XXLARGE} />
                    <span className="tw-mt-1 tw-text-base tw-font-medium tw-text-white">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </>
              )}
            </div>
            {file.label && (
              <div className="tw-absolute tw-left-2 tw-right-10 tw-top-2 tw-truncate tw-rounded tw-bg-iron-800/80 tw-px-2 tw-py-1 tw-text-sm tw-text-white">
                {file.label}
              </div>
            )}
            {!isUploading && (
              <button
                onClick={() => removeFile(file.file)}
                disabled={disabled}
                className={`tw-absolute tw-right-1 tw-top-1 tw-z-10 tw-flex tw-size-7 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-800 tw-text-red tw-transition-all tw-duration-300 hover:tw-bg-iron-700 ${
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
