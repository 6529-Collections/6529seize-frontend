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
  const normalizedPercentage = Number.isFinite(percentage)
    ? Math.min(Math.max(percentage, 0), 100)
    : null;

  const [isCompleted, setIsCompleted] = useState(false);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  async function startDownload() {
    const filename = props.extension
      ? `${props.name}.${props.extension}`
      : props.name;
    download(props.href, filename);
  }

  useEffect(() => {
    if (normalizedPercentage === 100 && showProgress) {
      setIsCompleted(true);
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
      completionTimeoutRef.current = setTimeout(() => {
        setIsCompleted(false);
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

  const renderContent = () => {
    if (isCompleted) {
      return (
        <div
          className="tw-inline-flex tw-h-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border-0 tw-bg-iron-900 tw-px-3 tw-text-white tw-transition tw-duration-300 tw-ease-out"
          aria-label="Download complete"
        >
          <span className="tw-text-sm tw-font-medium tw-leading-[2.25rem]">
            Complete
          </span>
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-cursor-pointer tw-text-white"
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
            className="tw-flex tw-cursor-pointer tw-items-center tw-gap-1.5 tw-border-0 tw-bg-transparent tw-text-xs tw-font-medium tw-text-white/40 tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-white"
            aria-label="Download file"
            type="button"
          >
            <ArrowDownTrayIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
            <span
              className={props.alwaysShowText ? "" : "tw-hidden sm:tw-inline"}
            >
              Download
            </span>
          </button>
        );
      }
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            startDownload();
          }}
          className="tw-inline-flex tw-size-9 tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-900 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-iron-800"
          aria-label="Download file"
          type="button"
        >
          <FontAwesomeIcon
            icon={faDownload}
            className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-white"
          />
        </button>
      );
    }

    return (
      <div
        className="tw-inline-flex tw-h-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border-0 tw-bg-iron-900 tw-px-3 tw-text-white tw-transition tw-duration-300 tw-ease-out"
        aria-label="Downloading file"
      >
        <span className="tw-text-sm tw-font-medium tw-leading-[2.25rem]">
          {normalizedPercentage === null
            ? "Downloading..."
            : `Downloading ${normalizedPercentage}%`}
        </span>
        <FontAwesomeIcon
          icon={faXmarkCircle}
          className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-cursor-pointer tw-text-white"
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
