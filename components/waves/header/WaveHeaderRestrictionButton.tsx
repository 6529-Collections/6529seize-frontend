"use client";

import clsx from "clsx";
import { useId, type ReactNode } from "react";
import HoverCard from "@/components/utils/tooltip/HoverCard";

interface WaveHeaderRestrictionButtonProps {
  readonly label: string;
  readonly reason: string;
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly "data-testid"?: string | undefined;
  readonly "data-full-width"?: string | undefined;
}

export default function WaveHeaderRestrictionButton({
  label,
  reason,
  children,
  className,
  "data-testid": testId,
  "data-full-width": fullWidth,
}: WaveHeaderRestrictionButtonProps) {
  const reasonId = useId();

  return (
    <HoverCard
      ariaLabel={label}
      content={
        <div className="tw-w-[min(82vw,18rem)] tw-p-1">
          <p className="tw-mb-0 tw-text-xs tw-font-semibold tw-text-iron-100">
            {label}
          </p>
          <p className="tw-mb-0 tw-mt-1.5 tw-text-xs tw-leading-5 tw-text-iron-400">
            {reason}
          </p>
        </div>
      }
      placement="auto"
      delayShow={150}
      delayHide={0}
      offset={10}
      openOnClick={true}
      triggerDisplay="inline-flex"
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={reasonId}
        aria-haspopup="dialog"
        data-testid={testId}
        data-full-width={fullWidth}
        className={clsx(
          "tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-gap-x-1.5 tw-transition tw-duration-150 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400",
          className
        )}
      >
        {children}
        <span id={reasonId} className="tw-sr-only">
          {reason}
        </span>
      </button>
    </HoverCard>
  );
}
