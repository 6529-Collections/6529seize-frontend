"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { EyeIcon } from "@heroicons/react/24/outline";
import type { MouseEvent } from "react";
import { useDropLinkPreviewToggleControl } from "./useDropLinkPreviewToggleControl";

interface WaveDropActionsRestoreLinkPreviewsProps {
  readonly drop: ApiDrop;
  readonly onRestored?: (() => void) | undefined;
}

export default function WaveDropActionsRestoreLinkPreviews({
  drop,
  onRestored,
}: WaveDropActionsRestoreLinkPreviewsProps) {
  const previewToggle = useDropLinkPreviewToggleControl(drop);

  if (!previewToggle?.isHidden) {
    return null;
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (previewToggle.isLoading || !previewToggle.canToggle) {
      return;
    }

    previewToggle.onToggle();
    onRestored?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={previewToggle.isLoading || !previewToggle.canToggle}
      className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-iron-300 tw-transition-colors tw-duration-200 disabled:tw-cursor-default disabled:tw-opacity-60 desktop-hover:hover:tw-bg-iron-800"
      aria-label="Restore link previews"
    >
      {previewToggle.isLoading ? (
        <svg
          className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="tw-opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="tw-opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <EyeIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
      )}
      <span className="tw-text-sm tw-font-medium">Restore link previews</span>
    </button>
  );
}
