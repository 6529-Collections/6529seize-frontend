import { useState, type MouseEvent } from "react";

import { stopPropagation } from "./MarketplaceItemPreviewCard.utils";

interface MarketplaceCopyListingButtonProps {
  readonly href: string;
  readonly className: string;
  readonly testId?: string | undefined;
}

export default function MarketplaceCopyListingButton({
  href,
  className,
  testId,
}: MarketplaceCopyListingButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (event: MouseEvent<HTMLButtonElement>) => {
    stopPropagation(event);
    void navigator.clipboard
      .writeText(href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 500);
      })
      .catch(() => {
        // Ignore clipboard write failures (e.g. missing permissions).
      });
  };

  return (
    <button
      type="button"
      data-testid={testId}
      className={className}
      aria-label={copied ? "Listing link copied" : "Copy listing link"}
      onClick={copyToClipboard}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <svg
        className="tw-size-3.5 tw-flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke={copied ? "#34d399" : "currentColor"}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
        />
      </svg>
    </button>
  );
}
