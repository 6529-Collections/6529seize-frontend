"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import Button from "@/components/utils/button/Button";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { MessageSearch } from "@/hooks/useMessageSearch";
import { formatDate, formatInteger, formatTime } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  ChevronRightIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import WaveDropSearchResultPreview from "./WaveDropSearchResultPreview";
import { DropAuthorSignedIndicator } from "@/components/waves/drops/signature/DropAuthorSignedMarker";
import {
  isDropAuthorSigned,
  withAuthorSignedLabel,
} from "@/components/waves/drops/signature/dropAuthorSigned";
import { MIN_WAVE_SEARCH_QUERY_LENGTH } from "./waveDropsSearch.utils";

const SEARCH_EMPTY_STATUS_ID = "wave-drops-search-empty-status";
const SEARCH_ERROR_STATUS_ID = "wave-drops-search-error-status";
const SEARCH_IDLE_STATUS_ID = "wave-drops-search-idle-status";
const SEARCH_LOADING_STATUS_ID = "wave-drops-search-loading-status";
const SEARCH_RESULTS_STATUS_ID = "wave-drops-search-results-status";

function WaveDropsSearchState({
  description,
  id,
  title,
  variant,
}: {
  readonly description: string;
  readonly id: string;
  readonly title: string;
  readonly variant: "empty" | "error" | "idle" | "loading";
}) {
  let stateRole: "alert" | "status" | undefined;
  if (variant === "error") stateRole = "alert";
  else if (variant === "loading" || variant === "empty") stateRole = "status";
  const iconClasses = "tw-size-5 tw-flex-shrink-0";
  let icon: ReactNode;
  if (variant === "loading") {
    icon = (
      <span
        className="tw-size-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-500 tw-border-t-primary-300"
        aria-hidden="true"
      />
    );
  } else if (variant === "error") {
    icon = (
      <ExclamationTriangleIcon
        className={`${iconClasses} tw-text-error`}
        aria-hidden="true"
      />
    );
  } else if (variant === "empty") {
    icon = (
      <MagnifyingGlassIcon
        className={`${iconClasses} tw-text-iron-300`}
        aria-hidden="true"
      />
    );
  } else {
    icon = (
      <MagnifyingGlassIcon
        className={`${iconClasses} tw-text-primary-300`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      id={id}
      role={stateRole}
      aria-live={
        variant === "loading" || variant === "empty" ? "polite" : undefined
      }
      className="tw-flex tw-min-h-[220px] tw-flex-col tw-items-center tw-justify-center tw-px-6 tw-py-10 tw-text-center"
    >
      <div className="tw-mb-4 tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-text-iron-200">
        {icon}
      </div>
      <p className="tw-text-sm tw-font-semibold tw-text-iron-100">{title}</p>
      <p className="tw-mt-1 tw-max-w-sm tw-text-sm tw-leading-6 tw-text-iron-400">
        {description}
      </p>
    </div>
  );
}

export default function MessageSearchResults({
  search,
  onSelect,
}: {
  readonly search: MessageSearch;
  readonly onSelect: (drop: ExtendedDrop) => void;
}) {
  const locale = useBrowserLocale();
  const {
    selectedWave: scopeWave,
    liveNormalizedQuery,
    canSearch,
    visibleResults,
    showLoading,
    isError,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = search;
  const scopeName =
    scopeWave?.name ?? t(locale, "waves.drops.searchModal.advanced.allWaves");
  const formattedMinQueryLength = formatInteger(
    locale,
    MIN_WAVE_SEARCH_QUERY_LENGTH
  );
  const formattedResultCount = formatInteger(locale, visibleResults.length);
  const searchCriteriaLabel =
    liveNormalizedQuery ||
    t(locale, "waves.drops.searchModal.results.filtersApplied");
  return (
    <>
      {showLoading && (
        <WaveDropsSearchState
          id={SEARCH_LOADING_STATUS_ID}
          variant="loading"
          title={t(locale, "waves.drops.searchModal.loading.title")}
          description={t(
            locale,
            "waves.drops.searchModal.loading.description",
            { waveName: scopeName }
          )}
        />
      )}
      {!showLoading && isError && (
        <div className="tw-flex tw-flex-col tw-items-center">
          <WaveDropsSearchState
            id={SEARCH_ERROR_STATUS_ID}
            variant="error"
            title={t(locale, "waves.drops.searchModal.error.title")}
            description={t(locale, "waves.drops.searchModal.error.description")}
          />
          <Button
            onClick={() => {
              refetch().catch(() => undefined);
            }}
            loading={isFetching}
            variant="tertiary"
            size="sm"
            className="-tw-mt-8 tw-mb-10"
          >
            {isFetching
              ? t(locale, "waves.drops.searchModal.error.retrying")
              : t(locale, "waves.drops.searchModal.error.retry")}
          </Button>
        </div>
      )}
      {!showLoading && !isError && !canSearch && (
        <WaveDropsSearchState
          id={SEARCH_IDLE_STATUS_ID}
          variant="idle"
          title={t(locale, "waves.drops.searchModal.idle.title")}
          description={t(
            locale,
            scopeWave
              ? "waves.drops.searchModal.idle.description"
              : "waves.drops.searchModal.advanced.idleAll",
            { minLength: formattedMinQueryLength }
          )}
        />
      )}
      {!showLoading &&
        !isError &&
        canSearch &&
        visibleResults.length === 0 &&
        !hasNextPage && (
          <WaveDropsSearchState
            id={SEARCH_EMPTY_STATUS_ID}
            variant="empty"
            title={t(locale, "waves.drops.searchModal.empty.title")}
            description={t(locale, "waves.drops.searchModal.empty.description")}
          />
        )}
      {!showLoading && !isError && canSearch && visibleResults.length > 0 && (
        <div className="tw-space-y-2.5">
          <div
            id={SEARCH_RESULTS_STATUS_ID}
            role="status"
            aria-live="polite"
            aria-label={t(
              locale,
              visibleResults.length === 1
                ? "waves.drops.searchModal.results.status.one"
                : "waves.drops.searchModal.results.status.other",
              {
                count: formattedResultCount,
                query: searchCriteriaLabel,
              }
            )}
            className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-pb-1"
          >
            <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-300">
              {t(
                locale,
                visibleResults.length === 1
                  ? "waves.drops.searchModal.results.count.one"
                  : "waves.drops.searchModal.results.count.other",
                { count: formattedResultCount }
              )}
            </p>
            {liveNormalizedQuery ? (
              <p className="tw-m-0 tw-min-w-0 tw-truncate tw-text-xs">
                <span className="tw-text-iron-600">
                  {t(locale, "waves.drops.searchModal.results.queryPrefix")}
                </span>{" "}
                <span className="tw-text-iron-300">
                  &quot;{liveNormalizedQuery}&quot;
                </span>
              </p>
            ) : (
              <p className="tw-m-0 tw-text-xs tw-text-iron-400">
                {t(locale, "waves.drops.searchModal.results.filtersApplied")}
              </p>
            )}
          </div>
          <div className="tw-space-y-2">
            {visibleResults.map((drop) => {
              const serialNo = drop.serial_no;
              const author =
                typeof drop.author.handle === "string" &&
                drop.author.handle.length > 0
                  ? drop.author.handle
                  : drop.author.primary_address;
              const resultButtonLabel = t(
                locale,
                !scopeWave
                  ? "waves.drops.searchModal.result.openInWave"
                  : "waves.drops.searchModal.result.open",
                { serialNo, author, wave: drop.wave.name }
              );
              const formattedDate = formatDate(locale, drop.created_at, {
                day: "numeric",
                month: "short",
              });
              const formattedTime = formatTime(locale, drop.created_at);
              // The row is one button, so its seal is static and the signed
              // status joins the button's name.
              const isAuthorSigned = isDropAuthorSigned(drop);
              return (
                <button
                  key={drop.stableKey}
                  type="button"
                  data-wave-id={drop.wave.id}
                  onClick={() => onSelect(drop)}
                  aria-label={withAuthorSignedLabel(
                    locale,
                    resultButtonLabel,
                    drop
                  )}
                  className="tw-group tw-flex tw-min-h-20 tw-w-full tw-cursor-pointer tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/80 tw-p-3 tw-text-left tw-transition tw-duration-150 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800/80"
                >
                  <ProfileAvatar
                    pfpUrl={drop.author.pfp}
                    size={ProfileBadgeSize.MEDIUM}
                    alt=""
                    fallbackContent={
                      <span className="tw-text-primary-200 tw-text-sm tw-font-semibold">
                        {([...author][0] ?? "").toLocaleUpperCase(locale)}
                      </span>
                    }
                  />
                  <span className="tw-min-w-0 tw-flex-1">
                    <span className="tw-flex tw-items-center tw-justify-between tw-gap-3">
                      <span className="tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
                        {author}
                      </span>
                      <span className="tw-flex-shrink-0 tw-text-[11px] tw-text-iron-500">
                        {t(locale, "waves.drops.searchModal.result.serial", {
                          serialNo,
                        })}
                        <span aria-hidden="true"> · </span>
                        {formattedDate} {formattedTime}
                        {isAuthorSigned && (
                          <span className="tw-ml-1 tw-inline-flex tw-align-middle">
                            <DropAuthorSignedIndicator />
                          </span>
                        )}
                      </span>
                    </span>
                    {!scopeWave && (
                      <span className="tw-mt-0.5 tw-block tw-truncate tw-text-xs tw-text-iron-400">
                        #{drop.wave.name}
                      </span>
                    )}
                    <span className="tw-mt-1 tw-line-clamp-4 tw-block tw-text-sm tw-leading-5 tw-text-iron-300">
                      <WaveDropSearchResultPreview
                        title={drop.title}
                        parts={drop.parts}
                        query={liveNormalizedQuery}
                        fallback={t(
                          locale,
                          "waves.drops.searchModal.result.mediaOnly"
                        )}
                        checkedLabel={t(
                          locale,
                          "waves.drops.searchModal.result.checked"
                        )}
                        imageFallback={t(
                          locale,
                          "waves.drops.searchModal.result.imageFallback"
                        )}
                        uncheckedLabel={t(
                          locale,
                          "waves.drops.searchModal.result.unchecked"
                        )}
                      />
                    </span>
                  </span>
                  <ChevronRightIcon
                    className="tw-mt-2 tw-size-4 tw-flex-shrink-0 -tw-translate-x-1 tw-text-iron-600 tw-transition group-hover:tw-translate-x-0 group-hover:tw-text-primary-300"
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
      {!showLoading && !isError && canSearch && hasNextPage && (
        <div className="tw-flex tw-justify-center tw-pt-2">
          <Button
            onClick={() => {
              fetchNextPage().catch(() => undefined);
            }}
            loading={isFetchingNextPage}
            variant="tertiary"
            size="sm"
          >
            {isFetchingNextPage
              ? t(locale, "waves.drops.searchModal.loadingMore")
              : t(locale, "waves.drops.searchModal.loadMore")}
          </Button>
        </div>
      )}
    </>
  );
}
