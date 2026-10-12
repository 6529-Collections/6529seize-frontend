"use client";

import type { FormEvent } from "react";
import { useContext, useEffect, useState } from "react";
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

const CIC_FOCUS_RING_CLASS_NAME = "focus:tw-ring-primary-400";

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

  const [mutating, setMutating] = useState<boolean>(false);

  const updateCICMutation = useMutation({
    mutationFn: async (amount: number) => {
      setMutating(true);
      return await commonApiPost({
        endpoint: `profiles/${profile.query}/cic/rating`,
        body: {
          amount,
        },
      });
    },
    onSuccess: () => {
      setToast({
        message: "NIC rating updated.",
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
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't update this NIC rating.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => {
      setMutating(false);
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
    isProxy || (newRating >= minMaxValues.min && newRating <= minMaxValues.max);
  const isSaveDisabled = !haveChanged || !isValidValue;

  const onSave = async () => {
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        message: "Log in to continue.",
        type: "error",
      });
      return;
    }
    if (!haveChanged || !isValidValue) {
      return;
    }

    await updateCICMutation.mutateAsync(newRating);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave();
  };

  const rateInput = (
    <div
      className={`tw-relative tw-flex tw-w-full ${
        isTooltip
          ? "tw-mt-2 tw-max-w-[12rem]"
          : "tw-mt-2"
      }`}
    >
      <UserPageRateInput
        value={adjustedRatingStr}
        onChange={setAdjustedRatingStr}
        minMax={minMaxValues}
        isProxy={isProxy}
        variant={isTooltip ? "compact" : "form"}
        inputId="nic-rating-input"
        focusRingClassName={CIC_FOCUS_RING_CLASS_NAME}
        required
      />
    </div>
  );

  const adjustmentHelper = (
    <UserRateAdjustmentHelper
      inLineValues={true}
      valueLayout="inline"
      originalValue={originalRating}
      adjustedValue={newRating}
      adjustmentType="NIC"
    />
  );

  return (
    <div>
      <UserPageIdentityHeaderCICRateStats
        isTooltip={isTooltip}
        profile={profile}
        minMaxValues={minMaxValues}
        heroAvailableCredit={
          currentCICState?.cic_ratings_left_to_give_by_rater ?? 0
        }
      />
      <form onSubmit={onSubmit} className="tw-mt-6">
        {isTooltip ? (
          <>
            <div className="tw-flex tw-items-end tw-gap-3">
              <div className="tw-min-w-0 tw-flex-1">
                <label
                  htmlFor="nic-rating-input"
                  className="tw-block tw-max-w-[12rem] tw-text-sm tw-font-normal tw-text-iron-400"
                >
                  Your total NIC Rating of{" "}
                  <span className="tw-whitespace-nowrap">{profile.query}:</span>
                </label>
                {rateInput}
              </div>
              <div className="tw-w-full sm:tw-w-auto">
                <div className="tw-inline-flex tw-w-full tw-items-end tw-space-x-6 sm:tw-w-auto">
                  <Button
                    type="submit"
                    disabled={isSaveDisabled}
                    loading={mutating}
                    variant="success"
                    size="xl"
                    fullWidth
                    className="sm:tw-w-auto"
                  >
                    Rate
                  </Button>
                </div>
              </div>
            </div>
            {adjustmentHelper}
          </>
        ) : (
          <>
            <label
              htmlFor="nic-rating-input"
              className="tw-mb-2 tw-block tw-text-sm tw-font-normal tw-text-iron-400"
            >
              Your total NIC Rating of{" "}
              <span className="tw-whitespace-nowrap">{profile.query}</span>
            </label>
            {rateInput}

            {adjustmentHelper}

            <div className="tw-mt-7 tw-flex tw-flex-col tw-gap-1">
              <Button
                type="submit"
                disabled={isSaveDisabled}
                loading={mutating}
                variant="success"
                size="xl"
                fullWidth
              >
                Rate
              </Button>
              {onCancel && (
                <Button onClick={onCancel} variant="ghost" size="lg" fullWidth>
                  Cancel
                </Button>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
