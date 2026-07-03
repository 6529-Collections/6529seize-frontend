"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useDownloader from "@/hooks/useDownloader";
import {
  faDownload,
  faXmarkCircle,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { type MouseEvent, useEffect, useReducer, useRef } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface Props {
  href: string;
  name: string;
  extension: string;
  showProgress?: boolean | undefined;
  className?: string | undefined;
  variant?: "default" | "text" | undefined;
  alwaysShowText?: boolean | undefined;
  labels?: Partial<DownloadLabels> | undefined;
}

export type DownloadLabels = {
  readonly cancelDownload: string;
  readonly complete: string;
  readonly dismissComplete: string;
  readonly download: string;
  readonly downloadComplete: string;
  readonly downloadFile: string;
  readonly downloading: string;
  readonly downloadingFile: string;
  readonly downloadingProgress: (percentage: number) => string;
};

const DEFAULT_DOWNLOAD_LABELS: DownloadLabels = {
  cancelDownload: "Cancel download",
  complete: "Complete",
  dismissComplete: "Dismiss download complete",
  download: "Download",
  downloadComplete: "Download complete",
  downloadFile: "Download file",
  downloading: "Downloading...",
  downloadingFile: "Downloading file",
  downloadingProgress: (percentage) => `Downloading ${percentage}%`,
};

function getDownloadLabels(
  labels: Partial<DownloadLabels> | undefined
): DownloadLabels {
  return {
    cancelDownload:
      labels?.cancelDownload ?? DEFAULT_DOWNLOAD_LABELS.cancelDownload,
    complete: labels?.complete ?? DEFAULT_DOWNLOAD_LABELS.complete,
    dismissComplete:
      labels?.dismissComplete ?? DEFAULT_DOWNLOAD_LABELS.dismissComplete,
    download: labels?.download ?? DEFAULT_DOWNLOAD_LABELS.download,
    downloadComplete:
      labels?.downloadComplete ?? DEFAULT_DOWNLOAD_LABELS.downloadComplete,
    downloadFile: labels?.downloadFile ?? DEFAULT_DOWNLOAD_LABELS.downloadFile,
    downloading: labels?.downloading ?? DEFAULT_DOWNLOAD_LABELS.downloading,
    downloadingFile:
      labels?.downloadingFile ?? DEFAULT_DOWNLOAD_LABELS.downloadingFile,
    downloadingProgress:
      labels?.downloadingProgress ??
      DEFAULT_DOWNLOAD_LABELS.downloadingProgress,
  };
}

type CompletionAction = "show" | "hide";

function completionReducer(
  _isCompleted: boolean,
  action: CompletionAction
): boolean {
  return action === "show";
}

type DownloadContentProps = {
  readonly alwaysShowText?: boolean | undefined;
  readonly isCompleted: boolean;
  readonly isInProgress: boolean;
  readonly labels: DownloadLabels;
  readonly normalizedPercentage: number | null;
  readonly onCancel: () => void;
  readonly onDismissComplete: () => void;
  readonly onStartDownload: () => void;
  readonly showProgress: boolean;
  readonly variant: "default" | "text";
};

function DownloadContent({
  alwaysShowText,
  isCompleted,
  isInProgress,
  labels,
  normalizedPercentage,
  onCancel,
  onDismissComplete,
  onStartDownload,
  showProgress,
  variant,
}: DownloadContentProps) {
  function handleDownloadClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onStartDownload();
  }

  if (isCompleted) {
    return (
      <div
        className="tw-inline-flex tw-h-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border-0 tw-bg-iron-900 tw-px-3 tw-text-white tw-transition tw-duration-300 tw-ease-out"
        aria-label={labels.downloadComplete}
      >
        <span className="tw-text-sm tw-font-medium tw-leading-[2.25rem]">
          {labels.complete}
        </span>
        <button
          aria-label={labels.dismissComplete}
          type="button"
          onClick={onDismissComplete}
          className="tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-white"
        >
          <FontAwesomeIcon
            aria-hidden="true"
            icon={faCheckCircle}
            className="tw-h-5 tw-w-5 tw-flex-shrink-0"
          />
        </button>
      </div>
    );
  }

  if (!isInProgress || !showProgress) {
    if (variant === "text") {
      return (
        <button
          onClick={handleDownloadClick}
          className="tw-flex tw-min-h-6 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-border-0 tw-bg-transparent tw-text-xs tw-font-medium tw-text-iron-500 tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-100"
          aria-label={labels.downloadFile}
          type="button"
        >
          <ArrowDownTrayIcon
            aria-hidden="true"
            className="tw-h-4 tw-w-4 tw-flex-shrink-0"
          />
          <span className={alwaysShowText ? "" : "tw-hidden sm:tw-inline"}>
            {labels.download}
          </span>
        </button>
      );
    }

    return (
      <button
        onClick={handleDownloadClick}
        className="tw-inline-flex tw-size-9 tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-900 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-800"
        aria-label={labels.downloadFile}
        type="button"
      >
        <FontAwesomeIcon
          aria-hidden="true"
          icon={faDownload}
          className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-white"
        />
      </button>
    );
  }

  return (
    <div
      className="tw-inline-flex tw-h-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border-0 tw-bg-iron-900 tw-px-3 tw-text-white tw-transition tw-duration-300 tw-ease-out"
      aria-label={labels.downloadingFile}
    >
      <span className="tw-text-sm tw-font-medium tw-leading-[2.25rem]">
        {normalizedPercentage === null
          ? labels.downloading
          : labels.downloadingProgress(normalizedPercentage)}
      </span>
      <button
        aria-label={labels.cancelDownload}
        type="button"
        onClick={onCancel}
        className="tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-white"
      >
        <FontAwesomeIcon
          aria-hidden="true"
          icon={faXmarkCircle}
          className="tw-h-5 tw-w-5 tw-flex-shrink-0"
        />
      </button>
    </div>
  );
}

export default function Download(props: Readonly<Props>) {
  const { percentage, download, cancel, isInProgress } = useDownloader();
  const showProgress = props.showProgress ?? true;
  const variant = props.variant ?? "default";
  const labels = getDownloadLabels(props.labels);
  const normalizedPercentage = Number.isFinite(percentage)
    ? Math.min(Math.max(percentage, 0), 100)
    : null;

  const [isCompleted, dispatchCompletion] = useReducer(
    completionReducer,
    false
  );
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function startDownload() {
    const filename = props.extension
      ? `${props.name}.${props.extension}`
      : props.name;
    download(props.href, filename);
  }

  useEffect(() => {
    if (normalizedPercentage === 100 && showProgress) {
      dispatchCompletion("show");
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
      completionTimeoutRef.current = setTimeout(() => {
        dispatchCompletion("hide");
        completionTimeoutRef.current = null;
      }, 1500);
    }
  }, [normalizedPercentage, showProgress]);

  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`tw-inline-block ${props.className ?? ""}`}>
      <DownloadContent
        alwaysShowText={props.alwaysShowText}
        isCompleted={isCompleted}
        isInProgress={isInProgress}
        labels={labels}
        normalizedPercentage={normalizedPercentage}
        onCancel={cancel}
        onDismissComplete={() => dispatchCompletion("hide")}
        onStartDownload={startDownload}
        showProgress={showProgress}
        variant={variant}
      />
    </div>
  );
}
