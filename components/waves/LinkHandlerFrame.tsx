import type { ReactNode } from "react";

import { removeBaseEndpoint } from "@/helpers/Helpers";

import ChatItemHrefButtons from "./ChatItemHrefButtons";
import { useLinkPreviewContext } from "./LinkPreviewContext";

interface LinkHandlerFrameProps {
  readonly href: string;
  readonly children: ReactNode;
  readonly hideLink?: boolean | undefined;
  readonly relativeHref?: string | undefined;
  readonly overlayAnchor?: "frame" | "content" | undefined;
}

export default function LinkHandlerFrame({
  href,
  children,
  hideLink = false,
  relativeHref,
  overlayAnchor = "frame",
}: LinkHandlerFrameProps) {
  const { hideActions } = useLinkPreviewContext();
  const effectiveRelativeHref =
    relativeHref ??
    (() => {
      const relative = removeBaseEndpoint(href);
      return relative.startsWith("/") ? relative : undefined;
    })();
  const actionButtons = !hideActions ? (
    <ChatItemHrefButtons
      href={href}
      hideLink={hideLink}
      relativeHref={effectiveRelativeHref}
      layout="overlay"
    />
  ) : null;
  const shouldAnchorOverlayToContent =
    overlayAnchor === "content" && actionButtons !== null;

  if (shouldAnchorOverlayToContent) {
    return (
      <div className="tw-flex tw-w-full tw-min-w-0 tw-max-w-full">
        <div className="tw-group/link-card tw-relative tw-inline-flex tw-w-fit tw-min-w-0 tw-max-w-full tw-flex-col">
          <div className="tw-min-w-0 tw-max-w-full tw-overflow-hidden focus-within:tw-overflow-visible">
            {children}
          </div>
          {actionButtons}
        </div>
      </div>
    );
  }

  return (
    <div className="tw-group/link-card tw-relative tw-w-full tw-min-w-0 tw-max-w-full">
      <div className="tw-min-w-0 tw-max-w-full tw-overflow-hidden focus-within:tw-overflow-visible">
        {children}
      </div>
      {actionButtons}
    </div>
  );
}
