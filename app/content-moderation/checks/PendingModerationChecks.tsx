"use client";

import Link from "next/link";
import type { ApiModerationCheck } from "@/generated/models/ApiModerationCheck";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { checkButtonClass, checkValueLabel } from "./checks.helpers";

export default function PendingModerationChecks({
  items,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  readonly items: readonly ApiModerationCheck[];
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  readonly onLoadMore: () => void;
}) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-mt-5 tw-space-y-5">
      {items.map((item) => (
        <article
          key={item.id}
          className="tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5"
        >
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-text-iron-400">
            {t(locale, "checks.queue.automatedCheck")}
          </p>
          <h2 className="tw-mb-0 tw-mt-2 tw-text-base tw-font-semibold tw-text-iron-100">
            {checkValueLabel(locale, item.subject_type)}
          </h2>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-300">
            {checkValueLabel(locale, item.outcome)} ·{" "}
            {checkValueLabel(locale, item.policy_family)}
          </p>
          <p className="tw-mb-0 tw-mt-3 tw-line-clamp-3 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-6 tw-text-iron-200 [overflow-wrap:anywhere]">
            {item.preview ?? t(locale, "checks.noPreview")}
          </p>
          <Link
            href={`/content-moderation/checks?check=${encodeURIComponent(item.id)}`}
            prefetch={false}
            className={`${checkButtonClass} tw-mt-4 tw-inline-flex tw-items-center tw-no-underline`}
          >
            {t(locale, "checks.open")}
          </Link>
        </article>
      ))}
      {hasMore && (
        <button
          type="button"
          className={`${checkButtonClass} tw-w-full`}
          disabled={loadingMore}
          onClick={onLoadMore}
        >
          {t(locale, loadingMore ? "checks.loading" : "checks.more")}
        </button>
      )}
    </div>
  );
}
