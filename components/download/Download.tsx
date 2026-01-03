"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useDownloader from "react-use-downloader";
import styles from "./Download.module.scss";
import {
  faDownload,
  faXmarkCircle,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface Props {
  href: string;
  name: string;
  extension: string;
  showProgress?: boolean | undefined;
  className?: string | undefined;
  variant?: "default" | "text" | undefined;
  alwaysShowText?: boolean | undefined;
}

export default function Download(props: Readonly<Props>) {
  const { percentage, download, cancel, isInProgress } = useDownloader();
  const showProgress = props.showProgress ?? true;
  const variant = props.variant ?? "default";

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

  const renderContent = () => {
    if (isCompleted) {
      return (
        <div
          className="tw-bg-iron-900 tw-rounded-full tw-h-9 tw-flex-shrink-0 tw-inline-flex tw-items-center tw-justify-center tw-transition tw-duration-300 tw-ease-out tw-border-0 tw-text-white tw-gap-2 tw-px-3"
          aria-label="Download complete">
          <span className="tw-leading-[2.25rem] tw-text-sm tw-font-medium">
            Complete
          </span>
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="tw-text-white tw-w-5 tw-h-5 tw-flex-shrink-0 tw-cursor-pointer"
            onClick={() => setIsCompleted(false)}
          />
        </div>
      );
    }

    if (!isInProgress || !showProgress) {
      if (variant === "text") {
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              startDownload();
            }}
            className="tw-bg-transparent tw-border-0 tw-text-white/40 desktop-hover:hover:tw-text-white tw-transition-colors tw-duration-300 tw-flex tw-items-center tw-gap-1.5 tw-cursor-pointer tw-text-xs tw-font-medium"
            aria-label="Download file"
            type="button">
            <ArrowDownTrayIcon className="tw-w-4 tw-h-4 tw-flex-shrink-0" />
            <span className={props.alwaysShowText ? "" : "tw-hidden sm:tw-inline"}>Download</span>
          </button>
        );
      }
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            startDownload();
          }}
          className="tw-bg-iron-900 desktop-hover:hover:tw-bg-iron-800 tw-rounded-full tw-size-9 tw-flex-shrink-0 tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-transition tw-duration-300 tw-ease-out tw-border-0"
          aria-label="Download file"
          type="button">
          <FontAwesomeIcon
            icon={faDownload}
            className="tw-text-white tw-w-4 tw-h-4 tw-flex-shrink-0"
          />
        </button>
      );
    }

    return (
      <div
        className="tw-bg-iron-900 tw-rounded-full tw-h-9 tw-flex-shrink-0 tw-inline-flex tw-items-center tw-justify-center tw-transition tw-duration-300 tw-ease-out tw-border-0 tw-text-white tw-gap-2 tw-px-3"
        aria-label="Downloading file">
        <span className="tw-leading-[2.25rem] tw-text-sm tw-font-medium">
          Downloading {percentage}%
        </span>
        <FontAwesomeIcon
          icon={faXmarkCircle}
          className="tw-text-white tw-w-5 tw-h-5 tw-flex-shrink-0 tw-cursor-pointer"
          onClick={() => cancel()}
        />
      </div>
    );
  };

  return (
    <div className={`${styles["download"]} ${props.className ?? ""}`}>
      {renderContent()}
    </div>
  );
}
