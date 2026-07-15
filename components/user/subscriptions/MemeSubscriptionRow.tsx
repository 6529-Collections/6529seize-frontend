"use client";

import { AuthContext } from "@/components/auth/Auth";
import { Spinner } from "@/components/dotLoader/DotLoader";
import type { SeasonMintRow } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  displayedSeasonNumberFromIndex,
  formatFullDate,
} from "@/components/meme-calendar/meme-calendar.helpers";
import type { NFTFinalSubscription } from "@/generated/models/NFTFinalSubscription";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import { formatAddress } from "@/helpers/Helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useState } from "react";
import { Tooltip } from "react-tooltip";
import SubscriptionHeaderLinks, {
  SubscriptionBalanceLabel,
} from "./SubscriptionHeaderLinks";
import UserPageSubscriptionsToggle from "./UserPageSubscriptionsToggle";

const SUBSCRIPTION_COUNT_SELECT_CLASS =
  "tw-h-10 tw-w-12 tw-appearance-none tw-border-0 tw-bg-transparent tw-py-0 tw-pl-3 tw-pr-5 tw-text-sm tw-leading-none tw-text-iron-200 focus:tw-outline-none disabled:tw-cursor-not-allowed disabled:tw-text-iron-500";

function MintingTodayLabel({
  tokenId,
  locale,
  className = "",
}: {
  readonly tokenId: number;
  readonly locale: ReturnType<typeof useBrowserLocale>;
  readonly className?: string | undefined;
}) {
  const tooltipId = `minting-today-${tokenId}`;

  return (
    <>
      <button
        type="button"
        className={`tw-inline-flex tw-items-center tw-gap-1 tw-border-0 tw-bg-transparent tw-p-0 ${className}`}
        data-tooltip-id={tooltipId}
        aria-describedby={tooltipId}
      >
        {t(locale, "profile.subscriptions.mintingToday.label")}
        <FontAwesomeIcon
          icon={faInfoCircle}
          className="tw-size-4"
          aria-hidden="true"
        />
      </button>
      <Tooltip
        id={tooltipId}
        place="top"
        positionStrategy="fixed"
        offset={8}
        delayShow={250}
        opacity={1}
        style={TOOLTIP_STYLES}
      >
        {t(locale, "profile.subscriptions.mintingToday.tooltip")}
      </Tooltip>
    </>
  );
}

export default function MemeSubscriptionRow(
  props: Readonly<{
    profileKey: string;
    title: string;
    subscription: NFTSubscription;
    eligibilityCount: number;
    readonly: boolean;
    minting_today?: boolean | undefined;
    first: boolean;
    date: SeasonMintRow | null;
    refresh: () => void;
    variant?: "default" | "compact";
    balanceLabel?: string;
    subscribedView?: boolean;
    infoHref?: string | undefined;
    profileSubscriptionsHref?: string | undefined;
  }>
) {
  const id = `subscription-${props.subscription.token_id}`;
  const isCompact = props.variant === "compact";
  const locale = useBrowserLocale();

  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useContext(AuthContext);

  const [subscribed, setSubscribed] = useState<boolean>(
    !!props.subscription.subscribed
  );

  const subscribedCount = useMemo<number>(
    () => props.subscription.subscribed_count ?? 1,
    [props.subscription.subscribed_count]
  );

  const [selectedCount, setSelectedCount] = useState<number>(subscribedCount);
  const countOptions = useMemo(
    () => Array.from({ length: props.eligibilityCount }, (_, i) => i + 1),
    [props.eligibilityCount]
  );

  useEffect(() => {
    setSelectedCount(subscribedCount);
  }, [subscribedCount]);

  useEffect(() => {
    if (selectedCount > props.eligibilityCount) {
      setSelectedCount(Math.max(0, props.eligibilityCount));
    }
  }, [props.eligibilityCount, selectedCount]);

  const { data: fetchedFinal } = useQuery<NFTFinalSubscription>({
    queryKey: [
      "consolidation-final-subscription",
      `${props.profileKey}-${props.subscription.contract}-${props.subscription.token_id}`,
    ],
    queryFn: async () =>
      await commonApiFetch<NFTFinalSubscription>({
        endpoint: `subscriptions/consolidation/final/${props.profileKey}/${props.subscription.contract}/${props.subscription.token_id}`,
      }),
    enabled: props.first,
    retry: false,
  });
  const final = fetchedFinal;

  useEffect(() => {
    setSubscribed(!!props.subscription.subscribed);
  }, [props.subscription.subscribed]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isToggleDisabled =
    props.readonly ||
    isSubmitting ||
    props.minting_today ||
    (!subscribed && props.eligibilityCount < 1);
  const finalWithMetadata = useMemo(() => {
    if (
      !props.first ||
      !final?.phase ||
      final.phase_position === undefined ||
      final.phase_position <= 0
    ) {
      return null;
    }

    return {
      phase: final.phase,
      phasePosition: final.phase_position,
      phaseSubscriptions: final.phase_subscriptions ?? 0,
      airdropAddress: final.airdrop_address,
      subscribedCount: final.subscribed_count,
    };
  }, [final, props.first]);

  const submit = async (): Promise<void> => {
    if (isSubmitting || props.minting_today) {
      return;
    }
    interface SubscribeBody {
      contract: string;
      token_id: number;
      subscribed: boolean;
    }

    setIsSubmitting(true);
    try {
      const { success } = await requestAuth();
      if (!success) {
        return;
      }

      const subscribe = !subscribed;
      const response = await commonApiPost<SubscribeBody, SubscribeBody>({
        endpoint: `subscriptions/${props.profileKey}/subscription`,
        body: {
          contract: props.subscription.contract,
          token_id: props.subscription.token_id,
          subscribed: subscribe,
        },
      });
      const responseSubscribed = response.subscribed;
      setSubscribed(!!responseSubscribed);
      const detail = responseSubscribed ? "Subscribed." : "Unsubscribed.";
      setToast({
        title: detail,
        description: `${props.title} #${response.token_id}`,
        type: "success",
      });
      props.refresh();
      queryClient.invalidateQueries({
        queryKey: [
          "consolidation-final-subscription",
          `${props.profileKey}-${props.subscription.contract}-${props.subscription.token_id}`,
        ],
      });
    } catch (e: unknown) {
      setToast({
        type: "error",
        title: "Couldn't update this subscription.",
        description: "Please try again.",
        details: getToastErrorDetails(
          e,
          "Could not change token subscription."
        ),
      });
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubscriptionCount = async (
    value: number
  ): Promise<void> => {
    if (isSubmitting || props.minting_today) {
      return;
    }
    interface UpdateSubscriptionCountBody {
      contract: string;
      token_id: number;
      count: number;
    }

    setIsSubmitting(true);
    try {
      const { success } = await requestAuth();
      if (!success) {
        setSelectedCount(subscribedCount);
        return;
      }

      const response = await commonApiPost<
        UpdateSubscriptionCountBody,
        UpdateSubscriptionCountBody
      >({
        endpoint: `subscriptions/${props.profileKey}/subscription-count`,
        body: {
          contract: props.subscription.contract,
          token_id: props.subscription.token_id,
          count: value,
        },
      });
      const responseCount = response.count;
      setSelectedCount(responseCount);
      setToast({
        title: "Subscription count updated.",
        description: `${props.title} #${props.subscription.token_id}: ${responseCount}.`,
        type: "success",
      });
      props.refresh();
      queryClient.invalidateQueries({
        queryKey: [
          "consolidation-final-subscription",
          `${props.profileKey}-${props.subscription.contract}-${props.subscription.token_id}`,
        ],
      });
    } catch (e: unknown) {
      setSelectedCount(subscribedCount);
      setToast({
        type: "error",
        title: "Couldn't update subscription count.",
        description: "Please try again.",
        details: getToastErrorDetails(
          e,
          "Could not update subscription count."
        ),
      });
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCountChange = async (value: string): Promise<void> => {
    const nextValue = Number.parseInt(value, 10);
    setSelectedCount(nextValue);
    await handleUpdateSubscriptionCount(nextValue);
  };

  const renderCountSelector = ({
    disableWhenSingleOption,
  }: {
    disableWhenSingleOption: boolean;
  }) => {
    if (!subscribed) {
      return null;
    }

    const isCountSelectDisabled =
      (disableWhenSingleOption && props.eligibilityCount <= 1) ||
      props.readonly ||
      isSubmitting ||
      props.minting_today;

    return (
      <span className="tw-inline-flex tw-h-10 tw-flex-shrink-0 tw-items-center tw-rounded-xl tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/[0.03] tw-transition-shadow focus-within:tw-ring-2 focus-within:tw-ring-primary-400/25">
        <span className="tw-relative tw-inline-flex tw-items-center">
          <select
            className={SUBSCRIPTION_COUNT_SELECT_CLASS}
            value={selectedCount}
            disabled={isCountSelectDisabled}
            onChange={(e) => {
              handleCountChange(e.target.value).catch(() => undefined);
            }}
            aria-label={`Select subscription quantity for ${props.title}`}
          >
            {countOptions.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            className={`tw-pointer-events-none tw-absolute tw-right-0.5 tw-size-4 ${
              isCountSelectDisabled ? "tw-text-iron-600" : "tw-text-iron-500"
            }`}
            aria-hidden="true"
          />
        </span>
        <span className="tw-pl-1 tw-pr-3 tw-text-sm tw-leading-none tw-text-iron-500">
          / {props.eligibilityCount}
        </span>
      </span>
    );
  };

  if (isCompact) {
    const isSubscribedView = !!props.subscribedView;
    return (
      <div className="tw-py-1">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
          <SubscriptionHeaderLinks
            labelKey={
              isSubscribedView
                ? "home.mintSubscriptions.subscribedLabel"
                : "home.mintSubscriptions.subscribeLabel"
            }
            infoHref={props.infoHref}
            profileSubscriptionsHref={props.profileSubscriptionsHref}
          >
            {props.balanceLabel && (
              <SubscriptionBalanceLabel balanceLabel={props.balanceLabel} />
            )}
          </SubscriptionHeaderLinks>
          {isSubscribedView ? (
            <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-300">
              {subscribedCount} / {props.eligibilityCount}
            </span>
          ) : (
            <div className="tw-flex tw-items-center tw-gap-2">
              {isSubmitting && <Spinner />}
              {renderCountSelector({
                disableWhenSingleOption: false,
              })}
              <UserPageSubscriptionsToggle
                disabled={isToggleDisabled}
                id={id}
                checked={subscribed}
                onChange={submit}
                ariaLabel={`Toggle subscription for ${props.title} #${props.subscription.token_id}`}
              />
            </div>
          )}
        </div>
        {finalWithMetadata && (
          <div className="tw-mt-2 tw-pr-2 tw-text-sm tw-text-iron-400">
            Phase: {finalWithMetadata.phase} - Subscription Position:{" "}
            {formatInteger(locale, finalWithMetadata.phasePosition)} /{" "}
            {formatInteger(locale, finalWithMetadata.phaseSubscriptions)} -
            Airdrop Address: {formatAddress(finalWithMetadata.airdropAddress)} -
            Subscription Count: x{finalWithMetadata.subscribedCount}
          </div>
        )}
        {props.minting_today && (
          <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-400">
            <MintingTodayLabel
              tokenId={props.subscription.token_id}
              locale={locale}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tw-rounded-xl tw-p-4 tw-transition-colors tw-duration-300 desktop-hover:hover:tw-bg-iron-900/40 motion-reduce:tw-transition-none">
      <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-4">
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-2">
          <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-0.5">
            <span className="tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
              {props.title} #{props.subscription.token_id}
            </span>
            {props.date && (
              <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1 tw-text-xs tw-leading-4">
                <span className="tw-text-iron-500">
                  SZN{displayedSeasonNumberFromIndex(props.date.seasonIndex)}
                </span>
                <span className="tw-text-iron-600" aria-hidden="true">
                  /
                </span>
                {props.minting_today ? (
                  <MintingTodayLabel
                    tokenId={props.subscription.token_id}
                    locale={locale}
                    className="tw-font-medium tw-text-primary-300"
                  />
                ) : (
                  <span className="tw-text-iron-600">
                    {formatFullDate(props.date.utcDay, "utc")}
                  </span>
                )}
              </span>
            )}
          </div>
          {finalWithMetadata && (
            <span className="tw-break-words tw-text-xs tw-leading-5 tw-text-iron-600">
              Phase: {finalWithMetadata.phase} - Subscription Position:{" "}
              {formatInteger(locale, finalWithMetadata.phasePosition)} /{" "}
              {formatInteger(locale, finalWithMetadata.phaseSubscriptions)} -
              Airdrop Address: {formatAddress(finalWithMetadata.airdropAddress)}{" "}
              - Subscription Count: x{finalWithMetadata.subscribedCount}
            </span>
          )}
        </div>
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-justify-end tw-gap-3">
          {isSubmitting && <Spinner />}
          {renderCountSelector({
            disableWhenSingleOption: true,
          })}
          <UserPageSubscriptionsToggle
            disabled={isToggleDisabled}
            id={id}
            checked={subscribed}
            onChange={submit}
            ariaLabel={`Toggle subscription for ${props.title} #${props.subscription.token_id}`}
          />
        </div>
      </div>
    </div>
  );
}
