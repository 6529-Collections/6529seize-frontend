"use client";

import Link from "next/link";
import {
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
  useState,
} from "react";

import { useLinkPreviewContext } from "./LinkPreviewContext";

type StopEvent =
  | MouseEvent<HTMLElement>
  | PointerEvent<HTMLElement>
  | TouchEvent<HTMLElement>;

const stopPropagation = (event: StopEvent) => {
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation?.();
};

export default function ChatItemHrefButtons({
  href,
  relativeHref,
  hideLink = false,
}: {
  href: string;
  relativeHref?: string | undefined;
  hideLink?: boolean | undefined;
}) {
  const { previewToggle } = useLinkPreviewContext();
  const [copied, setCopied] = useState(false);
  const showPreviewToggle = Boolean(previewToggle && !previewToggle.isHidden);

  const toggleLinkPreviews = (event: MouseEvent<HTMLButtonElement>) => {
    stopPropagation(event);
    if (!previewToggle || previewToggle.isLoading || !previewToggle.canToggle) {
      return;
    }
    previewToggle.onToggle();
  };

  const copyToClipboard = (event: MouseEvent<HTMLButtonElement>) => {
    stopPropagation(event);
    navigator.clipboard.writeText(href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 500);
    });
  };

  return (
    <div className="tw-mt-1 tw-flex tw-h-full tw-flex-col tw-justify-start tw-gap-y-2">
      {showPreviewToggle && (
        <button
          type="button"
          className={`tw-flex tw-items-center tw-gap-x-2 tw-rounded-xl tw-border-0 tw-bg-iron-900 tw-p-2 ${
            previewToggle?.isLoading || !previewToggle?.canToggle
              ? "tw-cursor-default tw-opacity-60"
              : "hover:tw-text-iron-400"
          }`}
          aria-label={previewToggle?.label}
          disabled={previewToggle?.isLoading ?? !previewToggle?.canToggle}
          onClick={toggleLinkPreviews}
          onPointerDown={stopPropagation}
          onMouseDown={stopPropagation}
          onTouchStart={stopPropagation}
        >
          {previewToggle?.isLoading ? (
            <svg
              className="tw-h-4 tw-w-4 tw-animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg
              className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 6.75C3 5.7835 3.7835 5 4.75 5H19.25C20.2165 5 21 5.7835 21 6.75V17.25C21 18.2165 20.2165 19 19.25 19H4.75C3.7835 19 3 18.2165 3 17.25V6.75Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M6.25 8.5H17.75"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M6.25 12.25H11.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M6.25 15.5H11.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M14 12H18V16H14V12Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M4 4L20 20"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      )}
      <button
        type="button"
        className={`tw-flex tw-items-center tw-gap-x-2 tw-rounded-xl tw-border-0 tw-bg-iron-900 tw-p-2 hover:tw-text-iron-400`}
        onClick={copyToClipboard}
        onPointerDown={stopPropagation}
        onMouseDown={stopPropagation}
        onTouchStart={stopPropagation}
      >
        <svg
          className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition tw-duration-300 tw-ease-out`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke={copied ? "#27ae60" : "currentColor"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
          />
        </svg>
      </button>
      {!hideLink && (
        <Link
          href={relativeHref ?? href}
          target={relativeHref ? undefined : "_blank"}
          className={`tw-flex tw-items-center tw-gap-x-2 tw-rounded-xl tw-border-0 tw-bg-iron-900 tw-p-2`}
          onClick={stopPropagation}
          onPointerDown={stopPropagation}
          onMouseDown={stopPropagation}
          onTouchStart={stopPropagation}
        >
          <svg
            className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition tw-duration-300 tw-ease-out`}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            strokeWidth="3"
            stroke="currentColor"
            fill="none"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <path d="M55.4,32V53.58a1.81,1.81,0,0,1-1.82,1.82H10.42A1.81,1.81,0,0,1,8.6,53.58V10.42A1.81,1.81,0,0,1,10.42,8.6H32"></path>
              <polyline points="40.32 8.6 55.4 8.6 55.4 24.18"></polyline>
              <line x1="19.32" y1="45.72" x2="54.61" y2="8.91"></line>
            </g>
          </svg>
        </Link>
      )}
    </div>
  );
}
