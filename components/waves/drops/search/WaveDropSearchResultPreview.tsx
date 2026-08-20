"use client";

import { Children, Fragment, isValidElement, type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

const TOKEN_PATTERN = /(@\[[^\]]+\]|#\[[^\]]+\]|\$\[[^\]]+\])/g;

const highlightText = (text: string, query: string): ReactNode => {
  const queryValue = query.trim();
  const tokenParts = text.split(TOKEN_PATTERN);
  return tokenParts.map((tokenPart, tokenIndex) => {
    if (TOKEN_PATTERN.test(tokenPart)) {
      TOKEN_PATTERN.lastIndex = 0;
      return (
        <span
          key={`token-${tokenIndex}`}
          className="tw-font-medium tw-text-primary-300"
        >
          {tokenPart}
        </span>
      );
    }
    TOKEN_PATTERN.lastIndex = 0;
    if (!queryValue) return tokenPart;
    const nodes: ReactNode[] = [];
    const lowerText = tokenPart.toLocaleLowerCase();
    const lowerQuery = queryValue.toLocaleLowerCase();
    let cursor = 0;
    let matchIndex = lowerText.indexOf(lowerQuery);
    while (matchIndex !== -1) {
      if (matchIndex > cursor) nodes.push(tokenPart.slice(cursor, matchIndex));
      const matchEnd = matchIndex + queryValue.length;
      nodes.push(
        <mark
          key={`match-${tokenIndex}-${matchIndex}`}
          className="tw-rounded-sm tw-bg-primary-400/20 tw-px-0.5 tw-text-inherit"
        >
          {tokenPart.slice(matchIndex, matchEnd)}
        </mark>
      );
      cursor = matchEnd;
      matchIndex = lowerText.indexOf(lowerQuery, cursor);
    }
    if (cursor < tokenPart.length) nodes.push(tokenPart.slice(cursor));
    return <Fragment key={`text-${tokenIndex}`}>{nodes}</Fragment>;
  });
};

const decorateChildren = (children: ReactNode, query: string): ReactNode =>
  Children.map(children, (child) => {
    if (typeof child === "string") return highlightText(child, query);
    if (isValidElement(child)) return child;
    return child;
  });

const createComponents = (query: string): Components => ({
  a: ({ children }) => (
    <span className="tw-text-primary-300 tw-underline tw-decoration-primary-400/50 tw-underline-offset-2">
      {decorateChildren(children, query)}
    </span>
  ),
  blockquote: ({ children }) => (
    <blockquote className="tw-my-1 tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-600 tw-pl-2 tw-text-iron-400">
      {children}
    </blockquote>
  ),
  br: () => <br />,
  code: ({ children }) => (
    <code className="tw-rounded tw-bg-iron-950 tw-px-1 tw-py-0.5 tw-font-mono tw-text-[0.9em] tw-text-iron-200">
      {decorateChildren(children, query)}
    </code>
  ),
  del: ({ children }) => <del>{decorateChildren(children, query)}</del>,
  em: ({ children }) => <em>{decorateChildren(children, query)}</em>,
  h1: ({ children }) => (
    <strong className="tw-block tw-text-base tw-text-iron-100">
      {decorateChildren(children, query)}
    </strong>
  ),
  h2: ({ children }) => (
    <strong className="tw-block tw-text-sm tw-text-iron-100">
      {decorateChildren(children, query)}
    </strong>
  ),
  h3: ({ children }) => (
    <strong className="tw-block tw-text-sm tw-text-iron-100">
      {decorateChildren(children, query)}
    </strong>
  ),
  img: ({ alt }) => (
    <span className="tw-italic tw-text-iron-400">[{alt ?? "image"}]</span>
  ),
  input: ({ checked }) => <span>{checked ? "☑" : "☐"} </span>,
  li: ({ children }) => <li>{children}</li>,
  ol: ({ children }) => (
    <ol className="tw-my-1 tw-list-decimal tw-pl-5">{children}</ol>
  ),
  p: ({ children }) => (
    <span className="tw-my-1 tw-block tw-whitespace-pre-wrap">
      {decorateChildren(children, query)}
    </span>
  ),
  pre: ({ children }) => (
    <pre className="tw-my-1 tw-overflow-hidden tw-whitespace-pre-wrap tw-rounded-md tw-bg-iron-950 tw-p-2">
      {children}
    </pre>
  ),
  strong: ({ children }) => (
    <strong className="tw-font-semibold tw-text-iron-100">
      {decorateChildren(children, query)}
    </strong>
  ),
  table: ({ children }) => (
    <span className="tw-my-1 tw-block tw-overflow-hidden">{children}</span>
  ),
  tbody: ({ children }) => <span className="tw-block">{children}</span>,
  td: ({ children }) => (
    <span className="tw-mr-2 tw-inline-block">
      {decorateChildren(children, query)}
    </span>
  ),
  th: ({ children }) => (
    <strong className="tw-mr-2 tw-inline-block">
      {decorateChildren(children, query)}
    </strong>
  ),
  thead: ({ children }) => <span className="tw-block">{children}</span>,
  tr: ({ children }) => <span className="tw-block">{children}</span>,
  ul: ({ children }) => (
    <ul className="tw-my-1 tw-list-disc tw-pl-5">{children}</ul>
  ),
});

export default function WaveDropSearchResultPreview({
  title,
  parts,
  query,
  fallback,
}: {
  readonly title: string | null;
  readonly parts: readonly { readonly content: string | null }[];
  readonly query: string;
  readonly fallback: string;
}) {
  const contentParts = parts
    .map((part) => part.content?.trim() ?? "")
    .filter(Boolean);
  if (!title?.trim() && contentParts.length === 0) return fallback;
  const components = createComponents(query);
  return (
    <span className="tw-block tw-space-y-1">
      {title?.trim() && (
        <strong className="tw-block tw-font-semibold tw-text-iron-100">
          {highlightText(title.trim(), query)}
        </strong>
      )}
      {contentParts.map((content, index) => (
        <span key={index} className="tw-block">
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            skipHtml
            components={components}
          >
            {content}
          </Markdown>
        </span>
      ))}
    </span>
  );
}
