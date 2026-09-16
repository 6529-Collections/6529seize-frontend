import { getPreparedDropImage } from "@/services/uploads/prepareDropImage";
import { getContentType } from "@/services/uploads/mediaUploadMimeType";
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
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { XMarkIcon } from "@heroicons/react/24/outline";

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
  if (getContentType(file).startsWith("video/")) {
    return faFileVideo;
  }

  if (getContentType(file).startsWith("audio/")) {
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

const ImageFilePreview: React.FC<{ file: File }> = ({ file }) => {
  const locale = useBrowserLocale();
  const objectUrl = useObjectUrl(
    getContentType(file) === "image/avif" ? null : file
  );
  const previewUrl = getPreparedDropImage(file)?.url ?? objectUrl;

  return (
    <div className="tw-relative tw-h-full tw-w-full">
      {previewUrl && (
        // Keep a plain img here because local blob previews cannot be optimized by next/image.
        <img
          src={previewUrl}
          alt={t(locale, "drop.upload.imagePreview", { file: file.name })}
          className="tw-h-full tw-w-full tw-object-cover"
        />
      )}
    </div>
  );
};

const FilePreview: React.FC<FilePreviewProps> = ({
  files,
  uploadingFiles,
  removeFile,
  disabled,
}) => {
  const locale = useBrowserLocale();
  return (
    <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
      {files.map((file, index) => {
        const uploadingFile = uploadingFiles.find(
          (uf) => uf.file === file.file
        );
        const isUploading = !!uploadingFile;
        const progress = uploadingFile?.progress ?? 0;
        const contentType = getContentType(file.file);
        const isPreparingAvif = contentType === "image/avif" && isUploading;
        const isProcessingImage =
          uploadingFile?.phase === "processing" &&
          contentType.startsWith("image/");
        const fileKey = `${file.file.name}-${file.file.size}-${file.file.lastModified}-${index}`;
        return (
          <div key={fileKey} className="tw-relative">
            <div className="tw-relative tw-size-24 tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/40">
              {contentType.startsWith("image/") ? (
                // Mount after preparation so the memoized preview reads the completed URL.
                !isPreparingAvif && <ImageFilePreview file={file.file} />
              ) : (
                <FileTypePreview file={file.file} />
              )}
              {isUploading && (
                <>
                  <ProgressOverlay progress={progress} />
                  <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center">
                    <CircleLoader size={CircleLoaderSize.XXLARGE} />
                    <output
                      role={isProcessingImage ? undefined : "progressbar"}
                      aria-label={t(locale, "drop.upload.preparingFile", {
                        file: file.file.name,
                      })}
                      aria-valuenow={
                        isProcessingImage ? undefined : Math.round(progress)
                      }
                      aria-valuemin={isProcessingImage ? undefined : 0}
                      aria-valuemax={isProcessingImage ? undefined : 100}
                      className="tw-mt-1 tw-px-2 tw-text-center tw-text-sm tw-font-medium tw-leading-tight tw-text-white"
                    >
                      {isProcessingImage
                        ? t(locale, "drop.media.processing")
                        : `${Math.round(progress)}%`}
                    </output>
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
                type="button"
                onClick={() => removeFile(file.file)}
                disabled={disabled}
                className="tw-absolute tw-right-1 tw-top-1 tw-z-10 tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-black/80 tw-p-0 tw-text-white tw-ring-1 tw-ring-inset tw-ring-white/20 tw-transition-colors hover:tw-bg-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-pointer-events-none disabled:tw-opacity-50"
                aria-label={t(locale, "drop.upload.removeFile")}
                title={t(locale, "drop.upload.removeFile")}
              >
                <XMarkIcon
                  className="tw-size-4"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FilePreview;
