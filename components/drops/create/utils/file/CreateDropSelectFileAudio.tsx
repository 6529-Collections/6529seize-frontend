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
    <div
      className="tw-cursor-pointer tw-group tw-h-10 tw-w-10 tw-flex tw-items-center tw-justify-center hover:tw-bg-iron-800 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
      role="button"
      aria-label="Select audio file"
    >
      <label htmlFor={randomId}>
        <svg
          className="tw-cursor-pointer -tw-mt-0.5 -tw-ml-0.5 tw-h-6 tw-w-6 lg:tw-h-5 lg:tw-w-5 tw-text-iron-300 group-hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 18V6.35537C9 5.87383 9 5.63306 9.0876 5.43778C9.16482 5.26565 9.28917 5.11887 9.44627 5.0144C9.62449 4.89588 9.86198 4.8563 10.337 4.77714L19.137 3.31047C19.7779 3.20364 20.0984 3.15023 20.3482 3.243C20.5674 3.32441 20.7511 3.48005 20.8674 3.68286C21 3.91398 21 4.23889 21 4.8887V16M9 18C9 19.6568 7.65685 21 6 21C4.34315 21 3 19.6568 3 18C3 16.3431 4.34315 15 6 15C7.65685 15 9 16.3431 9 18ZM21 16C21 17.6568 19.6569 19 18 19C16.3431 19 15 17.6568 15 16C15 14.3431 16.3431 13 18 13C19.6569 13 21 14.3431 21 16Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
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
      </label>
    </div>
  );
}
