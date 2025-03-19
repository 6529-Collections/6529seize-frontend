import React from 'react';
import { motion } from 'framer-motion';

interface MemesArtSubmissionFileProps {
  readonly artworkUploaded: boolean;
  readonly artworkUrl: string;
  readonly setArtworkUploaded: (uploaded: boolean) => void;
  readonly handleFileSelect: (file: File) => void;
}

const MemesArtSubmissionFile: React.FC<MemesArtSubmissionFileProps> = ({
  artworkUploaded,
  artworkUrl,
  setArtworkUploaded,
  handleFileSelect,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.002 }}
      className="tw-relative tw-w-full tw-h-[400px] tw-bg-gradient-to-br tw-from-iron-900 tw-to-iron-950 tw-rounded-xl tw-overflow-hidden tw-group tw-cursor-pointer hover:tw-border hover:tw-border-iron-700/80 tw-transition-all tw-duration-300"
    >
      {!artworkUploaded ? (
        <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-6">
          {/* Subtle animated dashed border around entire area */}
          <div className="tw-absolute tw-inset-[10px] tw-border-2 tw-border-dashed tw-border-iron-700/40 group-hover:tw-border-primary-500/30 tw-rounded-lg tw-transition-all tw-duration-300" />
          <div className="tw-absolute tw-inset-[10px] tw-border tw-border-dashed tw-border-iron-600/20 group-hover:tw-border-iron-500/30 tw-rounded-lg tw-animate-pulse tw-transition-all tw-duration-300" />

          {/* Pattern background suggesting droppable area */}
          <div className="tw-absolute tw-inset-0 tw-pointer-events-none tw-opacity-5">
            <div className="tw-grid tw-grid-cols-8 tw-h-full">
              {Array(32)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="tw-border-[0.5px] tw-border-iron-400/40"
                  />
                ))}
            </div>
          </div>

          {/* Abstract art-themed upload indicator */}
          <div className="tw-relative tw-mb-2">
            <div className="tw-w-32 tw-h-32 tw-relative">
              <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-tr tw-from-primary-500/20 tw-to-transparent tw-rounded-full tw-animate-pulse" />
              <div
                className="tw-absolute tw-inset-0 tw-border-2 tw-border-dashed tw-border-iron-700 tw-rounded-full tw-animate-spin"
                style={{ animationDuration: "10s" }}
              />
              <div className="tw-absolute tw-inset-4 tw-border tw-border-iron-600 tw-rounded-full" />
              <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
                <span className="tw-text-iron-400 tw-text-sm tw-font-medium group-hover:tw-text-primary-300 tw-transition-colors tw-duration-300">
                  Select Art
                </span>
              </div>
            </div>
          </div>

          {/* Drag and drop text hint */}
          <div className="tw-flex tw-items-center tw-justify-center tw-mb-8 tw-transition-all tw-duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="tw-w-4 tw-h-4 tw-mr-1.5 tw-text-iron-500 group-hover:tw-text-primary-400 tw-transition-colors tw-duration-300"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
            <span className="tw-text-iron-500 tw-text-xs group-hover:tw-text-iron-300 tw-transition-colors tw-duration-300">
              Drag and drop file here
            </span>
          </div>

          {/* File type indicators */}
          <div className="tw-absolute tw-bottom-6 tw-left-6 tw-right-6">
            <div className="tw-flex tw-justify-center tw-gap-3 tw-text-xs tw-text-iron-500">
              <span className="tw-px-3 tw-py-1.5 tw-rounded-full tw-bg-iron-900/50 tw-backdrop-blur tw-border tw-border-iron-800/50">
                PNG
              </span>
              <span className="tw-px-3 tw-py-1.5 tw-rounded-full tw-bg-iron-900/50 tw-backdrop-blur tw-border tw-border-iron-800/50">
                JPG
              </span>
              <span className="tw-px-3 tw-py-1.5 tw-rounded-full tw-bg-iron-900/50 tw-backdrop-blur tw-border tw-border-iron-800/50">
                VIDEO
              </span>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="tw-relative tw-w-full tw-h-full"
        >
          <img
            src={artworkUrl}
            alt="Preview"
            className="tw-w-full tw-h-full tw-object-cover"
          />
          <button
            onClick={() => setArtworkUploaded(false)}
            className="tw-absolute tw-top-4 tw-right-4 tw-p-2 tw-rounded-lg tw-bg-iron-900/80 tw-backdrop-blur hover:tw-bg-iron-800/80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="tw-w-5 tw-h-5 tw-text-iron-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MemesArtSubmissionFile; 