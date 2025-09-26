import { useEffect, useMemo, useState } from "react";
import {
  fetchYoutubePreview,
  YoutubeOEmbedResponse,
} from "@/services/api/youtube";

import ChatItemHrefButtons from "@/components/waves/ChatItemHrefButtons";

import { getYoutubeFetchUrl, parseYoutubeLink } from "./youtube";

const normalizeYoutubeHtml = (html: string): string => {
  let normalized = html.replace(/width="[^"]*"/i, 'width="100%"');
  normalized = normalized.replace(/height="[^"]*"/i, 'height="100%"');

  if (/style="[^"]*"/i.test(normalized)) {
    normalized = normalized.replace(
      /style="([^"]*)"/i,
      (_, styles: string) => {
        const cleanedStyles = styles.replace(/;?\s*$/, "");
        return `style="${cleanedStyles};width:100%;height:100%;"`;
      }
    );
  } else {
    normalized = normalized.replace(
      /<iframe/i,
      '<iframe style="width:100%;height:100%;"'
    );
  }

  return normalized;
};

export interface YoutubePreviewProps {
  readonly href: string;
}

const YoutubePreview = ({ href }: YoutubePreviewProps) => {
  const linkInfo = useMemo(() => parseYoutubeLink(href), [href]);
  if (!linkInfo) {
    throw new Error("Invalid YouTube link");
  }

  const { videoId } = linkInfo;
  const [preview, setPreview] = useState<YoutubeOEmbedResponse | null>(null);
  const [hasError, setHasError] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    let isActive = true;

    setPreview(null);
    setHasError(false);
    setShowEmbed(false);

    const fetchUrl = getYoutubeFetchUrl(href, videoId);

    fetchYoutubePreview(fetchUrl, abortController.signal)
      .then((data) => {
        if (!isActive) {
          return;
        }

        if (data) {
          setPreview({
            ...data,
            html: normalizeYoutubeHtml(data.html),
          });
        } else {
          setHasError(true);
        }
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setHasError(true);
      });

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [href, videoId]);

  if (hasError) {
    throw new Error("Failed to load YouTube preview");
  }

  if (!preview) {
    return (
      <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
        <div className="tw-flex-1 tw-min-w-0">
          <div className="tw-aspect-video tw-w-full tw-rounded-lg tw-bg-iron-800 tw-animate-pulse" />
        </div>
        <ChatItemHrefButtons href={href} />
      </div>
    );
  }

  const ariaLabel = preview.title
    ? `Play YouTube video ${preview.title}`
    : `Play YouTube video ${videoId}`;

  return (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">
        <div className="tw-relative tw-overflow-hidden tw-rounded-lg tw-bg-black">
          {showEmbed ? (
            <div
              className="tw-relative tw-w-full tw-aspect-video tw-bg-black"
              data-testid="youtube-embed"
              dangerouslySetInnerHTML={{ __html: preview.html }}
            />
          ) : (
            <button
              type="button"
              className="tw-relative tw-w-full tw-aspect-video tw-border-0 tw-bg-transparent tw-p-0 tw-cursor-pointer"
              onClick={() => setShowEmbed(true)}
              aria-label={ariaLabel}
            >
              <img
                src={preview.thumbnail_url}
                alt={preview.title ?? `YouTube video ${videoId}`}
                className="tw-h-full tw-w-full tw-object-cover"
              />
              <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/40">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="tw-h-12 tw-w-12 tw-text-white tw-opacity-90"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          )}
        </div>
        <div className="tw-mt-2 tw-space-y-1">
          {preview.title && (
            <p className="tw-text-sm tw-font-semibold tw-text-iron-100 tw-mb-0">
              {preview.title}
            </p>
          )}
          {preview.author_name && (
            <p className="tw-text-xs tw-text-iron-400 tw-mb-0">
              {preview.author_name}
            </p>
          )}
        </div>
      </div>
      <ChatItemHrefButtons href={href} />
    </div>
  );
};

export default YoutubePreview;
