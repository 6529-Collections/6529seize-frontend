"use client";

import StreamRouteLoadingShell from "@/components/brain/my-stream/layout/StreamRouteLoadingShell";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function MessagesRouteLoading({
  encrypted = false,
}: {
  readonly encrypted?: boolean;
}) {
  const locale = useBrowserLocale();
  return (
    <StreamRouteLoadingShell
      ariaLabel={t(
        locale,
        encrypted ? "e2ee.list.loading" : "messages.loading"
      )}
      variant="messages"
    />
  );
}
