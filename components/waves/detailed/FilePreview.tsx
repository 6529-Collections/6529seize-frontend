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
          <div className="tw-w-20 tw-h-20 tw-bg-iron-800 tw-rounded-lg tw-overflow-hidden">
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
            className="tw-absolute tw-top-0.5 tw-right-0.5 tw-text-red-500 tw-rounded-full tw-p-1 tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-300 tw-z-10 tw-cursor-pointer hover:tw-bg-iron-800 hover:tw-bg-opacity-50"
            aria-label="Remove file"
          >
            <svg
              className="tw-h-3.5 tw-w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="tw-absolute tw-inset-0 tw-bg-iron-900 tw-bg-opacity-0 group-hover:tw-bg-opacity-30 tw-transition-opacity tw-duration-300 tw-rounded-lg"></div>
        </div>
      ))}
    </div>
  );
};

export default FilePreview;
