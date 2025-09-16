import {
  AnchorHTMLAttributes,
  Children,
  ClassAttributes,
  Fragment,
  HTMLAttributes,
  ImgHTMLAttributes,
  isValidElement,
  memo,
  ReactNode,
  useEffect,
  useState,
  type JSX,
} from "react";
import Markdown, { ExtraProps } from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";

// Component definitions moved outside for better performance
const BreakComponent = () => <br />;
import DropListItemContentPart, {
  DropListItemContentPartProps,
} from "../item/content/DropListItemContentPart";
import { ApiDropMentionedUser } from "../../../../generated/models/ApiDropMentionedUser";
import { ApiDropReferencedNFT } from "../../../../generated/models/ApiDropReferencedNFT";
import { Tweet } from "react-tweet";

import DropPartMarkdownImage from "./DropPartMarkdownImage";
import WaveDropQuoteWithDropId from "../../../waves/drops/WaveDropQuoteWithDropId";
import WaveDropQuoteWithSerialNo from "../../../waves/drops/WaveDropQuoteWithSerialNo";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import {
  parseSeizeQueryLink,
  parseSeizeQuoteLink,
  SeizeQuoteLinkInfo,
} from "../../../../helpers/SeizeLinkParser";
import useIsMobileScreen from "../../../../hooks/isMobileScreen";
import { useEmoji } from "../../../../contexts/EmojiContext";
import GroupCardChat from "../../../groups/page/list/card/GroupCardChat";
import WaveItemChat from "../../../waves/list/WaveItemChat";
import DropItemChat from "../../../waves/drops/DropItemChat";
import ChatItemHrefButtons from "../../../waves/ChatItemHrefButtons";
import LinkPreviewCard from "../../../waves/LinkPreviewCard";
import {
  fetchYoutubePreview,
  YoutubeOEmbedResponse,
} from "@/services/api/youtube";

export interface DropPartMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly partContent: string | null;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly textSize?: "sm" | "md";
}

export enum DropContentPartType {
  MENTION = "MENTION",
  HASHTAG = "HASHTAG",
}

type SmartLinkHandler<T> = {
  parse: (href: string) => T | null;
  render: (result: T, href: string) => JSX.Element | null;
};

function DropPartMarkdown({
  mentionedUsers,
  referencedNfts,
  partContent,
  onQuoteClick,
  textSize,
}: DropPartMarkdownProps) {
  const isMobile = useIsMobileScreen();
  const { emojiMap, findNativeEmoji } = useEmoji();
  const textSizeClass = (() => {
    switch (textSize) {
      case "sm":
        return isMobile ? "tw-text-xs" : "tw-text-sm";
      default:
        return "tw-text-md"; // Always use medium text for both mobile and desktop
    }
  })();

  const customPartRenderer = ({
    content,
    mentionedUsers,
    referencedNfts,
  }: {
    readonly content: ReactNode | undefined;
    readonly mentionedUsers: Array<ApiDropMentionedUser>;
    readonly referencedNfts: Array<ApiDropReferencedNFT>;
  }) => {
    if (typeof content !== "string") {
      return content;
    }

    const splitter = getRandomObjectId();

    const values: Record<string, DropListItemContentPartProps> = {
      ...mentionedUsers.reduce(
        (acc, user) => ({
          ...acc,
          [`@[${user.handle_in_content}]`]: {
            type: DropContentPartType.MENTION,
            value: user,
            match: `@[${user.handle_in_content}]`,
          },
        }),
        {}
      ),
      ...referencedNfts.reduce(
        (acc, nft) => ({
          ...acc,
          [`#[${nft.name}]`]: {
            type: DropContentPartType.HASHTAG,
            value: nft,
            match: `#[${nft.name}]`,
          },
        }),
        {}
      ),
    };

    const emojiRegex = /(:\w+:)/g;
    const isEmoji = (str: string): boolean => {
      const emojiTextRegex =
        /^(?:\ud83c[\udffb-\udfff]|\ud83d[\udc00-\ude4f\ude80-\udfff]|\ud83e[\udd00-\uddff]|\u00a9|\u00ae|\u200d|\u203c|\u2049|\u2122|\u2139|\u2194-\u21aa|\u231a-\u23fa|\u24c2|\u25aa-\u25fe|\u2600-\u27bf|\u2934-\u2b55|\u3030|\u303d|\u3297|\u3299|\ufe0f)$/;
      return emojiTextRegex.test(str.trim());
    };
    const areAllPartsEmojis = content
      .split(emojiRegex)
      .filter((p) => !!p)
      .every((part) => part.match(emojiRegex) || isEmoji(part));

    let currentContent = content;

    for (const token of Object.values(values)) {
      currentContent = currentContent.replaceAll(
        token.match,
        `${splitter}${token.match}${splitter}`
      );
    }
    const parts = currentContent
      .split(splitter)
      .filter((part) => part !== "")
      .map((part) => {
        const partProps = values[part];
        if (partProps) {
          const randomId = getRandomObjectId();
          return <DropListItemContentPart key={randomId} part={partProps} />;
        } else {
          const parts = part.split(emojiRegex);

          return parts.map((part) =>
            part.match(emojiRegex) ? (
              <Fragment key={getRandomObjectId()}>
                {renderEmoji(part, areAllPartsEmojis)}
              </Fragment>
            ) : (
              <span
                key={getRandomObjectId()}
                className={`${areAllPartsEmojis ? "emoji-text-node" : "tw-align-middle"
                  }`}
              >
                {part}
              </span>
            )
          );
        }
      });

    return parts;
  };

  const customRenderer = ({
    content,
    mentionedUsers,
    referencedNfts,
  }: {
    readonly content: ReactNode | undefined;
    readonly mentionedUsers: Array<ApiDropMentionedUser>;
    readonly referencedNfts: Array<ApiDropReferencedNFT>;
  }) => {
    if (typeof content === "string") {
      return customPartRenderer({
        content,
        mentionedUsers,
        referencedNfts,
      });
    }

    if (Array.isArray(content)) {
      return content.map((child) => {
        if (typeof child === "string") {
          return customPartRenderer({
            content: child,
            mentionedUsers,
            referencedNfts,
          });
        }

        return child;
      });
    }

    return content;
  };

  const renderEmoji = (emojiProps: string, bigEmoji: boolean) => {
    const emojiId = emojiProps.replaceAll(":", "");
    const emoji = emojiMap
      .flatMap((cat) => cat.emojis)
      .find((e) => e.id === emojiId);

    if (!emoji) {
      const nativeEmoji = findNativeEmoji(emojiId);
      if (nativeEmoji) {
        return (
          <span
            className={`${bigEmoji ? "emoji-text-node" : "tw-align-middle"}`}
          >
            {nativeEmoji.skins[0].native}
          </span>
        );
      }
      return <span>{`:${emojiId}:`}</span>;
    }

    return (
      <img
        src={emoji.skins[0].src}
        alt={emojiId}
        className={`${bigEmoji ? "emoji-node-big" : "emoji-node"}`}
      />
    );
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

  const parseYoutubeLink = (
    href: string
  ): { readonly videoId: string; readonly url: string } | null => {
    try {
      const url = new URL(href);
      const normalizedHost = url.hostname.replace(/^www\./i, "").toLowerCase();
      const isYoutubeDomain =
        normalizedHost === "youtube.com" ||
        normalizedHost === "youtube-nocookie.com" ||
        normalizedHost.endsWith(".youtube.com") ||
        normalizedHost.endsWith(".youtube-nocookie.com");

      let videoId: string | null = null;

      if (normalizedHost === "youtu.be") {
        const pathSegments = url.pathname.split("/").filter(Boolean);
        videoId = pathSegments[0] ?? null;
      } else if (isYoutubeDomain) {
        const pathSegments = url.pathname.split("/").filter(Boolean);

        if (url.pathname === "/watch" || url.pathname === "/watch/") {
          videoId = url.searchParams.get("v");
        } else if (pathSegments[0] === "shorts") {
          videoId = pathSegments[1] ?? null;
        } else if (pathSegments[0] === "embed") {
          videoId = pathSegments[1] ?? null;
        } else if (pathSegments[0] === "live") {
          videoId = pathSegments[1] ?? null;
        } else if (pathSegments[0] === "v") {
          videoId = pathSegments[1] ?? null;
        }
      }

      if (!videoId) {
        return null;
      }

      const trimmed = videoId.trim();
      if (!trimmed.match(/^[A-Za-z0-9_-]{6,}$/)) {
        return null;
      }

      return { videoId: trimmed, url: href };
    } catch {
      return null;
    }
  };

  const getYoutubeFetchUrl = (href: string, videoId: string): string => {
    try {
      const url = new URL(href);
      const canonical = new URL(`https://www.youtube.com/watch?v=${videoId}`);
      const preservedParams = ["list", "index"] as const;

      preservedParams.forEach((param) => {
        const value = url.searchParams.get(param);
        if (value) {
          canonical.searchParams.set(param, value);
        }
      });

      return canonical.toString();
    } catch {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
  };

  const smartLinkHandlers: SmartLinkHandler<any>[] = [
    {
      parse: parseSeizeQuoteLink,
      render: (result: SeizeQuoteLinkInfo, href: string) =>
        renderSeizeQuote(result, onQuoteClick, href),
    },
    {
      parse: (href: string) => parseSeizeQueryLink(href, "/network", ["group"]),
      render: (result: { group: string }, href: string) => (
        <GroupCardChat href={href} groupId={result.group} />
      ),
    },
    {
      parse: (href: string) =>
        parseSeizeQueryLink(href, "/my-stream", ["wave"], true),
      render: (result: { wave: string }, href: string) => (
        <WaveItemChat href={href} waveId={result.wave} />
      ),
    },
    {
      parse: (href: string) =>
        parseSeizeQueryLink(href, "/my-stream", ["wave", "drop"], true),
      render: (result: { drop: string }, href: string) => (
        <DropItemChat href={href} dropId={result.drop} />
      ),
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

  const isSmartLink = (href: string): boolean => {
    if (parseYoutubeLink(href)) {
      return true;
    }

    if (smartLinkHandlers.some((handler) => !!handler.parse(href))) {
      return true;
    }

    return shouldUseOpenGraphPreview(href);
  };

  const aHrefRenderer = ({
    node,
    ...props
  }: ClassAttributes<HTMLAnchorElement> &
    AnchorHTMLAttributes<HTMLAnchorElement> &
    ExtraProps) => {
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
          fallbackProps={props}
        />
      );
    }

    for (const { parse, render } of smartLinkHandlers) {
      const result = parse(href);
      if (result) {
        return render(result, href);
      }
    }

    if (shouldUseOpenGraphPreview(href)) {
      return (
        <LinkPreviewCard
          href={href}
          renderFallback={() => renderExternalOrInternalLink(href, props)}
        />
      );
    }

    return renderExternalOrInternalLink(href, props);
  };

  const imgRenderer = ({
    node,
    ...props
  }: ClassAttributes<HTMLImageElement> &
    ImgHTMLAttributes<HTMLImageElement> &
    ExtraProps) =>
    typeof props.src === "string" ? (
      <DropPartMarkdownImage src={props.src} />
    ) : null;

  const renderTweetEmbed = (result: { href: string; tweetId: string }) => (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0" data-theme="dark">
        <Tweet id={result.tweetId} />
      </div>
      <ChatItemHrefButtons href={result.href} />
    </div>
  );

  const renderGifEmbed = (url: string) => (
    <img
      src={url}
      alt={url}
      className="tw-max-h-[25rem] tw-max-w-[100%] tw-h-auto"
    />
  );

  const isValidLink = (href: string): boolean => {
    try {
      new URL(href);
      return true;
    } catch {
      return false;
    }
  };

  const shouldUseOpenGraphPreview = (href: string): boolean => {
    const baseEndpoint = process.env.BASE_ENDPOINT;

    try {
      const parsed = new URL(href);
      const protocol = parsed.protocol.toLowerCase();
      if (protocol !== "http:" && protocol !== "https:") {
        return false;
      }

      if (baseEndpoint) {
        try {
          const baseUrl = new URL(baseEndpoint);
          if (parsed.host === baseUrl.host) {
            return false;
          }
        } catch {
          if (href.startsWith(baseEndpoint)) {
            return false;
          }
        }
      }

      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === "youtu.be" ||
        hostname.endsWith("youtube.com") ||
        hostname.endsWith("twitter.com") ||
        hostname.endsWith("x.com")
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

  const YoutubePreview = ({
    href,
    videoId,
    fallbackProps,
  }: {
    readonly href: string;
    readonly videoId: string;
    readonly fallbackProps: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps;
  }) => {
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

    const renderFallback = () =>
      renderExternalOrInternalLink(href, { ...fallbackProps });

    if (hasError) {
      return renderFallback();
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

  const renderSeizeQuote = (
    quoteLinkInfo: SeizeQuoteLinkInfo,
    onQuoteClick: (drop: ApiDrop) => void,
    href: string
  ) => {
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
    } else if (dropId) {
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

  const renderParagraph = (
    params: ClassAttributes<HTMLParagraphElement> &
      HTMLAttributes<HTMLParagraphElement> &
      ExtraProps
  ) => {
    const renderP = (
      params: ClassAttributes<HTMLParagraphElement> &
        HTMLAttributes<HTMLParagraphElement> &
        ExtraProps
    ) => (
      <p
        key={getRandomObjectId()}
        className={`tw-mb-0 tw-leading-6 tw-text-iron-200 tw-font-normal tw-whitespace-pre-wrap tw-break-words word-break tw-transition tw-duration-300 tw-ease-out ${textSizeClass}`}
      >
        {customRenderer({
          content: params.children,
          mentionedUsers,
          referencedNfts,
        })}
      </p>
    );

    const { children } = params;

    // Flatten children (could be string, JSX, or array)
    const flattened = Children.toArray(children);

    const elements: React.ReactNode[] = [];
    let currentTextChunk: React.ReactNode[] = [];

    const flushTextChunk = () => {
      if (currentTextChunk.length > 0) {
        elements.push(renderP({ children: currentTextChunk }));
        currentTextChunk = [];
      }
    };

    for (const node of flattened) {
      const isValid = isValidElement(node);
      const src = isValid && (node.props as any)?.src;
      const href = isValid && (node.props as any)?.href;
      if (src || (href && isSmartLink(href))) {
        flushTextChunk();
        elements.push(node);
      } else {
        currentTextChunk.push(node);
      }
    }

    flushTextChunk();

    return <>{elements}</>;
  };

  let processedContent = partContent;
  if (processedContent) {
    processedContent = processedContent.replace(/\n{4,}/g, (match: string) => {
      // Calculate how many empty paragraphs to create
      const numParagraphs = Math.floor(match.length / 2) - 1;
      // Create empty paragraphs with &nbsp; to ensure they render with height
      const emptyParagraphs = Array(numParagraphs).fill("\n\n&nbsp;").join("");
      return "\n\n" + emptyParagraphs + "\n\n";
    });
  }

  return (
    <Markdown
      rehypePlugins={[
        [
          rehypeExternalLinks,
          {
            target: "_blank",
            rel: ["noopener", "noreferrer", "nofollow"],
            protocols: ["http", "https"],
          },
        ],
        [
          rehypeSanitize,
          {
            allowedTags: [
              "p",
              "br",
              "strong",
              "em",
              "a",
              "code",
              "pre",
              "blockquote",
              "h1",
              "h2",
              "h3",
              "h4",
              "h5",
              "h6",
              "ul",
              "ol",
              "li",
              "img",
            ],
            allowedAttributes: {
              a: ["href", "title"],
              img: ["src", "alt", "title"],
            },
          },
        ],
      ]}
      remarkPlugins={[remarkGfm]}
      className="tw-w-full"
      components={{
        h5: (params) => (
          <h5 className="tw-text-iron-200 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </h5>
        ),
        h4: (params) => (
          <h4 className="tw-text-iron-200 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </h4>
        ),
        h3: (params) => (
          <h3 className="tw-text-iron-200 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </h3>
        ),
        h2: (params) => (
          <h2 className="tw-text-iron-200 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </h2>
        ),
        h1: (params) => (
          <h1 className="tw-text-iron-200 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </h1>
        ),
        p: renderParagraph,
        li: (params) => (
          <li className="tw-text-md tw-text-iron-200 tw-break-words word-break">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </li>
        ),
        code: (params) => (
          <code
            style={{ textOverflow: "unset" }}
            className="tw-text-iron-200 tw-whitespace-pre-wrap tw-break-words"
          >
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </code>
        ),
        a: (params) => aHrefRenderer(params),
        img: imgRenderer,
        br: BreakComponent,
        blockquote: (params) => (
          <blockquote className="tw-text-iron-200 tw-break-words word-break tw-pl-4 tw-border-l-4 tw-border-l-iron-500 tw-border-solid tw-border-t-0 tw-border-r-0 tw-border-b-0">
            {customRenderer({
              content: params.children,
              mentionedUsers,
              referencedNfts,
            })}
          </blockquote>
        ),
      }}
    >
      {processedContent}
    </Markdown>
  );
}

export default memo(DropPartMarkdown);
