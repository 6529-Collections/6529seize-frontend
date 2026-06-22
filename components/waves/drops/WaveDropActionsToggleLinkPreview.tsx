"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import type { MouseEvent } from "react";
import { Tooltip } from "react-tooltip";
import { useDropLinkPreviewToggleControl } from "./useDropLinkPreviewToggleControl";

interface WaveDropActionsToggleLinkPreviewProps {
  readonly drop: ApiDrop;
  readonly isMobile?: boolean | undefined;
  readonly onToggle?: (() => void) | undefined;
}

const getMobileLabel = (isHidden: boolean): string =>
  isHidden ? "Show Link Previews" : "Hide Link Previews";

export default function WaveDropActionsToggleLinkPreview({
  drop,
  isMobile = false,
  onToggle,
}: WaveDropActionsToggleLinkPreviewProps) {
  const previewToggle = useDropLinkPreviewToggleControl(drop);

  if (!previewToggle) {
    return null;
  }

  const isDisabled = previewToggle.isLoading || !previewToggle.canToggle;
  const Icon = previewToggle.isHidden ? EyeIcon : EyeSlashIcon;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isDisabled) {
      return;
    }

    previewToggle.onToggle(!previewToggle.isHidden);
    onToggle?.();
  };

  if (isMobile) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={`tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 ${
          isDisabled
            ? "tw-cursor-default tw-opacity-50"
            : "active:tw-bg-iron-800"
        } tw-transition-colors tw-duration-200`}
      >
        <Icon
          className="tw-size-5 tw-flex-shrink-0 tw-text-iron-300"
          aria-hidden="true"
        />
        <span className="tw-text-base tw-font-semibold tw-text-iron-300">
          {getMobileLabel(previewToggle.isHidden)}
        </span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={previewToggle.label}
        data-tooltip-id={`toggle-link-preview-${drop.id}`}
        className={`tw-group tw-flex tw-h-full tw-cursor-pointer tw-items-center tw-gap-x-1.5 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-50 ${
          isDisabled ? "tw-opacity-50" : ""
        }`}
      >
        <Icon
          className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-transition tw-duration-300 tw-ease-out"
          aria-hidden="true"
        />
      </button>
      <Tooltip
        id={`toggle-link-preview-${drop.id}`}
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        <span className="tw-text-xs">{previewToggle.label}</span>
      </Tooltip>
    </>
  );
}
