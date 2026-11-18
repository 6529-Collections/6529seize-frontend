"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import {
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { AnimatePresence, motion } from "framer-motion";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
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
import {
  formatNumberWithCommas,
  getStringAsNumberOrZero,
} from "@/helpers/Helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";
import { RATING_INPUT_SURFACE_CLASS } from "@/components/user/utils/rate/ratingInputStyles";
import UserRateAdjustmentHelper from "@/components/user/utils/rate/UserRateAdjustmentHelper";
import { useRepAllocation } from "@/hooks/useRepAllocation";
import {
  HELP_BOT_CREDIT_REP_CATEGORY,
  isHelpBotCreditRepCategory,
} from "@/components/utils/input/rep-category/repCategoryConstants";
import { getRepCategoryViolation } from "@/components/utils/input/rep-category/repCategoryValidation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import {
  isMemesNomineeLookalike,
  MEMES_NOMINEE_CATEGORY,
  MEMES_NOMINEE_REQUIRED_REP,
} from "@/helpers/waves/memes-nomination";
import { getGrantRepCategoriesToDisplay } from "./grantRepCategoryOptions";
import GrantRepCategorySuggestions from "./GrantRepCategorySuggestions";

import { isRatingValue } from "../ratingsManagement";

const SEARCH_LENGTH = {
  MIN: 3,
  MAX: 100,
};
const SUBMISSION_GUIDANCE_ID = "grant-rep-submission-guidance";
const getSearchLength = (value: string): number => Array.from(value).length;

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

function getSubmissionGuidanceContent(
  submissionHint: string,
  submissionLookalikeInfo: string | null,
  hasSelectedSubmissionCategory: boolean
): React.ReactNode {
  const submissionCategoryStart = submissionHint.indexOf(
    MEMES_NOMINEE_CATEGORY
  );
  if (submissionLookalikeInfo) {
    return submissionLookalikeInfo;
  }
  if (submissionCategoryStart >= 0) {
    return (
      <>
        {submissionHint.slice(0, submissionCategoryStart)}
        <span
          className={`tw-font-medium ${
            hasSelectedSubmissionCategory
              ? "tw-text-emerald-400"
              : "tw-text-iron-200"
          }`}
        >
          {MEMES_NOMINEE_CATEGORY}
        </span>
        {submissionHint.slice(
          submissionCategoryStart + MEMES_NOMINEE_CATEGORY.length
        )}
      </>
    );
  }
  return submissionHint;
}

function GrantRepStats({
  available,
  assigned,
  profileName,
  overAllowance,
  id,
}: {
  readonly available: number;
  readonly assigned: number;
  readonly profileName: string;
  readonly overAllowance: boolean;
  readonly id: string;
}) {
  const locale = useBrowserLocale();
  return (
    <dl className="tw-m-0 tw-mb-4 tw-space-y-2 tw-text-xs">
      <div
        id={id}
        className={`tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-4 tw-gap-y-1 ${overAllowance ? "tw-text-rose-400" : "tw-text-iron-400"}`}
      >
        <dt className="tw-font-normal">
          {t(locale, "rep.categories.grant.availableRepLabel")}
        </dt>
        <dd
          className={`tw-m-0 tw-ml-auto tw-whitespace-nowrap tw-font-medium ${overAllowance ? "tw-text-rose-400" : "tw-text-iron-100"}`}
        >
          {formatInteger(locale, available)}
        </dd>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-4 tw-gap-y-1">
        <dt className="tw-min-w-0 tw-break-words tw-font-normal tw-text-iron-400">
          {t(locale, "rep.categories.grant.assignedRepLabel", {
            name: profileName,
          })}
        </dt>
        <dd className="tw-m-0 tw-ml-auto tw-whitespace-nowrap tw-font-medium tw-text-iron-100">
          {formatInteger(locale, assigned)}
        </dd>
      </div>
    </dl>
  );
}

function GrantRepSubmissionGuidance({
  selectedCategory,
  categoriesToDisplay,
}: {
  readonly selectedCategory: string | null;
  readonly categoriesToDisplay: readonly string[];
}) {
  const locale = useBrowserLocale();
  const hasSelectedSubmissionCategory =
    selectedCategory === MEMES_NOMINEE_CATEGORY;
  const selectedNonQualifyingLookalike =
    selectedCategory && isMemesNomineeLookalike(selectedCategory)
      ? selectedCategory
      : null;
  const showSubmissionSearchHint =
    !selectedCategory && categoriesToDisplay.includes(MEMES_NOMINEE_CATEGORY);
  const showSubmissionGuidance =
    hasSelectedSubmissionCategory ||
    !!selectedNonQualifyingLookalike ||
    showSubmissionSearchHint;
  const submissionHint = t(locale, "rep.categories.grant.submissionHint", {
    category: MEMES_NOMINEE_CATEGORY,
    amount: formatNumberWithCommas(MEMES_NOMINEE_REQUIRED_REP),
  });
  const submissionLookalikeInfo = selectedNonQualifyingLookalike
    ? t(locale, "rep.categories.grant.submissionLookalikeInfo", {
        category: selectedNonQualifyingLookalike,
        submissionCategory: MEMES_NOMINEE_CATEGORY,
      })
    : null;
  const submissionGuidanceContent = getSubmissionGuidanceContent(
    submissionHint,
    submissionLookalikeInfo,
    hasSelectedSubmissionCategory
  );

  return (
    <output
      id={SUBMISSION_GUIDANCE_ID}
      hidden={!showSubmissionGuidance}
      className={`tw-mb-0 tw-mt-2 tw-items-start tw-gap-1.5 tw-text-xs tw-font-normal tw-leading-5 ${showSubmissionGuidance ? "tw-flex" : "tw-hidden"} ${
        selectedNonQualifyingLookalike
          ? "tw-text-amber-300"
          : "tw-text-iron-400"
      }`}
    >
      {selectedNonQualifyingLookalike && (
        <InformationCircleIcon
          aria-hidden="true"
          className="tw-mt-0.5 tw-h-3.5 tw-w-3.5 tw-flex-shrink-0"
        />
      )}
      <span>{showSubmissionGuidance ? submissionGuidanceContent : null}</span>
    </output>
  );
}

export default function UserPageRepNewRepSearch({
  overview,
  profile,
  onSuccess,
  onCancel,
}: {
  readonly overview: ApiRepOverview | null;
  readonly profile: ApiIdentity;
  readonly onSuccess?: (() => void) | undefined;
  readonly onCancel?: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  const amountInputId = useId();
  const amountFormId = useId();
  const availableRepId = useId();
  const categoryErrorId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectionRequest = useRef(0);
  const { onProfileRepModify } = useContext(ReactQueryWrapperContext);
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);
  const helpBotCreditRepCategoryError = t(
    locale,
    "rep.categories.helpBotReserved.error",
    { category: HELP_BOT_CREDIT_REP_CATEGORY }
  );

  const [repSearch, setRepSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [amountDraft, setAmountDraft] = useState<{
    readonly scope: string;
    readonly value: string;
  } | null>(null);
  const [mutating, setMutating] = useState<boolean>(false);

  const [formError, setError] = useState<{
    readonly message: string;
    readonly field: "category" | "save";
    readonly showDetails: boolean;
  } | null>(null);
  const categoryInvalid = formError?.field === "category";

  const [debouncedValue, setDebouncedValue] = useState<string>("");
  useDebounce(
    () => {
      setDebouncedValue(repSearch);
    },
    500,
    [repSearch]
  );

  const debouncedSearchLength = getSearchLength(debouncedValue);
  const matchingSearchLength =
    debouncedSearchLength >= SEARCH_LENGTH.MIN &&
    debouncedSearchLength <= SEARCH_LENGTH.MAX;

  const { isFetching, data: categories } = useQuery<string[]>({
    queryKey: [QueryKey.REP_CATEGORIES_SEARCH, debouncedValue],
    queryFn: async () =>
      await commonApiFetch<string[]>({
        endpoint: "/rep/categories",
        params: {
          param: debouncedValue,
        },
      }),
    enabled:
      matchingSearchLength && repSearch === debouncedValue && !selectedCategory,
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
    category: selectedCategory,
  });

  const amountContext = [
    profile.id ?? profile.query ?? profile.display,
    connectedProfile?.id,
    activeProfileProxy?.id,
  ].join(":");
  const amountScope = [amountContext, selectedCategory].join(":");
  const savedAmount = selectedCategory
    ? String(repState?.rater_contribution ?? 0)
    : "";
  const amountStr =
    amountDraft?.scope === amountScope ? amountDraft.value : savedAmount;
  const setAmountStr = (value: string) =>
    setAmountDraft({ scope: amountScope, value });

  const amountNum = getStringAsNumberOrZero(amountStr);
  const isValidValue =
    isRatingValue(amountStr) &&
    (!!activeProfileProxy ||
      (amountNum >= minMaxValues.min && amountNum <= minMaxValues.max));

  const currentRep = repState?.rater_contribution ?? 0;
  const amountReady = selectedCategory !== null && repState !== null;
  const focusSelectedAmount = useCallback(
    (input: HTMLInputElement | null) => {
      if (selectedCategory && amountReady)
        input?.focus({ preventScroll: true });
    },
    [selectedCategory, amountReady]
  );
  const haveChanged = amountNum !== currentRep;
  const overAllowance =
    selectedCategory !== null && isRatingValue(amountStr) && !isValidValue;
  const isGrantDisabled =
    !selectedCategory ||
    isError ||
    !repState ||
    !amountStr ||
    !haveChanged ||
    !isValidValue ||
    mutating;

  // --- End derived rep state ---

  const [isOpen, setIsOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const showHelpBotCreditRepCategoryError = () => {
    setError({
      message: helpBotCreditRepCategoryError,
      field: "category",
      showDetails: false,
    });
  };

  const onRepSelect = async (rep: string, knownCategory = false) => {
    if (mutating || selectedCategory === rep) return;
    const request = ++selectionRequest.current;
    if (isHelpBotCreditRepCategory(rep)) {
      showHelpBotCreditRepCategoryError();
      return;
    }
    // Mirror the server's category rules locally so the user sees the exact
    // broken rule, localized and instantly, instead of a server error blob.
    // Runs before the search-length guard below so the over-length and
    // leading-dash messages actually reach the user.
    const violation = getRepCategoryViolation(rep);
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
    if (!knownCategory && getSearchLength(rep) < SEARCH_LENGTH.MIN) {
      setError({
        message: t(locale, "rep.categories.validation.tooShort", {
          min: SEARCH_LENGTH.MIN,
        }),
        field: "category",
        showDetails: false,
      });
      return;
    }
    setCheckingAvailability(!knownCategory);
    try {
      if (!knownCategory)
        await commonApiFetch<boolean>({
          endpoint: "/rep/categories/availability",
          params: {
            param: rep,
          },
        });
      if (request !== selectionRequest.current) return;
      setSelectedCategory(rep);
      setRepSearch(rep);
      setAmountDraft((draft) =>
        !selectedCategory && draft?.scope === amountScope && draft.value
          ? { scope: [amountContext, rep].join(":"), value: draft.value }
          : null
      );
      setError(null);
      setIsOpen(false);
    } catch (error: unknown) {
      if (request !== selectionRequest.current) return;
      setError({
        message: getErrorMessage(
          error,
          t(locale, "rep.categories.grant.errors.generic")
        ),
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
          getErrorMessage(
            error,
            t(locale, "rep.categories.grant.errors.generic")
          )
        ),
      });
    },
  });

  const onGrantRep = async () => {
    if (isGrantDisabled || !selectedCategory || !profile.query) return;
    if (isHelpBotCreditRepCategory(selectedCategory)) {
      showHelpBotCreditRepCategoryError();
      return;
    }
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
      await addRepMutation.mutateAsync({ amount, category: selectedCategory });
    } catch (error: unknown) {
      setError({
        message: getErrorMessage(
          error,
          t(locale, "rep.categories.grant.errors.generic")
        ),
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
      search: debouncedValue,
      categories: categories ?? [],
      includeTypedCategory: matchingSearchLength,
    });
  }, [debouncedValue, categories, matchingSearchLength]);

  const repSearchState = useMemo(() => {
    const searchLength = getSearchLength(repSearch);
    if (searchLength < SEARCH_LENGTH.MIN)
      return RepSearchState.MIN_LENGTH_ERROR;
    if (searchLength > SEARCH_LENGTH.MAX)
      return RepSearchState.MAX_LENGTH_ERROR;
    if (repSearch !== debouncedValue || isFetching)
      return RepSearchState.LOADING;
    return RepSearchState.HAVE_RESULTS;
  }, [debouncedValue, isFetching, repSearch]);

  const handleRepSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.value;
    setIsOpen(true);
    selectionRequest.current++;
    setCheckingAvailability(false);
    setRepSearch(newValue);
    setError(null);
    if (selectedCategory && newValue !== selectedCategory) {
      setSelectedCategory(null);
      setAmountDraft(null);
    }
  };

  return (
    <div className="tw-flex tw-h-[440px] tw-max-h-[calc(100dvh-12rem)] tw-min-h-0 tw-max-w-full tw-flex-col md:tw-h-[392px]">
      <div
        ref={listRef}
        className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-4 sm:tw-px-6"
      >
        <GrantRepStats
          available={heroAvailableRep}
          assigned={overview?.authenticated_user_contribution ?? 0}
          profileName={profile.query ?? profile.handle ?? profile.display}
          overAllowance={overAllowance}
          id={availableRepId}
        />
        <form onSubmit={onSearchSubmit} className="tw-relative tw-w-full">
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
              required
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={repSearch}
              readOnly={!!selectedCategory}
              disabled={mutating}
              onChange={handleRepSearchChange}
              onFocus={() => {
                if (!selectedCategory) setIsOpen(true);
              }}
              aria-invalid={categoryInvalid}
              aria-describedby={
                categoryInvalid
                  ? `${SUBMISSION_GUIDANCE_ID} ${categoryErrorId}`
                  : SUBMISSION_GUIDANCE_ID
              }
              className={`${RATING_INPUT_SURFACE_CLASS} tw-block tw-h-[46px] tw-w-full tw-appearance-none tw-bg-iron-900 tw-py-3 tw-pl-11 tw-pr-10 tw-text-sm tw-font-normal tw-text-iron-100 tw-caret-primary-400 tw-transition-colors tw-duration-150 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-primary-400 motion-reduce:tw-transition-none`}
              placeholder={t(locale, "rep.categories.grant.searchPlaceholder")}
            />
            {selectedCategory ? (
              <button
                type="button"
                disabled={mutating}
                aria-label={t(locale, "rep.categories.grant.changeCategory")}
                onClick={() => {
                  selectionRequest.current++;
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
              checkingAvailability && (
                <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
                  <CircleLoader />
                </div>
              )
            )}
          </div>
          <AnimatePresence initial={false}>
            {isOpen && !selectedCategory && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="tw-absolute tw-left-0 tw-right-0 tw-top-full tw-z-20 tw-mt-2 tw-will-change-transform"
              >
                <div className="tw-max-h-48 tw-overflow-y-auto tw-rounded-lg tw-bg-iron-900 tw-p-2 tw-ring-1 tw-ring-inset tw-ring-iron-800/60">
                  <UserPageRepNewRepSearchDropdown
                    categories={categoriesToDisplay}
                    state={repSearchState}
                    minSearchLength={SEARCH_LENGTH.MIN}
                    maxSearchLength={SEARCH_LENGTH.MAX}
                    onRepSelect={onRepSelect}
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
        <form
          id={amountFormId}
          className="tw-mt-4"
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
            invalid={selectedCategory !== null && !isValidValue}
          />
          <div
            role="status"
            aria-hidden={!selectedCategory}
            className={!selectedCategory ? "tw-invisible" : undefined}
          >
            <UserRateAdjustmentHelper
              inLineValues
              originalValue={currentRep}
              adjustedValue={isRatingValue(amountStr) ? amountNum : currentRep}
              adjustmentType="Rep"
              valueLayout="inline"
              variant="summary"
            />
          </div>
        </form>
        <GrantRepSubmissionGuidance
          selectedCategory={selectedCategory}
          categoriesToDisplay={categoriesToDisplay}
        />

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
      <div className="tw-flex tw-shrink-0 tw-flex-col tw-gap-2 tw-px-4 tw-pt-4 sm:tw-px-6 md:tw-flex-row md:tw-justify-end md:tw-gap-3">
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
  );
}
