"use client";

import { useCallback, useState } from "react";
import type { ApiModerationCheckDetail } from "@/generated/models/ApiModerationCheckDetail";
import type { ApiModerationReviewCase } from "@/generated/models/ApiModerationReviewCase";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { CaseSummary, useModerationReviewCases } from "./ModerationReviewCases";
import CheckDetail from "./CheckDetail";
import CheckFilters from "./CheckFilters";
import CaseReports from "./CaseReports";
import CaseChecks from "./CaseChecks";
import {
  checkButtonClass,
  navigateChecks,
  readCheckFilters,
  safeCheckId,
} from "./checks.helpers";

type DetailIdentity = {
  selection: string;
  checkId: string;
  dropId: string | null;
};

function selectedCase(
  items: ApiModerationReviewCase[],
  params: URLSearchParams,
  identity: DetailIdentity | null
) {
  const caseId = readCheckFilters(params).case_id;
  const report = safeCheckId(params.get("report"));
  const check = safeCheckId(params.get("check"));
  return items.find(
    (item) =>
      item.id === caseId ||
      (!!report && item.report_id === report) ||
      (!!check && item.check_id === check) ||
      (!!identity &&
        identity.selection === (check ?? report) &&
        (item.check_id === identity.checkId ||
          (!!identity.dropId && item.drop_id === identity.dropId)))
  );
}

export default function ModerationReviewWorkspace({
  profileId,
  params,
}: {
  readonly profileId: string;
  readonly params: URLSearchParams;
}) {
  const locale = useBrowserLocale();
  const query = useModerationReviewCases(profileId);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const check = safeCheckId(params.get("check"));
  const report = safeCheckId(params.get("report"));
  const selection = check ?? report;
  const source = check ? "check" : "report";
  const [identity, setIdentity] = useState<DetailIdentity | null>(null);
  const onDetailLoaded = useCallback(
    (detail: ApiModerationCheckDetail) => {
      if (!selection) return;
      const next = {
        selection,
        checkId: detail.check.id,
        dropId:
          detail.check.subject_type === "DROP"
            ? detail.check.published_subject_id
            : null,
      };
      setIdentity((previous) =>
        previous?.selection === next.selection &&
        previous.checkId === next.checkId &&
        previous.dropId === next.dropId
          ? previous
          : next
      );
    },
    [selection]
  );
  const activeCase = selectedCase(items, params, identity);
  const caseId = activeCase?.id ?? readCheckFilters(params).case_id;
  function backToNeedsReview() {
    globalThis.history.pushState(null, "", "/content-moderation/needs-review");
    requestAnimationFrame(() => {
      const target =
        document.getElementById(`review-case-${caseId ?? ""}`) ??
        document.getElementById("moderation-review-queue");
      target?.focus();
    });
  }
  function openCase(item: ApiModerationReviewCase) {
    const next = new URLSearchParams({
      review_status: "NEEDS_REVIEW",
      case_id: item.id,
    });
    if (item.report_id) next.set("report", item.report_id);
    else if (item.check_id) next.set("check", item.check_id);
    navigateChecks(next);
  }
  return (
    <div className="tw-mt-6 tw-min-w-0">
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
          aria-labelledby="review-cases-heading"
          className={`tw-min-w-0 ${selection ? "tw-hidden lg:tw-block" : ""}`}
        >
          <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
            <h2
              id="review-cases-heading"
              className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100"
            >
              {t(locale, "checks.reviewWorkspace")}
            </h2>
            <button
              type="button"
              className={checkButtonClass}
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {t(locale, "checks.refresh")}
            </button>
          </div>
          {query.isLoading && (
            <output className="tw-text-sm tw-text-iron-400">
              {t(locale, "checks.loading")}
            </output>
          )}
          {query.isError && (
            <div role="alert" className="tw-text-sm tw-text-iron-300">
              <p>{t(locale, "contentModeration.moderator.loadError")}</p>
              <button
                type="button"
                className={checkButtonClass}
                onClick={() => void query.refetch()}
              >
                {t(locale, "checks.retry")}
              </button>
            </div>
          )}
          {query.isSuccess && items.length === 0 && (
            <p className="tw-text-sm tw-text-iron-400">
              {t(locale, "checks.queue.empty")}
            </p>
          )}
          <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={activeCase?.id === item.id ? "true" : undefined}
                  onClick={() => openCase(item)}
                  className={`tw-w-full tw-min-w-0 tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-p-4 tw-text-left focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${activeCase?.id === item.id ? "tw-border-primary-400 tw-bg-iron-900 tw-ring-1 tw-ring-primary-400" : "tw-border-iron-800 tw-bg-iron-950 hover:tw-bg-iron-900"}`}
                >
                  {activeCase?.id === item.id && (
                    <span className="tw-mb-2 tw-block tw-text-xs tw-font-semibold tw-text-primary-300">
                      {t(locale, "checks.selectedCase")}
                    </span>
                  )}
                  <CaseSummary item={item} />
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
              {t(locale, "contentModeration.moderator.loadMore")}
            </button>
          )}
        </section>
        {selection ? (
          <div className="tw-min-w-0 tw-space-y-4">
            <CheckDetail
              caseContext={
                <>
                  {caseId && (
                    <CaseReports
                      key={`${profileId}:${caseId}`}
                      caseId={caseId}
                      profileId={profileId}
                      initiallyOpen={source === "report"}
                    />
                  )}
                  {caseId && !!activeCase?.pending_check_count && (
                    <CaseChecks
                      key={`${profileId}:${caseId}`}
                      caseId={caseId}
                      profileId={profileId}
                      selectedCheckId={
                        identity?.selection === selection
                          ? identity.checkId
                          : (check ?? undefined)
                      }
                    />
                  )}
                </>
              }
              key={`${profileId}:${source}:${selection}`}
              id={selection}
              source={source}
              profileId={profileId}
              onDetailLoaded={onDetailLoaded}
              backLabel="checks.backToNeedsReview"
              onClose={backToNeedsReview}
            />
          </div>
        ) : (
          <p className="tw-text-sm tw-text-iron-400">
            {t(locale, "checks.selectCase")}
          </p>
        )}
      </div>
    </div>
  );
}
