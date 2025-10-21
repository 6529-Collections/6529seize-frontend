import {
  AnchorHTMLAttributes,
  ClassAttributes,
  ImgHTMLAttributes,
  type ReactElement,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ExtraProps } from "react-markdown";

import { ApiDrop } from "@/generated/models/ApiDrop";
import { ensureStableSeizeLink } from "@/helpers/SeizeLinkParser";

import LinkPreviewCard from "@/components/waves/LinkPreviewCard";
import DropPartMarkdownImage from "../DropPartMarkdownImage";

import { createLinkHandlers, createSeizeHandlers } from "./handlers";
import type { LinkHandler } from "./linkTypes";
import {
  isValidLink,
  parseUrl,
  renderExternalOrInternalLink,
  shouldUseOpenGraphPreview,
} from "./linkUtils";

export interface LinkRendererConfig {
  readonly onQuoteClick: (drop: ApiDrop) => void;
}

export interface LinkRenderer {
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
}: LinkRendererConfig): LinkRenderer => {
  const seizeHandlers = createSeizeHandlers({ onQuoteClick });
  const handlers = createLinkHandlers();

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
        const ogContent = renderOpenGraph();
        if (ogContent) {
          return ogContent;
        }
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
        if (rendered === null || rendered === undefined) {
          throw new Error("Link handler returned no content");
        }
        return renderHandlerContent(rendered);
      } catch {
        const ogContent = tryRenderOpenGraph();
        if (ogContent) {
          return ogContent;
        }
        return renderFallbackAnchor();
      }
    };

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
