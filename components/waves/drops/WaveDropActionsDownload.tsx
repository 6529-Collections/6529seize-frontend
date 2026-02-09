"use client";

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
  onDownload?: (() => void) | undefined;
}

export default function WaveDropActionsDownload(props: Readonly<Props>) {
  const { percentage, download, cancel, isInProgress } = useDownloader();
  const showProgress = props.showProgress ?? true;
  const isDropdownItem = props.isDropdownItem ?? false;

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

  const renderIcon = (size: "sm" | "md" = "md") => {
    const iconClass = size === "sm" ? "tw-w-4 tw-h-4" : "tw-w-5 tw-h-5";
    if (isCompleted) {
      return (
        <CheckCircleIcon
          className={`tw-flex-shrink-0 ${iconClass} tw-text-emerald-500`}
        />
      );
    }
    if (isInProgress && showProgress) {
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

  const getLabel = () => {
    if (isCompleted) return "Downloaded!";
    if (isInProgress && showProgress) return `Downloading ${percentage}%`;
    return "Download";
  };

  if (isDropdownItem) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!isInProgress) {
            void startDownload();
            props.onDownload?.();
          } else {
            cancel();
          }
        }}
        disabled={isCompleted}
        className="tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-iron-300 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
        type="button"
      >
        {renderIcon("sm")}
        <span className="tw-text-sm tw-font-medium">{getLabel()}</span>
      </button>
    );
  }

  return (
    <>
      <button
        className="tw-group tw-flex tw-h-full tw-cursor-pointer tw-items-center tw-gap-x-2 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-2 tw-text-[0.8125rem] tw-font-medium tw-leading-5 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-50"
        onClick={(e) => {
          e.stopPropagation();
          if (!isInProgress) {
            void startDownload();
          } else {
            cancel();
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
