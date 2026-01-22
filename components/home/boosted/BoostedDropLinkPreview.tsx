"use client";

import LinkPreviewCard from "@/components/waves/LinkPreviewCard";

const getFallbackLabel = (href: string): string => {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./i, "");
    return host || href;
  } catch {
    return href;
  }
};

export default function BoostedDropLinkPreview({
  href,
}: {
  readonly href: string;
}) {
  return (
    <div className="tw-h-full tw-w-full tw-min-w-0 tw-max-w-full">
      <LinkPreviewCard
        href={href}
        variant="home"
        renderFallback={() => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => e.stopPropagation()}
            className="tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-break-words tw-[overflow-wrap:anywhere] tw-transition tw-duration-200 hover:tw-text-white"
          >
            {getFallbackLabel(href)}
          </a>
        )}
      />
    </div>
  );
}

