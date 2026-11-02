"use client";

import { AuthContext } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";
import UserRateAdjustmentHelper from "@/components/user/utils/rate/UserRateAdjustmentHelper";
import Button from "@/components/utils/button/Button";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getStringAsNumberOrZero } from "@/helpers/Helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useRepAllocation } from "@/hooks/useRepAllocation";
import { t, tRich } from "@/i18n/messages";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useContext, useId, useState } from "react";
import UserPageRepModifyModalRaterStats from "./UserPageRepModifyModalRaterStats";

interface ApiAddRepRatingToProfileRequest {
  readonly amount: number;
  readonly category: string;
}

export default function UserPageRepModifyModal({
  onClose,
  profile,
  category,
}: {
  readonly onClose: () => void;
  readonly profile: ApiIdentity;
  readonly category: string;
}) {
  const locale = useBrowserLocale();
  const inputId = useId();
  const { onProfileRepModify } = useContext(ReactQueryWrapperContext);
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);
  const {
    repState,
    heroAvailableRep,
    minMaxValues,
    isError,
    isFetching,
    retry,
  } = useRepAllocation({ profile, category });

  // The caller removes this component after the shared dialog finishes leaving.
  const [isOpen, setIsOpen] = useState(true);
  const close = () => setIsOpen(false);
  const [draftRating, setDraftRating] = useState<string | null>(null);
  const adjustedRatingStr =
    draftRating ?? `${repState?.rater_contribution ?? 0}`;
  const newRating = getStringAsNumberOrZero(adjustedRatingStr);
  const haveChanged = newRating !== repState?.rater_contribution;
  const isValidValue =
    !!activeProfileProxy ||
    (newRating >= minMaxValues.min && newRating <= minMaxValues.max);
  const isUnavailable = !repState || isError;
  const isSaveDisabled = isUnavailable || !haveChanged || !isValidValue;
  const [mutating, setMutating] = useState(false);

  const addRepMutation = useMutation({
    mutationFn: async (body: ApiAddRepRatingToProfileRequest) =>
      await commonApiPost<ApiAddRepRatingToProfileRequest, void>({
        endpoint: `profiles/${profile.query ?? profile.handle ?? profile.display}/rep/rating`,
        body,
      }),
    onSuccess: () => {
      setToast({
        message: t(locale, "rep.categories.edit.updated"),
        type: "success",
      });
      onProfileRepModify({
        targetProfile: profile,
        connectedProfile,
        profileProxy: activeProfileProxy ?? null,
      });
      close();
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "rep.categories.edit.updateError"),
        description: t(locale, "rep.categories.edit.tryAgain"),
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => setMutating(false),
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutating || isSaveDisabled) return;
    setMutating(true);
    try {
      const { success } = await requestAuth();
      if (!success) {
        setToast({
          message: t(locale, "rep.categories.edit.loginRequired"),
          type: "error",
        });
        setMutating(false);
        return;
      }
      addRepMutation.mutate({ amount: newRating, category });
    } catch (error) {
      setToast({
        type: "error",
        title: t(locale, "rep.categories.edit.updateError"),
        description: t(locale, "rep.categories.edit.tryAgain"),
        details: getToastErrorDetails(error),
      });
      setMutating(false);
    }
  };

  return (
    <MobileWrapperDialog
      title={t(locale, "rep.categories.edit.title", {
        name: profile.query ?? profile.handle ?? profile.display,
      })}
      isOpen={isOpen}
      onClose={close}
      onAfterLeave={onClose}
      tabletModal
      maxWidthClass="md:tw-max-w-md"
      headerVariant="minimal"
    >
      <div className="tw-px-4 sm:tw-px-6">
        <div className="tw-relative tw-mt-5 tw-grid tw-min-h-10">
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
                {t(locale, "rep.categories.edit.loadError")}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={retry}
                loading={isFetching}
              >
                {t(locale, "rep.categories.edit.retry")}
              </Button>
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
            className="tw-block tw-break-words tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400"
          >
            {tRich(locale, "rep.categories.edit.totalLabel", {
              category: (
                <span
                  key="category"
                  className="tw-font-semibold tw-text-iron-300"
                >
                  {category}
                </span>
              ),
            })}
          </label>
          <div className="tw-relative tw-mt-2 tw-flex">
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
            />
          </div>
          <div className="tw-mt-7 tw-flex tw-flex-col tw-gap-1">
            <Button
              type="submit"
              disabled={isSaveDisabled}
              loading={mutating}
              variant="action"
              size="xl"
              fullWidth
            >
              {t(locale, "rep.categories.edit.save")}
            </Button>
            <Button
              onClick={close}
              disabled={mutating}
              variant="ghost"
              size="lg"
              fullWidth
            >
              {t(locale, "rep.categories.edit.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </MobileWrapperDialog>
  );
}
