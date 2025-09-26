import type { ReactNode } from "react";

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
  return (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">{children}</div>
      <ChatItemHrefButtons
        href={href}
        hideLink={hideLink}
        relativeHref={relativeHref}
      />
    </div>
  );
}
