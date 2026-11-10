import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";

/** Decorative feedback; the existing Reply action remains the tap/AT alternative. */
export function SwipeReplyHint() {
  return (
    <span
      aria-hidden="true"
      className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 tw-flex tw-size-8 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-iron-400 tw-opacity-0 [[data-reply-ready=true]_&]:tw-bg-primary-500/20 [[data-reply-ready=true]_&]:tw-text-primary-300 [[data-reply-swiping=true]_&]:tw-opacity-100"
    >
      <ArrowUturnLeftIcon className="tw-size-5 [[data-reply-ready=true]_&]:tw-stroke-[2.5]" />
    </span>
  );
}
