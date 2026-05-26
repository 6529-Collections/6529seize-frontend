import type {
  AnchorHTMLAttributes,
  ClassAttributes,
  ImgHTMLAttributes,
  ReactNode,
  ReactElement,
} from "react";
import { Children } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { ExtraProps } from "react-markdown";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ensureStableSeizeLink } from "@/helpers/SeizeLinkParser";

import LinkPreviewCard from "@/components/waves/LinkPreviewCard";
import type { LinkPreviewInlineShowControl } from "@/components/waves/LinkPreviewContext";
import DropPartMarkdownImage, {
  type DropPartMarkdownImageLayout,
} from "../DropPartMarkdownImage";

import { createLinkHandlers, createSeizeHandlers } from "./handlers";
import type { LinkHandler } from "./linkTypes";
import {
  isDirectImageUrl,
  isSafeMarkdownImageSrc,
  isValidLink,
  parseUrl,
  renderExternalOrInternalLink,
  shouldUseOpenGraphPreview,
} from "./linkUtils";

interface LinkRendererConfig {
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly currentDropId?: string | undefined;
  readonly hideLinkPreviews?: boolean | undefined;
  readonly isMemesWaveById?:
    | ((waveId: string | undefined | null) => boolean)
    | undefined;
  readonly isQuorumWaveById?:
    | ((waveId: string | undefined | null) => boolean)
    | undefined;
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

const getTextFromChildren = (children: ReactNode): string | null => {
  const childNodes = Children.toArray(children);

  if (childNodes.length === 0) {
    return "";
  }

  return childNodes.reduce<string | null>((text, child) => {
    if (text === null) {
      return null;
    }

    if (typeof child === "string" || typeof child === "number") {
      return `${text}${child}`;
    }

    return null;
  }, "");
};

const isBareHrefLabel = (children: ReactNode, href: string): boolean =>
  getTextFromChildren(children)?.trim() === href.trim();

const getImageLayout = (
  props: unknown
): DropPartMarkdownImageLayout | undefined => {
  if (typeof props !== "object" || props === null || !("layout" in props)) {
    return undefined;
  }

  return props.layout === "grouped" ? "grouped" : undefined;
};

export const createLinkRenderer = ({
  onQuoteClick,
  currentDropId,
  hideLinkPreviews = false,
  isMemesWaveById,
  isQuorumWaveById,
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
    isMemesWaveById,
    isQuorumWaveById,
  });
  const handlers = createLinkHandlers({
    linkPreviewVariant: "chat",
  });
  let inlineShowControlRendered = false;

  const renderImage: LinkRenderer["renderImage"] = ({ src, ...props }) => {
    if (typeof src !== "string") {
      return null;
    }

    if (!isSafeMarkdownImageSrc(src)) {
      return null;
    }

    return <DropPartMarkdownImage src={src} layout={getImageLayout(props)} />;
  };

  const renderAnchor: LinkRenderer["renderAnchor"] = (props) => {
    const { href } = props;
    if (!href) {
      return null;
    }

    const rawHref = href;
    const stableHref = ensureStableSeizeLink(rawHref);
    if (!isValidLink(stableHref)) {
      return null;
    }

    const parsedUrl = parseUrl(stableHref);
    if (
      isDirectImageUrl(stableHref, parsedUrl) &&
      (isBareHrefLabel(props.children, rawHref) ||
        isBareHrefLabel(props.children, stableHref))
    ) {
      return (
        <DropPartMarkdownImage
          src={stableHref}
          layout={getImageLayout(props)}
        />
      );
    }

    const anchorProps = { ...props, href: stableHref };
    const renderFallbackAnchor = () =>
      renderExternalOrInternalLink(stableHref, anchorProps);
    const matchSeize = findMatch(seizeHandlers, rawHref);
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

    const renderFromHandler = (
      handler: LinkHandler,
      targetHref: string
    ): ReactElement | null => {
      try {
        const rendered = handler.render(targetHref);
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
      const rendered = renderFromHandler(matchSeize, rawHref);
      if (rendered) {
        return rendered;
      }
    }

    const matchExternal = findMatch(handlers, stableHref);

    if (matchExternal) {
      const rendered = renderFromHandler(matchExternal, stableHref);
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

    const rawHref = href;
    const stableHref = ensureStableSeizeLink(rawHref);
    if (!isValidLink(stableHref)) {
      return false;
    }

    const parsedUrl = parseUrl(stableHref);
    const seizeMatch = findMatch(seizeHandlers, rawHref);
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
