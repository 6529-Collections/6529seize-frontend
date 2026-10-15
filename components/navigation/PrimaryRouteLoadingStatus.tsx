"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { t, type MessageKey } from "@/i18n/messages";

interface PrimaryRouteLoadingStatusProps {
  readonly messageKey: MessageKey;
}

export default function PrimaryRouteLoadingStatus({
  messageKey,
}: PrimaryRouteLoadingStatusProps) {
  // The status starts empty and fills after hydration, so screen readers
  // announce it. The browser locale switches once its dictionary has loaded.
  const locale = useBrowserLocale();
  const hasHydrated = useHasHydrated();

  return (
    <span aria-atomic="true" className="tw-sr-only" role="status">
      {hasHydrated ? t(locale, messageKey) : ""}
    </span>
  );
}
