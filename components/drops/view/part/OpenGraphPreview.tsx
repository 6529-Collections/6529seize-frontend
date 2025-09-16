import ChatItemHrefButtons from "../../../waves/ChatItemHrefButtons";
import { MouseEvent } from "react";

export interface OpenGraphPreviewData {
  readonly title?: string;
  readonly description?: string;
  readonly siteName?: string;
  readonly url?: string;
  readonly favicon?: string;
  readonly image?: string;
  readonly domain?: string;
}

interface OpenGraphPreviewProps {
  readonly href: string;
  readonly preview: OpenGraphPreviewData;
}

function getHostname(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  const candidates = [url, url.startsWith("http") ? url : `https://${url}`];

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      const hostname = parsed.hostname.replace(/^www\./, "");
      if (hostname) {
        return hostname;
      }
    } catch {
      continue;
    }
  }

  return undefined;
}

function OpenGraphPreview({ href, preview }: OpenGraphPreviewProps) {
  const { title, description, siteName, url, favicon, image, domain } = preview;
  const derivedDomain = domain ?? getHostname(url) ?? getHostname(href) ?? href;
  const label = siteName ?? derivedDomain;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="tw-flex tw-flex-1 tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800"
        onClick={handleClick}
      >
        <div className="tw-flex tw-flex-1 tw-min-w-0">
          {image && (
            <div className="tw-relative tw-hidden tw-flex-shrink-0 tw-overflow-hidden tw-rounded-l-xl md:tw-block md:tw-w-36">
              <img
                src={image}
                alt={title ?? derivedDomain}
                loading="lazy"
                className="tw-h-full tw-w-full tw-object-cover"
              />
            </div>
          )}
          <div className="tw-flex tw-flex-1 tw-min-w-0 tw-flex-col tw-gap-y-1 tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-xs tw-text-iron-400">
              {favicon && (
                <img
                  src={favicon}
                  alt=""
                  loading="lazy"
                  className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-rounded tw-object-cover"
                />
              )}
              {label && <span className="tw-truncate">{label}</span>}
            </div>
            {title && (
              <p className="tw-text-sm tw-font-semibold tw-leading-tight tw-text-iron-100 tw-break-words">
                {title}
              </p>
            )}
            {description && (
              <p className="tw-text-xs tw-leading-snug tw-text-iron-300 tw-break-words">
                {description}
              </p>
            )}
          </div>
        </div>
      </a>
      <ChatItemHrefButtons href={href} />
    </div>
  );
}

export default OpenGraphPreview;
