"use client";

import {
  createElement,
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from "react";
import Markdown, {
  defaultUrlTransform,
  type Components,
  type ExtraProps,
} from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useQueryClient } from "@tanstack/react-query";
import type { PluggableList } from "unified";

import { useEmoji } from "@/contexts/EmojiContext";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropNftLink } from "@/generated/models/ApiDropNftLink";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import type { ApiDropReferencedNFT } from "@/generated/models/ApiDropReferencedNFT";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import {
  LinkPreviewProvider,
  useLinkPreviewContext,
  type LinkPreviewToggleControl,
} from "@/components/waves/LinkPreviewContext";
import { primeMarketplacePreviewCacheFromNftLinks } from "@/components/waves/marketplace/common";

import { createMarkdownContentRenderers } from "./dropPartMarkdown/content";
import { highlightCodeElement } from "./dropPartMarkdown/highlight";
import {
  createLinkRenderer,
  DEFAULT_MAX_EMBED_DEPTH,
} from "./dropPartMarkdown/linkHandlers";
import { containsMarkdownLinkWithAnchorText } from "./dropPartMarkdown/linkPreviewDetection";
import { isSafeMarkdownImageSrc } from "./dropPartMarkdown/linkUtils";

const BreakComponent = () => <br />;

const EMPTY_MENTIONED_GROUPS: ApiDropGroupMention[] = [];
const EMOJI_SHORTCODE_REGEX = /:\w+:/;

const mergeClassNames = (...classes: Array<string | undefined>): string =>
  classes.filter(Boolean).join(" ");

const headingClassName = "tw-text-iron-200 tw-break-words word-break";

const normalizeStringArray = (values?: readonly string[]): string[] => {
  if (!values || values.length === 0) {
    return [];
  }

  return values.filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );
};

type MarkdownRendererProps<T extends ElementType> =
  ComponentPropsWithoutRef<T> &
    ExtraProps & {
      children?: ReactNode | undefined;
      className?: string | undefined;
    };

type MarkdownCodeProps = MarkdownRendererProps<"code"> & {
  inline?: boolean | undefined;
};

type MarkdownComponentsOptions = {
  customRenderer: (content: ReactNode | undefined) => ReactNode;
  renderParagraph: Components["p"];
  renderAnchor: Components["a"];
  renderImage: Components["img"];
};

const InlineCodeRenderer = ({
  children,
  className,
  style,
  ...props
}: MarkdownCodeProps) => (
  <code
    {...props}
    style={{ ...style, textOverflow: "unset" }}
    className={mergeClassNames(
      "tw-whitespace-pre-wrap tw-break-words tw-text-iron-200",
      className
    )}
  >
    {children}
  </code>
);

const CodeBlockRenderer = ({
  children,
  className,
  style,
  ...props
}: MarkdownCodeProps) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof globalThis.window === "undefined") {
      return;
    }

    const element = codeRef.current;
    if (!element) {
      return;
    }

    if (element.textContent.trim() === "") {
      return;
    }

    const language = /language-([\w+-]+)/.exec(element.className)?.[1] ?? null;

    void (async () => {
      try {
        await highlightCodeElement(element, language);
      } catch (error: unknown) {
        console.error("[DropPartMarkdown] Failed to highlight code", error);
      }
    })();
  });

  return (
    <code
      {...props}
      ref={codeRef}
      style={{ ...style, textOverflow: "unset" }}
      className={mergeClassNames(
        "tw-whitespace-pre-wrap tw-break-words tw-text-iron-200",
        className
      )}
    >
      {children}
    </code>
  );
};

const CodeRenderer = ({ inline, ...props }: MarkdownCodeProps) =>
  inline ? <InlineCodeRenderer {...props} /> : <CodeBlockRenderer {...props} />;

const createMarkdownComponents = ({
  customRenderer,
  renderParagraph,
  renderAnchor,
  renderImage,
}: MarkdownComponentsOptions): Components => {
  const createHeadingRenderer = <T extends ElementType>(Tag: T) => {
    const HeadingRenderer = ({
      children,
      className,
      ...props
    }: MarkdownRendererProps<T>) => {
      const TagComponent = Tag;
      const mergedProps = {
        ...(props as Record<string, unknown>),
        className: mergeClassNames(headingClassName, className),
      };

      return createElement(TagComponent, mergedProps, customRenderer(children));
    };

    HeadingRenderer.displayName = `MarkdownHeading(${
      typeof Tag === "string" ? Tag : "component"
    })`;

    return HeadingRenderer;
  };

  const ListItemRenderer = ({
    children,
    className,
    node: _node,
    ...props
  }: MarkdownRendererProps<"li">) => (
    <li
      {...props}
      className={mergeClassNames(
        "word-break tw-break-words tw-text-md tw-text-iron-200",
        className
      )}
    >
      {customRenderer(children)}
    </li>
  );

  const BlockQuoteRenderer = ({
    children,
    className,
    ...props
  }: MarkdownRendererProps<"blockquote">) => (
    <blockquote
      {...props}
      className={mergeClassNames(
        "word-break tw-break-words tw-border-b-0 tw-border-l-4 tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-l-iron-500 tw-pl-4 tw-text-iron-200",
        className
      )}
    >
      {customRenderer(children)}
    </blockquote>
  );

  return {
    h1: createHeadingRenderer("h1"),
    h2: createHeadingRenderer("h2"),
    h3: createHeadingRenderer("h3"),
    h4: createHeadingRenderer("h4"),
    h5: createHeadingRenderer("h5"),
    ...(renderParagraph !== undefined ? { p: renderParagraph } : {}),
    li: ListItemRenderer,
    code: CodeRenderer,
    ...(renderAnchor !== undefined ? { a: renderAnchor } : {}),
    ...(renderImage !== undefined ? { img: renderImage } : {}),
    br: BreakComponent,
    blockquote: BlockQuoteRenderer,
  } satisfies Components;
};

export interface DropPartMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly mentionedGroups?: Array<ApiDropGroupMention> | undefined;
  readonly mentionedWaves: Array<ApiMentionedWave>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly nftLinks?: readonly ApiDropNftLink[] | undefined;
  readonly partContent: string | null;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly textSize?: "sm" | "md" | undefined;
  readonly currentDropId?: string | undefined;
  readonly hideLinkPreviews?: boolean | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly bodyGalleryKeyPrefix?: string | undefined;
  readonly linkPreviewToggleControl?: LinkPreviewToggleControl | undefined;
  readonly onLinkCardActionsActiveChange?:
    | ((href: string, active: boolean) => void)
    | undefined;
}

function DropPartMarkdown({
  mentionedUsers,
  mentionedGroups = EMPTY_MENTIONED_GROUPS,
  mentionedWaves,
  referencedNfts,
  nftLinks,
  partContent,
  onQuoteClick,
  textSize,
  currentDropId,
  hideLinkPreviews = false,
  embedPath,
  quotePath,
  embedDepth = 0,
  maxEmbedDepth = DEFAULT_MAX_EMBED_DEPTH,
  fullWidthLinkPreviews = false,
  bodyGalleryKeyPrefix,
  linkPreviewToggleControl,
  onLinkCardActionsActiveChange,
}: DropPartMarkdownProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobileScreen();
  const { emojiMap, findNativeEmoji, loadEmojiData } = useEmoji();
  const seizeSettings = useSeizeSettingsOptional();
  const { variant: linkPreviewVariant } = useLinkPreviewContext();

  useEffect(() => {
    if (!partContent || !EMOJI_SHORTCODE_REGEX.test(partContent)) {
      return;
    }

    void loadEmojiData();
  }, [loadEmojiData, partContent]);

  useLayoutEffect(() => {
    primeMarketplacePreviewCacheFromNftLinks({
      queryClient,
      nftLinks,
    });
  }, [queryClient, nftLinks]);

  const textSizeClass = useMemo(() => {
    switch (textSize) {
      case "sm":
        return isMobile ? "tw-text-xs" : "tw-text-sm";
      case "md":
      case undefined:
      default:
        return "tw-text-md";
    }
  }, [isMobile, textSize]);

  const normalizedEmbedPath = useMemo(() => {
    const path = normalizeStringArray(embedPath);
    if (!currentDropId || path.includes(currentDropId)) {
      return path;
    }

    return [...path, currentDropId];
  }, [currentDropId, embedPath]);

  const normalizedQuotePath = useMemo(
    () => normalizeStringArray(quotePath),
    [quotePath]
  );

  const effectiveHideLinkPreviews = useMemo(
    () => hideLinkPreviews || containsMarkdownLinkWithAnchorText(partContent),
    [hideLinkPreviews, partContent]
  );

  const { renderAnchor, isSmartLink, renderImage } = useMemo(
    () =>
      createLinkRenderer({
        onQuoteClick,
        currentDropId,
        hideLinkPreviews: effectiveHideLinkPreviews,
        isMemesWaveById: seizeSettings?.isMemesWave,
        isQuorumWaveById: seizeSettings?.isQuorumWave,
        embedPath: normalizedEmbedPath,
        quotePath: normalizedQuotePath,
        embedDepth,
        maxEmbedDepth,
        fullWidthLinkPreviews,
        bodyGalleryKeyPrefix,
      }),
    [
      onQuoteClick,
      currentDropId,
      effectiveHideLinkPreviews,
      seizeSettings?.isMemesWave,
      seizeSettings?.isQuorumWave,
      normalizedEmbedPath,
      normalizedQuotePath,
      embedDepth,
      maxEmbedDepth,
      fullWidthLinkPreviews,
      bodyGalleryKeyPrefix,
    ]
  );

  const { customRenderer, renderParagraph, processContent } = useMemo(
    () =>
      createMarkdownContentRenderers({
        textSizeClass,
        mentionedUsers,
        mentionedGroups,
        mentionedWaves,
        referencedNfts,
        emojiMap,
        findNativeEmoji,
        isSmartLink,
      }),
    [
      textSizeClass,
      mentionedUsers,
      mentionedGroups,
      mentionedWaves,
      referencedNfts,
      emojiMap,
      findNativeEmoji,
      isSmartLink,
    ]
  );

  const processedContent = useMemo(
    () => processContent(partContent),
    [processContent, partContent]
  );

  const rehypePlugins = useMemo<PluggableList>(
    () => [
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
            code: ["className"],
            pre: ["className"],
          },
          protocols: {
            cite: ["http", "https"],
            href: ["http", "https", "irc", "ircs", "mailto", "xmpp"],
            longDesc: ["http", "https"],
            src: ["http", "https", "data"],
          },
        },
      ],
    ],
    []
  );

  const remarkPlugins = useMemo<PluggableList>(() => [remarkGfm], []);

  const markdownComponents = useMemo<Components>(
    () =>
      createMarkdownComponents({
        customRenderer,
        renderParagraph,
        renderAnchor,
        renderImage,
      }),
    [customRenderer, renderAnchor, renderImage, renderParagraph]
  );

  return (
    <LinkPreviewProvider
      variant={linkPreviewVariant}
      previewToggle={linkPreviewToggleControl}
      onCardActionsActiveChange={onLinkCardActionsActiveChange}
    >
      <Markdown
        rehypePlugins={rehypePlugins}
        remarkPlugins={remarkPlugins}
        className="tw-w-full"
        components={markdownComponents}
        urlTransform={(url, key, node) => {
          if (
            key === "src" &&
            node.tagName === "img" &&
            isSafeMarkdownImageSrc(url)
          ) {
            return url;
          }

          return defaultUrlTransform(url);
        }}
      >
        {processedContent}
      </Markdown>
    </LinkPreviewProvider>
  );
}

export default memo(DropPartMarkdown);
