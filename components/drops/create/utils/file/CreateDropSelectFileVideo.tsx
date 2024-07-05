import { useRef } from "react";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";

export default function CreateDropSelectFileVideo({
  onFileChange,
}: {
  readonly onFileChange: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
    const randomId = getRandomObjectId();
  return (
    <div className="tw-cursor-pointer tw-group tw-h-10 tw-w-10 tw-flex tw-items-center tw-justify-center hover:tw-bg-iron-800 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out" role="button" aria-label="Select video file">
      <label htmlFor={randomId}>
        <svg
          className="tw-cursor-pointer -tw-mt-0.5 -tw-ml-0.5 tw-h-6 tw-w-6 lg:tw-h-5 lg:tw-w-5 tw-text-iron-300 group-hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 12H22M2 7H7M17 7H22M2 17H7M17 17H22M7 22V2M17 22V2M6.8 22H17.2C18.8802 22 19.7202 22 20.362 21.673C20.9265 21.3854 21.3854 20.9265 21.673 20.362C22 19.7202 22 18.8802 22 17.2V6.8C22 5.11984 22 4.27976 21.673 3.63803C21.3854 3.07354 20.9265 2.6146 20.362 2.32698C19.7202 2 18.8802 2 17.2 2H6.8C5.11984 2 4.27976 2 3.63803 2.32698C3.07354 2.6146 2.6146 3.07354 2.32698 3.63803C2 4.27976 2 5.11984 2 6.8V17.2C2 18.8802 2 19.7202 2.32698 20.362C2.6146 20.9265 3.07354 21.3854 3.63803 21.673C4.27976 22 5.11984 22 6.8 22Z"
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
          accept="video/*"
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
