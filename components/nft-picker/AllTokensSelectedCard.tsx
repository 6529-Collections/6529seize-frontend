import { CheckCircleIcon } from "@heroicons/react/20/solid";
import type { MutableRefObject, RefObject } from "react";

type ButtonRef = RefObject<HTMLButtonElement | null> | MutableRefObject<HTMLButtonElement | null>;

interface AllTokensSelectedCardProps {
  onDeselect: () => void;
  buttonRef?: ButtonRef;
}

export function AllTokensSelectedCard({
  onDeselect,
  buttonRef,
}: AllTokensSelectedCardProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="All tokens selected status"
      className="tw-flex tw-w-full tw-flex-col tw-gap-3 tw-rounded-lg tw-border-2 tw-border-green-500/60 tw-bg-green-950/30 tw-p-4 tw-transition-all tw-duration-200 tw-ease-in-out @md:tw-flex-row @md:tw-items-center"
    >
      <div className="tw-flex tw-h-10 tw-w-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-green-600">
        <CheckCircleIcon className="tw-h-6 tw-w-6 tw-text-white" aria-hidden="true" />
      </div>

      <div className="tw-flex-1 tw-min-w-0">
        <div className="tw-text-base tw-font-semibold tw-text-green-400">All tokens selected</div>
        <div className="tw-text-sm tw-text-iron-400">
          Click "Deselect All" to add specific tokens
        </div>
      </div>

      <button
        ref={buttonRef}
        type="button"
        onClick={onDeselect}
        aria-label="Deselect all tokens and return to manual selection"
        className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-md tw-bg-green-600 tw-px-4 tw-py-2.5 tw-font-medium tw-text-white tw-transition-all hover:tw-bg-green-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-green-500 focus:tw-ring-offset-2 focus:tw-ring-offset-iron-900 active:tw-scale-95 @md:tw-w-auto @md:tw-shrink-0"
      >
        <CheckCircleIcon className="tw-h-5 tw-w-5 tw-text-white" aria-hidden="true" />
        Deselect All
      </button>
    </div>
  );
}
