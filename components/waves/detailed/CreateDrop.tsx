import PrimaryButton from "../../utils/buttons/PrimaryButton";
import { ActiveDropState } from "./WaveDetailedContent";
import CreateDropReplyingWrapper from "./CreateDropReplyingWrapper";
import CreateDropInput from "./CreateDropInput";

interface CreateDropProps {
  activeDrop: ActiveDropState | null;
  onCancelReplyQuote: () => void;
}

export default function CreateDrop({
  activeDrop,
  onCancelReplyQuote,
}: CreateDropProps) {
  return (
    <div className="tw-py-4 tw-px-2">
      <div className="tw-flex tw-items-end tw-gap-x-3">
        <div className="tw-w-full">
          <CreateDropReplyingWrapper
            activeDrop={activeDrop}
            onCancelReplyQuote={onCancelReplyQuote}
          />
          <div className="tw-relative tw-w-full">
            <input
              placeholder="Drop a post"
              className="tw-pr-24 tw-resize-none tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-950 focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-md tw-leading-6 tw-transition tw-duration-300 tw-ease-out 
      tw-pl-3 tw-py-2.5"
            />
            <button
              type="button"
              aria-label="Attach file"
              className="tw-cursor-pointer tw-flex tw-items-center tw-justify-center tw-p-2 tw-group tw-absolute tw-top-0.5 tw-right-11 tw-rounded-lg tw-border-none tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                aria-hidden="true"
                stroke="currentColor"
                className="tw-size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Expand view"
              className="tw-cursor-pointer tw-flex tw-items-center tw-justify-center tw-p-2 tw-group tw-absolute tw-top-1 tw-right-2 tw-rounded-lg tw-border-none tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
            >
              <svg
                className="tw-h-5 tw-w-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 14V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H14M10 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V10M15 9L21 3M21 3H15M21 3V9M9 15L3 21M3 21H9M3 21L3 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          {/* <CreateDropInput/> */}
        </div>
        <PrimaryButton>Drop</PrimaryButton>
      </div>
    </div>
  );
}
