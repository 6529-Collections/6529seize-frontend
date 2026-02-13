"use client";

import {
  useDropCurationMutation,
  type DropCurationTarget,
} from "@/hooks/drops/useDropCurationMutation";
import type { MouseEvent } from "react";

interface DropCurationButtonProps extends DropCurationTarget {
  readonly className?: string | undefined;
}

export default function DropCurationButton({
  dropId,
  waveId,
  isCuratable,
  isCurated,
  className,
}: DropCurationButtonProps) {
  const { toggleCuration, isPending } = useDropCurationMutation();
  const isTemporaryDrop = dropId.startsWith("temp-");
  const isDisabled = isPending || isTemporaryDrop;

  if (!isCuratable) {
    return null;
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    toggleCuration({
      dropId,
      waveId,
      isCuratable,
      isCurated,
    });
  };

  return (
    <button
      type="button"
      className={`tw-flex tw-items-center tw-justify-center tw-gap-x-1 tw-whitespace-nowrap tw-rounded-md tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-transition-all tw-duration-300 tw-ease-out ${
        isCurated
          ? "tw-text-primary-200 tw-border-primary-400/30 tw-bg-primary-500/10 desktop-hover:hover:tw-bg-primary-500/15"
          : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-400 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-text-iron-200"
      } ${isDisabled ? "tw-cursor-wait tw-opacity-70" : "tw-cursor-pointer"} ${
        className ?? ""
      }`}
      onClick={handleClick}
      disabled={isDisabled}
      aria-pressed={isCurated}
      aria-label={isCurated ? "Remove curation from drop" : "Curate drop"}
    >
      {isCurated && (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="-tw-ml-1 tw-size-3.5 tw-flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span>{isCurated ? "Curated" : "Curate"}</span>
    </button>
  );
}
