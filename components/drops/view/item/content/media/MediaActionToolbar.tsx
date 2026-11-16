"use client";

import { useFullScreenSupported } from "@/hooks/useFullScreenSupported";
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import type React from "react";
import IconButton from "@/components/utils/button/IconButton";
import { SURFACED_ICON_BUTTON_SURFACE_CLASSES } from "@/components/utils/button/iconButtonStyles";

const INLINE_MEDIA_ACTIONS_REVEAL_CLASS =
  "tw-hidden desktop-hover:tw-flex desktop-hover:tw-pointer-events-none desktop-hover:tw-opacity-0 desktop-hover:tw-transition-opacity desktop-hover:tw-duration-200 desktop-hover:group-hover/media:tw-pointer-events-auto desktop-hover:group-hover/media:tw-opacity-100 group-focus-within/media:tw-flex group-focus-within/media:tw-pointer-events-auto group-focus-within/media:tw-opacity-100 motion-reduce:tw-transition-none";

type MediaActionLabels = {
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
    <IconButton
      type="button"
      size={36}
      variant="ghost"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </IconButton>
  );
}

function getMediaActionLabels(labels?: MediaActionLabels) {
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
  visibility = "always",
  labels,
  className,
  style,
  children,
}: {
  readonly onDownload?: (() => void) | undefined;
  readonly onOpen?: (() => void) | undefined;
  readonly onFullscreen?: (() => void) | undefined;
  readonly openLabel?: string | undefined;
  readonly isDownloading: boolean;
  readonly fullscreenTargetAvailable?: boolean | undefined;
  readonly variant: "image" | "video" | "html";
  readonly position?: "top-right" | "bottom-right" | undefined;
  readonly visibility?: "always" | "desktop-hover" | undefined;
  readonly labels?: MediaActionLabels | undefined;
  readonly className?: string | undefined;
  readonly style?: React.CSSProperties | undefined;
  readonly children?: React.ReactNode;
}) {
  const actionLabels = getMediaActionLabels(labels);
  const supportsFullScreen = useFullScreenSupported();
  const canFullscreen =
    (variant === "image" || variant === "html") &&
    Boolean(onFullscreen) &&
    Boolean(fullscreenTargetAvailable) &&
    supportsFullScreen;
  const positionClassName =
    position === "bottom-right"
      ? "tw-bottom-[5px] tw-right-[5px]"
      : "tw-right-[5px] tw-top-[5px]";

  return (
    <div
      style={style}
      className={clsx(
        "tw-absolute tw-z-30 tw-overflow-hidden tw-rounded-lg",
        SURFACED_ICON_BUTTON_SURFACE_CLASSES,
        visibility === "desktop-hover"
          ? INLINE_MEDIA_ACTIONS_REVEAL_CLASS
          : "tw-flex",
        positionClassName,
        className
      )}
    >
      {children}
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
  children,
}: {
  readonly onOpen?: (() => void) | undefined;
  readonly onDownload: () => void;
  readonly onFullscreen?: (() => void) | undefined;
  readonly onClose: () => void;
  readonly openLabel?: string | undefined;
  readonly isDownloading: boolean;
  readonly fullscreenTargetAvailable?: boolean | undefined;
  readonly labels?: MediaActionLabels | undefined;
  readonly children?: React.ReactNode;
}) {
  const actionLabels = getMediaActionLabels(labels);
  const supportsFullScreen = useFullScreenSupported();
  const canFullscreen =
    Boolean(onFullscreen) &&
    Boolean(fullscreenTargetAvailable) &&
    supportsFullScreen;

  return (
    <div className="tw-fixed tw-right-4 tw-top-3 tw-z-[1102] tw-flex tw-items-center tw-gap-x-3 tw-pt-[env(safe-area-inset-top,0px)]">
      <div
        className={clsx(
          "tw-flex tw-overflow-hidden tw-rounded-lg",
          SURFACED_ICON_BUTTON_SURFACE_CLASSES
        )}
      >
        {children}
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
      <IconButton
        type="button"
        size={36}
        variant="surfaced"
        aria-label={actionLabels.close}
        title={actionLabels.close}
        onClick={stopAndRun(onClose)}
      >
        <XMarkIcon className="tw-size-5" aria-hidden="true" />
      </IconButton>
    </div>
  );
}
