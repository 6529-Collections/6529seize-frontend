import { useEffect, useState } from "react";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { smartLinkHandlers } from "./DropPartMarkdownLinkHandlers";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle, faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import useIsMobileScreen from "../../../../hooks/isMobileScreen";
import { isExternalLink } from "../../../../helpers/Helpers";

const isValidLink = (href: string): boolean => {
  try {
    const url = new URL(href);
    const lastSegment = url.pathname.split("/").pop()?.toLowerCase() || "";

    // Reject if last segment has a file extension
    const hasExtension = /\.[a-z0-9]+$/.test(lastSegment);

    return !hasExtension;
  } catch {
    return false;
  }
};

export default function DropPartMarkdownLink({
  href,
  onQuoteClick,
}: {
  href: string;
  onQuoteClick: (drop: ApiDrop) => void;
}) {
  if (!href) {
    return null;
  }

  for (const { parse, render } of smartLinkHandlers) {
    const result = parse(href);
    if (result) {
      return render(result, href, onQuoteClick);
    }
  }

  if (isValidLink(href)) {
    return <DropPartMarkdownLinkPreview href={href} />;
  }

  return <></>;
}

function DropPartMarkdownLinkPreview({ href }: { href: string }) {
  const isMobile = useIsMobileScreen();

  const [preview, setPreview] = useState<any | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    fetch(`/api/link-preview?url=${encodeURIComponent(href)}`, {
      redirect: "follow",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setPreview(data);
      })
      .catch(() => {});
  }, [href]);

  const image = preview?.images?.[0];
  const video = preview?.videos?.[0];

  let parsedVideoUrl: string | undefined;
  if (video?.secureUrl || video?.url) {
    try {
      const videoUrl = new URL(video.secureUrl || video.url);
      videoUrl.searchParams.set("parent", window.location.hostname);
      parsedVideoUrl = videoUrl.toString();
    } catch {}
  }

  const imgSize = isMobile ? "tw-w-12 tw-h-12" : "tw-w-16 tw-h-16";

  const getSiteName = (): string => {
    if (preview?.siteName) return preview.siteName;
    return new URL(href).hostname;
  };

  const getTitle = (): string => {
    if (preview?.title) return preview.title;
    return href;
  };

  let target = "_self";
  let rel = "";
  if (isExternalLink(href ?? "")) {
    target = "_blank";
    rel = "noopener noreferrer";
  }

  return (
    <Link href={href} target={target} rel={rel} className="tw-no-underline">
      <div className="tw-mt-1 tw-border tw-rounded tw-p-3 tw-bg-iron-800 tw-text-sm tw-flex tw-flex-row tw-gap-4 tw-items-center tw-relative">
        <div className={`${imgSize} tw-flex-shrink-0`}>
          {image ? (
            <img
              src={image}
              alt={preview?.title || ""}
              className="tw-w-full tw-h-full tw-object-cover tw-rounded"
            />
          ) : (
            <div className="tw-w-full tw-h-full tw-bg-iron-700 tw-rounded" />
          )}
        </div>
        <div className="tw-flex-1 tw-min-w-0">
          <div className="tw-text-xs tw-text-iron-500">{getSiteName()}</div>
          <div className="tw-font-medium tw-mb-1 tw-text-sm tw-whitespace-nowrap tw-overflow-hidden tw-text-ellipsis tw-w-full">
            {getTitle()}
          </div>
          {preview?.description && (
            <div className="tw-text-xs tw-text-iron-500 tw-line-clamp-2">
              {preview.description}
            </div>
          )}
        </div>
        {parsedVideoUrl && (
          <FontAwesomeIcon
            icon={showVideo ? faXmarkCircle : faPlayCircle}
            className="tw-w-6 tw-h-6 tw-cursor-pointer hover:tw-text-iron-300"
            onClick={(e) => {
              e.stopPropagation();
              setShowVideo((prev) => !prev);
            }}
          />
        )}
      </div>
      {showVideo && parsedVideoUrl && (
        <div className="tw-mt-2 tw-aspect-video tw-w-full tw-relative tw-overflow-hidden tw-rounded">
          <iframe
            className="tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full"
            src={parsedVideoUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={preview?.title || "Embedded content"}
          />
        </div>
      )}
    </Link>
  );
}
