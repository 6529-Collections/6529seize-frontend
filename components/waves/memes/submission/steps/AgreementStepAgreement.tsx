import React from "react";
import Markdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

interface AgreementStepAgreementProps {
  readonly text: string;
}

/**
 * A component that renders markdown text in a scrollable container.
 * Used for displaying legal agreements, terms, and other formatted text.
 */
export default function AgreementStepAgreement({ text }: AgreementStepAgreementProps) {
  return (
    <div className="tw-w-full tw-flex tw-flex-col tw-items-center">
      <div className="tw-w-full tw-border tw-border-iron-800 tw-rounded-lg tw-overflow-y-auto tw-overflow-x-hidden tw-p-4 tw-max-h-[50vh] md:tw-max-h-[60vh] lg:tw-min-h-[20vh] tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800">
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
            [rehypeSanitize],
          ]}
          remarkPlugins={[remarkGfm]}
          className="tw-text-iron-200 tw-w-full"
          components={{
            h1: ({ children }) => (
              <h1 className="tw-text-2xl tw-font-semibold tw-text-iron-100 tw-mt-4 tw-mb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="tw-text-xl tw-font-semibold tw-text-iron-100 tw-mt-3 tw-mb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-mt-3 tw-mb-1">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="tw-text-iron-300 tw-mb-3 tw-leading-relaxed tw-whitespace-pre-wrap tw-break-words">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="tw-list-disc tw-pl-6 tw-mb-3">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="tw-list-decimal tw-pl-6 tw-mb-3">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="tw-text-iron-300 tw-mb-1">{children}</li>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="tw-text-blue-400 hover:tw-text-blue-300 tw-underline"
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="tw-border-l-4 tw-border-iron-500 tw-pl-4 tw-italic tw-my-3">
                {children}
              </blockquote>
            ),
            code: ({ children }) => (
              <code className="tw-bg-iron-800 tw-rounded tw-px-1 tw-py-0.5 tw-font-mono tw-text-sm">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="tw-bg-iron-800 tw-rounded tw-p-3 tw-overflow-x-auto tw-my-3 tw-font-mono tw-text-sm">
                {children}
              </pre>
            ),
          }}
        >
          {text}
        </Markdown>
      </div>
    </div>
  );
}
