import { useRef } from "react";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";

export default function CreateDropSelectFileImage({
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
        aria-label="Select image file"
        className="tw-cursor-pointer tw-flex tw-items-center tw-gap-x-2 tw-text-iron-400 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
      >
        <svg
          className="tw-flex-shrink-0 tw-h-5 tw-w-5"
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
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>

        <input
          id={randomId}
          ref={inputRef}
          type="file"
          className="tw-hidden"
          accept="image/*"
          onChange={(e: any) => {
            if (e.target.files) {
              const f = e.target.files[0];
              onFileChange(f);
            }
          }}
        />

        <span className="tw-text-sm tw-font-medium">Image</span>
      </div>
    </label>
  );
}
