"use client";

import type { YoutubePreviewData } from "../../../../services/youtube-preview";
import ChatItemHrefButtons from "../../../waves/ChatItemHrefButtons";

interface YouTubePreviewProps {
  readonly href: string;
  readonly preview: YoutubePreviewData;
}

export default function YouTubePreview({
  href,
  preview,
}: YouTubePreviewProps) {
  const title = preview.title?.trim() || "YouTube Video";
  const authorName = preview.authorName?.trim();
  const providerLabel = preview.providerName || "YouTube";

  return (
    <div className="tw-flex tw-w-full tw-items-stretch tw-gap-x-1">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="tw-flex-1 tw-min-w-0 tw-no-underline tw-text-current"
      >
        <div className="tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-500">
          <div className="tw-relative tw-aspect-video tw-bg-iron-900">
            {preview.thumbnailUrl ? (
              <img
                src={preview.thumbnailUrl}
                alt={title}
                loading="lazy"
                className="tw-h-full tw-w-full tw-object-cover"
              />
            ) : (
              <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-iron-900">
                <span className="tw-text-sm tw-font-medium tw-text-iron-400">
                  {providerLabel}
                </span>
              </div>
            )}
            <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
              <div className="tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-full tw-bg-black/70">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="tw-h-6 tw-w-6 tw-text-iron-50"
                  aria-hidden="true"
                >
                  <path d="M8.25 5.469a.75.75 0 0 1 1.125-.65l8 4.531a.75.75 0 0 1 0 1.3l-8 4.531a.75.75 0 0 1-1.125-.65V5.47Z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="tw-flex tw-flex-col tw-gap-y-1 tw-p-4">
            <span className="tw-text-sm tw-font-semibold tw-leading-snug tw-text-iron-50 tw-break-words">
              {title}
            </span>
            {authorName && (
              <span className="tw-text-xs tw-text-iron-400 tw-truncate" title={authorName}>
                {authorName}
              </span>
            )}
          </div>
        </div>
      </a>
      <ChatItemHrefButtons href={href} />
    </div>
  );
}
