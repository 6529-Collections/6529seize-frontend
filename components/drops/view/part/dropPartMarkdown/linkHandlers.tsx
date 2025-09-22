import {
  AnchorHTMLAttributes,
  ClassAttributes,
  ImgHTMLAttributes,
  type ReactElement,
} from "react";
import { ExtraProps } from "react-markdown";

import { ApiDrop } from "@/generated/models/ApiDrop";

import LinkPreviewCard from "@/components/waves/LinkPreviewCard";
import DropPartMarkdownImage from "../DropPartMarkdownImage";

import { createLinkHandlers } from "./handlers";
import {
  isValidLink,
  parseUrl,
  renderExternalOrInternalLink,
  shouldUseOpenGraphPreview,
} from "./linkUtils";
import type { LinkHandler, LinkRenderContext } from "./linkTypes";

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

interface LinkMatchResult<TPayload> {
  readonly handler: LinkHandler<TPayload>;
  readonly payload: TPayload;
}

const findMatch = <TPayload,>(
  handlers: readonly LinkHandler<unknown>[],
  href: string
): LinkMatchResult<TPayload> | null => {
  for (const handler of handlers) {
    const payload = handler.match(href);
    if (payload) {
      return { handler, payload } as LinkMatchResult<TPayload>;
    }
  }

  return null;
};

export const createLinkRenderer = ({
  onQuoteClick,
}: LinkRendererConfig): LinkRenderer => {
  const handlers = createLinkHandlers({ onQuoteClick });

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
    const renderDefaultAnchor = () => renderExternalOrInternalLink(href, props);
    const match = findMatch(handlers, href);
    const renderOpenGraph = () => {
      if (!shouldUseOpenGraphPreview(href, parsedUrl)) {
        return renderDefaultAnchor();
      }

      return (
        <LinkPreviewCard
          href={href}
          renderFallback={() => renderDefaultAnchor()}
        />
      );
    };

    const context: LinkRenderContext = {
      href,
      onQuoteClick,
      parsedUrl,
      renderOpenGraph,
    };

    if (match) {
      const rendered = match.handler.render(match.payload, context, props);
      return rendered ?? renderDefaultAnchor();
    }

    return renderDefaultAnchor();
  };

  const isSmartLink = (href: string): boolean => {
    if (!href || !isValidLink(href)) {
      return false;
    }

    const match = findMatch(handlers, href);
    if (!match) {
      return false;
    }

    return match.handler.display === "block";
  };

  return {
    renderAnchor,
    isSmartLink,
    renderImage,
  };
};
