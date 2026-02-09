import type { ReactElement } from "react";
import { ErrorBoundary } from "react-error-boundary";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { SeizeQuoteLinkInfo } from "@/helpers/SeizeLinkParser";
import { getWaveRoute } from "@/helpers/navigation.helpers";

import LinkHandlerFrame from "@/components/waves/LinkHandlerFrame";
import WaveDropQuoteWithDropId from "@/components/waves/drops/WaveDropQuoteWithDropId";
import WaveDropQuoteWithSerialNo from "@/components/waves/drops/WaveDropQuoteWithSerialNo";
import ExpandableTweetPreview from "@/components/tweets/ExpandableTweetPreview";
import type { TweetPreviewMode } from "@/components/tweets/TweetPreviewModeContext";
import { ensureTwitterLink } from "./twitter";

const TweetFallback = ({ href }: { href: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="tw-flex tw-h-full tw-w-full tw-flex-col tw-justify-center tw-gap-y-1 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 tw-text-left tw-no-underline tw-transition-colors tw-duration-200 hover:tw-border-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
  >
    <span className="tw-text-sm tw-font-medium tw-text-iron-100">
      Tweet unavailable
    </span>
    <span className="tw-text-xs tw-text-iron-400">Open on X</span>
  </a>
);

const renderTweetEmbed = (
  href: string,
  options?: { readonly tweetPreviewMode?: TweetPreviewMode }
) => {
  const { tweetId, href: normalizedHref } = ensureTwitterLink(href);
  const renderFallback = () => <TweetFallback href={normalizedHref} />;
  return (
    <LinkHandlerFrame href={normalizedHref}>
      <div className="tw-min-w-0 tw-flex-1">
        <ErrorBoundary fallbackRender={() => renderFallback()}>
          <ExpandableTweetPreview
            href={normalizedHref}
            tweetId={tweetId}
            compactMode={options?.tweetPreviewMode}
            renderFallback={(fallbackHref) => (
              <TweetFallback href={fallbackHref} />
            )}
          />
        </ErrorBoundary>
      </div>
    </LinkHandlerFrame>
  );
};

const renderGifEmbed = (url: string): ReactElement => (
  <img
    src={url}
    alt={url}
    className="tw-h-auto tw-max-h-[25rem] tw-max-w-[100%]"
  />
);

const renderSeizeQuote = (
  quoteLinkInfo: SeizeQuoteLinkInfo,
  onQuoteClick: (drop: ApiDrop) => void,
  href: string
): ReactElement | null => {
  const { waveId, serialNo, dropId } = quoteLinkInfo;
  if (serialNo) {
    return (
      <LinkHandlerFrame href={href} hideLink>
        <WaveDropQuoteWithSerialNo
          serialNo={Number.parseInt(serialNo, 10)}
          waveId={waveId}
          onQuoteClick={onQuoteClick}
        />
      </LinkHandlerFrame>
    );
  }

  if (dropId) {
    return (
      <LinkHandlerFrame
        href={href}
        relativeHref={getWaveRoute({
          waveId,
          extraParams: { drop: dropId },
          isDirectMessage: false,
          isApp: false,
        })}
      >
        <WaveDropQuoteWithDropId
          dropId={dropId}
          partId={1}
          maybeDrop={null}
          onQuoteClick={onQuoteClick}
        />
      </LinkHandlerFrame>
    );
  }

  return null;
};

export { renderGifEmbed, renderSeizeQuote, renderTweetEmbed };
