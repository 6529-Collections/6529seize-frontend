import type {
  AnchorHTMLAttributes,
  ClassAttributes,
  ImgHTMLAttributes,
  ReactElement,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { ExtraProps } from "react-markdown";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ensureStableSeizeLink } from "@/helpers/SeizeLinkParser";

import LinkPreviewCard from "@/components/waves/LinkPreviewCard";
import type { LinkPreviewInlineShowControl } from "@/components/waves/LinkPreviewContext";
import DropPartMarkdownImage from "../DropPartMarkdownImage";
import type { TweetPreviewMode } from "@/components/tweets/TweetPreviewModeContext";

import { createLinkHandlers, createSeizeHandlers } from "./handlers";
import type { LinkHandler } from "./linkTypes";
import {
  isValidLink,
  parseUrl,
  renderExternalOrInternalLink,
  shouldUseOpenGraphPreview,
} from "./linkUtils";

interface LinkRendererConfig {
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly currentDropId?: string | undefined;
  readonly hideLinkPreviews?: boolean | undefined;
  readonly tweetPreviewMode?: TweetPreviewMode | undefined;
  readonly marketplaceCompact?: boolean | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
  readonly inlineShowControl?: LinkPreviewInlineShowControl | undefined;
}

interface LinkRenderer {
  readonly renderAnchor: (
    params: ClassAttributes<HTMLAnchorElement> &
      AnchorHTMLAttributes<HTMLAnchorElement> &
      ExtraProps
  ) => ReactElement | null;
  readonly isSmartLink: (href: string) => boolean;
  readonly renderImage: (
    params: ClassAttributes<HTMLImageElement> &
      ImgHTMLAttributes<HTMLImageElement> &
      ExtraProps
  ) => ReactElement | null;
}

export const DEFAULT_MAX_EMBED_DEPTH = 4;

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

export const createLinkRenderer = ({
  onQuoteClick,
  currentDropId,
  hideLinkPreviews = false,
  tweetPreviewMode = "auto",
  marketplaceCompact = false,
  embedPath,
  quotePath,
  embedDepth = 0,
  maxEmbedDepth = DEFAULT_MAX_EMBED_DEPTH,
  inlineShowControl,
}: LinkRendererConfig): LinkRenderer => {
  const seizeHandlers = createSeizeHandlers({
    onQuoteClick,
    currentDropId,
    embedPath: embedPath ?? [],
    quotePath: quotePath ?? [],
    embedDepth,
    maxEmbedDepth,
  });
  const handlers = createLinkHandlers({
    tweetPreviewMode,
    linkPreviewVariant: "chat",
    marketplaceCompact,
  });
  let inlineShowControlRendered = false;

  const renderImage: LinkRenderer["renderImage"] = ({ src }) => {
    if (typeof src !== "string") {
      return null;
    }

    return <DropPartMarkdownImage src={src} />;
  };

  const renderAnchor: LinkRenderer["renderAnchor"] = (props) => {
    const { href } = props;
    if (!href) {
      return null;
    }

    const stableHref = ensureStableSeizeLink(href);
    if (!isValidLink(stableHref)) {
      return null;
    }

    const parsedUrl = parseUrl(stableHref);
    const anchorProps = { ...props, href: stableHref };
    const renderFallbackAnchor = () =>
      renderExternalOrInternalLink(stableHref, anchorProps);
    const matchSeize = findMatch(seizeHandlers, stableHref);
    const renderOpenGraph = () => {
      if (!shouldUseOpenGraphPreview(stableHref, parsedUrl)) {
        return renderFallbackAnchor();
      }

      return (
        <LinkPreviewCard
          href={stableHref}
          renderFallback={() => renderFallbackAnchor()}
        />
      );
    };

    const tryRenderOpenGraph = () => {
      try {
        return renderOpenGraph();
      } catch {
        // swallow and fall back to default anchor
      }

      return null;
    };

    const renderHandlerContent = (element: ReactElement): ReactElement => (
      <ErrorBoundary
        fallbackRender={() => {
          const ogContent = tryRenderOpenGraph();
          if (ogContent) {
            return ogContent;
          }
          return renderFallbackAnchor();
        }}
      >
        {element}
      </ErrorBoundary>
    );

    const renderFromHandler = (handler: LinkHandler): ReactElement | null => {
      try {
        const rendered = handler.render(stableHref);
        return renderHandlerContent(rendered);
      } catch {
        const ogContent = tryRenderOpenGraph();
        if (ogContent) {
          return ogContent;
        }
        return renderFallbackAnchor();
      }
    };

    if (hideLinkPreviews) {
      const fallbackAnchor = renderFallbackAnchor();
      if (!inlineShowControl?.enabled || inlineShowControlRendered) {
        return fallbackAnchor;
      }

      inlineShowControlRendered = true;

      return (
        <span className="tw-inline-flex tw-items-center tw-gap-x-2">
          {fallbackAnchor}
          <button
            type="button"
            disabled={inlineShowControl.isLoading}
            className={`tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-200 tw-transition tw-duration-200 ${
              inlineShowControl.isLoading
                ? "tw-cursor-default tw-opacity-60"
                : "hover:tw-bg-iron-700 hover:tw-text-white"
            }`}
            aria-label={inlineShowControl.label}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              event.nativeEvent.stopImmediatePropagation();
              if (!inlineShowControl.isLoading) {
                inlineShowControl.onToggle();
              }
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              event.nativeEvent.stopImmediatePropagation();
            }}
            onTouchStart={(event) => {
              event.stopPropagation();
              event.nativeEvent.stopImmediatePropagation();
            }}
          >
            {inlineShowControl.label}
          </button>
        </span>
      );
    }

    if (matchSeize) {
      const rendered = renderFromHandler(matchSeize);
      if (rendered) {
        return rendered;
      }
    }

    const matchExternal = findMatch(handlers, stableHref);

    if (matchExternal) {
      const rendered = renderFromHandler(matchExternal);
      if (rendered) {
        return rendered;
      }
    }

    const ogContent = tryRenderOpenGraph();
    if (ogContent) {
      return ogContent;
    }

    return renderFallbackAnchor();
  };

  const isSmartLink = (href: string): boolean => {
    if (!href) {
      return false;
    }

    if (hideLinkPreviews) {
      return false;
    }

    const stableHref = ensureStableSeizeLink(href);
    if (!isValidLink(stableHref)) {
      return false;
    }

    const parsedUrl = parseUrl(stableHref);
    const seizeMatch = findMatch(seizeHandlers, stableHref);
    if (seizeMatch) {
      return seizeMatch.display === "block";
    }

    const match = findMatch(handlers, stableHref);
    if (match) {
      return match.display === "block";
    }

    return shouldUseOpenGraphPreview(stableHref, parsedUrl);
  };

  return {
    renderAnchor,
    isSmartLink,
    renderImage,
  };
};
