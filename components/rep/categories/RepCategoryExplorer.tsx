"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "react-use";
import GlobalRepCategoryDetail from "./GlobalRepCategoryDetail";
import {
  getGlobalRepCategorySearchQueryKey,
  searchGlobalRepCategories,
} from "./globalRepCategory.api";

const MIN_CATEGORY_SEARCH_LENGTH = 3;

export default function RepCategoryExplorer() {
  const [input, setInput] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const trimmedInput = debouncedInput.trim();

  useDebounce(() => setDebouncedInput(input), 200, [input]);

  const searchQuery = useQuery({
    queryKey: getGlobalRepCategorySearchQueryKey(trimmedInput),
    queryFn: async () => await searchGlobalRepCategories(trimmedInput),
    enabled: trimmedInput.length >= MIN_CATEGORY_SEARCH_LENGTH,
  });

  const showPrompt = input.trim().length < MIN_CATEGORY_SEARCH_LENGTH;

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

        <div
          className="tw-mt-4"
          role="region"
          aria-live="polite"
          aria-label="REP category search results"
        >
          {showPrompt ? (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
              Type at least 3 characters to search.
            </p>
          ) : searchQuery.isPending ? (
            <div
              role="status"
              aria-label="Searching REP categories"
              className="tw-flex tw-justify-center tw-py-4"
            >
              <CircleLoader size={CircleLoaderSize.MEDIUM} />
            </div>
          ) : searchQuery.isError ? (
            <p className="tw-mb-0 tw-text-sm tw-text-error">
              Could not search REP categories.
            </p>
          ) : searchQuery.data.length === 0 ? (
            <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
              No matching categories found.
            </p>
          ) : (
            <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
              {searchQuery.data.map((category) => (
                <li key={category}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-px-3 tw-py-2.5 tw-text-left tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-border-primary-400/40 hover:tw-bg-primary-500/10"
                  >
                    <span className="tw-min-w-0 tw-break-words">
                      {category}
                    </span>
                    <span className="tw-flex-shrink-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
                      View
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {selectedCategory && (
        <GlobalRepCategoryDetail
          key={selectedCategory}
          category={selectedCategory}
          mode="page"
        />
      )}
    </div>
  );
}
