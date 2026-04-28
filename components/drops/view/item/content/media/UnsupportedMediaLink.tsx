"use client";

import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

const SAFE_URL_PROTOCOLS = new Set(["https:", "http:", "ipfs:", "ar:"]);

function getSafeUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function getLinkLabel(mediaUrl: string): string {
  const fileInfo = getFileInfoFromUrl(mediaUrl);
  if (fileInfo) {
    return `${fileInfo.name}.${fileInfo.extension}`;
  }

  return mediaUrl;
}

export default function UnsupportedMediaLink({
  media_url,
}: {
  readonly media_url: string;
}) {
  const safeUrl = getSafeUrl(media_url);
  const label = getLinkLabel(media_url);

  if (!safeUrl) {
    return (
      <span className="tw-break-all tw-text-sm tw-text-iron-400">{label}</span>
    );
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="tw-inline-flex tw-max-w-full tw-items-center tw-gap-x-2 tw-break-all tw-text-sm tw-font-medium tw-text-primary-400 tw-no-underline desktop-hover:hover:tw-text-primary-300"
    >
      <span className="tw-min-w-0 tw-break-all">{label}</span>
      <ArrowTopRightOnSquareIcon className="tw-size-4 tw-flex-shrink-0" />
    </a>
  );
}
