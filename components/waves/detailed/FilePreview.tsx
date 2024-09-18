import React from 'react';

interface FilePreviewProps {
  files: File[];
  removeFile: (index: number) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ files, removeFile }) => {
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-2">
      {files.map((file, index) => (
        <div key={index} className="tw-relative tw-group">
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
          </div>
          <button
            onClick={() => removeFile(index)}
            className="tw-border-0 tw-flex tw-items-center tw-justify-center tw-absolute tw-top-1 tw-right-1 tw-text-red-500 tw-rounded-full tw-size-7 tw-opacity-0 group-hover:tw-opacity-100 hover:tw-bg-iron-800/80 tw-transition-all tw-duration-300 tw-z-10 tw-cursor-pointer tw-bg-iron-800"
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
        </div>
      ))}
    </div>
  );
};

export default FilePreview;
