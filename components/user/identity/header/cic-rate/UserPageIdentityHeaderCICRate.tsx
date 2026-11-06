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
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, tRich } from "@/i18n/messages";

import { isRatingValue } from "@/components/user/rep/ratingsManagement";

const CIC_FOCUS_RING_CLASS_NAME = "focus:tw-ring-primary-400";

export default function UserPageIdentityHeaderCICRate({
  profile,
  isTooltip,
  onSuccess,
  onCancel,
  onBusyChange,
  locale = DEFAULT_LOCALE,
}: {
  readonly profile: ApiIdentity;
  readonly isTooltip: boolean;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
  readonly onBusyChange?: (busy: boolean) => void;
  readonly locale?: SupportedLocale;
}) {
  const { address } = useSeizeConnectContext();
  const inputId = useId();
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      onBusyChange?.(false);
    };
  }, [onBusyChange]);
  const profileIdentity = profile.query ?? profile.handle ?? profile.display;
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);

  const { onProfileCICModify } = useContext(ReactQueryWrapperContext);

  const {
    data: currentCICState,
    isError,
    isFetching,
    refetch,
  } = useQuery<ApiProfileRaterCicState>({
    queryKey: [
      QueryKey.PROFILE_RATER_CIC_STATE,
      {
        handle: profileIdentity.toLowerCase(),
        rater: activeProfileProxy?.created_by.handle ?? address?.toLowerCase(),
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileRaterCicState>({
        endpoint: `profiles/${encodeURIComponent(profileIdentity)}/cic/rating/${
          activeProfileProxy?.created_by.handle ?? address?.toLowerCase()
        }`,
      }),
    enabled: !!address,
    staleTime: 0,
  });

  const [mutating, setMutating] = useState<boolean>(false);
  const setBusy = (busy: boolean) => {
    setMutating(busy);
    onBusyChange?.(busy);
  };

  const updateCICMutation = useMutation({
    mutationFn: async (amount: number) => {
      setBusy(true);
      return await commonApiPost({
        endpoint: `profiles/${encodeURIComponent(profileIdentity)}/cic/rating`,
        body: {
          amount,
        },
      });
    },
    onSuccess: () => {
      setToast({
        message: t(locale, "user.rate.updated", { matter: "NIC" }),
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
    onSettled: () => {
      setBusy(false);
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
  >(() => getProxyAvailableCredit());

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
  }>(() => getMinMaxValues());

  useEffect(
    () => setMinMaxValues(getMinMaxValues()),
    [currentCICState, proxyAvailableCredit]
  );

  const originalRating = currentCICState?.cic_rating_by_rater ?? 0;
  const [draftRating, setDraftRating] = useState<string | null>(null);
  const adjustedRatingStr = draftRating ?? String(originalRating);
  const isUnavailable = !currentCICState || isError;

  const newRating = getStringAsNumberOrZero(adjustedRatingStr);
  const haveChanged = newRating !== originalRating;
  const isProxy = !!activeProfileProxy;
  const isValidValue =
    isRatingValue(adjustedRatingStr) &&
    (isProxy ||
      (newRating >= minMaxValues.min && newRating <= minMaxValues.max));
  const isSaveDisabled = isUnavailable || !haveChanged || !isValidValue;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutating || isSaveDisabled) return;
    setBusy(true);
    try {
      const { success } = await requestAuth();
      if (!mounted.current) return;
      if (!success) {
        setToast({
          message: t(locale, "user.rate.loginRequired"),
          type: "error",
        });
        return;
      }
      await updateCICMutation.mutateAsync(newRating);
    } catch (error) {
      setToast({
        type: "error",
        title: t(locale, "user.rate.updateError"),
        description: t(locale, "user.rate.tryAgain"),
        details: getToastErrorDetails(error),
      });
    } finally {
      setBusy(false);
    }
  };

  const rateInput = (
    <div
      className={`tw-relative tw-flex tw-w-full tw-min-w-0 ${
        isTooltip ? "tw-flex-1" : "tw-mt-2"
      }`}
    >
      <UserPageRateInput
        value={currentCICState ? adjustedRatingStr : ""}
        onChange={setDraftRating}
        minMax={minMaxValues}
        isProxy={isProxy}
        variant={isTooltip ? "tooltip" : "form"}
        inputId={inputId}
        readOnly={isUnavailable}
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
    <div className={isTooltip ? "tw-w-full tw-min-w-0" : undefined}>
      <UserPageIdentityHeaderCICRateStats
        isTooltip={isTooltip}
        profile={profile}
        minMaxValues={minMaxValues}
        heroAvailableCredit={
          currentCICState?.cic_ratings_left_to_give_by_rater ?? 0
        }
      />
      {isError && (
        <div role="alert" className="tw-mt-3 tw-text-sm tw-text-iron-300">
          <p>{t(locale, "user.rate.loadError")}</p>
          <Button
            variant="secondary"
            size="sm"
            loading={isFetching}
            onClick={() => {
              void refetch();
            }}
          >
            {t(locale, "user.rate.retry")}
          </Button>
        </div>
      )}
      {!currentCICState && !isError && (
        <output className="tw-sr-only">{t(locale, "user.rate.loading")}</output>
      )}
      <form
        aria-busy={!currentCICState && !isError}
        onSubmit={onSubmit}
        className="tw-mt-6"
      >
        {isTooltip ? (
          <>
            <label
              htmlFor={inputId}
              className="tw-block tw-text-sm tw-font-normal tw-text-iron-400 [overflow-wrap:anywhere]"
            >
              {t(locale, "user.rate.nic.label", { profile: profileIdentity })}
            </label>
            <div className="tw-mt-2 tw-flex tw-items-stretch tw-gap-3">
              {rateInput}
              <Button
                type="submit"
                disabled={isSaveDisabled}
                loading={mutating}
                variant="success"
                size="md"
                className="tw-shrink-0 !tw-text-xs touch-only:tw-h-11"
              >
                {t(locale, "user.rate.submit")}
              </Button>
            </div>
            {adjustmentHelper}
          </>
        ) : (
          <>
            <label
              htmlFor={inputId}
              className="tw-mb-2 tw-block tw-text-sm tw-font-normal tw-text-iron-400"
            >
              {tRich(locale, "user.rate.nic.label", {
                profile: (
                  <span key="profile" className="tw-break-all">
                    {profileIdentity}
                  </span>
                ),
              })}
            </label>
            <p className="tw-text-xs tw-text-iron-400">
              {t(locale, "user.rate.totalHelp")}
            </p>
            {rateInput}

            {adjustmentHelper}

            <div className="tw-mt-7 tw-flex tw-flex-col tw-gap-1">
              {originalRating !== 0 && (
                <Button
                  variant="ghost"
                  size="lg"
                  fullWidth
                  disabled={mutating || isUnavailable}
                  onClick={() => setDraftRating("0")}
                >
                  {t(locale, "user.rate.remove")}
                </Button>
              )}
              {originalRating !== 0 && draftRating === "0" && (
                <output className="tw-text-center tw-text-xs tw-text-iron-400">
                  {t(locale, "user.rate.removeHint")}
                </output>
              )}
              <Button
                type="submit"
                disabled={isSaveDisabled}
                loading={mutating}
                variant="success"
                size="xl"
                fullWidth
              >
                {t(locale, "user.rate.save")}
              </Button>
              {onCancel && (
                <Button
                  onClick={onCancel}
                  disabled={mutating}
                  variant="ghost"
                  size="lg"
                  fullWidth
                >
                  {t(locale, "user.rate.cancel")}
                </Button>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
