import { memo, useMemo, type ComponentPropsWithoutRef } from "react";
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
  isArtBlocksFeatureEnabled,
} from "./dropPartMarkdown/linkHandlers";

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

  const isArtBlocksCardEnabled = useMemo(
    () => isArtBlocksFeatureEnabled(),
    []
  );

  const { renderAnchor, isSmartLink, renderImage } = useMemo(
    () =>
      createLinkRenderer({
        onQuoteClick,
        isArtBlocksCardEnabled,
      }),
    [onQuoteClick, isArtBlocksCardEnabled]
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
      const createHeadingRenderer = <T extends keyof JSX.IntrinsicElements>(
        Tag: T
      ) =>
        ({ children, className, ...props }: ComponentPropsWithoutRef<T> & ExtraProps) => (
          <Tag
            {...props}
            className={mergeClassNames(headingClassName, className)}
          >
            {customRenderer(children)}
          </Tag>
        );

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
        code: ({ children, className, style, ...props }) => (
          <code
            {...props}
            style={{ ...style, textOverflow: "unset" }}
            className={mergeClassNames(
              "tw-text-iron-200 tw-whitespace-pre-wrap tw-break-words",
              className
            )}
          >
            {customRenderer(children)}
          </code>
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
