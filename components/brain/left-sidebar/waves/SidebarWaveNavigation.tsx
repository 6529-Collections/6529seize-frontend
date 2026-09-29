"use client";
import useDeviceInfo from "@/hooks/useDeviceInfo";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useId } from "react";
import type { SidebarWaveNavigation } from "@/hooks/useSidebarWaveNavigation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import WavePicture from "@/components/waves/WavePicture";
import { t } from "@/i18n/messages";

const COLLECTION_LABELS = {
  pinned: "waves.sidebar.pinned",
  joined: "waves.sidebar.filterJoined",
  all: "waves.sidebar.filterAll",
} as const;

export function SidebarWaveNavigationControls({
  navigation,
}: {
  readonly navigation: SidebarWaveNavigation;
}) {
  const locale = useBrowserLocale();
  const inputId = useId();
  return (
    <div className="tw-sticky tw-top-0 tw-z-10 tw-bg-black tw-px-4 tw-py-2">
      <label htmlFor={inputId} className="tw-sr-only">
        {t(locale, "waves.sidebar.findWave")}
      </label>
      <div className="tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 focus-within:tw-border-primary-400">
        <MagnifyingGlassIcon
          className="tw-size-4 tw-shrink-0 tw-text-iron-400"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="search"
          value={navigation.queryText}
          onChange={(event) => navigation.setQueryText(event.target.value)}
          placeholder={t(locale, "waves.sidebar.findWave")}
          autoComplete="off"
          className="tw-w-full tw-min-w-0 tw-border-0 tw-bg-transparent tw-py-2 tw-text-sm tw-text-white tw-outline-none tw-ring-0 placeholder:tw-text-iron-400 focus:tw-ring-0"
        />
        {navigation.searching && (
          <button
            type="button"
            onClick={() => navigation.setQueryText("")}
            aria-label={t(locale, "waves.sidebar.clearSearch")}
            className="tw-flex tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-300"
          >
            <XMarkIcon className="tw-size-4" />
          </button>
        )}
      </div>
      {navigation.searching && (
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-text-iron-400">
          {t(locale, "waves.sidebar.searchResults")}
        </p>
      )}
      {!navigation.searching && navigation.canUseCollections && (
        <div
          role="group"
          aria-label={t(locale, "waves.sidebar.filterAriaLabel")}
          className="tw-mt-2 tw-flex tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-1"
        >
          {(["pinned", "joined", "all"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={navigation.collection === tab}
              onClick={() => navigation.setCollection(tab)}
              className={`tw-min-h-9 tw-flex-1 tw-rounded-md tw-border-0 tw-px-2 tw-text-xs focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${navigation.collection === tab ? "tw-bg-iron-800 tw-text-white" : "tw-bg-transparent tw-text-iron-400"}`}
            >
              {t(locale, COLLECTION_LABELS[tab])}
            </button>
          ))}
        </div>
      )}
      {!navigation.searching && !navigation.canUseCollections && (
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-font-semibold tw-text-iron-400">
          {t(locale, "waves.sidebar.allWaves")}
        </p>
      )}
    </div>
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
  if (queryText.trim().length < 3)
    return (
      <p role="status" className="tw-p-4 tw-text-sm tw-text-iron-400">
        {t(locale, "waves.sidebar.searchHint")}
      </p>
    );
  if (!queryEnabled || results.isPending)
    return (
      <p role="status" className="tw-p-4 tw-text-sm tw-text-iron-400">
        {t(locale, "waves.discovery.loading")}
      </p>
    );
  return (
    <section
      aria-label={t(locale, "waves.sidebar.searchResults")}
      className="tw-px-3"
    >
      {results.isError && (
        <p role="alert" className="tw-p-2 tw-text-sm tw-text-iron-400">
          {t(locale, "waves.discovery.error")}{" "}
          <button
            type="button"
            onClick={() => void results.refetch()}
            className="tw-border-0 tw-bg-transparent tw-text-primary-300"
          >
            {t(locale, "waves.discovery.retry")}
          </button>
        </p>
      )}
      {!results.isError && resultWaves.length === 0 && (
        <p role="status" className="tw-p-2 tw-text-sm tw-text-iron-400">
          {t(locale, "waves.sidebar.searchEmpty", { query: queryText.trim() })}
        </p>
      )}
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
              {wave.pinned && <span>{t(locale, "waves.sidebar.pinned")}</span>}
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
    </section>
  );
}
