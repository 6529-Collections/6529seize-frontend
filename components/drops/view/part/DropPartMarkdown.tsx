import {
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

import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { ApiDropMentionedUser } from "../../../../generated/models/ApiDropMentionedUser";
import { ApiDropReferencedNFT } from "../../../../generated/models/ApiDropReferencedNFT";
import { useEmoji } from "../../../../contexts/EmojiContext";
import useIsMobileScreen from "../../../../hooks/isMobileScreen";

import {
  DropContentPartType,
  createMarkdownContentRenderers,
} from "./dropPartMarkdown/content";
import {
  createLinkRenderer,

} from "./dropPartMarkdown/linkHandlers";
import { highlightCodeElement } from "./dropPartMarkdown/highlight";

const BreakComponent = () => <br />;

export interface DropPartMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly partContent: string | null;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly textSize?: "sm" | "md";
}

function DropPartMarkdown({
  mentionedUsers,
  referencedNfts,
  partContent,
  onQuoteClick,
  textSize,
}: DropPartMarkdownProps) {
  const isMobile = useIsMobileScreen();
  const { emojiMap, findNativeEmoji } = useEmoji();

  const textSizeClass = useMemo(() => {
    switch (textSize) {
      case "sm":
        return isMobile ? "tw-text-xs" : "tw-text-sm";
      default:
        return "tw-text-md";
    }
  }, [isMobile, textSize]);



  const { renderAnchor, isSmartLink, renderImage } = useMemo(
    () =>
      createLinkRenderer({
        onQuoteClick
      }),
    [onQuoteClick]
  );

  const { customRenderer, renderParagraph, processContent } = useMemo(
    () =>
      createMarkdownContentRenderers({
        textSizeClass,
        mentionedUsers,
        referencedNfts,
        emojiMap,
        findNativeEmoji,
        isSmartLink,
      }),
    [
      textSizeClass,
      mentionedUsers,
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
    () => {
      const mergeClassNames = (
        ...classes: Array<string | undefined>
      ): string => classes.filter(Boolean).join(" ");

      const headingClassName = "tw-text-iron-200 tw-break-words word-break";

      type MarkdownRendererProps<T extends ElementType> = ComponentPropsWithoutRef<T> &
        ExtraProps & { children?: ReactNode; className?: string };

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

        HeadingRenderer.displayName = `MarkdownHeading(${typeof Tag === "string" ? Tag : "component"})`;

        return HeadingRenderer;
      };

      type MarkdownCodeProps = MarkdownRendererProps<"code"> & {
        inline?: boolean;
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
            "tw-text-iron-200 tw-whitespace-pre-wrap tw-break-words",
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

        const language = useMemo(() => {
          const match = typeof className === "string"
            ? /language-([\w+-]+)/.exec(className)
            : null;
          return match?.[1] ?? null;
        }, [className]);

        useEffect(() => {
          if (typeof window === "undefined") {
            return;
          }

          const element = codeRef.current;
          if (!element) {
            return;
          }

          void highlightCodeElement(element, language);
        }, [language, children]);

        return (
          <code
            {...props}
            ref={codeRef}
            style={{ ...style, textOverflow: "unset" }}
            className={mergeClassNames(
              "tw-text-iron-200 tw-whitespace-pre-wrap tw-break-words",
              className
            )}
          >
            {children}
          </code>
        );
      };

      return {
        h1: createHeadingRenderer("h1"),
        h2: createHeadingRenderer("h2"),
        h3: createHeadingRenderer("h3"),
        h4: createHeadingRenderer("h4"),
        h5: createHeadingRenderer("h5"),
        p: renderParagraph,
        li: ({ children, className, ...props }) => (
          <li
            {...props}
            className={mergeClassNames(
              "tw-text-md tw-text-iron-200 tw-break-words word-break",
              className
            )}
          >
            {customRenderer(children)}
          </li>
        ),
        code: ({ inline, ...props }: MarkdownCodeProps) =>
          inline ? (
            <InlineCodeRenderer {...props} />
          ) : (
            <CodeBlockRenderer {...props} />
          ),
        a: renderAnchor,
        img: renderImage,
        br: BreakComponent,
        blockquote: ({ children, className, ...props }) => (
          <blockquote
            {...props}
            className={mergeClassNames(
              "tw-text-iron-200 tw-break-words word-break tw-pl-4 tw-border-l-4 tw-border-l-iron-500 tw-border-solid tw-border-t-0 tw-border-r-0 tw-border-b-0",
              className
            )}
          >
            {customRenderer(children)}
          </blockquote>
        ),
      } satisfies Components;
    },
    [customRenderer, renderAnchor, renderImage, renderParagraph]
  );

  return (
    <Markdown
      rehypePlugins={rehypePlugins}
      remarkPlugins={remarkPlugins}
      className="tw-w-full"
      components={markdownComponents}
    >
      {processedContent}
    </Markdown>
  );
}

export { DropContentPartType };

export default memo(DropPartMarkdown);
