"use client";

import {
  Children,
  memo,
  useEffect,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from "react";
import Markdown, { type Components, type ExtraProps } from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { PluggableList } from "unified";

import { useEmoji } from "@/contexts/EmojiContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import type { ApiDropReferencedNFT } from "@/generated/models/ApiDropReferencedNFT";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useTweetPreviewMode } from "@/components/tweets/TweetPreviewModeContext";
import {
  LinkPreviewProvider,
  useLinkPreviewContext,
  type LinkPreviewToggleControl,
} from "@/components/waves/LinkPreviewContext";

import {
  DropContentPartType,
  createMarkdownContentRenderers,
} from "./dropPartMarkdown/content";
import { highlightCodeElement } from "./dropPartMarkdown/highlight";
import {
  createLinkRenderer,
  DEFAULT_MAX_EMBED_DEPTH,
} from "./dropPartMarkdown/linkHandlers";

const BreakComponent = () => <br />;

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

  const codeText = useMemo(() => {
    return Children.toArray(children)
      .map((child) => {
        if (typeof child === "string" || typeof child === "number") {
          return child;
        }

        return "";
      })
      .join("");
  }, [children]);

  const language = useMemo(() => {
    const match =
      typeof className === "string"
        ? /language-([\w+-]+)/.exec(className)
        : null;

    return match?.[1] ?? null;
  }, [className]);

  useEffect(() => {
    if (globalThis.window === undefined) {
      return;
    }

    const element = codeRef.current;
    if (!element) {
      return;
    }

    if (!codeText || codeText.trim() === "") {
      return;
    }

    highlightCodeElement(element, language).catch((error) => {
      console.error("[DropPartMarkdown] Failed to highlight code", error);
    });
  }, [codeText, language]);

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

      return (
        <TagComponent {...(mergedProps as any)}>
          {customRenderer(children)}
        </TagComponent>
      );
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
    ...(renderParagraph ? { p: renderParagraph } : {}),
    li: ListItemRenderer,
    code: CodeRenderer,
    ...(renderAnchor ? { a: renderAnchor } : {}),
    ...(renderImage ? { img: renderImage } : {}),
    br: BreakComponent,
    blockquote: BlockQuoteRenderer,
  } satisfies Components;
};

export interface DropPartMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly mentionedWaves: Array<ApiMentionedWave>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly partContent: string | null;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly textSize?: "sm" | "md" | undefined;
  readonly currentDropId?: string | undefined;
  readonly hideLinkPreviews?: boolean | undefined;
  readonly marketplaceImageOnly?: boolean | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
  readonly linkPreviewToggleControl?: LinkPreviewToggleControl | undefined;
}

function DropPartMarkdown({
  mentionedUsers,
  mentionedWaves,
  referencedNfts,
  partContent,
  onQuoteClick,
  textSize,
  currentDropId,
  hideLinkPreviews = false,
  marketplaceImageOnly = false,
  embedPath,
  quotePath,
  embedDepth = 0,
  maxEmbedDepth = DEFAULT_MAX_EMBED_DEPTH,
  linkPreviewToggleControl,
}: DropPartMarkdownProps) {
  const isMobile = useIsMobileScreen();
  const { emojiMap, findNativeEmoji } = useEmoji();
  const tweetPreviewMode = useTweetPreviewMode();
  const { variant: linkPreviewVariant } = useLinkPreviewContext();

  const textSizeClass = useMemo(() => {
    switch (textSize) {
      case "sm":
        return isMobile ? "tw-text-xs" : "tw-text-sm";
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

  const inlineShowControl = useMemo(() => {
    if (!linkPreviewToggleControl) {
      return undefined;
    }

    return {
      enabled: linkPreviewToggleControl.isHidden,
      isLoading: linkPreviewToggleControl.isLoading,
      onToggle: linkPreviewToggleControl.onToggle,
      label: linkPreviewToggleControl.label,
    };
  }, [linkPreviewToggleControl]);

  const { renderAnchor, isSmartLink, renderImage } = useMemo(
    () =>
      createLinkRenderer({
        onQuoteClick,
        currentDropId,
        hideLinkPreviews,
        tweetPreviewMode,
        marketplaceImageOnly,
        embedPath: normalizedEmbedPath,
        quotePath: normalizedQuotePath,
        embedDepth,
        maxEmbedDepth,
        inlineShowControl,
      }),
    [
      onQuoteClick,
      currentDropId,
      hideLinkPreviews,
      tweetPreviewMode,
      marketplaceImageOnly,
      normalizedEmbedPath,
      normalizedQuotePath,
      embedDepth,
      maxEmbedDepth,
      inlineShowControl,
    ]
  );

  const { customRenderer, renderParagraph, processContent } = useMemo(
    () =>
      createMarkdownContentRenderers({
        textSizeClass,
        mentionedUsers,
        mentionedWaves,
        referencedNfts,
        emojiMap,
        findNativeEmoji,
        isSmartLink,
      }),
    [
      textSizeClass,
      mentionedUsers,
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
      inlineShowControl={inlineShowControl}
    >
      <Markdown
        rehypePlugins={rehypePlugins}
        remarkPlugins={remarkPlugins}
        className="tw-w-full"
        components={markdownComponents}
      >
        {processedContent}
      </Markdown>
    </LinkPreviewProvider>
  );
}

export { DropContentPartType };

export default memo(DropPartMarkdown);
