"use client";

import {
  createContext,
  createElement,
  memo,
  useContext,
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
import rehypeSanitize, {
  defaultSchema,
  type Options as RehypeSanitizeSchema,
} from "rehype-sanitize";
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
import { isSafeMarkdownImageSrc } from "./dropPartMarkdown/linkUtils";
import { rehypeDropPreview } from "./dropPartMarkdown/preview";
import { rehypePreserveOrderedListDelimiter } from "./dropPartMarkdown/orderedListDelimiter";

/**
 * Complete sanitize policy for drop markdown.
 *
 * rehype-sanitize shallow-merges its options over hast-util-sanitize's
 * GitHub-style `defaultSchema`, so drops use that schema's tag, attribute,
 * ancestor, `script` strip and `user-content-` clobber rules. The only
 * override is `protocols`, which also allows `data:` image sources;
 * `isSafeMarkdownImageSrc` in `urlTransform` narrows those to base64 raster
 * images. Raw HTML in drop text is dropped here (there is no rehype-raw), so
 * only markdown and GFM constructs render. Narrowing this schema changes how
 * existing drops render (for example GFM tables, strikethrough, task lists
 * and footnotes).
 */
const DROP_MARKDOWN_SANITIZE_SCHEMA: RehypeSanitizeSchema = {
  ...defaultSchema,
  protocols: {
    cite: ["http", "https"],
    href: ["http", "https", "irc", "ircs", "mailto", "xmpp"],
    longDesc: ["http", "https"],
    src: ["http", "https", "data"],
  },
};

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

type MarkdownComponentsOptions = Pick<
  ReturnType<typeof createMarkdownContentRenderers>,
  "customRenderer" | "renderParagraph"
> &
  Pick<ReturnType<typeof createLinkRenderer>, "renderAnchor" | "renderImage">;

const MarkdownRenderersContext =
  createContext<MarkdownComponentsOptions | null>(null);

function useMarkdownRenderers() {
  const renderers = useContext(MarkdownRenderersContext);
  if (!renderers) throw new Error("Markdown renderers are unavailable");
  return renderers;
}

const ParagraphRenderer = (
  props: Parameters<MarkdownComponentsOptions["renderParagraph"]>[0]
) => useMarkdownRenderers().renderParagraph(props);
const AnchorRenderer = (
  props: Parameters<MarkdownComponentsOptions["renderAnchor"]>[0]
) => useMarkdownRenderers().renderAnchor(props);
const ImageRenderer = (
  props: Parameters<MarkdownComponentsOptions["renderImage"]>[0]
) => useMarkdownRenderers().renderImage(props);

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

const createMarkdownComponents = (): Components => {
  const createHeadingRenderer = <T extends ElementType>(Tag: T) => {
    const HeadingRenderer = ({
      children,
      className,
      ...props
    }: MarkdownRendererProps<T>) => {
      const { customRenderer } = useMarkdownRenderers();
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
  }: MarkdownRendererProps<"li">) => {
    const { customRenderer } = useMarkdownRenderers();
    return (
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
  };

  const BlockQuoteRenderer = ({
    children,
    className,
    ...props
  }: MarkdownRendererProps<"blockquote">) => {
    const { customRenderer } = useMarkdownRenderers();
    return (
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
  };

  return {
    h1: createHeadingRenderer("h1"),
    h2: createHeadingRenderer("h2"),
    h3: createHeadingRenderer("h3"),
    h4: createHeadingRenderer("h4"),
    h5: createHeadingRenderer("h5"),
    p: ParagraphRenderer,
    li: ListItemRenderer,
    code: CodeRenderer,
    a: AnchorRenderer,
    img: ImageRenderer,
    br: BreakComponent,
    blockquote: BlockQuoteRenderer,
  } satisfies Components;
};

// Keep component types stable when emoji data, settings or callbacks change.
// Replacing a touched paragraph breaks its native touch sequence and selection.
const MARKDOWN_COMPONENTS = createMarkdownComponents();

export interface DropPartMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly mentionedGroups?: Array<ApiDropGroupMention> | undefined;
  readonly mentionedWaves: Array<ApiMentionedWave>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly nftLinks?: readonly ApiDropNftLink[] | undefined;
  readonly partContent: string | null;
  readonly collapsedPreview?: boolean | undefined;
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
  collapsedPreview = false,
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

  const { renderAnchor, isSmartLink, renderImage } = useMemo(
    () =>
      createLinkRenderer({
        onQuoteClick,
        currentDropId,
        hideLinkPreviews,
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
      hideLinkPreviews,
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
      [rehypeSanitize, DROP_MARKDOWN_SANITIZE_SCHEMA],
      // This trusted plugin only adds one static renderer-owned class.
      rehypePreserveOrderedListDelimiter,
      ...(collapsedPreview ? [rehypeDropPreview] : []),
    ],
    [collapsedPreview]
  );

  const remarkPlugins = useMemo<PluggableList>(() => [remarkGfm], []);

  const markdownRenderers = useMemo<MarkdownComponentsOptions>(
    () => ({
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
      <MarkdownRenderersContext.Provider value={markdownRenderers}>
        <Markdown
          rehypePlugins={rehypePlugins}
          remarkPlugins={remarkPlugins}
          className="tw-w-full"
          components={MARKDOWN_COMPONENTS}
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
      </MarkdownRenderersContext.Provider>
    </LinkPreviewProvider>
  );
}

export default memo(DropPartMarkdown);
