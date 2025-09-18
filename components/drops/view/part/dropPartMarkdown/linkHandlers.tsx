import {
  AnchorHTMLAttributes,
  ClassAttributes,
  ImgHTMLAttributes,
  type ReactElement,
} from "react";
import { ExtraProps } from "react-markdown";
import { ErrorBoundary } from "react-error-boundary";
import { Tweet, type TwitterComponents } from "react-tweet";

import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import { SeizeQuoteLinkInfo, parseSeizeQuoteLink, parseSeizeQueryLink } from "../../../../../helpers/SeizeLinkParser";
import { parseArtBlocksLink } from "@/src/services/artblocks/url";
import ArtBlocksTokenCard from "@/src/components/waves/ArtBlocksTokenCard";

import { parseYoutubeLink } from "./youtube";
import YoutubePreview from "./youtubePreview";
import type { PepeLinkResult } from "./pepe";
import { isPepeHost, parsePepeLink, renderPepeLink } from "./pepe";
import { parseTikTokLink } from "./tiktok";

type DropPartMarkdownImageComponent = typeof import("../DropPartMarkdownImage").default;
type WaveDropQuoteWithSerialNoComponent = typeof import("../../../../waves/drops/WaveDropQuoteWithSerialNo").default;
type WaveDropQuoteWithDropIdComponent = typeof import("../../../../waves/drops/WaveDropQuoteWithDropId").default;
type GroupCardChatComponent = typeof import("../../../../groups/page/list/card/GroupCardChat").default;
type WaveItemChatComponent = typeof import("../../../../waves/list/WaveItemChat").default;
type DropItemChatComponent = typeof import("../../../../waves/drops/DropItemChat").default;
type ChatItemHrefButtonsComponent = typeof import("../../../../waves/ChatItemHrefButtons").default;
type LinkPreviewCardComponent = typeof import("../../../../waves/LinkPreviewCard").default;
type TikTokCardComponent = typeof import("../../../../waves/TikTokCard").default;

const getDropPartMarkdownImage = (): DropPartMarkdownImageComponent => {
  const module = require("../DropPartMarkdownImage");
  return module.default as DropPartMarkdownImageComponent;
};

const getWaveDropQuoteWithSerialNo = (): WaveDropQuoteWithSerialNoComponent => {
  const module = require("../../../../waves/drops/WaveDropQuoteWithSerialNo");
  return module.default as WaveDropQuoteWithSerialNoComponent;
};

const getWaveDropQuoteWithDropId = (): WaveDropQuoteWithDropIdComponent => {
  const module = require("../../../../waves/drops/WaveDropQuoteWithDropId");
  return module.default as WaveDropQuoteWithDropIdComponent;
};

const getGroupCardChat = (): GroupCardChatComponent => {
  const module = require("../../../../groups/page/list/card/GroupCardChat");
  return module.default as GroupCardChatComponent;
};

const getWaveItemChat = (): WaveItemChatComponent => {
  const module = require("../../../../waves/list/WaveItemChat");
  return module.default as WaveItemChatComponent;
};

const getDropItemChat = (): DropItemChatComponent => {
  const module = require("../../../../waves/drops/DropItemChat");
  return module.default as DropItemChatComponent;
};

const getChatItemHrefButtons = (): ChatItemHrefButtonsComponent => {
  const module = require("../../../../waves/ChatItemHrefButtons");
  return module.default as ChatItemHrefButtonsComponent;
};

const getLinkPreviewCard = (): LinkPreviewCardComponent => {
  const module = require("../../../../waves/LinkPreviewCard");
  return module.default as LinkPreviewCardComponent;
};

const getTikTokCard = (): TikTokCardComponent => {
  const module = require("../../../../waves/TikTokCard");
  return module.default as TikTokCardComponent;
};

interface SmartLinkHandler<T> {
  parse: (href: string) => T | null;
  render: (result: T, href: string) => ReactElement | null;
}

const matchesDomainOrSubdomain = (host: string, domain: string): boolean => {
  return host === domain || host.endsWith(`.${domain}`);
};

const ART_BLOCKS_FLAG_CANDIDATES = [
  "VITE_FEATURE_AB_CARD",
  "NEXT_PUBLIC_VITE_FEATURE_AB_CARD",
  "NEXT_PUBLIC_FEATURE_AB_CARD",
  "FEATURE_AB_CARD",
] as const;

const TIKTOK_FLAG_CANDIDATES = [
  "FEATURE_TIKTOK_CARD",
  "NEXT_PUBLIC_FEATURE_TIKTOK_CARD",
] as const;

const parseFeatureFlagValue = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  if (["1", "true", "on", "yes", "enabled"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "off", "no", "disabled"].includes(normalized)) {
    return false;
  }

  return Boolean(normalized);
};

const isArtBlocksCardEnabled = (): boolean => {
  for (const flagName of ART_BLOCKS_FLAG_CANDIDATES) {
    const value = process.env[flagName];
    if (value !== undefined) {
      return parseFeatureFlagValue(value);
    }
  }

  return true;
};

const isTikTokCardEnabled = (): boolean => {
  for (const flagName of TIKTOK_FLAG_CANDIDATES) {
    const value = process.env[flagName];
    if (value !== undefined) {
      return parseFeatureFlagValue(value);
    }
  }

  return true;
};

const parseTwitterLink = (
  href: string
): { href: string; tweetId: string } | null => {
  const twitterRegex =
    /https:\/\/(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/;
  const match = href.match(twitterRegex);
  return match ? { href, tweetId: match[3] } : null;
};

const parseGifLink = (href: string): string | null => {
  const gifRegex = /^https?:\/\/media\.tenor\.com\/[^\s]+\.gif$/i;
  return gifRegex.test(href) ? href : null;
};

const renderTweetFallback = (href: string) => (
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
  const renderFallback = () => renderTweetFallback(result.href);
  const TweetNotFound: TwitterComponents["TweetNotFound"] = () => renderFallback();
  const ChatItemHrefButtons = getChatItemHrefButtons();

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

const renderGifEmbed = (url: string) => (
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
) => {
  const { waveId, serialNo, dropId } = quoteLinkInfo;
  const ChatItemHrefButtons = getChatItemHrefButtons();

  if (serialNo) {
    const WaveDropQuoteWithSerialNo = getWaveDropQuoteWithSerialNo();
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
    const WaveDropQuoteWithDropId = getWaveDropQuoteWithDropId();
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

const shouldUseOpenGraphPreview = (href: string): boolean => {

  try {
    const parsed = new URL(href);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== "http:" && protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    const youtubeDomains = ["youtube.com", "youtube-nocookie.com"];
    const twitterDomains = ["twitter.com", "x.com"];
    const artBlocksDomains = [
      "artblocks.io",
      "live.artblocks.io",
      "media.artblocks.io",
      "media-proxy.artblocks.io",
      "token.artblocks.io",
    ];

    if (isPepeHost(hostname)) {
      return false;
    }

    if (isTikTokCardEnabled() && matchesDomainOrSubdomain(hostname, "tiktok.com")) {
      return false;
    }

    if (
      hostname === "youtu.be" ||
      youtubeDomains.some((domain) => matchesDomainOrSubdomain(hostname, domain)) ||
      twitterDomains.some((domain) => matchesDomainOrSubdomain(hostname, domain)) ||
      artBlocksDomains.some((domain) => matchesDomainOrSubdomain(hostname, domain))
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

const renderExternalOrInternalLink = (
  href: string,
  props: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps
) => {
  const baseEndpoint = process.env.BASE_ENDPOINT ?? "";
  const isExternalLink = baseEndpoint && !href.startsWith(baseEndpoint);
  const { onClick, ...restProps } = props;
  const anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps = {
    ...restProps,
    href,
  };

  if (isExternalLink) {
    anchorProps.rel = "noopener noreferrer nofollow";
    anchorProps.target = "_blank";
  } else {
    anchorProps.href = href.replace(baseEndpoint, "");
  }

  return (
    <a
      {...anchorProps}
      onClick={(e) => {
        e.stopPropagation();
        if (typeof onClick === "function") {
          onClick(e);
        }
      }}
    />
  );
};

const createSmartLinkHandlers = (
  onQuoteClick: (drop: ApiDrop) => void
): SmartLinkHandler<any>[] => {
  const handlers: SmartLinkHandler<any>[] = [
    {
      parse: parseSeizeQuoteLink,
      render: (result: SeizeQuoteLinkInfo, href: string) =>
        renderSeizeQuote(result, onQuoteClick, href),
    },
    {
      parse: (href: string) => parseSeizeQueryLink(href, "/network", ["group"]),
      render: (result: { group: string }, href: string) => {
        const GroupCardChat = getGroupCardChat();
        return <GroupCardChat href={href} groupId={result.group} />;
      },
    },
    {
      parse: (href: string) =>
        parseSeizeQueryLink(href, "/my-stream", ["wave"], true),
      render: (result: { wave: string }, href: string) => {
        const WaveItemChat = getWaveItemChat();
        return <WaveItemChat href={href} waveId={result.wave} />;
      },
    },
    {
      parse: (href: string) =>
        parseSeizeQueryLink(href, "/my-stream", ["wave", "drop"], true),
      render: (result: { drop: string }, href: string) => {
        const DropItemChat = getDropItemChat();
        return <DropItemChat href={href} dropId={result.drop} />;
      },
    },
    {
      parse: parseTwitterLink,
      render: (result: { href: string; tweetId: string }) =>
        renderTweetEmbed(result),
    },
    {
      parse: parseGifLink,
      render: (url: string) => renderGifEmbed(url),
    },
  ];

  if (isArtBlocksCardEnabled()) {
    handlers.push({
      parse: parseArtBlocksLink,
      render: (
        artBlocksId: { tokenId: string; contract?: string },
        href: string
      ) => {
        const ChatItemHrefButtons = getChatItemHrefButtons();
        return (
          <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
            <div className="tw-flex-1 tw-min-w-0">
              <ArtBlocksTokenCard href={href} id={artBlocksId} />
            </div>
            <ChatItemHrefButtons href={href} />
          </div>
        );
      },
    });
  }

  handlers.push({
    parse: parsePepeLink,
    render: (result: PepeLinkResult) => renderPepeLink(result),
  });



  return handlers;
};

const isValidLink = (href: string): boolean => {
  try {
    new URL(href);
    return true;
  } catch {
    return false;
  }
};

export interface LinkRendererConfig {
  readonly onQuoteClick: (drop: ApiDrop) => void;
}

export interface LinkRenderer {
  readonly renderAnchor: (
    params: ClassAttributes<HTMLAnchorElement> &
      AnchorHTMLAttributes<HTMLAnchorElement> &
      ExtraProps
  ) => ReactElement | null;
  readonly isSmartLink: (href: string) => boolean;
  readonly renderImage: (
    params: ClassAttributes<HTMLImageElement> &
      ImgHTMLAttributes<HTMLImageElement> &
      ExtraProps
  ) => ReactElement | null;
}

export const createLinkRenderer = ({
  onQuoteClick
}: LinkRendererConfig): LinkRenderer => {
  const smartLinkHandlers = createSmartLinkHandlers(
    onQuoteClick
  );

  const renderImage: LinkRenderer["renderImage"] = ({
    ...props
  }) => {
    if (typeof props.src !== "string") {
      return null;
    }

    const DropPartMarkdownImage = getDropPartMarkdownImage();
    return <DropPartMarkdownImage src={props.src} />;
  };

  const renderAnchor: LinkRenderer["renderAnchor"] = ({
    ...props
  }) => {
    const { href } = props;
    if (!href || !isValidLink(href)) {
      return null;
    }

    const youtubeInfo = parseYoutubeLink(href);
    if (youtubeInfo) {
      return (
        <YoutubePreview
          href={youtubeInfo.url}
          videoId={youtubeInfo.videoId}
          renderFallback={() => renderExternalOrInternalLink(href, props)}
        />
      );
    }

    if (isTikTokCardEnabled()) {
      const tiktokInfo = parseTikTokLink(href);
      if (tiktokInfo) {
        const TikTokCard = getTikTokCard();
        return (
          <TikTokCard
            href={href}
            renderFallback={() => renderExternalOrInternalLink(href, props)}
          />
        );
      }
    }

    for (const { parse, render } of smartLinkHandlers) {
      const result = parse(href);
      if (result) {
        return render(result, href);
      }
    }

    if (shouldUseOpenGraphPreview(href)) {
      const LinkPreviewCard = getLinkPreviewCard();
      return (
        <LinkPreviewCard
          href={href}
          renderFallback={() => renderExternalOrInternalLink(href, props)}
        />
      );
    }

    return renderExternalOrInternalLink(href, props);
  };

  const isSmartLink = (href: string): boolean => {
    if (parseYoutubeLink(href)) {
      return true;
    }

    if (isTikTokCardEnabled() && parseTikTokLink(href)) {
      return true;
    }

    if (smartLinkHandlers.some((handler) => !!handler.parse(href))) {
      return true;
    }

    return shouldUseOpenGraphPreview(href);
  };

  return {
    renderAnchor,
    isSmartLink,
    renderImage,
  };
};
