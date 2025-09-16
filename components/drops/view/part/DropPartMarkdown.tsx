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
import {
  fetchLinkPreview,
  type LinkPreviewMetadata,
} from "../../../../services/api/link-preview";

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
                className={`${
                  areAllPartsEmojis ? "emoji-text-node" : "tw-align-middle"
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

  const shouldRenderLinkPreview = (href: string): boolean => {
    const baseEndpoint = process.env.BASE_ENDPOINT ?? "";
    const isExternalLink = !!baseEndpoint && !href.startsWith(baseEndpoint);

    if (!isExternalLink) {
      return false;
    }

    try {
      const protocol = new URL(href).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  };

  const isSmartLink = (href: string): boolean => {
    return (
      smartLinkHandlers.some((handler) => !!handler.parse(href)) ||
      shouldRenderLinkPreview(href)
    );
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

    for (const { parse, render } of smartLinkHandlers) {
      const result = parse(href);
      if (result) {
        return render(result, href);
      }
    }

    const anchorRenderData = createAnchorRenderData(href, props);

    if (!shouldRenderLinkPreview(href)) {
      return anchorRenderData.element;
    }

    return (
      <ExternalLinkPreview
        href={href}
        anchorProps={anchorRenderData.anchorProps}
        fallback={anchorRenderData.element}
      />
    );
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

  const createAnchorRenderData = (
    href: string,
    props: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps
  ): {
    anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps;
    element: JSX.Element;
    isExternalLink: boolean;
  } => {
    const baseEndpoint = process.env.BASE_ENDPOINT ?? "";
    const isExternalLink = !!baseEndpoint && !href.startsWith(baseEndpoint);

    const anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps = {
      ...props,
    };

    const originalOnClick = anchorProps.onClick;

    anchorProps.onClick = (event) => {
      event.stopPropagation();
      if (originalOnClick) {
        originalOnClick(event);
      }
    };

    if (isExternalLink) {
      anchorProps.href = href;
      anchorProps.rel = "noopener noreferrer nofollow";
      anchorProps.target = "_blank";
    } else {
      anchorProps.href = href.replace(baseEndpoint, "");
    }

    return {
      anchorProps,
      element: <a {...anchorProps} />,
      isExternalLink,
    };
  };

  type LinkPreviewState =
    | { readonly status: "loading" }
    | { readonly status: "error" }
    | { readonly status: "success"; readonly data: LinkPreviewMetadata };

  const ExternalLinkPreview = ({
    href,
    anchorProps,
    fallback,
  }: {
    readonly href: string;
    readonly anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps;
    readonly fallback: JSX.Element;
  }) => {
    const [state, setState] = useState<LinkPreviewState>({
      status: "loading",
    });

    useEffect(() => {
      let isMounted = true;
      const controller = new AbortController();

      setState({ status: "loading" });

      try {
        const maybePromise = fetchLinkPreview(href, {
          signal: controller.signal,
        });

        Promise.resolve(maybePromise)
          .then((metadata) => {
            if (!isMounted) {
              return;
            }

            if (
              !metadata ||
              (!metadata.title && !metadata.description && !metadata.image)
            ) {
              setState({ status: "error" });
              return;
            }

            setState({ status: "success", data: metadata });
          })
          .catch((error: unknown) => {
            if (!isMounted) {
              return;
            }

            if (error instanceof DOMException && error.name === "AbortError") {
              return;
            }

            setState({ status: "error" });
          });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({ status: "error" });
      }

      return () => {
        isMounted = false;
        controller.abort();
      };
    }, [href]);

    if (state.status !== "success") {
      return fallback;
    }

    const { children: _children, className, ...restAnchorProps } = anchorProps;
    const { title, description, image, siteName } = state.data;

    let hostLabel: string | undefined;
    try {
      hostLabel = siteName ?? new URL(href).hostname;
    } catch {
      hostLabel = siteName ?? href;
    }

    const imageAlt = title ?? hostLabel ?? href;

    return (
      <div
        className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1"
        data-testid="link-preview-card"
      >
        <div className="tw-flex-1 tw-min-w-0">
          <a
            {...restAnchorProps}
            className={`tw-block tw-no-underline tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-500 ${
              className ?? ""
            }`}
          >
            <div className="tw-flex tw-items-start tw-gap-x-3">
              {image && (
                <div className="tw-w-20 tw-h-20 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
                  <img
                    src={image}
                    alt={imageAlt}
                    className="tw-w-full tw-h-full tw-object-cover"
                  />
                </div>
              )}
              <div className="tw-flex tw-flex-col tw-gap-y-1 tw-min-w-0">
                {hostLabel && (
                  <span className="tw-text-xs tw-text-iron-400 tw-truncate">
                    {hostLabel}
                  </span>
                )}
                {title && (
                  <span className="tw-text-sm tw-font-semibold tw-text-iron-50 tw-truncate">
                    {title}
                  </span>
                )}
                {description && (
                  <span className="tw-text-xs tw-text-iron-300 tw-break-words">
                    {description}
                  </span>
                )}
              </div>
            </div>
          </a>
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
