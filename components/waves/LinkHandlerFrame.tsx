import type { ReactNode } from "react";

import { removeBaseEndpoint } from "@/helpers/Helpers";

import ChatItemHrefButtons from "./ChatItemHrefButtons";
import { useLinkPreviewContext } from "./LinkPreviewContext";

interface LinkHandlerFrameProps {
  readonly href: string;
  readonly children: ReactNode;
  readonly hideLink?: boolean | undefined;
  readonly relativeHref?: string | undefined;
}

export default function LinkHandlerFrame({
  href,
  children,
  hideLink = false,
  relativeHref,
}: LinkHandlerFrameProps) {
  const { hideActions } = useLinkPreviewContext();
  const effectiveRelativeHref =
    relativeHref ??
    (() => {
      const relative = removeBaseEndpoint(href);
      return relative?.startsWith("/") ? relative : undefined;
    })();

  return (
    <div className="tw-flex tw-w-full tw-min-w-0 tw-max-w-full tw-items-stretch tw-gap-x-1">
      <div className="tw-min-w-0 tw-max-w-full tw-flex-1 tw-overflow-hidden focus-within:tw-overflow-visible">
        {children}
      </div>
      {!hideActions && (
        <ChatItemHrefButtons
          href={href}
          hideLink={hideLink}
          relativeHref={effectiveRelativeHref}
        />
      )}
    </div>
  );
}
