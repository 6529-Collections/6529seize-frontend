import { useRef } from "react";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";

export default function CreateDropSelectFileAudio({
  onFileChange,
}: {
  readonly onFileChange: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const randomId = getRandomObjectId();
  return (
    <label htmlFor={randomId}>
      <div
        role="button"
        aria-label="Select audio file"
        className="tw-cursor-pointer tw-flex tw-items-center tw-gap-x-2 tw-text-iron-400 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
      >
        <svg
          className="tw-flex-shrink-0 tw-cursor-pointer tw-h-5 tw-w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z"
          />
        </svg>
        <input
          id={randomId}
          ref={inputRef}
          type="file"
          className="tw-hidden"
          accept="audio/*"
          onChange={(e: any) => {
            if (e.target.files) {
              const f = e.target.files[0];
              onFileChange(f);
            }
          }}
        />

        <span className="tw-text-sm tw-font-medium">Audio</span>
      </div>
    </label>
  );
}
