import type { ReactElement } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Tweet, type TwitterComponents } from "react-tweet";

import { ApiDrop } from "@/generated/models/ApiDrop";
import type { SeizeQuoteLinkInfo } from "../../../../../helpers/SeizeLinkParser";

import ChatItemHrefButtons from "../../../../waves/ChatItemHrefButtons";
import WaveDropQuoteWithDropId from "../../../../waves/drops/WaveDropQuoteWithDropId";
import WaveDropQuoteWithSerialNo from "../../../../waves/drops/WaveDropQuoteWithSerialNo";

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

const renderTweetEmbed = (result: { href: string; tweetId: string }) => {
  const renderFallback = () => <TweetFallback href={result.href} />;
  const TweetNotFound: TwitterComponents["TweetNotFound"] = () => renderFallback();
  return (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0" data-theme="dark">
        <ErrorBoundary fallbackRender={() => renderFallback()}>
          <Tweet id={result.tweetId} components={{ TweetNotFound }} />
        </ErrorBoundary>
      </div>
      <ChatItemHrefButtons href={result.href} />
    </div>
  );
};

const renderGifEmbed = (url: string): ReactElement => (
  <img
    src={url}
    alt={url}
    className="tw-max-h-[25rem] tw-max-w-[100%] tw-h-auto"
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
      <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
        <div className="tw-flex-1 tw-min-w-0">
          <WaveDropQuoteWithSerialNo
            serialNo={parseInt(serialNo)}
            waveId={waveId}
            onQuoteClick={onQuoteClick}
          />
        </div>
        <ChatItemHrefButtons href={href} hideLink />
      </div>
    );
  }

  if (dropId) {
    return (
      <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
        <div className="tw-flex-1 tw-min-w-0">
          <WaveDropQuoteWithDropId
            dropId={dropId}
            partId={1}
            maybeDrop={null}
            onQuoteClick={onQuoteClick}
          />
        </div>
        <ChatItemHrefButtons
          href={href}
          relativeHref={`/my-stream?wave=${waveId}&drop=${dropId}`}
        />
      </div>
    );
  }

  return null;
};

export {
  renderGifEmbed,
  renderSeizeQuote,
  renderTweetEmbed,
  TweetFallback,
};
