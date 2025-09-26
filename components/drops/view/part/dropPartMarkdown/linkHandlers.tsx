import {
  AnchorHTMLAttributes,
  ClassAttributes,
  ImgHTMLAttributes,
  type ReactElement,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ExtraProps } from "react-markdown";

import { ApiDrop } from "@/generated/models/ApiDrop";

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
    if (!href || !isValidLink(href)) {
      return null;
    }

    const parsedUrl = parseUrl(href);
    const renderFallbackAnchor = () => renderExternalOrInternalLink(href, props);
    const matchSeize = findMatch(seizeHandlers, href);
    const renderOpenGraph = () => {
      if (!shouldUseOpenGraphPreview(href, parsedUrl)) {
        return renderFallbackAnchor();
      }

      return (
        <LinkPreviewCard
          href={href}
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
        const rendered = handler.render(href);
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

    const matchExternal = findMatch(handlers, href);

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
    if (!href || !isValidLink(href)) {
      return false;
    }

    const parsedUrl = parseUrl(href);
    const seizeMatch = findMatch(seizeHandlers, href);
    if (seizeMatch) {
      return seizeMatch.display === "block";
    }

    const match = findMatch(handlers, href);
    if (match) {
      return match.display === "block";
    }

    return shouldUseOpenGraphPreview(href, parsedUrl);
  };

  return {
    renderAnchor,
    isSmartLink,
    renderImage,
  };
};
