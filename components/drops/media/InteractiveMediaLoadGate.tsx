"use client";

import InteractiveIcon from "@/components/drops/media/InteractiveIcon";
import { Children, type ReactNode } from "react";

interface InteractiveMediaLoadGateProps {
  readonly onLoad: () => void;
  readonly children?: ReactNode;
  readonly ariaLabel?: string | undefined;
  readonly className?: string | undefined;
  readonly buttonLabel?: string | undefined;
}

export default function InteractiveMediaLoadGate({
  onLoad,
  children,
  ariaLabel = "Load interactive media",
  className,
  buttonLabel = "Tap to load",
}: InteractiveMediaLoadGateProps) {
  const hasBackground = Children.toArray(children).length > 0;

  const wrapperClassName = [
    "tw-relative tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center",
    className,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return (
    <div className={wrapperClassName}>
      {hasBackground ? (
        <>
          <div className="tw-h-full tw-w-full">{children}</div>
          <div
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-iron-950/20"
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="tw-absolute tw-inset-0 tw-bg-iron-950/30"
        />
      )}
      <button
        type="button"
        onClick={onLoad}
        className="tw-absolute tw-inset-0 tw-z-10 tw-flex tw-items-center tw-justify-center tw-bg-transparent"
        aria-label={ariaLabel}
      >
        <span className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border tw-border-white/20 tw-bg-iron-950/90 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-shadow-[0_16px_40px_rgba(0,0,0,0.65)] tw-ring-1 tw-ring-white/10 tw-transition hover:tw-bg-iron-900">
          <InteractiveIcon className="tw-size-4 tw-flex-shrink-0" />
          {buttonLabel}
        </span>
      </button>
    </div>
  );
}
