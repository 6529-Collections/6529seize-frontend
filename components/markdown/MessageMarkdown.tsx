"use client";

import {
  Children,
  createContext,
  memo,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import Markdown, {
  defaultUrlTransform,
  type Components,
  type ExtraProps,
} from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { PluggableList } from "unified";
import { highlightCodeElement } from "@/components/drops/view/part/dropPartMarkdown/highlight";
import { isSafeMarkdownImageSrc } from "@/components/drops/view/part/dropPartMarkdown/linkUtils";
import { normalizeDropMarkdownContent } from "@/components/drops/view/part/dropPartMarkdown/normalizeContent";
import { rehypePreserveOrderedListDelimiter } from "@/components/drops/view/part/dropPartMarkdown/orderedListDelimiter";
import { rehypeDropPreview } from "@/components/drops/view/part/dropPartMarkdown/preview";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

// Public drops support safe raster data images. Private messages keep the
// default protocol policy; their images are explicit links, never resources.
const PUBLIC_SCHEMA = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https", "data"],
  },
};
const REMARK_PLUGINS = [remarkGfm];
const EMPTY_PLUGINS: PluggableList = [];
const PUBLIC_LINK_PLUGINS: PluggableList = [
  [
    rehypeExternalLinks,
    {
      target: "_blank",
      rel: ["noopener", "noreferrer", "nofollow"],
      protocols: ["http", "https"],
    },
  ],
];
const identity = (children: ReactNode) => children;
const RenderingContext = createContext({ renderText: identity });

/** Shared paragraph typography, including authored empty lines. */
export function MarkdownParagraph({
  children,
  textSizeClassName = "tw-text-md",
  renderText = identity,
}: {
  readonly children: ReactNode;
  readonly textSizeClassName?: string;
  readonly renderText?: (children: ReactNode) => ReactNode;
}) {
  const parts = Children.toArray(children);
  const blank =
    parts.length > 0 &&
    parts.every((part) => typeof part === "string" && !part.trim());
  if (blank) {
    return (
      <p
        aria-hidden="true"
        className="word-break tw-my-1 tw-h-2 tw-leading-none"
      >
        {"\u00a0"}
      </p>
    );
  }
  return (
    <p
      className={`word-break tw-mb-1.5 tw-mt-0 tw-whitespace-pre-wrap tw-break-words tw-font-normal tw-leading-6 tw-text-iron-200 last:tw-mb-0 ${textSizeClassName}`}
    >
      {renderText(children)}
    </p>
  );
}

function Paragraph({ children }: ComponentPropsWithoutRef<"p">) {
  const { renderText } = useContext(RenderingContext);
  return (
    <MarkdownParagraph renderText={renderText}>{children}</MarkdownParagraph>
  );
}

function createHeading(Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  return function Heading({ children }: ComponentPropsWithoutRef<"h1">) {
    const { renderText } = useContext(RenderingContext);
    return (
      <Tag className="word-break tw-break-words tw-text-iron-200">
        {renderText(children)}
      </Tag>
    );
  };
}

function ListItem({
  children,
  node: _node,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"li"> & ExtraProps) {
  const { renderText } = useContext(RenderingContext);
  return (
    <li
      {...props}
      className={`word-break tw-break-words tw-text-md tw-text-iron-200 ${className}`}
    >
      {renderText(children)}
    </li>
  );
}

function Blockquote({ children }: ComponentPropsWithoutRef<"blockquote">) {
  const { renderText } = useContext(RenderingContext);
  return (
    <blockquote className="word-break tw-break-words tw-border-y-0 tw-border-l-4 tw-border-r-0 tw-border-solid tw-border-l-iron-500 tw-pl-4 tw-text-iron-200">
      {renderText(children)}
    </blockquote>
  );
}

function Code({ children, className }: ComponentPropsWithoutRef<"code">) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || element.parentElement?.tagName !== "PRE") return;
    delete element.dataset["highlighted"];
    const language = /language-([\w+-]+)/.exec(className ?? "")?.[1];
    // Only bundled highlighters are loaded; message URLs are never fetched.
    void highlightCodeElement(element, language).catch(() => {
      // The original code remains readable if highlighting is unavailable.
    });
  }, [children, className]);
  return (
    <code
      key={typeof children === "string" ? children : undefined}
      ref={ref}
      className={`tw-whitespace-pre-wrap tw-break-words tw-text-iron-200 ${className ?? ""}`}
      style={{ textOverflow: "unset" }}
    >
      {children}
    </code>
  );
}

function SafeLink({
  node: _node,
  href,
  children,
  ...props
}: ComponentPropsWithoutRef<"a"> & ExtraProps) {
  const safeHref = href ? defaultUrlTransform(href) : undefined;
  if (!safeHref) return <span>{children}</span>;
  return (
    <a
      {...props}
      href={safeHref}
      target={safeHref.startsWith("#") ? undefined : "_blank"}
      rel="noopener noreferrer nofollow ugc"
      className="tw-break-all tw-text-primary-300 tw-underline tw-decoration-primary-300/40 tw-underline-offset-2 hover:tw-decoration-primary-300 focus-visible:tw-rounded focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
    >
      {children}
    </a>
  );
}

function ImageLink({ src, alt, title }: ComponentPropsWithoutRef<"img">) {
  const locale = useBrowserLocale();
  const href = typeof src === "string" ? src : undefined;
  if (!href) return <span>{alt}</span>;
  let label = alt;
  if (!label?.trim()) {
    let host: string | undefined;
    try {
      host = new URL(href).hostname;
    } catch {
      // Relative links have no host label.
    }
    label = host
      ? t(locale, "e2ee.message.imageLinkFrom", { host })
      : t(locale, "e2ee.message.imageLink");
  }
  return (
    <SafeLink href={href} title={title}>
      {label}
    </SafeLink>
  );
}

function Table({ children }: ComponentPropsWithoutRef<"table">) {
  const locale = useBrowserLocale();
  return (
    <div
      role="region"
      aria-label={t(locale, "e2ee.message.markdownTable")}
      tabIndex={0}
      className="tw-max-w-full tw-overflow-x-auto focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
    >
      <table>{children}</table>
    </div>
  );
}

function PreviewImage({ alt }: ComponentPropsWithoutRef<"img">) {
  const locale = useBrowserLocale();
  const label = alt?.trim() ?? "";
  return (
    <span>
      {label.length > 0 ? label : t(locale, "e2ee.message.imageLink")}
    </span>
  );
}

const COMPONENTS: Components = {
  h1: createHeading("h1"),
  h2: createHeading("h2"),
  h3: createHeading("h3"),
  h4: createHeading("h4"),
  h5: createHeading("h5"),
  h6: createHeading("h6"),
  p: Paragraph,
  li: ListItem,
  blockquote: Blockquote,
  code: Code,
  a: SafeLink,
  img: ImageLink,
  table: Table,
};
const PRIVATE_COMPONENTS: Components = { a: SafeLink, img: ImageLink };
// A notification row is already a link. Its body must never nest links,
// interactive controls, embeds or remote images inside that destination.
const PREVIEW_COMPONENTS: Components = {
  a: ({ children }) => <span>{children}</span>,
  img: PreviewImage,
  input: ({ checked }) => <span>{checked ? "☑" : "☐"}</span>,
  table: ({ children }) => <table>{children}</table>,
  p: ({ children }) => (
    <p className="tw-m-0 tw-text-sm tw-leading-5">{children}</p>
  ),
};

export interface MessageMarkdownProps {
  readonly text: string | null;
  readonly privacy: "public" | "private";
  /** Two-line, non-interactive notification content. Parse before shortening. */
  readonly preview?: boolean;
  /** Longer expandable drop excerpts retain their public media behavior. */
  readonly collapsedPreview?: boolean;
  readonly messageId?: string | undefined;
  readonly className?: string;
  /** Trusted, local adapters for mentions and public rich media. */
  readonly components?: Components;
  readonly renderText?: (children: ReactNode) => ReactNode;
  readonly textPlugins?: PluggableList;
}

/** One parser and formatting policy for public drops, private chats and previews. */
export const MessageMarkdown = memo(
  ({
    text,
    privacy,
    preview = false,
    collapsedPreview = false,
    messageId = "message",
    className = "",
    components,
    renderText = identity,
    textPlugins = EMPTY_PLUGINS,
  }: MessageMarkdownProps) => {
    const renderId = useId();
    const context = useMemo(() => ({ renderText }), [renderText]);
    const content = useMemo(
      () => (preview ? text : normalizeDropMarkdownContent(text)),
      [preview, text]
    );
    const plugins = useMemo<PluggableList>(
      () => [
        ...(privacy === "public" ? PUBLIC_LINK_PLUGINS : EMPTY_PLUGINS),
        [
          rehypeSanitize,
          {
            ...(privacy === "public" ? PUBLIC_SCHEMA : defaultSchema),
            // remark scopes footnotes to this mounted instance before sanitization.
            clobberPrefix: "",
          },
        ],
        rehypePreserveOrderedListDelimiter,
        ...(preview || collapsedPreview ? [rehypeDropPreview] : []),
        ...textPlugins,
      ],
      [privacy, preview, collapsedPreview, textPlugins]
    );
    const renderers = useMemo<Components>(
      () => ({
        ...COMPONENTS,
        ...components,
        ...(privacy === "private" ? PRIVATE_COMPONENTS : {}),
        ...(preview ? PREVIEW_COMPONENTS : {}),
      }),
      [components, privacy, preview]
    );
    return (
      <RenderingContext.Provider value={context}>
        <Markdown
          className={`word-break tw-min-w-0 tw-max-w-full tw-break-words tw-text-iron-200 [&_pre]:tw-max-w-full [&_pre]:tw-overflow-x-auto [&_ul]:tw-list-disc [&_ul_ul]:tw-list-[circle] [&_ul_ul_ul]:tw-list-[square] ${preview ? "tw-line-clamp-2 tw-max-h-10 tw-overflow-hidden [&_*]:!tw-my-0 [&_*]:!tw-text-sm [&_*]:!tw-leading-5 [&_pre_code]:!tw-p-0" : ""} ${className}`}
          skipHtml
          remarkPlugins={REMARK_PLUGINS}
          remarkRehypeOptions={{
            clobberPrefix: `${privacy === "private" ? "e2ee" : "user-content"}-${messageId}-${renderId}-`,
          }}
          rehypePlugins={plugins}
          components={renderers}
          urlTransform={(url, key, node) =>
            privacy === "public" &&
            !preview &&
            key === "src" &&
            node.tagName === "img" &&
            isSafeMarkdownImageSrc(url)
              ? url
              : defaultUrlTransform(url)
          }
        >
          {content}
        </Markdown>
      </RenderingContext.Provider>
    );
  }
);

MessageMarkdown.displayName = "MessageMarkdown";
