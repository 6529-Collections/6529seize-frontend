"use client";

import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWaveSearchAuthors } from "@/hooks/useWaveSearchAuthors";
import { t } from "@/i18n/messages";
import type { WaveSearchAuthor } from "@/services/api/wave-drops-v2.types";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useDebounce } from "react-use";

const AUTHOR_LIST_ID = "wave-drops-search-author-list";

export default function WaveDropsSearchFilters({
  waveId,
  author,
  after,
  before,
  invalidDateRange,
  onAuthorChange,
  onAfterChange,
  onBeforeChange,
  onClose,
}: {
  readonly waveId: string;
  readonly author: WaveSearchAuthor | null;
  readonly after: string;
  readonly before: string;
  readonly invalidDateRange: boolean;
  readonly onAuthorChange: (author: WaveSearchAuthor | null) => void;
  readonly onAfterChange: (value: string) => void;
  readonly onBeforeChange: (value: string) => void;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const [authorQuery, setAuthorQuery] = useState(author?.handle ?? "");
  const [debouncedAuthorQuery, setDebouncedAuthorQuery] = useState(authorQuery);
  useDebounce(() => setDebouncedAuthorQuery(authorQuery), 200, [authorQuery]);
  const { data: authors = [], isFetching } = useWaveSearchAuthors({
    waveId,
    handle: debouncedAuthorQuery,
    enabled: true,
  });

  return (
    <>
      <button
        type="button"
        aria-label={t(locale, "waves.drops.searchModal.filters.close")}
        onClick={onClose}
        className="tw-fixed tw-inset-0 tw-z-10 tw-border-0 tw-bg-black/35 sm:tw-absolute sm:tw-bg-transparent"
      />
      <section
        aria-labelledby="wave-drops-search-filters-title"
        className="tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-20 tw-rounded-t-2xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 tw-shadow-2xl sm:tw-absolute sm:tw-inset-auto sm:tw-right-5 sm:tw-top-[7.75rem] sm:tw-w-80 sm:tw-rounded-xl"
      >
        <div className="tw-flex tw-items-center tw-justify-between">
          <h3
            id="wave-drops-search-filters-title"
            className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100"
          >
            {t(locale, "waves.drops.searchModal.filters.title")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(locale, "waves.drops.searchModal.filters.close")}
            className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70"
          >
            <XMarkIcon className="tw-size-5" />
          </button>
        </div>

        <div className="tw-mt-3">
          <label
            htmlFor="wave-drops-search-author"
            className="tw-text-xs tw-font-medium tw-text-iron-300"
          >
            {t(locale, "waves.drops.searchModal.filters.from")}
          </label>
          <div className="tw-relative tw-mt-1.5">
            <input
              id="wave-drops-search-author"
              role="combobox"
              aria-autocomplete="list"
              aria-controls={AUTHOR_LIST_ID}
              aria-expanded="true"
              autoComplete="off"
              value={authorQuery}
              onChange={(event) => setAuthorQuery(event.target.value)}
              placeholder={t(
                locale,
                "waves.drops.searchModal.filters.authorPlaceholder"
              )}
              className="tw-form-input tw-block tw-h-10 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-primary-300/90"
            />
            {author && (
              <button
                type="button"
                onClick={() => {
                  onAuthorChange(null);
                  setAuthorQuery("");
                }}
                aria-label={t(
                  locale,
                  "waves.drops.searchModal.filters.clearAuthor"
                )}
                className="tw-absolute tw-right-2 tw-top-1/2 tw-flex tw-size-6 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-800 tw-text-iron-300"
              >
                <XMarkIcon className="tw-size-4" />
              </button>
            )}
          </div>
          <div
            id={AUTHOR_LIST_ID}
            role="listbox"
            aria-label={t(
              locale,
              "waves.drops.searchModal.filters.authorResults"
            )}
            className="tw-mt-1.5 tw-max-h-36 tw-overflow-y-auto tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-1"
          >
            {isFetching && (
              <p className="tw-m-0 tw-px-2 tw-py-2 tw-text-xs tw-text-iron-400">
                {t(locale, "waves.drops.searchModal.filters.loadingAuthors")}
              </p>
            )}
            {!isFetching && authors.length === 0 && (
              <p className="tw-m-0 tw-px-2 tw-py-2 tw-text-xs tw-text-iron-400">
                {t(locale, "waves.drops.searchModal.filters.noAuthors")}
              </p>
            )}
            {!isFetching &&
              authors.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  role="option"
                  aria-selected={author?.id === candidate.id}
                  aria-label={candidate.handle}
                  onClick={() => {
                    setAuthorQuery(candidate.handle);
                    onAuthorChange(candidate);
                  }}
                  className="tw-flex tw-w-full tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-p-2 tw-text-left tw-text-sm tw-text-iron-200 hover:tw-bg-iron-800 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70"
                >
                  <ProfileAvatar
                    pfpUrl={candidate.pfp}
                    size={ProfileBadgeSize.COMPACT}
                    alt=""
                    fallbackContent={candidate.handle
                      .slice(0, 1)
                      .toLocaleUpperCase(locale)}
                  />
                  <span className="tw-truncate">{candidate.handle}</span>
                </button>
              ))}
          </div>
        </div>

        <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-3">
          <label className="tw-text-xs tw-font-medium tw-text-iron-300">
            {t(locale, "waves.drops.searchModal.filters.after")}
            <input
              type="date"
              value={after}
              onChange={(event) => onAfterChange(event.target.value)}
              className="tw-form-input tw-mt-1.5 tw-block tw-h-10 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-2 tw-text-sm tw-text-iron-100 tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-primary-300/90"
            />
          </label>
          <label className="tw-text-xs tw-font-medium tw-text-iron-300">
            {t(locale, "waves.drops.searchModal.filters.before")}
            <input
              type="date"
              value={before}
              onChange={(event) => onBeforeChange(event.target.value)}
              className="tw-form-input tw-mt-1.5 tw-block tw-h-10 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-2 tw-text-sm tw-text-iron-100 tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-primary-300/90"
            />
          </label>
        </div>
        {invalidDateRange && (
          <p role="alert" className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-error">
            {t(locale, "waves.drops.searchModal.filters.invalidRange")}
          </p>
        )}
      </section>
    </>
  );
}
