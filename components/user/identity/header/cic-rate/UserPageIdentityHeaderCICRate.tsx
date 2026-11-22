"use client";

import type { FormEvent } from "react";
import { useContext, useEffect, useId, useRef, useState } from "react";
import { getStringAsNumberOrZero } from "@/helpers/Helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { AuthContext } from "@/components/auth/Auth";
import {
  chainRatingBlockedText,
  chainRatingFailureText,
} from "@/components/chain-identity/chainErrorMessage";
import { useChainRatingWriter } from "@/components/chain-identity/useChainRatingWriter";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";

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

import { useNicRatingState } from "./useNicRatingState";

const CIC_FOCUS_RING_CLASS_NAME = "focus:tw-ring-primary-400";

type NicRateProps = {
  readonly profile: ApiIdentity;
  readonly isTooltip: boolean;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
  readonly onBusyChange?: (busy: boolean) => void;
  readonly locale?: SupportedLocale;
};

function UserPageIdentityHeaderCICRateForm({
  profile,
  isTooltip,
  onSuccess,
  onCancel,
  onBusyChange,
  ratingState,
  locale = DEFAULT_LOCALE,
}: NicRateProps & {
  readonly ratingState: ReturnType<typeof useNicRatingState>;
}) {
  const { address } = useSeizeConnectContext();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const didFocusAmount = useRef(false);
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
  const chainWrite = useChainRatingWriter();

  const { onProfileCICModify } = useContext(ReactQueryWrapperContext);

  const {
    data: currentCICState,
    error: stateError,
    isError,
    isFetching,
    refetch,
  } = ratingState;
  // Only the 6529 Network's reads carry a reason a retry can't fix.
  const blocked = chainWrite
    ? chainRatingBlockedText(locale, stateError)
    : null;

  const [mutating, setMutating] = useState<boolean>(false);
  const setBusy = (busy: boolean) => {
    setMutating(busy);
    onBusyChange?.(busy);
  };

  const updateCICMutation = useMutation({
    mutationFn: async (amount: number) => {
      setBusy(true);
      if (chainWrite) {
        await chainWrite({ matter: "NIC", profile, category: null, amount });
        return;
      }
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
      void onProfileCICModify({
        targetProfiles: [profile],
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
  useEffect(() => {
    if (
      isTooltip ||
      isUnavailable ||
      didFocusAmount.current ||
      !globalThis.matchMedia(
        "(min-width: 768px) and (hover: hover) and (pointer: fine)"
      ).matches
    )
      return;
    inputRef.current?.focus({ preventScroll: true });
    didFocusAmount.current = true;
  }, [isTooltip, isUnavailable]);

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
      // On the 6529 Network the rating carries its own signature.
      const { success } = chainWrite ? { success: true } : await requestAuth();
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
        ...(chainWrite
          ? { description: chainRatingFailureText(locale, error) }
          : {
              description: t(locale, "user.rate.tryAgain"),
              details: getToastErrorDetails(error),
            }),
      });
    } finally {
      setBusy(false);
    }
  };

  const rateInput = (
    <div
      className={`tw-relative tw-flex tw-w-full tw-min-w-0 ${
        isTooltip ? "tw-flex-1" : ""
      }`}
    >
      <UserPageRateInput
        inputRef={inputRef}
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
      variant={isTooltip ? "default" : "summary"}
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
          <p>{blocked ?? t(locale, "user.rate.loadError")}</p>
          {blocked === null && (
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
          )}
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
              className="tw-mb-1 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
            >
              {tRich(locale, "user.rate.nic.label", {
                profile: (
                  <span key="profile" className="tw-break-all">
                    {profileIdentity}
                  </span>
                ),
              })}
            </label>
            <p className="tw-mb-2 tw-mt-0 tw-text-xs tw-leading-5 tw-text-iron-500">
              {t(locale, "user.rate.totalHelp")}
            </p>
            {rateInput}

            {adjustmentHelper}

            <div className="tw-mt-7 tw-flex tw-flex-col tw-gap-2 md:tw-flex-row md:tw-justify-end md:tw-gap-3">
              {onCancel && (
                <Button
                  onClick={onCancel}
                  disabled={mutating}
                  variant="ghost"
                  size="md"
                  className="tw-min-h-11 tw-w-full md:tw-w-auto"
                >
                  {t(locale, "user.rate.cancel")}
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSaveDisabled}
                loading={mutating}
                variant="success"
                size="md"
                className="tw-min-h-11 tw-w-full md:tw-w-auto"
              >
                {t(locale, "user.rate.save")}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

export default function UserPageIdentityHeaderCICRate(props: NicRateProps) {
  const identity =
    props.profile.query ?? props.profile.handle ?? props.profile.display;
  const ratingState = useNicRatingState(identity);
  return (
    <UserPageIdentityHeaderCICRateForm {...props} ratingState={ratingState} />
  );
}
