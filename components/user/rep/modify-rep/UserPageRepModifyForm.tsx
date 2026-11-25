"use client";

import { AuthContext } from "@/components/auth/Auth";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";
import UserRateAdjustmentHelper from "@/components/user/utils/rate/UserRateAdjustmentHelper";
import Button from "@/components/utils/button/Button";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getStringAsNumberOrZero } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { chainRatingBlockedText } from "@/components/chain-identity/chainErrorMessage";
import ChainRatingNote from "@/components/chain-identity/ChainRatingNote";
import { useRepAllocation } from "@/hooks/useRepAllocation";
import { t, tRich } from "@/i18n/messages";
import { useContext, useEffect, useId, useState } from "react";
import UserPageRepModifyModalRaterStats from "./UserPageRepModifyModalRaterStats";
import { isRatingValue } from "../ratingsManagement";

import { useRepRatingSave } from "./useRepRatingSave";

export default function UserPageRepModifyForm({
  onCancel,
  onSuccess,
  onBusyChange,
  profile,
  category,
}: {
  readonly onCancel: () => void;
  readonly onSuccess: () => void;
  readonly onBusyChange?: (busy: boolean) => void;
  readonly profile: ApiIdentity;
  readonly category: string;
}) {
  const locale = useBrowserLocale();
  const inputId = useId();
  const { activeProfileProxy } = useContext(AuthContext);
  const { save, isSaving: mutating } = useRepRatingSave();
  useEffect(() => {
    onBusyChange?.(mutating);
    return () => onBusyChange?.(false);
  }, [mutating, onBusyChange]);
  const {
    repState,
    heroAvailableRep,
    minMaxValues,
    isError,
    chainError,
    isFetching,
    retry,
  } = useRepAllocation({ profile, category });
  const blocked = chainRatingBlockedText(locale, chainError);

  const [draftRating, setDraftRating] = useState<string | null>(null);
  const adjustedRatingStr =
    draftRating ?? `${repState?.rater_contribution ?? 0}`;
  const newRating = getStringAsNumberOrZero(adjustedRatingStr);
  const haveChanged = newRating !== repState?.rater_contribution;
  const isValidValue =
    isRatingValue(adjustedRatingStr) &&
    (!!activeProfileProxy ||
      (newRating >= minMaxValues.min && newRating <= minMaxValues.max));
  const isUnavailable = !repState || isError;
  const isSaveDisabled = isUnavailable || !haveChanged || !isValidValue;
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutating || isSaveDisabled) return;
    if (await save([{ profile, amount: newRating, category }])) onSuccess();
  };

  return (
    <div className="tw-px-4 sm:tw-px-6">
      <div className="tw-relative tw-mt-3 tw-grid tw-min-h-10 md:tw-mt-5">
        <div
          className={isError ? "tw-invisible" : undefined}
          aria-hidden={isError}
        >
          <UserPageRepModifyModalRaterStats
            category={category}
            minMaxValues={minMaxValues}
            heroAvailableCredit={heroAvailableRep}
            isLoading={!repState}
          />
          <ChainRatingNote />
        </div>
        {!repState && !isError && (
          <output className="tw-sr-only">
            {t(locale, "rep.categories.edit.loading")}
          </output>
        )}
        {isError && (
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-gap-3">
            <p
              role="alert"
              className="tw-m-0 tw-min-w-0 tw-flex-1 tw-text-xs tw-text-iron-300"
            >
              {blocked ?? t(locale, "rep.categories.edit.loadError")}
            </p>
            {blocked === null && (
              <Button
                variant="secondary"
                size="sm"
                onClick={retry}
                loading={isFetching}
              >
                {t(locale, "rep.categories.edit.retry")}
              </Button>
            )}
          </div>
        )}
      </div>
      <form
        onSubmit={onSubmit}
        className="tw-mt-6"
        aria-busy={!repState && !isError}
      >
        <label
          htmlFor={inputId}
          className="tw-mb-1 tw-block tw-break-words tw-text-sm tw-font-medium tw-text-iron-200"
        >
          {tRich(locale, "rep.categories.edit.totalLabel", {
            category: <span key="category">{category}</span>,
          })}
        </label>
        <p className="tw-mb-2 tw-mt-0 tw-text-xs tw-leading-5 tw-text-iron-500">
          {t(locale, "user.rate.totalHelp")}
        </p>
        <div className="tw-relative tw-flex">
          <UserPageRateInput
            value={repState ? adjustedRatingStr : ""}
            onChange={setDraftRating}
            minMax={minMaxValues}
            isProxy={!!activeProfileProxy}
            variant="form"
            inputId={inputId}
            readOnly={isUnavailable}
            autoFocus
            required
          />
        </div>
        <div
          className={!repState ? "tw-invisible" : undefined}
          aria-hidden={!repState}
        >
          <UserRateAdjustmentHelper
            inLineValues
            valueLayout="inline"
            originalValue={repState?.rater_contribution ?? 0}
            adjustedValue={newRating}
            adjustmentType="Rep"
            variant="summary"
          />
        </div>
        <div className="tw-mt-7 tw-flex tw-flex-col tw-gap-2 md:tw-flex-row md:tw-justify-end md:tw-gap-3">
          <Button
            onClick={onCancel}
            disabled={mutating}
            variant="ghost"
            size="md"
            className="tw-min-h-11 tw-w-full md:tw-w-auto"
          >
            {t(locale, "rep.categories.edit.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isSaveDisabled}
            loading={mutating}
            variant="action"
            size="md"
            className="tw-min-h-11 tw-w-full md:tw-w-auto"
          >
            {t(locale, "rep.categories.edit.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
