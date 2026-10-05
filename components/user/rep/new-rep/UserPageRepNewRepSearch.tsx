"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
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
import UserRateAdjustmentHelper from "@/components/user/utils/rate/UserRateAdjustmentHelper";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";
import { useRepAllocation } from "@/hooks/useRepAllocation";
import {
  HELP_BOT_CREDIT_REP_CATEGORY,
  isHelpBotCreditRepCategory,
} from "@/components/utils/input/rep-category/repCategoryConstants";
import { getRepCategoryViolation } from "@/components/utils/input/rep-category/repCategoryValidation";
import { formatNumber } from "@/i18n/format";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, tRich } from "@/i18n/messages";
import {
  USER_RATE_FIELD_CLASS_NAME,
  USER_RATE_SAVE_BUTTON_CLASS_NAME,
  USER_RATE_CANCEL_BUTTON_CLASS_NAME,
} from "@/components/user/utils/rate/userRateStyles";
import {
  isMemesNomineeLookalike,
  MEMES_NOMINEE_CATEGORY,
  MEMES_NOMINEE_REQUIRED_REP,
} from "@/helpers/waves/memes-nomination";
import { getGrantRepCategoriesToDisplay } from "./grantRepCategoryOptions";

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
  const amountInputRef = useRef<HTMLInputElement>(null);
  const statsId = useId();
  const adjustmentId = useId();
  const reduceMotion = useReducedMotion();
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
  const [amountStr, setAmountStr] = useState<string>("0");
  const [mutating, setMutating] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(true);

  const [debouncedValue, setDebouncedValue] = useState<string>("");
  useDebounce(
    () => {
      setDebouncedValue(repSearch);
      setErrorMsg(null);
      setShowErrorDetails(true);
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
    enabled: matchingSearchLength,
  });

  const { repState, heroAvailableRep, minMaxValues } = useRepAllocation({
    profile,
    category: selectedCategory,
  });

  useEffect(() => {
    if (repState) {
      setAmountStr(`${repState.rater_contribution}`);
    }
  }, [repState]);

  const amountNum = getStringAsNumberOrZero(amountStr);
  const isValidValue =
    /^-?\d+$/.test(amountStr) &&
    (!!activeProfileProxy ||
      (amountNum >= minMaxValues.min && amountNum <= minMaxValues.max));

  const newRating = getStringAsNumberOrZero(amountStr);
  const haveChanged = newRating !== (repState?.rater_contribution ?? 0);

  // --- End derived rep state ---

  const [isOpen, setIsOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const showHelpBotCreditRepCategoryError = () => {
    setErrorMsg(helpBotCreditRepCategoryError);
    setShowErrorDetails(false);
  };

  const onRepSelect = async (rep: string) => {
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
      setErrorMsg(t(locale, violation.key, { ...violation.params }));
      setShowErrorDetails(false);
      return;
    }
    // Search-specific minimum (below the server's 1-char floor): surface it
    // instead of silently dropping the input. Count code points to stay
    // consistent with the validator's length semantics.
    if (getSearchLength(rep) < SEARCH_LENGTH.MIN) {
      setErrorMsg(
        t(locale, "rep.categories.validation.tooShort", {
          min: SEARCH_LENGTH.MIN,
        })
      );
      setShowErrorDetails(false);
      return;
    }
    if (checkingAvailability) return;
    setCheckingAvailability(true);
    try {
      await commonApiFetch<boolean>({
        endpoint: "/rep/categories/availability",
        params: {
          param: rep,
        },
      });
      setSelectedCategory(rep);
      setRepSearch(rep);
      setErrorMsg(null);
      setShowErrorDetails(true);
      setIsOpen(false);
      amountInputRef.current?.focus();
    } catch (error: unknown) {
      setErrorMsg(
        getErrorMessage(error, t(locale, "rep.categories.grant.errors.generic"))
      );
      setShowErrorDetails(true);
    } finally {
      setCheckingAvailability(false);
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
    onSuccess: () => {
      setToast({
        message: t(locale, "rep.categories.grant.toast.updated"),
        type: "success",
      });
      onProfileRepModify({
        targetProfile: profile,
        connectedProfile,
        profileProxy: activeProfileProxy ?? null,
      });
      setSelectedCategory(null);
      setRepSearch("");
      setAmountStr("0");
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
    if (
      mutating ||
      !selectedCategory ||
      !amountStr ||
      !profile.query ||
      !isValidValue
    )
      return;
    if (isHelpBotCreditRepCategory(selectedCategory)) {
      showHelpBotCreditRepCategoryError();
      return;
    }
    const amount = Number.parseInt(amountStr, 10);
    if (Number.isNaN(amount)) return;
    if (!haveChanged) return;
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
    } finally {
      setMutating(false);
    }
  };

  const onSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    amount: formatNumber(locale, MEMES_NOMINEE_REQUIRED_REP),
  });
  const submissionLookalikeInfo = selectedNonQualifyingLookalike
    ? t(locale, "rep.categories.grant.submissionLookalikeInfo", {
        category: selectedNonQualifyingLookalike,
        submissionCategory: MEMES_NOMINEE_CATEGORY,
      })
    : null;
  const submissionCategoryStart = submissionHint.indexOf(
    MEMES_NOMINEE_CATEGORY
  );
  let submissionGuidanceContent: React.ReactNode = submissionHint;
  if (submissionLookalikeInfo) {
    submissionGuidanceContent = submissionLookalikeInfo;
  } else if (submissionCategoryStart >= 0) {
    submissionGuidanceContent = (
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
    setRepSearch(newValue);
    if (selectedCategory && newValue !== selectedCategory) {
      setSelectedCategory(null);
      setAmountStr("");
    }
  };

  const isGrantDisabled =
    !selectedCategory ||
    !amountStr ||
    !haveChanged ||
    !isValidValue ||
    mutating;

  return (
    <div className="tw-relative tw-max-w-full">
      <div className="tw-w-full">
        <div className="tw-w-full">
          <div ref={listRef} className="tw-w-full">
            <div className="tw-relative tw-w-full tw-bg-iron-950">
              <div
                id={statsId}
                className="tw-space-y-1.5 tw-px-4 tw-text-sm tw-leading-5 tw-text-iron-400 sm:tw-px-6"
              >
                <div>
                  {tRich(locale, "rep.categories.grant.availableRep", {
                    amount: (
                      <span
                        key="available"
                        className="tw-font-semibold tw-tabular-nums tw-text-iron-100"
                      >
                        {formatNumber(locale, heroAvailableRep)}
                      </span>
                    ),
                  })}
                </div>
                <div className="tw-break-words">
                  {tRich(locale, "rep.categories.grant.assignedRep", {
                    name: profile.query ?? "",
                    amount: (
                      <span
                        key="assigned"
                        className="tw-font-semibold tw-tabular-nums tw-text-iron-100"
                      >
                        {formatNumber(
                          locale,
                          overview?.authenticated_user_contribution ?? 0
                        )}
                      </span>
                    ),
                  })}
                </div>
              </div>
              <div className="tw-mt-5 tw-flex tw-flex-col tw-items-stretch tw-gap-5 tw-px-4 sm:tw-px-6">
                <form
                  onSubmit={onSearchSubmit}
                  className="tw-relative tw-w-full"
                >
                  <label
                    htmlFor="search-rep"
                    className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-300"
                  >
                    {t(locale, "rep.categories.grant.searchPlaceholder")}
                  </label>
                  <div className="tw-relative tw-w-full">
                    <svg
                      className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-4 tw-h-4 tw-w-4 tw-text-iron-400"
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
                      id="search-rep"
                      name="search-rep"
                      type="text"
                      required
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={repSearch}
                      onChange={handleRepSearchChange}
                      onFocus={() => setIsOpen(true)}
                      aria-describedby={
                        showSubmissionGuidance
                          ? SUBMISSION_GUIDANCE_ID
                          : undefined
                      }
                      className={`${USER_RATE_FIELD_CLASS_NAME} !tw-pl-9 !tw-pr-10`}
                      placeholder={t(
                        locale,
                        "rep.categories.grant.searchPlaceholder"
                      )}
                    />
                    {checkingAvailability && (
                      <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
                        <CircleLoader />
                      </div>
                    )}
                  </div>
                  {showSubmissionGuidance && (
                    <output
                      id={SUBMISSION_GUIDANCE_ID}
                      className={`tw-mb-0 tw-mt-2 tw-flex tw-items-start tw-gap-1.5 tw-px-1 tw-text-xs tw-font-normal tw-leading-relaxed ${
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
                      <span>{submissionGuidanceContent}</span>
                    </output>
                  )}
                  <AnimatePresence initial={false}>
                    {isOpen && !selectedCategory && (
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={
                          reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }
                        }
                        transition={{
                          duration: reduceMotion ? 0 : 0.15,
                          ease: "easeOut",
                        }}
                        className="tw-mt-2"
                      >
                        <div className="tw-rounded-lg tw-bg-iron-900 tw-p-2">
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
                <div>
                  <label
                    htmlFor={amountInputId}
                    className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-300"
                  >
                    {t(locale, "rep.categories.grant.amountLabel")}
                  </label>
                  <div className="tw-relative tw-flex tw-w-full">
                    <UserPageRateInput
                      value={amountStr}
                      onChange={setAmountStr}
                      minMax={minMaxValues}
                      isProxy={!!activeProfileProxy}
                      inputId={amountInputId}
                      inputRef={amountInputRef}
                      descriptionId={
                        selectedCategory
                          ? `${statsId} ${adjustmentId}`
                          : statsId
                      }
                    />
                  </div>
                  {selectedCategory && (
                    <UserRateAdjustmentHelper
                      id={adjustmentId}
                      inLineValues={true}
                      originalValue={repState?.rater_contribution ?? 0}
                      adjustedValue={newRating}
                      adjustmentType="Rep"
                    />
                  )}
                </div>
              </div>
              <div className="tw-mt-6 tw-flex tw-flex-wrap tw-justify-end tw-gap-2 tw-px-4 sm:tw-px-6">
                {onCancel && (
                  <Button
                    onClick={onCancel}
                    disabled={mutating}
                    variant="secondary"
                    size="lg"
                    className={USER_RATE_CANCEL_BUTTON_CLASS_NAME}
                  >
                    {t(locale, "rep.categories.grant.actions.cancel")}
                  </Button>
                )}
                <Button
                  disabled={isGrantDisabled}
                  onClick={onGrantRep}
                  loading={mutating}
                  size="lg"
                  className={USER_RATE_SAVE_BUTTON_CLASS_NAME}
                >
                  {t(locale, "rep.categories.grant.actions.grant")}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {!!errorMsg && (
            <div className="tw-mt-3 tw-px-4 tw-pb-4 sm:tw-px-6">
              <UserPageRepNewRepError
                msg={errorMsg}
                showDetails={showErrorDetails}
                closeError={() => {
                  setErrorMsg(null);
                  setShowErrorDetails(true);
                }}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
