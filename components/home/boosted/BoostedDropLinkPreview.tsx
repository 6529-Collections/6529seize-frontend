"use client";

import type { SyntheticEvent } from "react";

import SmartLinkPreview from "@/components/waves/SmartLinkPreview";

const getFallbackLabel = (href: string): string => {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./i, "");
    return host || href;
  } catch {
    return href;
  }
};

const stopPropagation = (event: SyntheticEvent) => {
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();
};

export default function BoostedDropLinkPreview({
  href,
}: {
  readonly href: string;
}) {
  return (
    <div
      className="tw-h-full tw-w-full tw-min-w-0 tw-max-w-full"
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onPointerDown={stopPropagation}
      onTouchStart={stopPropagation}
    >
      <SmartLinkPreview
        href={href}
        variant="home"
        renderFallback={() => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => e.stopPropagation()}
            className="tw-[overflow-wrap:anywhere] tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white"
          >
            {getFallbackLabel(href)}
          </a>
        )}
      />
    </div>
  );
}
