import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface MuseumMarkdownProps {
  readonly children: string;
  readonly className?: string | undefined;
}

function safeUrlTransform(url: string): string {
  if (url.startsWith("/") || url.startsWith("#")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ||
      parsed.protocol === "http:" ||
      parsed.protocol === "mailto:"
      ? url
      : "";
  } catch {
    return "";
  }
}

const components: Components = {
  h1: ({ children }) => (
    <h2 className="tw-mt-8 tw-text-2xl tw-font-semibold tw-text-white">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h3 className="tw-mt-7 tw-text-xl tw-font-semibold tw-text-white">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="tw-mt-6 tw-text-lg tw-font-semibold tw-text-white">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="tw-m-0 tw-leading-7 tw-text-iron-200">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="tw-m-0 tw-list-disc tw-space-y-2 tw-pl-5 tw-text-iron-200">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="tw-m-0 tw-list-decimal tw-space-y-2 tw-pl-5 tw-text-iron-200">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="tw-pl-1">{children}</li>,
  a: ({ href, children }) => {
    const safeHref = typeof href === "string" ? safeUrlTransform(href) : "";
    if (safeHref.length === 0) {
      return <span className="tw-text-iron-200">{children}</span>;
    }

    const external =
      safeHref.startsWith("http") || safeHref.startsWith("mailto:");
    return (
      <a
        href={safeHref}
        className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="tw-m-0 tw-border-l-2 tw-border-primary-500/60 tw-pl-4 tw-text-iron-300">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => (
    <code
      className={`tw-rounded-md tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-text-sm tw-text-iron-100 ${className ?? ""}`}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="tw-max-w-full tw-overflow-x-auto tw-rounded-lg tw-border tw-border-white/10 tw-bg-iron-950 tw-p-4 tw-text-sm tw-text-iron-200">
      {children}
    </pre>
  ),
  img: ({ alt }) => (
    <span className="tw-inline-flex tw-rounded-md tw-border tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-300">
      {t(DEFAULT_LOCALE, "museum.network.markdown.mediaOmitted", {
        suffix: alt ? `: ${alt}` : "",
      })}
    </span>
  ),
  hr: () => <hr className="tw-border-white/10" />,
};

export function MuseumMarkdown({
  children,
  className = "",
}: MuseumMarkdownProps) {
  return (
    <div className={`tw-space-y-4 ${className}`}>
      <ReactMarkdown
        components={components}
        rehypePlugins={[rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
        urlTransform={safeUrlTransform}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function MuseumJsonDisclosure({
  label,
  value,
}: {
  readonly label: string;
  readonly value: unknown;
}) {
  return (
    <details className="tw-rounded-lg tw-border tw-border-white/10 tw-bg-iron-950/60">
      <summary className="tw-cursor-pointer tw-list-none tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
        {label}
      </summary>
      <pre className="tw-m-0 tw-max-h-96 tw-overflow-auto tw-border-t tw-border-white/10 tw-p-4 tw-text-xs tw-leading-5 tw-text-iron-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}
