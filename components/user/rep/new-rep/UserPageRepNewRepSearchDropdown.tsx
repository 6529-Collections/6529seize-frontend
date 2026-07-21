import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { GrantRepCategoryOption } from "./grantRepCategorySearch";
import { RepSearchState } from "./rep-search-types";

function ExistingCategoryDetails({
  option,
}: {
  readonly option: Extract<GrantRepCategoryOption, { kind: "existing" }>;
}) {
  const locale = useBrowserLocale();

  return (
    <>
      <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <span className="tw-break-words tw-text-sm tw-font-semibold tw-text-white">
          {option.category}
        </span>
        <span className="tw-rounded-full tw-bg-primary-500/15 tw-px-2 tw-py-0.5 tw-text-[0.6875rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
          {t(locale, "rep.categories.grant.existing")}
        </span>
      </span>
      {option.selectionReason === "submission" && (
        <span className="tw-text-xs tw-font-medium tw-leading-relaxed tw-text-success">
          {t(locale, "rep.categories.grant.submissionCategory")}
        </span>
      )}
      {option.selectionReason === "most-active" && (
        <span className="tw-text-xs tw-font-normal tw-leading-relaxed tw-text-iron-400">
          {t(locale, "rep.categories.grant.mostActive")}
        </span>
      )}
      {option.aliases.length > 0 && (
        <span className="tw-flex tw-flex-col tw-gap-1.5">
          <span className="tw-text-xs tw-font-normal tw-leading-relaxed tw-text-iron-400">
            {t(locale, "rep.categories.grant.similarSpellings")}
          </span>
          <span className="tw-flex tw-flex-wrap tw-gap-1.5">
            {option.aliases.map((alias) => (
              <span
                key={alias}
                className="tw-max-w-full tw-break-words tw-rounded-md tw-bg-white/5 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-400"
              >
                {alias}
              </span>
            ))}
          </span>
        </span>
      )}
    </>
  );
}

function CategoryOption({
  option,
  optionId,
  optionIndex,
  optionCount,
  listId,
  onRepSelect,
}: {
  readonly option: GrantRepCategoryOption;
  readonly optionId: string;
  readonly optionIndex: number;
  readonly optionCount: number;
  readonly listId: string;
  readonly onRepSelect: (option: GrantRepCategoryOption) => void;
}) {
  const locale = useBrowserLocale();
  const isNew = option.kind === "new";
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") {
      nextIndex = Math.min(optionIndex + 1, optionCount - 1);
    } else if (event.key === "ArrowUp") {
      nextIndex = Math.max(optionIndex - 1, 0);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = optionCount - 1;
    }
    if (nextIndex === null) return;
    const nextOption = document.getElementById(`${listId}-option-${nextIndex}`);
    if (!(nextOption instanceof HTMLButtonElement)) return;
    event.preventDefault();
    nextOption.focus();
  };

  return (
    <li
      role="presentation"
      className={
        isNew
          ? "tw-mt-1 tw-border-b-0 tw-border-l-0 tw-border-r-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-2"
          : undefined
      }
    >
      <button
        id={optionId}
        type="button"
        role="option"
        aria-selected={false}
        onKeyDown={handleKeyDown}
        onClick={(event) => {
          event.stopPropagation();
          onRepSelect(option);
        }}
        className={`tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-flex-col tw-items-start tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2.5 tw-text-left tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${
          isNew
            ? "tw-border-dashed tw-border-iron-700 tw-bg-transparent hover:tw-border-primary-400/60 hover:tw-bg-primary-500/10"
            : "tw-border-white/10 tw-bg-white/5 hover:tw-border-white/20 hover:tw-bg-white/10"
        }`}
      >
        {option.kind === "existing" ? (
          <ExistingCategoryDetails option={option} />
        ) : (
          <>
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
              {t(locale, "rep.categories.grant.create")}
            </span>
            <span className="tw-break-words tw-text-sm tw-font-semibold tw-text-white">
              {option.category}
            </span>
            <span className="tw-text-xs tw-font-normal tw-leading-relaxed tw-text-iron-400">
              {t(locale, "rep.categories.grant.createDescription")}
            </span>
          </>
        )}
      </button>
    </li>
  );
}

export default function UserPageRepNewRepSearchDropdown({
  options,
  onRepSelect,
  state,
  minSearchLength,
  maxSearchLength,
  listId,
}: {
  readonly options: readonly GrantRepCategoryOption[];
  readonly onRepSelect: (option: GrantRepCategoryOption) => void;
  readonly state: RepSearchState;
  readonly minSearchLength: number;
  readonly maxSearchLength: number;
  readonly listId: string;
}) {
  const locale = useBrowserLocale();

  if (state === RepSearchState.MIN_LENGTH_ERROR) {
    return (
      <p className="tw-mb-0 tw-px-2 tw-py-1 tw-text-xs tw-font-normal tw-text-iron-500">
        {t(locale, "rep.categories.grant.minimumCharacters", {
          min: minSearchLength,
        })}
      </p>
    );
  }

  if (state === RepSearchState.MAX_LENGTH_ERROR) {
    return (
      <p className="tw-mb-0 tw-px-2 tw-py-1 tw-text-xs tw-font-normal tw-text-iron-500">
        {t(locale, "rep.categories.grant.maximumCharacters", {
          max: maxSearchLength,
        })}
      </p>
    );
  }

  if (state === RepSearchState.LOADING) {
    return (
      <output className="tw-flex tw-items-center tw-gap-2 tw-px-2 tw-py-1 tw-text-xs tw-text-iron-400">
        <CircleLoader />
        <span>{t(locale, "rep.categories.grant.searching")}</span>
      </output>
    );
  }

  if (state === RepSearchState.ERROR) {
    return (
      <p className="tw-mb-0 tw-px-2 tw-py-1 tw-text-xs tw-font-normal tw-text-error">
        {t(locale, "rep.categories.grant.searchError")}
      </p>
    );
  }

  if (!options.length) {
    return (
      <p className="tw-mb-0 tw-px-2 tw-py-1 tw-text-xs tw-font-normal tw-text-iron-500">
        {t(locale, "rep.categories.grant.noOptions")}
      </p>
    );
  }

  return (
    <ul
      id={listId}
      role="listbox"
      aria-label={t(locale, "rep.categories.grant.resultsLabel")}
      className="tw-m-0 tw-flex tw-max-h-80 tw-list-none tw-flex-col tw-gap-2 tw-overflow-y-auto tw-p-1"
    >
      {options.map((option, index) => (
        <CategoryOption
          key={`${option.kind}-${option.category}`}
          option={option}
          optionId={`${listId}-option-${index}`}
          optionIndex={index}
          optionCount={options.length}
          listId={listId}
          onRepSelect={onRepSelect}
        />
      ))}
    </ul>
  );
}
