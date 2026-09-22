"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function DistributionPlanToolWrapper({
  children,
  title = t(DEFAULT_LOCALE, "emma.entryTitle"),
}: {
  readonly children: React.ReactNode;
  readonly title?: string;
}) {
  useSetTitle(title);

  return (
    <div className="tw-bg-iron-900">
      <div
        id="allowlist-tool"
        className="tailwind-scope tw-relative tw-min-h-screen tw-overflow-y-auto tw-overflow-x-hidden"
      >
        {children}
      </div>
    </div>
  );
}
