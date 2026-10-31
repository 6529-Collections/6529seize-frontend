"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";

type NextGenLoadErrorMessageKey = Exclude<
  Extract<MessageKey, `nextgen.loadError.${string}`>,
  "nextgen.loadError.retry"
>;

interface NextGenLoadErrorProps {
  readonly message: NextGenLoadErrorMessageKey;
  readonly onRetry?: (() => void) | undefined;
  readonly className?: string | undefined;
}

export default function NextGenLoadError({
  message,
  onRetry,
  className,
}: Readonly<NextGenLoadErrorProps>) {
  const locale = useBrowserLocale();

  return (
    <div
      role="alert"
      className={`tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-py-4 tw-text-sm tw-text-error ${className ?? ""}`}
    >
      <span>{t(locale, message)}</span>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t(locale, "nextgen.loadError.retry")}
        </Button>
      )}
    </div>
  );
}
