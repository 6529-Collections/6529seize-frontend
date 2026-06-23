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
import { getFileExtension } from "./memes/file-upload/utils/formatHelpers";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { t } from "@/i18n/messages";
import { DEFAULT_LOCALE } from "@/i18n/locales";

interface FileItem {
  file: File;
  label: string | null;
}

interface UploadingFile {
  file: File;
  isUploading: boolean;
  progress: number;
  phase?: "uploading" | "processing";
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
    role="img"
    className="tw-relative tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-px-3 tw-text-iron-300"
    aria-label={`${getFileExtension(file, "FILE")} file: ${file.name}`}
  >
    <FontAwesomeIcon icon={getFileIcon(file)} className="tw-size-7" />
    <div
      title={file.name}
      className="tw-absolute tw-bottom-2 tw-left-3 tw-right-3 tw-truncate tw-text-center tw-text-[11px] tw-text-iron-500"
    >
      {file.name}
    </div>
  </div>
);

const ImageFilePreview: React.FC<{ file: File; index: number }> = ({
  file,
  index,
}) => {
  const previewUrl = useObjectUrl(file);

  return (
    <div className="tw-relative tw-h-full tw-w-full">
      {previewUrl && (
        // Keep a plain img here because local blob previews cannot be optimized by next/image.
        <img
          src={previewUrl}
          alt={`Preview ${index}`}
          className="tw-h-full tw-w-full tw-object-cover"
        />
      )}
      <div className="tw-absolute tw-inset-0 tw-bg-iron-950 tw-opacity-0 tw-transition-opacity tw-duration-300 group-hover:tw-opacity-30"></div>
    </div>
  );
};

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
        const isProcessingImage =
          uploadingFile?.phase === "processing" &&
          file.file.type.startsWith("image/");
        const fileKey = `${file.file.name}-${file.file.size}-${file.file.lastModified}-${index}`;
        return (
          <div key={fileKey} className="tw-group tw-relative">
            <div className="tw-size-24 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
              {file.file.type.startsWith("image/") ? (
                <ImageFilePreview file={file.file} index={index} />
              ) : (
                <FileTypePreview file={file.file} />
              )}
              {isUploading && (
                <>
                  <ProgressOverlay progress={progress} />
                  <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center">
                    <CircleLoader size={CircleLoaderSize.XXLARGE} />
                    <span className="tw-mt-1 tw-px-2 tw-text-center tw-text-sm tw-font-medium tw-leading-tight tw-text-white">
                      {isProcessingImage
                        ? t(DEFAULT_LOCALE, "drop.media.processing")
                        : `${Math.round(progress)}%`}
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
