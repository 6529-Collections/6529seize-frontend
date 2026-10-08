"use client";
import useDeviceInfo from "@/hooks/useDeviceInfo";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useId, useRef } from "react";
import type { SidebarWaveNavigation } from "@/hooks/useSidebarWaveNavigation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import WavePicture from "@/components/waves/WavePicture";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useWaveFeatureUsage } from "@/hooks/useWaveFeatureUsage";
import { waveFeatureAttributes } from "@/services/analytics/waveFeatureUsage";

const COLLECTION_LABELS = {
  pinned: "waves.sidebar.pinned",
  joined: "waves.sidebar.filterJoined",
  all: "waves.sidebar.filterAll",
} as const;

export function SidebarWaveNavigationControls({
  navigation,
  isCollectionLoading = false,
}: {
  readonly navigation: SidebarWaveNavigation;
  readonly isCollectionLoading?: boolean;
}) {
  const locale = useBrowserLocale();
  const inputId = useId();
  const { ref: featureUsageRef } = useWaveFeatureUsage("sidebar");
  const hasHydrated = useHasHydrated();
  const { searchOpen, setSearchOpen } = navigation;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const focusSearch = useCallback(
    (input: HTMLInputElement | null) => {
      if (input && hasHydrated) input.focus();
    },
    [hasHydrated]
  );
  const findWaveLabel = t(locale, "waves.sidebar.findWave");
  const closeSearch = () => {
    navigation.setQueryText("");
    setSearchOpen(false);
    // The search toggle returns on the next render.
    requestAnimationFrame(() => toggleRef.current?.focus());
  };
  const searchLoading =
    navigation.searching &&
    navigation.queryText.trim().length >= 3 &&
    (!navigation.queryEnabled || navigation.results.isFetching);
  return (
    <>
      <div
        ref={featureUsageRef}
        className="tailwind-scope tw-sticky tw-top-0 tw-z-30 tw-bg-[var(--wave-sidebar-background,#000)] tw-px-4 tw-py-2"
      >
        {searchOpen ? (
          <>
            <label htmlFor={inputId} className="tw-sr-only">
              {findWaveLabel}
            </label>
            <div className="tw-flex tw-min-h-9 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-2.5 focus-within:tw-border-primary-400">
              {searchLoading ? (
                <span
                  aria-hidden="true"
                  className="tw-size-4 tw-shrink-0 tw-animate-spin tw-rounded-full tw-border tw-border-solid tw-border-iron-600 tw-border-t-primary-300 motion-reduce:tw-animate-none"
                />
              ) : (
                <MagnifyingGlassIcon
                  className="tw-size-4 tw-shrink-0 tw-text-iron-400"
                  aria-hidden="true"
                />
              )}
              <input
                ref={focusSearch}
                id={inputId}
                type="search"
                disabled={!hasHydrated}
                aria-busy={searchLoading}
                value={navigation.queryText}
                onChange={(event) =>
                  navigation.setQueryText(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    closeSearch();
                  }
                }}
                placeholder={findWaveLabel}
                autoComplete="off"
                className="tw-w-full tw-min-w-0 tw-border-0 tw-bg-transparent tw-py-1.5 tw-text-xs tw-leading-5 tw-text-white tw-outline-none tw-ring-0 placeholder:tw-text-iron-400 focus:tw-ring-0 touch-only:tw-text-base [&::-webkit-search-cancel-button]:tw-appearance-none"
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label={t(locale, "waves.sidebar.closeSearch")}
                className="tw-flex tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-300"
              >
                <XMarkIcon className="tw-size-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="tw-flex tw-items-center tw-gap-2">
            {navigation.canUseCollections ? (
              <fieldset
                aria-label={t(locale, "waves.sidebar.filterAriaLabel")}
                className="tw-m-0 tw-flex tw-h-9 tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-0.5 touch-only:tw-h-10"
              >
                {(["all", "pinned", "joined"] as const).map((tab) => (
                  <button
                    key={tab}
                    {...waveFeatureAttributes("sidebar_collection", tab)}
                    type="button"
                    aria-label={t(locale, COLLECTION_LABELS[tab])}
                    aria-pressed={navigation.collection === tab}
                    onClick={() => navigation.setCollection(tab)}
                    className={`tw-inline-flex tw-min-h-7 tw-min-w-0 tw-flex-1 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-px-2 tw-text-xs focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${navigation.collection === tab ? "tw-bg-iron-800 tw-font-semibold tw-text-white" : "tw-bg-transparent tw-text-iron-400"}`}
                  >
                    {t(locale, COLLECTION_LABELS[tab])}
                  </button>
                ))}
              </fieldset>
            ) : (
              <span className="tw-min-w-0 tw-text-sm tw-font-semibold tw-text-iron-300">
                {t(locale, "waves.sidebar.allWaves")}
              </span>
            )}
            <button
              ref={toggleRef}
              {...waveFeatureAttributes("sidebar_entry", "search")}
              type="button"
              disabled={!hasHydrated}
              aria-label={findWaveLabel}
              title={findWaveLabel}
              aria-expanded={false}
              onClick={() => setSearchOpen(true)}
              className="tw-group tw-ml-auto tw-flex tw-size-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-white touch-only:tw-size-11 touch-only:tw-rounded-none"
            >
              <span className="tw-flex tw-size-full tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 desktop-hover:group-hover:tw-bg-iron-800 touch-only:tw-size-10">
                <MagnifyingGlassIcon className="tw-size-4" aria-hidden="true" />
              </span>
            </button>
          </div>
        )}
      </div>
      {!navigation.searching &&
        navigation.canUseCollections &&
        isCollectionLoading && (
          <div className="tailwind-scope tw-flex tw-min-h-12 tw-items-center tw-justify-center tw-py-3">
            <output
              aria-label={t(locale, "waves.discovery.loading")}
              className="tw-size-4 tw-shrink-0 tw-animate-spin tw-rounded-full tw-border tw-border-solid tw-border-iron-600 tw-border-t-primary-300 motion-reduce:tw-animate-none"
            />
          </div>
        )}
    </>
  );
}

export function SidebarWaveSearchResults({
  navigation,
}: {
  readonly navigation: SidebarWaveNavigation;
}) {
  const { isApp } = useDeviceInfo();
  const locale = useBrowserLocale();
  const { activeWave } = useMyStream();
  const { queryText, queryEnabled, results, resultWaves } = navigation;
  const loading = !queryEnabled || results.isPending;
  const showResults = queryText.trim().length >= 3 && !loading;
  let feedback = t(locale, "waves.sidebar.searchHint");
  if (queryText.trim().length >= 3) {
    feedback = t(locale, "waves.discovery.loading");
    if (!loading) {
      feedback = t(locale, "waves.sidebar.searchResultCount", {
        count: formatInteger(locale, resultWaves.length),
      });
      if (resultWaves.length === 0)
        feedback = t(locale, "waves.sidebar.searchEmpty", {
          query: queryText.trim(),
        });
      if (results.isError) feedback = t(locale, "waves.discovery.error");
    }
  }
  return (
    <section
      aria-label={t(locale, "waves.sidebar.searchResults")}
      className="tw-px-3"
    >
      <output
        aria-live="polite"
        aria-atomic="true"
        className="tw-block tw-p-2 tw-text-sm tw-text-iron-400"
      >
        {feedback}
      </output>
      {showResults && results.isError && (
        <button
          type="button"
          onClick={() => void results.refetch()}
          className="tw-min-h-11 tw-border-0 tw-bg-transparent tw-px-2 tw-text-primary-300"
        >
          {t(locale, "waves.discovery.retry")}
        </button>
      )}
      {showResults && (
        <>
          {resultWaves.map((wave) => (
            <Link
              key={wave.id}
              href={getWaveRoute({
                waveId: wave.id,
                isDirectMessage: false,
                isApp,
              })}
              prefetch={false}
              onClick={(event) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey ||
                  event.button !== 0
                )
                  return;
                event.preventDefault();
                activeWave.set(wave.id, { isDirectMessage: false });
              }}
              className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-p-2 tw-text-iron-100 tw-no-underline hover:tw-bg-iron-900 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              <span className="tw-size-10 tw-shrink-0">
                <WavePicture
                  name={wave.name}
                  picture={wave.picture}
                  contributors={[]}
                />
              </span>
              <span className="tw-min-w-0">
                <span className="tw-line-clamp-2 tw-text-sm">{wave.name}</span>
                {wave.creator?.handle && (
                  <span className="tw-block tw-text-xs tw-text-iron-400">
                    {t(locale, "waves.sidebar.byCreator", {
                      creator: wave.creator.handle,
                    })}
                  </span>
                )}
                <span className="tw-flex tw-gap-2 tw-text-xs tw-text-primary-300">
                  {wave.pinned && (
                    <span>{t(locale, "waves.sidebar.pinned")}</span>
                  )}
                  {wave.subscribed && (
                    <span>{t(locale, "waves.sidebar.filterJoined")}</span>
                  )}
                </span>
              </span>
            </Link>
          ))}
          {results.hasNextPage && (
            <button
              type="button"
              disabled={results.isFetchingNextPage}
              aria-busy={results.isFetchingNextPage}
              onClick={() => void results.fetchNextPage()}
              className="tw-min-h-11 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-sm tw-text-primary-300"
            >
              {t(
                locale,
                results.isFetchingNextPage
                  ? "waves.discovery.loading"
                  : "waves.discovery.loadMore"
              )}
            </button>
          )}
        </>
      )}
    </section>
  );
}
