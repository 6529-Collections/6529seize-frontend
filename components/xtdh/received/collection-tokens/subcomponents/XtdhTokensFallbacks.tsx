import type { ReactNode } from "react";
import Button from "@/components/utils/button/Button";

interface ListMessageProps {
  readonly children: ReactNode;
}

interface RetryableMessageProps {
  readonly message?: string | undefined;
  readonly onRetry: () => void;
}

export function ListMessage({ children }: Readonly<ListMessageProps>) {
  return <p className="tw-m-0 tw-text-sm tw-text-iron-300 group-data-[typography=profile]/profile-xtdh:tw-text-meta group-data-[typography=profile]/profile-xtdh:tw-font-normal group-data-[typography=profile]/profile-xtdh:tw-text-iron-500">{children}</p>;
}

export function ListError({ message, onRetry }: Readonly<RetryableMessageProps>) {
  const displayMessage = message ?? "Failed to load received tokens.";
  return (
    <div className="tw-flex tw-flex-col tw-gap-2 tw-px-6 tw-pb-6">
      <p className="tw-m-0 tw-text-sm tw-text-red-400 group-data-[typography=profile]/profile-xtdh:tw-text-[15px] group-data-[typography=profile]/profile-xtdh:tw-font-normal" role="alert">
        {displayMessage}
      </p>
      <RetryButton onRetry={onRetry} />
    </div>
  );
}

export function InlineRetry({ message, onRetry }: Readonly<RetryableMessageProps>) {
  const displayMessage = message ?? "Unable to load more tokens.";
  return (
    <div className="tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-3">
      <p className="tw-m-0 tw-text-sm tw-text-iron-100 group-data-[typography=profile]/profile-xtdh:tw-text-[15px] group-data-[typography=profile]/profile-xtdh:tw-font-normal" role="alert">
        {displayMessage}
      </p>
      <div className="tw-mt-2">
        <RetryButton onRetry={onRetry} />
      </div>
    </div>
  );
}

function RetryButton({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <Button
      variant="tertiary"
      size="sm"
      onClick={onRetry}
    >
      Retry
    </Button>
  );
}
