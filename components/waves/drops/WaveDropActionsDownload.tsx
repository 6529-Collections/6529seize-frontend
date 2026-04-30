"use client";

import { shareFetchedBlobInNativeApp } from "@/helpers/capacitorBlobDownload.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import useDownloader from "react-use-downloader";

interface Props {
  href: string;
  name: string;
  extension: string;
  showProgress?: boolean | undefined;
  className?: string | undefined;
  tooltipId?: string | undefined;
  isDropdownItem?: boolean | undefined;
  isMobile?: boolean | undefined;
  onDownload?: (() => void) | undefined;
}

export default function WaveDropActionsDownload(props: Readonly<Props>) {
  const { percentage, download, cancel, isInProgress } = useDownloader();
  const { isCapacitor } = useCapacitor();
  const showProgress = props.showProgress ?? true;
  const isDropdownItem = props.isDropdownItem ?? false;
  const isMobile = props.isMobile ?? false;

  const [isCompleted, setIsCompleted] = useState(false);
  const [isMobileDownloading, setIsMobileDownloading] = useState(false);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mobileDownloadAbortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const getFilename = () =>
    props.extension ? `${props.name}.${props.extension}` : props.name;

  function startDownload() {
    download(props.href, getFilename());
  }

  async function startMobileDownload() {
    if (isMobileDownloading) {
      return;
    }

    setIsMobileDownloading(true);
    const controller = new AbortController();
    mobileDownloadAbortRef.current = controller;
    const filename = getFilename();

    try {
      const response = await fetch(props.href, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error("Unable to download media.");
      }

      const blob = await response.blob();
      if (isCapacitor) {
        await shareFetchedBlobInNativeApp(blob, filename, {
          dialogTitle: "Save media",
        });
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = filename;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      if (
        controller.signal.aborted ||
        mobileDownloadAbortRef.current !== controller
      ) {
        return;
      }
      const anchor = document.createElement("a");
      anchor.href = props.href;
      anchor.download = filename;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      if (mobileDownloadAbortRef.current === controller) {
        mobileDownloadAbortRef.current = null;
      }
      if (isMountedRef.current) {
        setIsMobileDownloading(false);
      }
    }
  }

  function handleDownloadClick() {
    if (isMobile) {
      props.onDownload?.();
      void startMobileDownload();
      return;
    }

    if (isInProgress) {
      cancel();
    } else {
      startDownload();
      props.onDownload?.();
    }
  }

  useEffect(() => {
    if (percentage === 100 && showProgress) {
      setIsCompleted(true);
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
      completionTimeoutRef.current = setTimeout(() => {
        setIsCompleted(false);
        completionTimeoutRef.current = null;
      }, 1500);
    }
  }, [percentage, showProgress]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  const getTooltipText = () => {
    if (isCompleted) return "Downloaded!";
    if (isMobileDownloading) return "Downloading";
    if (isInProgress && showProgress) return `Downloading ${percentage}%`;
    return "Download media";
  };

  const renderIcon = (size: "sm" | "md" = "md") => {
    const iconClass = size === "sm" ? "tw-w-4 tw-h-4" : "tw-w-5 tw-h-5";
    if (isCompleted) {
      return (
        <CheckCircleIcon
          className={`tw-flex-shrink-0 ${iconClass} tw-text-emerald-500`}
        />
      );
    }
    if ((isInProgress && showProgress) || isMobileDownloading) {
      return (
        <svg
          className={`${iconClass} tw-flex-shrink-0 tw-animate-spin tw-text-iron-500`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
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
      );
    }
    return <ArrowDownTrayIcon className={`tw-flex-shrink-0 ${iconClass}`} />;
  };

  if (isMobile) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDownloadClick();
        }}
        disabled={isMobileDownloading || isCompleted}
        className="tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-transition-colors tw-duration-200 active:tw-bg-iron-800 disabled:tw-cursor-default disabled:tw-opacity-70"
        type="button"
      >
        {renderIcon()}
        <span className="tw-text-base tw-font-semibold tw-text-iron-300">
          {getTooltipText()}
        </span>
      </button>
    );
  }

  if (isDropdownItem) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDownloadClick();
        }}
        disabled={isCompleted}
        className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-iron-300 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
        type="button"
      >
        {renderIcon("sm")}
        <span className="tw-text-sm tw-font-medium">{getTooltipText()}</span>
      </button>
    );
  }

  return (
    <>
      <button
        className="tw-group tw-flex tw-h-full tw-cursor-pointer tw-items-center tw-gap-x-2 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-2 tw-text-[0.8125rem] tw-font-medium tw-leading-5 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-50"
        onClick={(e) => {
          e.stopPropagation();
          if (isInProgress) {
            cancel();
          } else {
            startDownload();
          }
        }}
        disabled={isCompleted}
        aria-label="Download file"
        {...(props.tooltipId && { "data-tooltip-id": props.tooltipId })}
        type="button"
      >
        {renderIcon()}
      </button>
      {props.tooltipId && (
        <Tooltip
          id={props.tooltipId}
          place="top"
          offset={8}
          opacity={1}
          style={{
            padding: "4px 8px",
            background: "#37373E",
            color: "white",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "6px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            zIndex: 99999,
            pointerEvents: "none",
          }}
        >
          <span className="tw-text-xs">{getTooltipText()}</span>
        </Tooltip>
      )}
    </>
  );
}
