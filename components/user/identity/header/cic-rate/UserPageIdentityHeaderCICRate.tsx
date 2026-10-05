"use client";

import type { FormEvent } from "react";
import { useContext, useEffect, useId, useRef, useState } from "react";
import type { ApiProfileRaterCicState } from "@/entities/IProfile";
import { getStringAsNumberOrZero } from "@/helpers/Helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { AuthContext } from "@/components/auth/Auth";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";

import UserRateAdjustmentHelper from "@/components/user/utils/rate/UserRateAdjustmentHelper";
import UserPageRateInput from "@/components/user/utils/rate/UserPageRateInput";
import Button from "@/components/utils/button/Button";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import UserPageIdentityHeaderCICRateStats from "./UserPageIdentityHeaderCICRateStats";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, tRich } from "@/i18n/messages";
import {
  USER_RATE_SAVE_BUTTON_CLASS_NAME,
  USER_RATE_CANCEL_BUTTON_CLASS_NAME,
} from "@/components/user/utils/rate/userRateStyles";

export default function UserPageIdentityHeaderCICRate({
  profile,
  isTooltip,
  onSuccess,
  onCancel,
}: {
  readonly profile: ApiIdentity;
  readonly isTooltip: boolean;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
}) {
  const locale = useBrowserLocale();
  const inputId = useId();
  const statsId = useId();
  const adjustmentId = useId();
  const { address } = useSeizeConnectContext();
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);

  const { onProfileCICModify } = useContext(ReactQueryWrapperContext);

  const { data: currentCICState } = useQuery<ApiProfileRaterCicState>({
    queryKey: [
      QueryKey.PROFILE_RATER_CIC_STATE,
      {
        handle: profile?.handle?.toLowerCase(),
        rater: activeProfileProxy?.created_by.handle ?? address?.toLowerCase(),
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileRaterCicState>({
        endpoint: `profiles/${profile.query}/cic/rating/${
          activeProfileProxy?.created_by.handle ?? address?.toLowerCase()
        }`,
      }),
    enabled: !!address,
    staleTime: 0,
  });

  const [mutating, setMutating] = useState(false);
  const submissionInFlight = useRef(false);

  const updateCICMutation = useMutation({
    mutationFn: async (amount: number) => {
      return await commonApiPost({
        endpoint: `profiles/${profile.query}/cic/rating`,
        body: {
          amount,
        },
      });
    },
    onSuccess: () => {
      setToast({
        message: t(locale, "user.rate.nic.updated"),
        type: "success",
      });
      onProfileCICModify({
        targetProfile: profile,
        connectedProfile: connectedProfile ?? null,
        rater:
          activeProfileProxy?.created_by.handle ??
          address?.toLowerCase() ??
          null,
        profileProxy: activeProfileProxy ?? null,
      });
      onSuccess?.();
    },
  });

  const getProxyAvailableCredit = (): number | null => {
    const repProxy = activeProfileProxy?.actions.find(
      (a) => a.action_type === ApiProfileProxyActionType.AllocateCic
    );
    if (!repProxy) {
      return null;
    }
    return Math.max(
      (repProxy.credit_amount ?? 0) - (repProxy.credit_spent ?? 0),
      0
    );
  };

  const [proxyAvailableCredit, setProxyAvailableCredit] = useState<
    number | null
  >(getProxyAvailableCredit());

  useEffect(
    () => setProxyAvailableCredit(getProxyAvailableCredit()),
    [activeProfileProxy]
  );

  const getMinValue = (): number => {
    const currentCic = currentCICState?.cic_rating_by_rater ?? 0;
    const heroAvailableCic =
      currentCICState?.cic_ratings_left_to_give_by_rater ?? 0;
    const minHeroCic = 0 - (Math.abs(currentCic) + heroAvailableCic);
    if (typeof proxyAvailableCredit !== "number") {
      return minHeroCic;
    }
    const minProxyRep = currentCic - proxyAvailableCredit;

    return Math.abs(minHeroCic) < Math.abs(minProxyRep)
      ? minHeroCic
      : minProxyRep;
  };

  const getMaxValue = (): number => {
    const currentCic = currentCICState?.cic_rating_by_rater ?? 0;
    const heroAvailableCic =
      currentCICState?.cic_ratings_left_to_give_by_rater ?? 0;
    const maxHeroCic = Math.abs(currentCic) + heroAvailableCic;
    if (typeof proxyAvailableCredit !== "number") {
      return maxHeroCic;
    }
    const maxProxyRep = currentCic + proxyAvailableCredit;

    return Math.min(maxHeroCic, maxProxyRep);
  };

  const getMinMaxValues = (): {
    readonly min: number;
    readonly max: number;
  } => ({
    min: getMinValue(),
    max: getMaxValue(),
  });

  const [minMaxValues, setMinMaxValues] = useState<{
    readonly min: number;
    readonly max: number;
  }>(getMinMaxValues());

  useEffect(
    () => setMinMaxValues(getMinMaxValues()),
    [currentCICState, proxyAvailableCredit]
  );

  const [originalRating, setOriginalRating] = useState<number>(
    currentCICState?.cic_rating_by_rater ?? 0
  );

  const [adjustedRatingStr, setAdjustedRatingStr] = useState<string>(
    `${originalRating}`
  );

  useEffect(() => {
    setOriginalRating(currentCICState?.cic_rating_by_rater ?? 0);
    setAdjustedRatingStr(`${currentCICState?.cic_rating_by_rater ?? 0}`);
  }, [currentCICState]);

  const newRating = getStringAsNumberOrZero(adjustedRatingStr);
  const haveChanged = newRating !== originalRating;
  const isProxy = !!activeProfileProxy;
  const isValidValue =
    /^-?\d+$/.test(adjustedRatingStr) &&
    (isProxy ||
      (newRating >= minMaxValues.min && newRating <= minMaxValues.max));
  const isSaveDisabled = !haveChanged || !isValidValue;

  const onSave = async () => {
    if (submissionInFlight.current || isSaveDisabled) return;
    submissionInFlight.current = true;
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
      await updateCICMutation.mutateAsync(newRating);
    } catch (error) {
      setToast({
        type: "error",
        title: t(locale, "user.rate.nic.updateFailed"),
        description: t(locale, "rep.categories.grant.toast.tryAgain"),
        details: getToastErrorDetails(error),
      });
    } finally {
      submissionInFlight.current = false;
      setMutating(false);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave();
  };

  const rateInput = (
    <div
      className={`tw-relative tw-mt-2 tw-flex tw-w-full ${isTooltip ? "sm:tw-max-w-48" : ""}`}
    >
      <UserPageRateInput
        value={adjustedRatingStr}
        onChange={setAdjustedRatingStr}
        minMax={minMaxValues}
        isProxy={isProxy}
        inputId={inputId}
        descriptionId={`${statsId} ${adjustmentId}`}
        required
      />
    </div>
  );

  const adjustmentHelper = (
    <UserRateAdjustmentHelper
      id={adjustmentId}
      inLineValues={true}
      originalValue={originalRating}
      adjustedValue={newRating}
      adjustmentType="NIC"
    />
  );

  const label = tRich(
    locale,
    isTooltip ? "user.rate.nic.tooltipLabel" : "user.rate.nic.label",
    {
      name: (
        <span key="profile" className="tw-break-words">
          {profile.query}
        </span>
      ),
    }
  );

  return (
    <div>
      <div id={statsId}>
        <UserPageIdentityHeaderCICRateStats
          isTooltip={isTooltip}
          profile={profile}
          minMaxValues={minMaxValues}
          heroAvailableCredit={
            currentCICState?.cic_ratings_left_to_give_by_rater ?? 0
          }
        />
      </div>
      <form onSubmit={onSubmit} className="tw-mt-5">
        {isTooltip ? (
          <>
            <div className="tw-flex tw-items-end tw-gap-3">
              <div className="tw-min-w-0 tw-flex-1">
                <label
                  htmlFor={inputId}
                  className="tw-block tw-text-sm tw-font-medium tw-text-iron-300"
                >
                  {label}
                </label>
                {rateInput}
              </div>
              <Button
                type="submit"
                disabled={isSaveDisabled}
                loading={mutating}
                size="lg"
                className={USER_RATE_SAVE_BUTTON_CLASS_NAME}
              >
                {t(locale, "user.rate.nic.rate")}
              </Button>
            </div>
            {adjustmentHelper}
          </>
        ) : (
          <>
            <label
              htmlFor={inputId}
              className="tw-block tw-text-sm tw-font-medium tw-text-iron-300"
            >
              {label}
            </label>
            {rateInput}
            {adjustmentHelper}
            <div className="tw-mt-6 tw-flex tw-flex-wrap tw-justify-end tw-gap-2">
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
                type="submit"
                disabled={isSaveDisabled}
                loading={mutating}
                size="lg"
                className={USER_RATE_SAVE_BUTTON_CLASS_NAME}
              >
                {t(locale, "user.rate.nic.rate")}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
