"use client";

import { CheckCircleIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";
import Button from "@/components/utils/button/Button";

const QUICK_VOTE_RESTART_VISIBILITY_DELAY_MS = 200;

function MemesQuickVoteDialogStatusState({
  action,
  className,
  description,
  title,
  visual,
}: {
  readonly action?: ReactNode;
  readonly className?: string;
  readonly description: string;
  readonly title: string;
  readonly visual: ReactNode;
}) {
  return (
    <div
      className={`tw-relative tw-flex tw-min-h-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-[#0c0c0d]/95 tw-px-6 tw-py-10 md:tw-px-8 md:tw-py-12 ${className ?? ""}`}
      style={
        className
          ? {
              animationDelay: `${QUICK_VOTE_RESTART_VISIBILITY_DELAY_MS}ms`,
              animationFillMode: "both",
            }
          : undefined
      }
    >
      <div className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-1/2 tw-h-72 tw-w-72 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-primary-500/10 tw-blur-[84px]" />
      <div className="tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-1/2 tw-h-44 tw-w-44 -tw-translate-x-1/2 -tw-translate-y-[58%] tw-rounded-full tw-bg-white/5 tw-blur-[48px]" />
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_46%)]" />

      <div className="tw-relative tw-z-10 tw-flex tw-w-full tw-max-w-md tw-flex-col tw-items-center tw-text-center">
        {visual}
        <p className="tw-mb-3 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white md:tw-text-[1.75rem]">
          {title}
        </p>
        <p className="tw-mx-auto tw-mb-8 tw-max-w-sm tw-text-sm tw-leading-6 tw-text-iron-400 md:tw-text-[15px]">
          {description}
        </p>
        {action}
      </div>
    </div>
  );
}

export function MemesQuickVoteDialogDoneState({
  description,
  onClose,
  title,
}: {
  readonly description: string;
  readonly onClose: () => void;
  readonly title: string;
}) {
  return (
    <MemesQuickVoteDialogStatusState
      action={
        <Button
          data-autofocus="true"
          onClick={onClose}
          variant="tertiary"
          size="lg"
          className="tw-px-6"
        >
          Close
        </Button>
      }
      description={description}
      title={title}
      visual={
        <div className="tw-relative tw-mx-auto tw-mb-8 tw-flex tw-size-24 tw-items-center tw-justify-center md:tw-size-28">
          <div className="tw-absolute tw-inset-0 tw-rounded-full tw-bg-primary-500/10 tw-blur-2xl" />
          <div className="tw-absolute tw-inset-3 tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.03] tw-backdrop-blur-md" />
          <div className="tw-relative tw-flex tw-size-20 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-black/50 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:tw-size-24">
            <CheckCircleIcon className="tw-size-10 tw-text-iron-100 md:tw-size-12" />
          </div>
        </div>
      }
    />
  );
}

export function MemesQuickVoteDialogRestartState() {
  return (
    <MemesQuickVoteDialogStatusState
      className="tw-animate-in tw-fade-in tw-duration-150"
      description="You’ve reached the end of this round."
      title="Starting over"
      visual={
        <div className="tw-relative tw-mx-auto tw-mb-8 tw-flex tw-size-24 tw-items-center tw-justify-center md:tw-size-28">
          <div className="tw-absolute tw-inset-0 tw-rounded-full tw-bg-primary-500/10 tw-blur-2xl" />
          <div className="tw-absolute tw-inset-3 tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.03] tw-backdrop-blur-md" />
          <div className="tw-relative tw-flex tw-size-20 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-black/50 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:tw-size-24">
            <div className="tw-size-9 tw-animate-spin tw-rounded-full tw-border-[3px] tw-border-solid tw-border-white/10 tw-border-r-primary-400 tw-border-t-primary-400 md:tw-size-10" />
          </div>
        </div>
      }
      action={
        <div className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-300">
          <span className="tw-size-2 tw-rounded-full tw-bg-primary-400" />
          <span>Loading next memes...</span>
        </div>
      }
    />
  );
}

export function MemesQuickVoteDialogErrorState({
  onRetry,
}: {
  readonly onRetry: () => void;
}) {
  return (
    <div className="tw-flex tw-min-h-full tw-items-center tw-justify-center tw-py-8">
      <div className="tw-w-full tw-max-w-xl tw-rounded-[1.75rem] tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-px-6 tw-py-10 tw-text-center tw-shadow-[0_24px_60px_rgba(0,0,0,0.35)] tw-backdrop-blur-sm">
        <p className="tw-mb-2 tw-text-lg tw-font-semibold tw-text-white">
          Couldn&apos;t load quick vote
        </p>
        <p className="tw-mb-4 tw-text-sm tw-text-iron-400">
          Quick vote couldn&apos;t load the next meme. Try again.
        </p>
        <Button onClick={onRetry} variant="tertiary" size="sm">
          Try again
        </Button>
      </div>
    </div>
  );
}
