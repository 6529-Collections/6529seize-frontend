"use client";

import type { ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function AuthLoadingPlaceholder({
  compact = false,
}: {
  readonly compact?: boolean;
}) {
  const locale = useBrowserLocale();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`tailwind-scope tw-flex tw-items-center tw-justify-center ${compact ? "tw-min-h-8" : "tw-min-h-32"}`}
    >
      <span className="tw-sr-only">
        {t(locale, "webSidebar.account.loading")}
      </span>
      <span
        aria-hidden="true"
        className="tw-h-8 tw-w-28 tw-rounded-lg tw-bg-iron-800 motion-safe:tw-animate-pulse"
      />
    </div>
  );
}

export function AuthLoadingBoundary({
  loading,
  compact = false,
  children,
}: {
  readonly loading: boolean;
  readonly compact?: boolean;
  readonly children: ReactNode;
}) {
  return loading ? <AuthLoadingPlaceholder compact={compact} /> : children;
}
