import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { CASEY_ACCESSION_ID } from "@/lib/museum/casey";
import { MUSEUM_REPOSITORY_URL } from "@/lib/museum/types";

interface MuseumMarkdownProps {
  readonly children: string;
  readonly className?: string | undefined;
  readonly embeddedDocument?: boolean | undefined;
  readonly sourcePath?: string | undefined;
}

function withoutEmbeddedDocumentTitle(markdown: string): string {
  const lines = markdown.replace(/^\uFEFF/u, "").split(/\r?\n/u);
  if (!/^#\s+\S/u.test(lines[0] ?? "")) {
    return markdown;
  }

  lines.shift();
  while (lines[0]?.trim() === "") {
    lines.shift();
  }
  return lines.join("\n");
}

const DOSSIER_ANCHORS: Readonly<Record<string, string>> = {
  "accession-certificate.md": "accession-certificate",
  "curatorial-accession-review.md": "curatorial-accession-review",
  "gift-acceptance-authorization.md": "gift-acceptance-authorization",
  "technical-and-condition-review.md": "technical-and-condition-review",
  "title-rights-and-accession-review.md": "title-rights-and-accession-review",
  "custody-title-and-compliance-diligence.md":
    "custody-title-and-compliance-diligence",
};

function publicMuseumRoute(url: string): string | null {
  const withoutFragment = url.split("#", 1)[0] ?? "";
  const fileName = withoutFragment.split("/").at(-1) ?? "";
  const objectMatch = fileName.match(/^(6529NM\.2026\.001\.\d{2})\.md$/u);
  if (objectMatch?.[1]) {
    return `/museum/network/collection/${encodeURIComponent(objectMatch[1])}`;
  }
  if (fileName === "casey-reas-artist-practice.md") {
    return "/museum/network/artists/casey-reas";
  }
  if (fileName === "casey-reas-collection-essay.md") {
    return `/museum/network/gifts/${CASEY_ACCESSION_ID}#gift-essay-title`;
  }
  const dossierAnchor = DOSSIER_ANCHORS[fileName];
  return dossierAnchor
    ? `/museum/network/gifts/${CASEY_ACCESSION_ID}#${dossierAnchor}`
    : null;
}

function repositoryHref(url: string, sourcePath: string): string {
  try {
    const base = new URL(sourcePath, "https://museum-source.invalid/");
    const resolved = new URL(url, base);
    if (resolved.origin !== "https://museum-source.invalid") {
      return "";
    }
    const normalizedPath = decodeURIComponent(resolved.pathname).replace(
      /^\/+/,
      ""
    );
    if (
      normalizedPath.length === 0 ||
      normalizedPath.includes("\\") ||
      normalizedPath.split("/").some((segment) => segment === "..")
    ) {
      return "";
    }
    return `${MUSEUM_REPOSITORY_URL}/blob/main/${normalizedPath
      .split("/")
      .map(encodeURIComponent)
      .join("/")}${resolved.hash}`;
  } catch {
    return "";
  }
}

function safeUrlTransform(url: string, sourcePath?: string): string {
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
    const museumRoute = publicMuseumRoute(url);
    if (museumRoute !== null) {
      return museumRoute;
    }
    return sourcePath ? repositoryHref(url, sourcePath) : "";
  }
}

const baseComponents: Components = {
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
  embeddedDocument = false,
  sourcePath,
}: MuseumMarkdownProps) {
  const components: Components = {
    ...baseComponents,
    a: ({ href, children: linkChildren }) => {
      const safeHref =
        typeof href === "string" ? safeUrlTransform(href, sourcePath) : "";
      if (safeHref.length === 0) {
        return <span className="tw-text-iron-200">{linkChildren}</span>;
      }

      const external =
        safeHref.startsWith("http") || safeHref.startsWith("mailto:");
      return (
        <a
          href={safeHref}
          className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {linkChildren}
        </a>
      );
    },
  };

  return (
    <div className={`tw-space-y-4 ${className}`}>
      <ReactMarkdown
        components={components}
        rehypePlugins={[rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => safeUrlTransform(url, sourcePath)}
      >
        {embeddedDocument ? withoutEmbeddedDocumentTitle(children) : children}
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
