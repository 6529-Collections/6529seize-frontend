import React from "react";

interface WaveDropsEmptyPlaceholderProps {
  readonly dropId: string | null;
}

export default function WaveDropsEmptyPlaceholder({
  dropId,
}: WaveDropsEmptyPlaceholderProps) {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-10 tw-space-y-6 tw-text-iron-400">
      <div className="tw-relative tw-group">
        <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-primary-400/20 tw-via-indigo-500/10 tw-to-iron-800/10 tw-rounded-full tw-animate-[spin_4s_linear_infinite] group-hover:tw-from-primary-400/30"></div>
        <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-tr tw-from-iron-800/10 tw-via-indigo-500/10 tw-to-primary-400/20 tw-rounded-full tw-animate-[spin_5s_linear_infinite] group-hover:tw-to-primary-400/30"></div>
        <div className="tw-absolute tw-inset-0 tw-bg-gradient-radial tw-from-primary-300/5 tw-to-transparent tw-animate-pulse"></div>
        <svg
          className="tw-size-10 tw-flex-shrink-0 tw-relative tw-text-white/60"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
          />
        </svg>
      </div>
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-y-4">
        <span className="tw-tracking-tight tw-text-lg tw-font-semibold tw-bg-gradient-to-br tw-from-iron-200 tw-via-iron-300 tw-to-iron-400 tw-bg-clip-text tw-text-transparent">
          Be the First to Start a Discussion
        </span>
        <p className="tw-text-sm tw-text-iron-500 tw-text-center tw-mb-0 tw-max-w-xs">
          {dropId ? "Share your thoughts and join the discussion." : ""}
        </p>
      </div>
    </div>
  );
}
