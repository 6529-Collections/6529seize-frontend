"use client";

import React, { useEffect, useRef, useState } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { Tooltip } from "react-tooltip";
import useDownloader from "react-use-downloader";
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface WaveDropActionsDownloadProps {
  readonly drop: ExtendedDrop;
}

export default function WaveDropActionsDownload({
  drop,
}: WaveDropActionsDownloadProps) {
  // All hooks must be called before any early returns
  const { percentage, download, cancel, isInProgress } = useDownloader();
  const [isCompleted, setIsCompleted] = useState(false);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (percentage === 100) {
      setIsCompleted(true);
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
      completionTimeoutRef.current = setTimeout(() => {
        setIsCompleted(false);
        completionTimeoutRef.current = null;
      }, 1500);
    }
  }, [percentage]);

  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  // Find first media (any type) in drop parts
  const media = drop.parts?.find((part) => part.media && part.media.length > 0)
    ?.media?.[0];

  // Early returns after all hooks are established
  if (!media?.url) {
    return null;
  }

  const startDownload = async () => {
    const fileName = getDownloadFileName(drop, media);
    const extension = getFileExtension(media);
    const fullFileName = extension ? `${fileName}.${extension}` : fileName;
    download(media.url, fullFileName);
  };

  const renderContent = () => {
    if (isCompleted) {
      return (
        <CheckCircleIcon className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300 tw-text-emerald-600" />
      );
    }

    if (!isInProgress) {
      return (
        <ArrowDownTrayIcon className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300" />
      );
    }

    return (
      <svg
        className="tw-w-5 tw-h-5 tw-text-iron-500 tw-animate-spin tw-flex-shrink-0"
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
  };

  const getTooltipText = () => {
    if (isCompleted) return "Downloaded!";
    if (isInProgress) return `Downloading ${percentage}%`;
    return "Download media";
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
        aria-label="Download media"
        data-tooltip-id={`download-media-${drop.id}`}
      >
        {renderContent()}
      </button>

      <Tooltip
        id={`download-media-${drop.id}`}
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        <span className="tw-text-xs">{getTooltipText()}</span>
      </Tooltip>
    </>
  );
}

function getDownloadFileName(drop: ExtendedDrop, media: any): string {
  // Simple naming pattern like Download.tsx - just use serial number
  return `media-${drop.serial_no}`;
}

function getFileExtension(media: any): string {
  // Extract extension from URL, same logic as Download.tsx getFileInfoFromUrl
  const urlExtension = media.url?.match(/\.([^./?]+)(?:[?#]|$)/)?.[1];
  return urlExtension || 'file';
}
