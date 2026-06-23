import type { ReactElement } from "react";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { SeizeQuoteLinkInfo } from "@/helpers/SeizeLinkParser";

import LinkHandlerFrame from "@/components/waves/LinkHandlerFrame";
import TwitterPreviewCard from "@/components/waves/TwitterPreviewCard";
import WaveDropQuoteWithDropId from "@/components/waves/drops/WaveDropQuoteWithDropId";
import WaveDropQuoteWithSerialNo from "@/components/waves/drops/WaveDropQuoteWithSerialNo";
import { ensureTwitterLink } from "./twitter";

interface SeizeQuoteRenderOptions {
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

const renderTweetEmbed = (
  href: string,
  options?: { readonly fullWidth?: boolean | undefined }
) => {
  const { tweetId, href: normalizedHref } = ensureTwitterLink(href);
  const fullWidth = options?.fullWidth === true;
  return (
    <LinkHandlerFrame
      href={normalizedHref}
      hideLink
      overlayAnchor={fullWidth ? "frame" : "content"}
    >
      <div
        className={
          fullWidth
            ? "tw-w-full tw-min-w-0"
            : "tw-w-full tw-min-w-0 tw-flex-1 lg:tw-max-w-[480px]"
        }
      >
        <TwitterPreviewCard href={normalizedHref} tweetId={tweetId} />
      </div>
    </LinkHandlerFrame>
  );
};

const CHAT_GIF_HEIGHT = 180;

interface GifEmbedOptions {
  readonly fixedSize?: boolean | undefined;
}

const renderGifEmbed = (
  url: string,
  options?: GifEmbedOptions
): ReactElement => {
  if (options?.fixedSize) {
    return (
      // Use fixed height to prevent vertical layout shift while preserving GIF aspect ratio.
      <img
        src={url}
        alt="Embedded GIF"
        className="tw-block tw-w-auto tw-max-w-full tw-rounded-xl tw-object-contain"
        style={{ height: `${CHAT_GIF_HEIGHT}px` }}
        loading="lazy"
      />
    );
  }

  return (
    // Markdown-style GIF embeds intentionally keep <img> for animation support.
    <img
      src={url}
      alt="Embedded GIF"
      className="tw-h-auto tw-max-h-[25rem] tw-max-w-[100%]"
      loading="lazy"
    />
  );
};

const renderSeizeQuote = (
  quoteLinkInfo: SeizeQuoteLinkInfo,
  onQuoteClick: (drop: ApiDrop) => void,
  href: string,
  options?: SeizeQuoteRenderOptions
): ReactElement | null => {
  const { waveId, serialNo, dropId } = quoteLinkInfo;
  if (serialNo) {
    return (
      <LinkHandlerFrame href={href} hideLink>
        <WaveDropQuoteWithSerialNo
          serialNo={Number.parseInt(serialNo, 10)}
          waveId={waveId}
          onQuoteClick={onQuoteClick}
          embedPath={options?.embedPath}
          quotePath={options?.quotePath}
          embedDepth={options?.embedDepth}
          maxEmbedDepth={options?.maxEmbedDepth}
        />
      </LinkHandlerFrame>
    );
  }

  if (dropId) {
    return (
      <LinkHandlerFrame href={href}>
        <WaveDropQuoteWithDropId
          dropId={dropId}
          partId={1}
          maybeDrop={null}
          waveId={waveId}
          onQuoteClick={onQuoteClick}
          embedPath={options?.embedPath}
          quotePath={options?.quotePath}
          embedDepth={options?.embedDepth}
          maxEmbedDepth={options?.maxEmbedDepth}
        />
      </LinkHandlerFrame>
    );
  }

  return null;
};

export { renderGifEmbed, renderSeizeQuote, renderTweetEmbed };
