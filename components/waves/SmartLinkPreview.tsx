"use client";

import { type ReactElement, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { ensureStableSeizeLink } from "@/helpers/SeizeLinkParser";
import { createLinkHandlers } from "@/components/drops/view/part/dropPartMarkdown/handlers";
import type { LinkHandler } from "@/components/drops/view/part/dropPartMarkdown/linkTypes";
import {
  parseUrl,
  shouldUseOpenGraphPreview,
} from "@/components/drops/view/part/dropPartMarkdown/linkUtils";

import LinkPreviewCard from "./LinkPreviewCard";
import {
  LinkPreviewProvider,
  useLinkPreviewContext,
  type LinkPreviewVariant,
} from "./LinkPreviewContext";

interface SmartLinkPreviewProps {
  readonly href: string;
  readonly variant?: LinkPreviewVariant | undefined;
  readonly renderFallback?: (() => ReactElement) | undefined;
}

const getFallbackLabel = (href: string): string => {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./i, "");
    return host || href;
  } catch {
    return href;
  }
};

const DefaultFallback = ({ href }: { readonly href: string }) => {
  let isHttpUrl = false;
  try {
    const parsed = new URL(href);
    isHttpUrl = parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    isHttpUrl = false;
  }

  if (!isHttpUrl) {
    return (
      <span className="tw-[overflow-wrap:anywhere] tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100">
        {getFallbackLabel(href)}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="tw-[overflow-wrap:anywhere] tw-break-words tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-text-white"
    >
      {getFallbackLabel(href)}
    </a>
  );
};

const findMatch = (
  handlers: readonly LinkHandler[],
  href: string
): LinkHandler | null => {
  for (const handler of handlers) {
    if (handler.match(href)) {
      return handler;
    }
  }

  return null;
};

export default function SmartLinkPreview({
  href,
  variant,
  renderFallback,
}: SmartLinkPreviewProps) {
  const { variant: contextVariant } = useLinkPreviewContext();
  const resolvedVariant = variant ?? contextVariant;
  const stableHref = ensureStableSeizeLink(href);
  const handlers = useMemo(() => createLinkHandlers(), []);
  const parsedUrl = parseUrl(stableHref);
  const fallbackRenderer =
    renderFallback ?? (() => <DefaultFallback href={stableHref} />);

  const renderOpenGraph = (): ReactElement => {
    if (!shouldUseOpenGraphPreview(stableHref, parsedUrl)) {
      return fallbackRenderer();
    }

    return (
      <LinkPreviewCard
        href={stableHref}
        variant={resolvedVariant}
        renderFallback={fallbackRenderer}
      />
    );
  };

  const renderHandlerContent = (element: ReactElement): ReactElement => (
    <ErrorBoundary fallbackRender={() => renderOpenGraph()}>
      {element}
    </ErrorBoundary>
  );

  const renderFromHandler = (handler: LinkHandler): ReactElement => {
    const rendered = handler.render(stableHref);
    return renderHandlerContent(rendered);
  };

  let content: ReactElement;
  const handler = findMatch(handlers, stableHref);
  if (handler) {
    try {
      content = renderFromHandler(handler);
    } catch {
      content = renderOpenGraph();
    }
  } else {
    content = renderOpenGraph();
  }

  return (
    <LinkPreviewProvider variant={resolvedVariant}>
      {content}
    </LinkPreviewProvider>
  );
}
