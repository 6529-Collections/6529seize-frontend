"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ChatItemHrefButtons from "./ChatItemHrefButtons";

export interface YoutubePreview {
  readonly title?: string | null;
  readonly channelTitle?: string | null;
  readonly channelName?: string | null;
  readonly authorName?: string | null;
  readonly thumbnailUrl?: string | null;
  readonly embedHtml?: string | null;
}

interface YouTubePreviewProps {
  readonly href: string;
  readonly preview: YoutubePreview;
}

export default function YouTubePreview({
  href,
  preview,
}: YouTubePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedContainerRef = useRef<HTMLDivElement | null>(null);

  const embedHtml = useMemo(
    () => preview.embedHtml?.trim() ?? "",
    [preview.embedHtml]
  );
  const thumbnailUrl = useMemo(
    () => preview.thumbnailUrl?.trim() ?? "",
    [preview.thumbnailUrl]
  );

  const hasEmbed = embedHtml.length > 0;
  const hasThumbnail = thumbnailUrl.length > 0;

  const displayTitle = useMemo(() => {
    const trimmedTitle = preview.title?.trim();
    return trimmedTitle && trimmedTitle.length > 0 ? trimmedTitle : href;
  }, [preview.title, href]);

  const channelName = useMemo(() => {
    const candidates = [
      preview.channelTitle,
      preview.channelName,
      preview.authorName,
    ];

    for (const candidate of candidates) {
      const trimmed = candidate?.trim();
      if (trimmed && trimmed.length > 0) {
        return trimmed;
      }
    }

    return null;
  }, [preview.channelTitle, preview.channelName, preview.authorName]);

  useEffect(() => {
    setIsPlaying(false);
  }, [href, embedHtml]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const container = embedContainerRef.current;
    if (!container) {
      return;
    }

    const iframe = container.querySelector("iframe");

    if (iframe) {
      iframe.setAttribute("width", "100%");
      iframe.setAttribute("height", "100%");
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "0";
    }
  }, [isPlaying, embedHtml]);

  const handlePlay = () => {
    if (hasEmbed) {
      setIsPlaying(true);
    }
  };

  return (
    <div className="tw-flex tw-w-full tw-items-stretch tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">
        <div className="tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900">
          <div
            className="tw-relative tw-w-full tw-bg-iron-950"
            style={{ paddingBottom: "56.25%" }}
          >
            {isPlaying && hasEmbed ? (
              <div
                ref={embedContainerRef}
                className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-overflow-hidden"
                dangerouslySetInnerHTML={{ __html: embedHtml }}
              />
            ) : hasEmbed ? (
              <button
                type="button"
                onClick={handlePlay}
                className="tw-group tw-absolute tw-inset-0 tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-border-0 tw-bg-iron-950 tw-p-0 tw-text-left tw-transition tw-duration-300 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500"
                aria-label={`Play YouTube video${
                  preview.title ? `: ${preview.title}` : ""
                }`}
              >
                {hasThumbnail ? (
                  <img
                    src={thumbnailUrl}
                    alt={displayTitle}
                    className="tw-h-full tw-w-full tw-object-cover tw-transition tw-duration-300 tw-ease-out group-hover:tw-scale-[1.02]"
                  />
                ) : (
                  <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-iron-950">
                    <span className="tw-rounded tw-bg-iron-900 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-300">
                      Play video
                    </span>
                  </div>
                )}
                <span className="tw-pointer-events-none tw-absolute tw-flex tw-h-14 tw-w-14 tw-items-center tw-justify-center tw-rounded-full tw-bg-black/70 tw-text-white tw-transition tw-duration-300 group-hover:tw-bg-black/80">
                  <svg
                    className="tw-h-5 tw-w-5 tw-translate-x-[1px]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M7.5 5.75v8.5L14 10 7.5 5.75z" />
                  </svg>
                </span>
              </button>
            ) : (
              <>
                {hasThumbnail ? (
                  <img
                    src={thumbnailUrl}
                    alt={displayTitle}
                    className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-object-cover tw-opacity-40"
                  />
                ) : (
                  <div className="tw-absolute tw-inset-0 tw-bg-iron-950" />
                )}
                <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-y-2 tw-bg-iron-950/80">
                  <span className="tw-rounded tw-bg-iron-900 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-300">
                    Video unavailable
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="tw-space-y-1 tw-p-4">
            <p
              className="tw-m-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100"
              title={displayTitle}
            >
              {displayTitle}
            </p>
            {channelName ? (
              <p
                className="tw-m-0 tw-truncate tw-text-xs tw-uppercase tw-text-iron-400"
                title={channelName}
              >
                {channelName}
              </p>
            ) : null}
            {!hasEmbed ? (
              <p className="tw-m-0 tw-truncate tw-text-xs tw-text-iron-500" title={href}>
                {href}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <ChatItemHrefButtons href={href} />
    </div>
  );
}
