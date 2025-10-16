import type { ReactNode } from "react";

import { removeBaseEndpoint } from "@/helpers/Helpers";

import ChatItemHrefButtons from "./ChatItemHrefButtons";

interface LinkHandlerFrameProps {
  readonly href: string;
  readonly children: ReactNode;
  readonly hideLink?: boolean;
  readonly relativeHref?: string;
}

export default function LinkHandlerFrame({
  href,
  children,
  hideLink = false,
  relativeHref,
}: LinkHandlerFrameProps) {
  const effectiveRelativeHref =
    relativeHref ??
    (() => {
      const relative = removeBaseEndpoint(href);
      return relative?.startsWith("/") ? relative : undefined;
    })();

  return (
    <div className="tw-flex tw-items-stretch tw-w-full tw-min-w-0 tw-max-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0 tw-max-w-full tw-overflow-hidden focus-within:tw-overflow-visible">
        {children}
      </div>
      <ChatItemHrefButtons
        href={href}
        hideLink={hideLink}
        relativeHref={effectiveRelativeHref}
      />
    </div>
  );
}
