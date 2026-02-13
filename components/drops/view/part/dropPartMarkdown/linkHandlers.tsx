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
  readonly marketplaceImageOnly?: boolean | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
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
  marketplaceImageOnly = false,
  embedPath,
  quotePath,
  embedDepth = 0,
  maxEmbedDepth = DEFAULT_MAX_EMBED_DEPTH,
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
    marketplaceImageOnly,
  });

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
      return renderFallbackAnchor();
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
