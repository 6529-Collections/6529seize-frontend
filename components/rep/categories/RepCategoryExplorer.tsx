"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { ApiGlobalRepCategorySuggestedCategory } from "@/generated/models/ApiGlobalRepCategorySuggestedCategory";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "react-use";
import GlobalRepCategoryDetail from "./GlobalRepCategoryDetail";
import {
  fetchSuggestedRepCategories,
  getGlobalRepCategorySearchQueryKey,
  getGlobalRepCategorySuggestedQueryKey,
  searchGlobalRepCategories,
} from "./globalRepCategory.api";

const MIN_CATEGORY_SEARCH_LENGTH = 3;
const REP_CATEGORY_LOCALE = DEFAULT_LOCALE;

function RepCategorySearchResults({
  showPrompt,
  isPending,
  isError,
  categories,
  onSelect,
}: {
  readonly showPrompt: boolean;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly categories: string[] | undefined;
  readonly onSelect: (category: string) => void;
}) {
  if (showPrompt) {
    return (
      <p className="tw-mb-0 tw-text-xs tw-text-iron-500">
        {t(REP_CATEGORY_LOCALE, "rep.categories.search.minChars")}
      </p>
    );
  }

  if (isPending) {
    return (
      <output
        aria-label={t(REP_CATEGORY_LOCALE, "rep.categories.search.loading")}
        className="tw-flex tw-justify-center tw-py-4"
      >
        <CircleLoader size={CircleLoaderSize.MEDIUM} />
      </output>
    );
  }

  if (isError) {
    return (
      <p className="tw-mb-0 tw-text-sm tw-text-error">
        {t(REP_CATEGORY_LOCALE, "rep.categories.search.error")}
      </p>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
        {t(REP_CATEGORY_LOCALE, "rep.categories.search.empty")}
      </p>
    );
  }

  return (
    <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1.5 tw-p-0">
      {categories.map((category) => (
        <li key={category}>
          <button
            type="button"
            onClick={() => onSelect(category)}
            className="tw-group tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/60 tw-bg-iron-900/40 tw-px-3 tw-py-2.5 tw-text-left tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors hover:tw-border-primary-400/40 hover:tw-bg-primary-500/[0.08] focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60"
          >
            <span className="tw-min-w-0 tw-break-words">{category}</span>
            <span className="tw-flex-shrink-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400 tw-transition-colors group-hover:tw-text-iron-200">
              {t(REP_CATEGORY_LOCALE, "rep.categories.search.view")}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function SuggestedCategoryButton({
  item,
  onSelect,
}: {
  readonly item: ApiGlobalRepCategorySuggestedCategory;
  readonly onSelect: (category: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.category)}
      className="tw-grid tw-h-full tw-w-full tw-grid-cols-2 tw-gap-x-4 tw-gap-y-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/60 tw-bg-iron-900/40 tw-p-4 tw-text-left tw-transition-colors hover:tw-border-primary-400/40 hover:tw-bg-primary-500/[0.08] focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60"
    >
      <span className="tw-col-span-2 tw-break-words tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-50">
        {item.category}
      </span>
      <span className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
        <span className="tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-leading-none tw-tracking-wider tw-text-iron-500">
          {t(REP_CATEGORY_LOCALE, "rep.categories.suggested.rep")}
        </span>
        <span className="tw-text-sm tw-leading-none tw-text-primary-300">
          {formatNumberWithCommas(item.total_rep)}
        </span>
      </span>
      <span className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
        <span className="tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-leading-none tw-tracking-wider tw-text-iron-500">
          {t(REP_CATEGORY_LOCALE, "rep.categories.suggested.ratings")}
        </span>
        <span className="tw-text-sm tw-leading-none tw-text-iron-400">
          {formatNumberWithCommas(item.rating_count)}
        </span>
      </span>
    </button>
  );
}

function SuggestedCategories({
  isPending,
  isError,
  categories,
  onSelect,
}: {
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly categories: ApiGlobalRepCategorySuggestedCategory[] | undefined;
  readonly onSelect: (category: string) => void;
}) {
  if (isPending) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="tw-flex tw-justify-center tw-py-8"
      >
        <CircleLoader size={CircleLoaderSize.LARGE} />
        <span className="tw-sr-only">
          {t(REP_CATEGORY_LOCALE, "rep.categories.suggested.loading")}
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="tw-mb-0 tw-text-sm tw-text-error">
        {t(REP_CATEGORY_LOCALE, "rep.categories.suggested.error")}
      </p>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
        {t(REP_CATEGORY_LOCALE, "rep.categories.suggested.empty")}
      </p>
    );
  }

  return (
    <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-2 tw-p-0 md:tw-grid-cols-2 xl:tw-grid-cols-3">
      {categories.map((item) => (
        <li key={item.category}>
          <SuggestedCategoryButton item={item} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}

export default function RepCategoryExplorer() {
  const [input, setInput] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [scrollTargetCategory, setScrollTargetCategory] = useState<
    string | null
  >(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const trimmedInput = debouncedInput.trim();

  useDebounce(() => setDebouncedInput(input), 200, [input]);

  const searchQuery = useQuery({
    queryKey: getGlobalRepCategorySearchQueryKey(trimmedInput),
    queryFn: async () => await searchGlobalRepCategories(trimmedInput),
    enabled: trimmedInput.length >= MIN_CATEGORY_SEARCH_LENGTH,
  });

  const suggestedQuery = useQuery({
    queryKey: getGlobalRepCategorySuggestedQueryKey(),
    queryFn: fetchSuggestedRepCategories,
  });

  useEffect(() => {
    if (!scrollTargetCategory || scrollTargetCategory !== selectedCategory) {
      return;
    }

    let secondFrame: number | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const scrollToDetail = () => {
      const detail = detailRef.current;
      if (!detail) {
        return;
      }

      const scrollTop =
        detail.getBoundingClientRect().top + globalThis.scrollY - 96;
      globalThis.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: "smooth",
      });
      detail.focus({ preventScroll: true });
      setScrollTargetCategory(null);
    };
    const scheduleScroll = () => {
      timeout = globalThis.setTimeout(scrollToDetail, 50);
    };
    const scheduleSecondFrame = () => {
      secondFrame = globalThis.requestAnimationFrame(scheduleScroll);
    };
    const firstFrame = globalThis.requestAnimationFrame(scheduleSecondFrame);

    return () => {
      globalThis.cancelAnimationFrame(firstFrame);
      if (secondFrame !== undefined) {
        globalThis.cancelAnimationFrame(secondFrame);
      }
      if (timeout) {
        globalThis.clearTimeout(timeout);
      }
    };
  }, [scrollTargetCategory, selectedCategory]);

  const showPrompt = trimmedInput.length < MIN_CATEGORY_SEARCH_LENGTH;
  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setScrollTargetCategory(category);
  };

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-6 tw-text-iron-100">
      <section className="tw-border-b tw-border-l-0 tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-iron-900 tw-pb-6">
        <label
          htmlFor="global-rep-category-search"
          className="tw-mb-3 tw-block tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50"
        >
          {t(REP_CATEGORY_LOCALE, "rep.categories.search.label")}
        </label>
        <input
          id="global-rep-category-search"
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="tw-form-input tw-block tw-w-full tw-max-w-2xl tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-4 tw-py-3 tw-text-base tw-font-medium tw-text-iron-100 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-transition placeholder:tw-text-iron-500 hover:tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 sm:tw-text-sm"
          placeholder={t(
            REP_CATEGORY_LOCALE,
            "rep.categories.search.placeholder"
          )}
          autoComplete="off"
        />

        <section
          className="tw-mt-2 tw-max-w-2xl"
          aria-live="polite"
          aria-label={t(
            REP_CATEGORY_LOCALE,
            "rep.categories.search.resultsLabel"
          )}
        >
          <RepCategorySearchResults
            showPrompt={showPrompt}
            isPending={searchQuery.isPending}
            isError={searchQuery.isError}
            categories={searchQuery.data}
            onSelect={selectCategory}
          />
        </section>
      </section>

      {!selectedCategory && (
        <section className="tw-flex tw-flex-col tw-gap-5">
          <div>
            <h2 className="tw-mb-1 tw-mt-0 tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50">
              {t(REP_CATEGORY_LOCALE, "rep.categories.suggested.title")}
            </h2>
            <p className="tw-mb-0 tw-mt-0 tw-text-sm tw-text-iron-400">
              {t(REP_CATEGORY_LOCALE, "rep.categories.suggested.description")}
            </p>
          </div>
          <SuggestedCategories
            isPending={suggestedQuery.isPending}
            isError={suggestedQuery.isError}
            categories={suggestedQuery.data}
            onSelect={selectCategory}
          />
        </section>
      )}

      {selectedCategory && (
        <div ref={detailRef} tabIndex={-1} className="tw-scroll-mt-24">
          <GlobalRepCategoryDetail
            key={selectedCategory}
            category={selectedCategory}
            mode="page"
            className="!tw-pt-0"
          />
        </div>
      )}
    </div>
  );
}
