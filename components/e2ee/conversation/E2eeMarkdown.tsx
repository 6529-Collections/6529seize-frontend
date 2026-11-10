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
} from "react";
import Markdown, {
  defaultUrlTransform,
  type Components,
  type ExtraProps,
} from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { Plugin, PluggableList } from "unified";
import type { ComponentPropsWithoutRef } from "react";

import { highlightCodeElement } from "@/components/drops/view/part/dropPartMarkdown/highlight";
import { normalizeDropMarkdownContent } from "@/components/drops/view/part/dropPartMarkdown/normalizeContent";
import { rehypePreserveOrderedListDelimiter } from "@/components/drops/view/part/dropPartMarkdown/orderedListDelimiter";
import type { E2eeMember } from "@/lib/e2ee/types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { findMember } from "../e2eeFormat";
import { E2eeProfileLink } from "../ui/E2eeProfileLink";
import { E2eeEmojiText } from "./E2eeEmojiText";
import { splitMentions } from "./e2eeMentions";

interface PrivateTextContext {
  readonly members: readonly E2eeMember[];
  readonly mentions: readonly string[];
  readonly selfProfileId: string | null;
}

const TextContext = createContext<PrivateTextContext>({
  members: [],
  mentions: [],
  selfProfileId: null,
});

interface TextTree {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: TextTree[];
}

/** Decorate only prose. Code and link labels must never become profile links. */
function wrapProse(node: TextTree): void {
  if (!node.children || ["code", "pre", "a"].includes(node.tagName ?? ""))
    return;
  node.children = node.children.map((child) => {
    if (child.type === "text" && child.value?.trim()) {
      return {
        type: "element",
        tagName: "span",
        properties: {},
        children: [child],
      };
    }
    wrapProse(child);
    return child;
  });
}

const rehypePrivateText: Plugin = () => (tree) => wrapProse(tree as TextTree);

function Prose({ children }: ComponentPropsWithoutRef<"span">) {
  const { members, mentions, selfProfileId } = useContext(TextContext);
  if (typeof children !== "string") return <span>{children}</span>;
  return splitMentions(children, members, mentions).map((segment) =>
    segment.kind === "mention" ? (
      <E2eeProfileLink
        key={segment.start}
        member={findMember(members, segment.profileId)}
        className={`tw-rounded tw-px-0.5 tw-font-semibold tw-text-primary-300 ${segment.profileId === selfProfileId ? "tw-bg-primary-500/25" : ""}`}
      >
        {segment.value}
      </E2eeProfileLink>
    ) : (
      <E2eeEmojiText key={segment.start} text={segment.value} />
    )
  );
}

function PrivateLink({
  node: _node,
  href,
  children,
  ...props
}: ComponentPropsWithoutRef<"a"> & ExtraProps) {
  // Native anchors have no router prefetch, preview, proxy or hover fetch.
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

function PrivateImage({ src, alt, title }: ComponentPropsWithoutRef<"img">) {
  const locale = useBrowserLocale();
  // Rendering a Markdown image must not contact its host or an image proxy.
  const href = typeof src === "string" ? src : undefined;
  if (!href) return <span>{alt}</span>;
  let label = alt;
  if (!label?.trim()) {
    let host: string | undefined;
    try {
      host = new URL(href).hostname;
    } catch {
      /* Relative links have no host label. */
    }
    label = host
      ? t(locale, "e2ee.message.imageLinkFrom", { host })
      : t(locale, "e2ee.message.imageLink");
  }
  return (
    <PrivateLink href={href} title={title}>
      {label}
    </PrivateLink>
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

function Code({
  children,
  className,
}: ComponentPropsWithoutRef<"code"> & ExtraProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || element.parentElement?.tagName !== "PRE") return;
    delete element.dataset["highlighted"];
    const language = /language-([\w+-]+)/.exec(className ?? "")?.[1];
    // The highlighter loads bundled code only; no content or language URL is fetched.
    void highlightCodeElement(element, language).catch(() => {
      // Readable code remains available if local highlighting fails.
    });
  }, [children, className]);
  return (
    <code
      key={typeof children === "string" ? children : undefined}
      ref={ref}
      className={className}
    >
      {children}
    </code>
  );
}

function Paragraph({ children }: ComponentPropsWithoutRef<"p">) {
  const parts = Children.toArray(children);
  const blank =
    parts.length > 0 &&
    parts.every((part) => typeof part === "string" && part.trim().length === 0);
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
    <p className="tw-m-0 tw-mb-1.5 tw-whitespace-pre-wrap last:tw-mb-0">
      {children}
    </p>
  );
}

const COMPONENTS: Components = {
  span: Prose,
  a: PrivateLink,
  img: PrivateImage,
  code: Code,
  p: Paragraph,
  blockquote: ({ children }) => (
    <blockquote className="tw-border-y-0 tw-border-l-4 tw-border-r-0 tw-border-solid tw-border-l-iron-500 tw-pl-4">
      {children}
    </blockquote>
  ),
  table: Table,
};

const REMARK_PLUGINS = [remarkGfm];

export const E2eeMarkdown = memo(
  ({
    text,
    messageId,
    members,
    mentions,
    selfProfileId,
  }: PrivateTextContext & {
    readonly text: string;
    readonly messageId: string;
  }) => {
    const renderId = useId();
    const context = useMemo(
      () => ({ members, mentions, selfProfileId }),
      [members, mentions, selfProfileId]
    );
    const plugins = useMemo<PluggableList>(
      () => [
        // Raw HTML is disabled; remark already scopes its generated footnote IDs.
        [rehypeSanitize, { ...defaultSchema, clobberPrefix: "" }],
        rehypePreserveOrderedListDelimiter,
        rehypePrivateText,
      ],
      []
    );
    return (
      <TextContext.Provider value={context}>
        <Markdown
          className="word-break tw-min-w-0 tw-max-w-full tw-break-words tw-text-md tw-leading-6 tw-text-iron-200 [&_code]:tw-text-iron-200 [&_h1]:tw-text-iron-200 [&_h2]:tw-text-iron-200 [&_h3]:tw-text-iron-200 [&_h4]:tw-text-iron-200 [&_h5]:tw-text-iron-200 [&_h6]:tw-text-iron-200 [&_pre]:tw-max-w-full [&_pre]:tw-overflow-x-auto [&_pre_code]:tw-whitespace-pre-wrap"
          skipHtml
          remarkPlugins={REMARK_PLUGINS}
          remarkRehypeOptions={{
            clobberPrefix: `e2ee-${messageId}-${renderId}-`,
          }}
          rehypePlugins={plugins}
          components={COMPONENTS}
        >
          {normalizeDropMarkdownContent(text)}
        </Markdown>
      </TextContext.Provider>
    );
  }
);

E2eeMarkdown.displayName = "E2eeMarkdown";
