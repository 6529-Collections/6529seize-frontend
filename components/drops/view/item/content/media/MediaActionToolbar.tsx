"use client";

import { fullScreenSupported } from "@/helpers/Helpers";
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import type React from "react";

const BASE_BUTTON_CLASS =
  "tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-text-iron-100 tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-700 disabled:tw-cursor-default disabled:tw-opacity-60";

export type MediaActionLabels = {
  readonly close?: string | undefined;
  readonly download?: string | undefined;
  readonly downloading?: string | undefined;
  readonly fullscreen?: string | undefined;
};

const DEFAULT_MEDIA_ACTION_LABELS = {
  close: "Close media",
  download: "Download media",
  downloading: "Downloading media",
  fullscreen: "Full screen",
} satisfies Required<MediaActionLabels>;

function ToolbarButton({
  label,
  onClick,
  disabled = false,
  children,
  className,
}: {
  readonly label: string;
  readonly onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  readonly disabled?: boolean | undefined;
  readonly children: React.ReactNode;
  readonly className?: string | undefined;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={clsx(BASE_BUTTON_CLASS, className)}
    >
      {children}
    </button>
  );
}

function getMediaActionLabels(labels?: MediaActionLabels | undefined) {
  return {
    close: labels?.close ?? DEFAULT_MEDIA_ACTION_LABELS.close,
    download: labels?.download ?? DEFAULT_MEDIA_ACTION_LABELS.download,
    downloading: labels?.downloading ?? DEFAULT_MEDIA_ACTION_LABELS.downloading,
    fullscreen: labels?.fullscreen ?? DEFAULT_MEDIA_ACTION_LABELS.fullscreen,
  };
}

const stopAndRun =
  (handler: () => void) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    handler();
  };

export function InlineMediaActions({
  onDownload,
  onOpen,
  onFullscreen,
  openLabel,
  isDownloading,
  fullscreenTargetAvailable,
  variant,
  position = "top-right",
  labels,
}: {
  readonly onDownload?: (() => void) | undefined;
  readonly onOpen?: (() => void) | undefined;
  readonly onFullscreen?: (() => void) | undefined;
  readonly openLabel?: string | undefined;
  readonly isDownloading: boolean;
  readonly fullscreenTargetAvailable?: boolean | undefined;
  readonly variant: "image" | "video" | "html";
  readonly position?: "top-right" | "bottom-right" | undefined;
  readonly labels?: MediaActionLabels | undefined;
}) {
  const actionLabels = getMediaActionLabels(labels);
  const canFullscreen =
    (variant === "image" || variant === "html") &&
    Boolean(onFullscreen) &&
    Boolean(fullscreenTargetAvailable) &&
    fullScreenSupported();
  const positionClassName =
    position === "bottom-right"
      ? "tw-bottom-[5px] tw-right-[5px]"
      : "tw-right-[5px] tw-top-[5px]";

  return (
    <div
      className={clsx(
        "tw-absolute tw-z-30 tw-flex tw-overflow-hidden tw-rounded-lg tw-bg-iron-950/90 tw-shadow-lg tw-shadow-black/20 tw-ring-1 tw-ring-inset tw-ring-iron-700/60 tw-backdrop-blur",
        positionClassName
      )}
    >
      {canFullscreen && (
        <ToolbarButton
          label={actionLabels.fullscreen}
          onClick={stopAndRun(onFullscreen!)}
        >
          <ArrowsPointingOutIcon className="tw-size-4" aria-hidden="true" />
        </ToolbarButton>
      )}
      {onOpen && openLabel && (
        <ToolbarButton label={openLabel} onClick={stopAndRun(onOpen)}>
          <ArrowTopRightOnSquareIcon className="tw-size-4" aria-hidden="true" />
        </ToolbarButton>
      )}
      {onDownload && (
        <ToolbarButton
          label={
            isDownloading ? actionLabels.downloading : actionLabels.download
          }
          onClick={stopAndRun(onDownload)}
          disabled={isDownloading}
        >
          <ArrowDownTrayIcon className="tw-size-4" aria-hidden="true" />
        </ToolbarButton>
      )}
    </div>
  );
}

export function ExpandedMediaToolbar({
  onOpen,
  onDownload,
  onFullscreen,
  onClose,
  openLabel,
  isDownloading,
  fullscreenTargetAvailable,
  labels,
}: {
  readonly onOpen?: (() => void) | undefined;
  readonly onDownload: () => void;
  readonly onFullscreen?: (() => void) | undefined;
  readonly onClose: () => void;
  readonly openLabel?: string | undefined;
  readonly isDownloading: boolean;
  readonly fullscreenTargetAvailable?: boolean | undefined;
  readonly labels?: MediaActionLabels | undefined;
}) {
  const actionLabels = getMediaActionLabels(labels);
  const canFullscreen =
    Boolean(onFullscreen) &&
    Boolean(fullscreenTargetAvailable) &&
    fullScreenSupported();

  return (
    <div className="tw-fixed tw-right-4 tw-top-3 tw-z-[1102] tw-flex tw-items-center tw-gap-x-3 tw-pt-[env(safe-area-inset-top,0px)]">
      <div className="tw-flex tw-overflow-hidden tw-rounded-xl tw-bg-iron-900/95 tw-shadow-lg tw-shadow-black/30 tw-ring-1 tw-ring-inset tw-ring-iron-700/70 tw-backdrop-blur">
        {canFullscreen && (
          <ToolbarButton
            label={actionLabels.fullscreen}
            onClick={stopAndRun(onFullscreen!)}
          >
            <ArrowsPointingOutIcon className="tw-size-5" aria-hidden="true" />
          </ToolbarButton>
        )}
        {onOpen && openLabel && (
          <ToolbarButton label={openLabel} onClick={stopAndRun(onOpen)}>
            <ArrowTopRightOnSquareIcon
              className="tw-size-5"
              aria-hidden="true"
            />
          </ToolbarButton>
        )}
        <ToolbarButton
          label={
            isDownloading ? actionLabels.downloading : actionLabels.download
          }
          onClick={stopAndRun(onDownload)}
          disabled={isDownloading}
        >
          <ArrowDownTrayIcon className="tw-size-5" aria-hidden="true" />
        </ToolbarButton>
      </div>
      <button
        type="button"
        aria-label={actionLabels.close}
        title={actionLabels.close}
        onClick={stopAndRun(onClose)}
        className="tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-xl tw-border-0 tw-bg-iron-900/95 tw-text-iron-100 tw-shadow-lg tw-shadow-black/30 tw-ring-1 tw-ring-inset tw-ring-iron-700/70 tw-backdrop-blur tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-700"
      >
        <XMarkIcon className="tw-size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
