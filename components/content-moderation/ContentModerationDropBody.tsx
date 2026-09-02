"use client";

import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { useContentModerationDropGateContext } from "./ContentModerationDropGateContext";

export default function ContentModerationDropBody({
  children,
}: {
  readonly children: ReactNode;
}) {
  const locale = useBrowserLocale();
  const context = useContentModerationDropGateContext();
  const status = context?.globalModerationStatus ?? null;
  if (
    status === null ||
    status === ApiDropModerationStatus.Visible ||
    context?.canViewGlobalModeratedContent === true
  ) {
    return children;
  }

  const message =
    status === ApiDropModerationStatus.ModeratorRemoved
      ? t(locale, "contentModeration.tombstone.removed")
      : t(locale, "contentModeration.tombstone.quarantined");

  return (
    <div
      data-testid="content-moderation-inline-global-state"
      className="tw-inline-flex tw-items-center tw-gap-2 tw-align-middle tw-text-sm tw-leading-6 tw-text-iron-400"
    >
      <ShieldExclamationIcon
        aria-hidden="true"
        className="tw-size-4 tw-flex-none tw-text-iron-500"
      />
      <span>{message}</span>
    </div>
  );
}
