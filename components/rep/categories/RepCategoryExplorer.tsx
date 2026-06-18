"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { ApiGlobalRepCategorySuggestedCategory } from "@/generated/models/ApiGlobalRepCategorySuggestedCategory";
import { formatNumberWithCommas } from "@/helpers/Helpers";
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
      <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
        Type at least 3 characters to search.
      </p>
    );
  }

  if (isPending) {
    return (
      <output
        aria-label="Searching REP categories"
        className="tw-flex tw-justify-center tw-py-4"
      >
        <CircleLoader size={CircleLoaderSize.MEDIUM} />
      </output>
    );
  }

  if (isError) {
    return (
      <p className="tw-mb-0 tw-text-sm tw-text-error">
        Could not search REP categories.
      </p>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
        No matching categories found.
      </p>
    );
  }

  return (
    <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
      {categories.map((category) => (
        <li key={category}>
          <button
            type="button"
            onClick={() => onSelect(category)}
            className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-px-3 tw-py-2.5 tw-text-left tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-border-primary-400/40 hover:tw-bg-primary-500/10"
          >
            <span className="tw-min-w-0 tw-break-words">{category}</span>
            <span className="tw-flex-shrink-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
              View
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
      className="tw-flex tw-h-full tw-w-full tw-flex-col tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-p-4 tw-text-left tw-transition-colors hover:tw-border-primary-400/40 hover:tw-bg-primary-500/10"
    >
      <span className="tw-break-words tw-text-base tw-font-semibold tw-text-white">
        {item.category}
      </span>
      <span className="tw-grid tw-w-full tw-grid-cols-2 tw-gap-2 tw-text-xs tw-text-iron-400">
        <span>
          <span className="tw-block tw-font-semibold tw-uppercase tw-text-iron-500">
            REP
          </span>
          <span className="tw-text-primary-300">
            {formatNumberWithCommas(item.total_rep)}
          </span>
        </span>
        <span>
          <span className="tw-block tw-font-semibold tw-uppercase tw-text-iron-500">
            Ratings
          </span>
          <span>{formatNumberWithCommas(item.rating_count)}</span>
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
      <output
        aria-label="Loading active REP categories"
        className="tw-flex tw-justify-center tw-py-8"
      >
        <CircleLoader size={CircleLoaderSize.LARGE} />
      </output>
    );
  }

  if (isError) {
    return (
      <p className="tw-mb-0 tw-text-sm tw-text-error">
        Could not load active REP categories.
      </p>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
        No active REP categories found yet.
      </p>
    );
  }

  return (
    <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 md:tw-grid-cols-2 xl:tw-grid-cols-3">
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

    const animationFrame = globalThis.requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      detailRef.current?.focus({ preventScroll: true });
      setScrollTargetCategory(null);
    });

    return () => globalThis.cancelAnimationFrame(animationFrame);
  }, [scrollTargetCategory, selectedCategory]);

  const showPrompt = input.trim().length < MIN_CATEGORY_SEARCH_LENGTH;
  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setScrollTargetCategory(category);
  };

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-6 tw-text-iron-100">
      <section className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.03] tw-p-4 sm:tw-p-5">
        <label
          htmlFor="global-rep-category-search"
          className="tw-mb-2 tw-block tw-text-sm tw-font-semibold tw-text-iron-200"
        >
          Search REP categories
        </label>
        <input
          id="global-rep-category-search"
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-base tw-font-medium tw-text-white tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 sm:tw-text-sm"
          placeholder="Type a category name"
          autoComplete="off"
        />

        <section
          className="tw-mt-4"
          aria-live="polite"
          aria-label="REP category search results"
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
        <section className="tw-flex tw-flex-col tw-gap-4">
          <div>
            <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-white">
              Active REP categories
            </h2>
            <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
              Categories with the most profile REP activity.
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
        <div ref={detailRef} tabIndex={-1} className="tw-scroll-mt-6">
          <GlobalRepCategoryDetail
            key={selectedCategory}
            category={selectedCategory}
            mode="page"
          />
        </div>
      )}
    </div>
  );
}
