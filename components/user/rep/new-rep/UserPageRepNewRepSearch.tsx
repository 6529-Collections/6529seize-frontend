"use client";

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useClickAway,
  useDebounce,
  useKeyPressEvent,
  useMeasure,
} from "react-use";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ApiRepOverview } from "@/generated/models/ApiRepOverview";
import UserPageRepNewRepSearchDropdown from "./UserPageRepNewRepSearchDropdown";
import { RepSearchState } from "./rep-search-types";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import Button from "@/components/utils/button/Button";
import UserPageRepNewRepError from "./UserPageRepNewRepError";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getStringAsNumberOrZero } from "@/helpers/Helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";
import { RATING_INPUT_SURFACE_CLASS } from "@/components/user/utils/rate/ratingInputStyles";
import UserRateAdjustmentHelper from "@/components/user/utils/rate/UserRateAdjustmentHelper";
import { useRepAllocation } from "@/hooks/useRepAllocation";
import { getRepCategoryViolation } from "@/components/utils/input/rep-category/repCategoryValidation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { isMemesNomineeLookalike } from "@/helpers/waves/memes-nomination";
import { getGrantRepCategoriesToDisplay } from "./grantRepCategoryOptions";
import GrantRepCategorySuggestions from "./GrantRepCategorySuggestions";
import GrantRepSubmissionGuidance from "./GrantRepSubmissionGuidance";
import GrantRepStats from "./GrantRepStats";
import useRepCategoryNavigation from "./useRepCategoryNavigation";

import { isRatingValue } from "../ratingsManagement";

const SEARCH_LENGTH = {
  MIN: 3,
  MAX: 100,
};
const GENERIC_ERROR_KEY = "rep.categories.grant.errors.generic";
const getSearchLength = (value: string): number => Array.from(value).length;

function categoryAvailabilityOptions(category: string) {
  const name = category.trim();
  const params = new URLSearchParams({ param: name });
  return queryOptions({
    queryKey: [QueryKey.REP_CATEGORY_AVAILABILITY, name],
    queryFn: ({ signal }) =>
      commonApiFetch<boolean>({
        endpoint: `rep/categories/availability?${params.toString()}`,
        signal,
      }),
    staleTime: ({ state }) => (state.data === true ? 60_000 : 0),
    retry: false,
  });
}

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { readonly message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallbackMessage;
};

type Props = {
  readonly overview: ApiRepOverview | null;
  readonly profile: ApiIdentity;
  readonly onSuccess?: (() => void) | undefined;
  readonly onCancel?: (() => void) | undefined;
};

export default function UserPageRepNewRepSearch(props: Props) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const amountContext = [
    props.profile.id ?? props.profile.query ?? props.profile.display,
    connectedProfile?.id,
    activeProfileProxy?.id,
  ].join(":");
  return (
    <GrantRepForm
      key={amountContext}
      {...props}
      amountContext={amountContext}
    />
  );
}

function GrantRepForm({
  overview,
  profile,
  onSuccess,
  onCancel,
  amountContext,
}: Props & {
  readonly amountContext: string;
}) {
  const locale = useBrowserLocale();
  const reducedMotion = useReducedMotion();
  const transition = {
    duration: reducedMotion ? 0 : 0.15,
    ease: "easeOut",
  } as const;
  // Measure natural content separately so the footer stays pinned when the body scrolls.
  const [contentRef, { height: contentHeight }] = useMeasure<HTMLDivElement>();
  const [footerRef, { height: footerHeight }] = useMeasure<HTMLDivElement>();
  const layoutHeight =
    contentHeight > 0 && footerHeight > 0
      ? contentHeight + footerHeight
      : "auto";
  const amountInputId = useId();
  const amountFormId = useId();
  const availableRepId = useId();
  const categoryErrorId = useId();
  const typedCategoryErrorId = useId();
  const submissionGuidanceId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectionRequest = useRef(0);
  const amountFocusSource = useRef<Element | null>(null);
  const isCurrentForm = useRef(false);
  useEffect(() => {
    isCurrentForm.current = true;
    return () => {
      isCurrentForm.current = false;
    };
  }, []);
  const queryClient = useQueryClient();
  const { onProfileRepModify } = useContext(ReactQueryWrapperContext);
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);

  const [repSearch, setRepSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [amountDraft, setAmountDraft] = useState<{
    readonly scope: string;
    readonly value: string;
  } | null>(null);
  const [mutating, setMutating] = useState<boolean>(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [formError, setError] = useState<{
    readonly message: string;
    readonly field: "category" | "save";
    readonly showDetails: boolean;
  } | null>(null);
  const [debouncedValue, setDebouncedValue] = useState<string>("");
  useDebounce(
    () => {
      setDebouncedValue(repSearch);
    },
    500,
    [repSearch]
  );

  const typedCategory = repSearch.trim();
  const debouncedCategory = debouncedValue.trim();
  const debouncedSearchLength = getSearchLength(debouncedCategory);
  const matchingSearchLength =
    debouncedSearchLength >= SEARCH_LENGTH.MIN &&
    debouncedSearchLength <= SEARCH_LENGTH.MAX;

  const typedCategoryViolation = getRepCategoryViolation(typedCategory);
  const isDebouncedCategory =
    !selectedCategory && typedCategory === debouncedCategory;
  const shouldCheckAvailability =
    isDebouncedCategory && matchingSearchLength && !typedCategoryViolation;
  const availability = useQuery({
    ...categoryAvailabilityOptions(typedCategory),
    enabled: shouldCheckAvailability,
  });
  const activeCategory =
    selectedCategory ??
    (shouldCheckAvailability &&
    availability.isSuccess &&
    availability.data === true
      ? typedCategory
      : null);
  const hasActiveCategory = activeCategory !== null;
  const categorySelectionInvalid = formError?.field === "category";
  const unavailableCategoryMessage = t(
    locale,
    "rep.categories.validation.unavailable"
  );
  let typedCategoryError: string | null = null;
  if (isDebouncedCategory && !categorySelectionInvalid) {
    if (typedCategoryViolation) {
      typedCategoryError = t(locale, typedCategoryViolation.key, {
        ...typedCategoryViolation.params,
      });
    } else if (shouldCheckAvailability && availability.isError) {
      typedCategoryError = getErrorMessage(
        availability.error,
        t(locale, GENERIC_ERROR_KEY)
      );
    } else if (
      shouldCheckAvailability &&
      availability.isSuccess &&
      availability.data === false
    ) {
      typedCategoryError = unavailableCategoryMessage;
    }
  }

  const { isFetching, data: categories } = useQuery<string[]>({
    queryKey: [QueryKey.REP_CATEGORIES_SEARCH, debouncedCategory],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ param: debouncedCategory });
      return commonApiFetch<string[]>({
        endpoint: `rep/categories?${params.toString()}`,
        signal,
      });
    },
    enabled: matchingSearchLength && isDebouncedCategory,
  });

  const {
    repState,
    ratingStats,
    heroAvailableRep,
    minMaxValues,
    isError,
    retry,
  } = useRepAllocation({
    profile,
    category: activeCategory,
  });

  const amountScope = [amountContext, activeCategory].join(":");
  const draftWithoutCategoryScope = [amountContext, null].join(":");
  const savedAmount = hasActiveCategory
    ? String(repState?.rater_contribution ?? 0)
    : "";
  const amountStr =
    amountDraft?.scope === amountScope ||
    (amountDraft?.scope === draftWithoutCategoryScope && amountDraft.value)
      ? amountDraft.value
      : savedAmount;
  const setAmountStr = (value: string) =>
    setAmountDraft({ scope: amountScope, value });

  const amountNum = getStringAsNumberOrZero(amountStr);
  const isValidValue =
    isRatingValue(amountStr) &&
    (!!activeProfileProxy ||
      (amountNum >= minMaxValues.min && amountNum <= minMaxValues.max));

  const currentRep = repState?.rater_contribution ?? 0;
  const amountReady = hasActiveCategory && repState !== null;
  const focusSelectedAmount = useCallback(
    (input: HTMLInputElement | null) => {
      if (!input || !selectedCategory || !amountReady) return;
      const source = amountFocusSource.current;
      amountFocusSource.current = null;
      if (!source) return;
      const ownerDocument = input.ownerDocument;
      if (
        ownerDocument.activeElement === source ||
        (ownerDocument.activeElement === ownerDocument.body &&
          !source.isConnected)
      ) {
        input.focus({ preventScroll: true });
      }
    },
    [selectedCategory, amountReady]
  );
  const haveChanged = amountNum !== currentRep;
  const overAllowance =
    amountReady && isRatingValue(amountStr) && !isValidValue;
  const isGrantDisabled =
    !amountReady ||
    isError ||
    !amountStr ||
    !haveChanged ||
    !isValidValue ||
    checkingAvailability ||
    mutating;

  // --- End derived rep state ---

  const [isOpen, setIsOpen] = useState(false);

  const listRef = useRef<HTMLFormElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const onRepSelect = async (rep: string, knownCategory = false) => {
    const category = rep.trim();
    if (mutating || selectedCategory === category) return;
    const request = ++selectionRequest.current;
    // Mirror the server's category rules locally so the user sees the exact
    // broken rule, localized and instantly, instead of a server error blob.
    // Runs before the search-length guard below so the over-length and
    // leading-dash messages actually reach the user.
    const violation = getRepCategoryViolation(category);
    if (violation) {
      setError({
        message: t(locale, violation.key, { ...violation.params }),
        field: "category",
        showDetails: false,
      });
      return;
    }
    // Search-specific minimum (below the server's 1-char floor): surface it
    // instead of silently dropping the input. Count code points to stay
    // consistent with the validator's length semantics.
    if (!knownCategory && getSearchLength(category) < SEARCH_LENGTH.MIN) {
      setError({
        message: t(locale, "rep.categories.validation.tooShort", {
          min: SEARCH_LENGTH.MIN,
        }),
        field: "category",
        showDetails: false,
      });
      return;
    }
    const focusSource =
      searchInputRef.current?.ownerDocument.activeElement ?? null;
    setCheckingAvailability(!knownCategory);
    try {
      if (!knownCategory) {
        const isAvailable = await queryClient.fetchQuery(
          categoryAvailabilityOptions(category)
        );
        if (!isAvailable) throw new Error(unavailableCategoryMessage);
      }
      if (!isCurrentForm.current || request !== selectionRequest.current)
        return;
      amountFocusSource.current = focusSource;
      setSelectedCategory(category);
      setRepSearch(category);
      const selectedAmountScope = [amountContext, category].join(":");
      setAmountDraft((draft) => {
        if (draft?.scope === selectedAmountScope) return draft;
        if (draft?.scope === draftWithoutCategoryScope && draft.value)
          return { scope: selectedAmountScope, value: draft.value };
        return null;
      });
      setError(null);
      setIsOpen(false);
    } catch (error: unknown) {
      if (request !== selectionRequest.current) return;
      setError({
        message: getErrorMessage(error, t(locale, GENERIC_ERROR_KEY)),
        field: "category",
        showDetails: true,
      });
    } finally {
      if (request === selectionRequest.current) setCheckingAvailability(false);
    }
  };

  const addRepMutation = useMutation({
    mutationFn: async ({
      amount,
      category,
    }: {
      amount: number;
      category: string;
    }) =>
      await commonApiPost<{ amount: number; category: string }, void>({
        endpoint: `profiles/${profile.query ?? ""}/rep/rating`,
        body: { amount, category },
      }),
    onSuccess: async () => {
      setToast({
        message: t(locale, "rep.categories.grant.toast.updated"),
        type: "success",
      });
      await onProfileRepModify({
        targetProfiles: [profile],
        connectedProfile,
        profileProxy: activeProfileProxy ?? null,
      });
      if (!isCurrentForm.current) return;
      setSelectedCategory(null);
      setRepSearch("");
      setAmountDraft(null);
      setError(null);
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "rep.categories.grant.toast.updateFailed"),
        description: t(locale, "rep.categories.grant.toast.tryAgain"),
        details: getToastErrorDetails(
          error,
          getErrorMessage(error, t(locale, GENERIC_ERROR_KEY))
        ),
      });
    },
  });

  const onGrantRep = async () => {
    if (isGrantDisabled || !activeCategory || !profile.query) return;
    const amount = Number.parseInt(amountStr, 10);
    if (Number.isNaN(amount)) return;
    setMutating(true);
    try {
      const { success } = await requestAuth();
      if (!success) {
        setToast({
          message: t(locale, "rep.categories.grant.toast.loginRequired"),
          type: "error",
        });
        return;
      }
      await addRepMutation.mutateAsync({ amount, category: activeCategory });
    } catch (error: unknown) {
      setError({
        message: getErrorMessage(error, t(locale, GENERIC_ERROR_KEY)),
        field: "save",
        showDetails: true,
      });
    } finally {
      setMutating(false);
    }
  };

  const onSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedCategory) return;
    if (!repSearch) return;
    if (isMemesNomineeLookalike(repSearch)) {
      setIsOpen(true);
      return;
    }
    void onRepSelect(repSearch);
  };

  const categoriesToDisplay = useMemo(() => {
    return getGrantRepCategoriesToDisplay({
      search: debouncedCategory,
      categories: categories ?? [],
      showSubmissionSuggestion: matchingSearchLength,
    });
  }, [debouncedCategory, categories, matchingSearchLength]);

  const repSearchState = useMemo(() => {
    const searchLength = getSearchLength(typedCategory);
    if (searchLength < SEARCH_LENGTH.MIN)
      return RepSearchState.MIN_LENGTH_ERROR;
    if (searchLength > SEARCH_LENGTH.MAX)
      return RepSearchState.MAX_LENGTH_ERROR;
    if (typedCategory !== debouncedCategory || isFetching)
      return RepSearchState.LOADING;
    return RepSearchState.HAVE_RESULTS;
  }, [debouncedCategory, isFetching, typedCategory]);
  const showSearchDropdown =
    isOpen &&
    !selectedCategory &&
    (repSearchState !== RepSearchState.HAVE_RESULTS ||
      categoriesToDisplay.length > 0);
  const {
    searchListId,
    optionIdPrefix,
    activeSuggestionIndex,
    activeSuggestionId,
    handleSearchKeyDown,
    resetHighlightedCategory,
  } = useRepCategoryNavigation({
    categories: categoriesToDisplay,
    enabled:
      showSearchDropdown && repSearchState === RepSearchState.HAVE_RESULTS,
    onSelect: onRepSelect,
  });

  const handleRepSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.value;
    setIsOpen(true);
    resetHighlightedCategory();
    selectionRequest.current++;
    amountFocusSource.current = null;
    setCheckingAvailability(false);
    setRepSearch(newValue);
    setError(null);
    if (newValue.trim() !== typedCategory) {
      setSelectedCategory(null);
      setAmountDraft((draft) =>
        draft?.scope === draftWithoutCategoryScope ? draft : null
      );
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ height: layoutHeight }}
      data-testid="grant-rep-layout"
      transition={transition}
      className="tw-flex tw-min-h-0 tw-max-w-full tw-flex-auto tw-flex-col tw-overflow-hidden"
    >
      <motion.div
        layoutScroll
        data-testid="grant-rep-body"
        className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-4 sm:tw-px-6"
      >
        <div ref={contentRef} data-testid="grant-rep-content">
          <GrantRepStats
            available={heroAvailableRep}
            assigned={overview?.authenticated_user_contribution ?? 0}
            profileName={profile.query ?? profile.handle ?? profile.display}
            overAllowance={overAllowance}
            id={availableRepId}
          />
          <form
            ref={listRef}
            onSubmit={onSearchSubmit}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setIsOpen(false);
            }}
            className="tw-relative tw-w-full"
          >
            <label htmlFor="search-rep" className="tw-sr-only">
              {t(locale, "rep.categories.grant.searchPlaceholder")}
            </label>
            <div className="tw-relative tw-w-full">
              <svg
                className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-1/2 tw-h-4 tw-w-4 -tw-translate-y-1/2 tw-text-iron-500"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                ref={searchInputRef}
                id="search-rep"
                name="search-rep"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSearchDropdown}
                aria-controls={showSearchDropdown ? searchListId : undefined}
                aria-activedescendant={activeSuggestionId}
                data-dialog-expand
                required
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={repSearch}
                disabled={mutating}
                onChange={handleRepSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (!selectedCategory) setIsOpen(true);
                }}
                aria-invalid={categorySelectionInvalid || !!typedCategoryError}
                aria-describedby={[
                  submissionGuidanceId,
                  categorySelectionInvalid && categoryErrorId,
                  typedCategoryError && typedCategoryErrorId,
                ]
                  .filter(Boolean)
                  .join(" ")}
                className={`${RATING_INPUT_SURFACE_CLASS} tw-block tw-h-[46px] tw-w-full tw-appearance-none tw-bg-iron-900 tw-py-3 tw-pl-11 tw-pr-10 tw-text-sm tw-font-normal tw-text-iron-100 tw-caret-primary-400 tw-ring-1 tw-transition-colors tw-duration-150 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-primary-400 motion-reduce:tw-transition-none`}
                placeholder={t(
                  locale,
                  "rep.categories.grant.searchPlaceholder"
                )}
              />
              {selectedCategory ? (
                <button
                  type="button"
                  disabled={mutating}
                  aria-label={t(locale, "rep.categories.grant.changeCategory")}
                  onClick={() => {
                    selectionRequest.current++;
                    amountFocusSource.current = null;
                    setSelectedCategory(null);
                    setRepSearch("");
                    setAmountDraft(null);
                    setError(null);
                    setIsOpen(true);
                    searchInputRef.current?.focus();
                  }}
                  className="tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-w-11 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                >
                  <XMarkIcon aria-hidden="true" className="tw-size-4" />
                </button>
              ) : (
                (checkingAvailability ||
                  (shouldCheckAvailability && availability.isFetching)) && (
                  <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
                    <CircleLoader />
                  </div>
                )
              )}
            </div>
            <GrantRepSubmissionGuidance
              id={submissionGuidanceId}
              selectedCategory={activeCategory}
              categoriesToDisplay={categoriesToDisplay}
              search={typedCategory}
            />
            {typedCategoryError && (
              <p
                id={typedCategoryErrorId}
                role="alert"
                className="tw-mb-0 tw-mt-2 tw-break-words tw-text-xs tw-leading-5 tw-text-error"
              >
                {typedCategoryError}
              </p>
            )}
            <AnimatePresence initial={false}>
              {showSearchDropdown && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transition}
                  className="tw-mt-2"
                >
                  <div
                    id={searchListId}
                    role="listbox"
                    aria-label={t(
                      locale,
                      "rep.categories.grant.searchPlaceholder"
                    )}
                    aria-busy={repSearchState === RepSearchState.LOADING}
                    className="tw-rounded-lg tw-bg-iron-900 tw-p-2 tw-ring-1 tw-ring-inset tw-ring-iron-800/60"
                  >
                    <UserPageRepNewRepSearchDropdown
                      categories={categoriesToDisplay}
                      state={repSearchState}
                      minSearchLength={SEARCH_LENGTH.MIN}
                      maxSearchLength={SEARCH_LENGTH.MAX}
                      onRepSelect={onRepSelect}
                      search={typedCategory}
                      activeIndex={activeSuggestionIndex}
                      optionIdPrefix={optionIdPrefix}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
          {!isError && (
            <GrantRepCategorySuggestions
              ratings={ratingStats}
              search={repSearch}
              selectedCategory={selectedCategory}
              disabled={mutating}
              onSelect={(category) => {
                void onRepSelect(category, true);
              }}
            />
          )}
          <motion.form
            layout={reducedMotion ? false : "position"}
            transition={transition}
            id={amountFormId}
            data-testid="grant-rep-amount"
            className={`tw-mt-6 ${showSearchDropdown ? "tw-hidden md:tw-block" : ""}`}
            onSubmit={(event) => {
              event.preventDefault();
              void onGrantRep();
            }}
          >
            <label
              htmlFor={amountInputId}
              className="tw-mb-1 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
            >
              {t(locale, "rep.categories.grant.amountLabel")}
            </label>
            <p
              id={`${amountInputId}-hint`}
              className="tw-mb-2 tw-mt-0 tw-text-xs tw-leading-5 tw-text-iron-500"
            >
              {t(locale, "user.rate.totalHelp")}
            </p>
            <UserPageRateInput
              inputRef={focusSelectedAmount}
              value={amountStr}
              onChange={setAmountStr}
              minMax={minMaxValues}
              isProxy={!!activeProfileProxy}
              clampOnBlur={false}
              variant="form"
              inputId={amountInputId}
              disabled={mutating}
              placeholder="0"
              descriptionId={`${availableRepId} ${amountInputId}-hint`}
              invalid={amountReady && !isValidValue}
            />
            {amountReady && (
              <output className="tw-block">
                <UserRateAdjustmentHelper
                  inLineValues
                  originalValue={currentRep}
                  adjustedValue={
                    isRatingValue(amountStr) ? amountNum : currentRep
                  }
                  adjustmentType="Rep"
                  valueLayout="inline"
                  variant="summary"
                />
              </output>
            )}
          </motion.form>

          {isError && (
            <div role="alert" className="tw-mt-3 tw-text-xs tw-text-iron-400">
              {t(locale, "rep.categories.edit.loadError")}{" "}
              <Button variant="ghost" size="sm" onClick={retry}>
                {t(locale, "rep.categories.edit.retry")}
              </Button>
            </div>
          )}
          {formError && (
            <div id={categoryErrorId} className="tw-mt-3 tw-pb-2">
              <UserPageRepNewRepError
                msg={formError.message}
                showDetails={formError.showDetails}
                closeError={() => setError(null)}
              />
            </div>
          )}
        </div>
      </motion.div>
      <div
        ref={footerRef}
        data-testid="grant-rep-footer"
        className="tw-shrink-0"
      >
        <div className="tw-flex tw-flex-col tw-gap-2 tw-px-4 tw-pt-4 sm:tw-px-6 md:tw-flex-row md:tw-justify-end md:tw-gap-3">
          {onCancel && (
            <Button
              onClick={onCancel}
              disabled={mutating}
              variant="ghost"
              size="md"
              className="tw-min-h-11 tw-w-full md:tw-w-auto"
            >
              {t(locale, "rep.categories.grant.actions.cancel")}
            </Button>
          )}
          <Button
            disabled={isGrantDisabled}
            type="submit"
            form={amountFormId}
            loading={mutating}
            variant="action"
            size="md"
            className="tw-min-h-11 tw-w-full md:tw-w-auto"
          >
            {t(
              locale,
              currentRep !== 0
                ? "rep.categories.edit.save"
                : "rep.categories.grant.actions.grant"
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
