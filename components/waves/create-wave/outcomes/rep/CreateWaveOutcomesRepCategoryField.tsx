"use client";

import RepCategorySearch from "@/components/utils/input/rep-category/RepCategorySearch";

export default function CreateWaveOutcomesRepCategoryField({
  category,
  errorMessage,
  setCategory,
}: {
  readonly category: string | null;
  readonly errorMessage: string | null;
  readonly setCategory: (category: string | null) => void;
}) {
  return (
    <div className="tw-w-full">
      <RepCategorySearch
        error={errorMessage !== null}
        category={category}
        setCategory={setCategory}
      />
      {errorMessage !== null && (
        <div
          className="tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5"
          role="alert"
        >
          <svg
            className="tw-size-5 tw-flex-shrink-0 tw-text-error"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="tw-text-xs tw-font-medium tw-text-error">
            {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
}
