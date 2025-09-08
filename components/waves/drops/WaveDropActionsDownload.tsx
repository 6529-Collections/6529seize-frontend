"use client";

import { useEffect, useRef, useState } from "react";
import useDownloader from "react-use-downloader";
import { Tooltip } from "react-tooltip";
import { ArrowDownTrayIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface Props {
  href: string;
  name: string;
  extension: string;
  showProgress?: boolean;
  className?: string;
  tooltipId?: string;
}

export default function WaveDropActionsDownload(props: Readonly<Props>) {
  const { percentage, download, cancel, isInProgress } = useDownloader();
  const showProgress = props.showProgress ?? true;

  const [isCompleted, setIsCompleted] = useState(false);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  async function startDownload() {
    const filename = props.extension
      ? `${props.name}.${props.extension}`
      : props.name;
    download(props.href, filename);
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
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  const getTooltipText = () => {
    if (isCompleted) return "Downloaded!";
    if (isInProgress && showProgress) return `Downloading ${percentage}%`;
    return "Download media";
  };

  const renderIcon = () => {
    if (isCompleted) {
      return (
        <CheckCircleIcon className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-emerald-600" />
      );
    }
    if (isInProgress && showProgress) {
      return (
        <svg
          className="tw-w-5 tw-h-5 tw-text-iron-500 tw-animate-spin tw-flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24">
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
    return (
      <ArrowDownTrayIcon className="tw-flex-shrink-0 tw-w-5 tw-h-5" />
    );
  };

  return (
    <>
      <button
        className="tw-text-iron-400 desktop-hover:hover:tw-text-iron-50 tw-px-2 tw-h-full tw-group tw-bg-transparent tw-rounded-full tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300 tw-cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (!isInProgress) {
            startDownload();
          } else {
            cancel();
          }
        }}
        disabled={isCompleted}
        aria-label="Download file"
        data-tooltip-id={props.tooltipId ?? undefined}
        type="button">
        {renderIcon()}
      </button>
      {props.tooltipId && (
        <Tooltip
          id={props.tooltipId}
          place="top"
          style={{
            backgroundColor: "#1F2937",
            color: "white",
            padding: "4px 8px",
          }}>
          <span className="tw-text-xs">{getTooltipText()}</span>
        </Tooltip>
      )}
    </>
  );
}
