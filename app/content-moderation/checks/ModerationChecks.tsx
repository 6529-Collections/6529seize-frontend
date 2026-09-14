"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { fetchModerationChecks } from "@/services/api/moderation-checks-api";
import { MODERATION_CHECKS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import {
  checkButtonClass,
  checkValueLabel,
  navigateChecks,
  readCheckFilters,
  safeCheckId,
} from "./checks.helpers";
import CheckFilters from "./CheckFilters";
import CheckDetail from "./CheckDetail";

export default function ModerationChecks({
  profileId,
}: {
  readonly profileId: string;
}) {
  const locale = useBrowserLocale();
  const search = useSearchParams();
  const params = new URLSearchParams(search.toString());
  const filters = readCheckFilters(params);
  const selection =
    safeCheckId(params.get("check")) ??
    safeCheckId(params.get("report")) ??
    safeCheckId(params.get("profile"));
  let source: "check" | "report" | "profile" = "profile";
  if (safeCheckId(params.get("check"))) source = "check";
  else if (safeCheckId(params.get("report"))) source = "report";
  const query = useInfiniteQuery({
    queryKey: [...MODERATION_CHECKS_QUERY_KEY, profileId, "list", filters],
    queryFn: ({ pageParam, signal }) =>
      fetchModerationChecks(filters, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    retry: false,
    gcTime: 0,
  });
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  function openCheck(id: string) {
    const next = new URLSearchParams(params);
    next.delete("report");
    next.delete("profile");
    next.set("check", id);
    navigateChecks(next);
  }
  function closeCheck() {
    const next = new URLSearchParams(params);
    next.delete("check");
    next.delete("report");
    next.delete("profile");
    navigateChecks(next);
    requestAnimationFrame(() => {
      const target =
        document.getElementById(`check-list-${selection ?? ""}`) ??
        document.getElementById("checks-list-heading");
      target?.focus();
    });
  }
  return (
    <div className="tw-mt-6 tw-min-w-0">
      <p className="tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "checks.policyNotice")}
      </p>
      <p className="tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "checks.privateNotice")}
      </p>
      <div className={selection ? "tw-hidden lg:tw-block" : ""}>
        <CheckFilters
          key={params.toString()}
          params={params}
          onApply={navigateChecks}
        />
      </div>
      <div
        className={`tw-mt-6 tw-grid tw-min-w-0 tw-gap-5 ${selection ? "lg:tw-grid-cols-[minmax(16rem,2fr)_minmax(0,3fr)]" : ""}`}
      >
        <section
          className={`tw-min-w-0 ${selection ? "tw-hidden lg:tw-block" : ""}`}
          aria-labelledby="checks-list-heading"
        >
          <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
            <h2
              id="checks-list-heading"
              tabIndex={-1}
              className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100 focus:tw-outline-none"
            >
              {t(locale, "checks.title")}
            </h2>
            <button
              type="button"
              className={checkButtonClass}
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              {t(locale, "checks.refresh")}
            </button>
          </div>
          {query.isLoading && (
            <output className="tw-block tw-text-sm tw-text-iron-400">
              {t(locale, "checks.loading")}
            </output>
          )}
          {query.isError && (
            <div
              role="alert"
              className="tw-mb-4 tw-space-y-3 tw-text-sm tw-text-iron-300"
            >
              <p>{t(locale, "checks.error")}</p>
              <button
                type="button"
                className={checkButtonClass}
                onClick={() => void query.refetch()}
              >
                {t(locale, "checks.retry")}
              </button>
            </div>
          )}
          {!query.isLoading && !query.isError && items.length === 0 && (
            <p className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-6 tw-text-sm tw-text-iron-400">
              {t(locale, "checks.empty")}
            </p>
          )}
          <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  id={`check-list-${item.id}`}
                  onClick={() => openCheck(item.id)}
                  aria-current={selection === item.id ? "true" : undefined}
                  className={`tw-w-full tw-min-w-0 tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-bg-iron-950 tw-p-4 tw-text-left hover:tw-bg-iron-900 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${selection === item.id ? "tw-border-primary-400" : "tw-border-iron-800"}`}
                >
                  <span className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-text-sm tw-font-semibold tw-text-iron-100">
                    <span>{checkValueLabel(locale, item.subject_type)}</span>
                    <span className="tw-rounded-md tw-bg-iron-800 tw-px-2 tw-py-1 tw-text-xs tw-text-iron-200">
                      {checkValueLabel(locale, item.outcome)}
                    </span>
                  </span>
                  <span className="tw-mt-2 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
                    {checkValueLabel(locale, item.policy_family)} ·{" "}
                    {checkValueLabel(locale, item.review_status)}
                  </span>
                  <span className="tw-mt-2 tw-block tw-break-all tw-text-xs tw-leading-5 tw-text-iron-400">
                    {t(locale, "checks.author")}:{" "}
                    {typeof item.scope["handle"] === "string"
                      ? item.scope["handle"]
                      : (item.author_profile_id ?? t(locale, "checks.none"))}
                  </span>
                  <span className="tw-mt-3 tw-line-clamp-3 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-6 tw-text-iron-200 [overflow-wrap:anywhere]">
                    {item.preview ?? t(locale, "checks.noPreview")}
                  </span>
                  <span className="tw-mt-3 tw-block tw-text-xs tw-text-iron-400">
                    {formatDate(locale, item.created_at, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <span className="tw-mt-3 tw-block tw-text-sm tw-font-semibold tw-text-primary-300">
                    {t(locale, "checks.open")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {query.hasNextPage && (
            <button
              type="button"
              className={`${checkButtonClass} tw-mt-4 tw-w-full`}
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {t(
                locale,
                query.isFetchingNextPage ? "checks.loading" : "checks.more"
              )}
            </button>
          )}
        </section>
        {selection && (
          <CheckDetail
            key={`${profileId}:${source}:${selection}`}
            id={selection}
            source={source}
            profileId={profileId}
            onClose={closeCheck}
          />
        )}
      </div>
    </div>
  );
}
