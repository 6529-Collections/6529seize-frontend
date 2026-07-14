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
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useState } from "react";
import { Tooltip } from "react-tooltip";
import SubscriptionHeaderLinks, {
  SubscriptionBalanceLabel,
} from "./SubscriptionHeaderLinks";
import UserPageSubscriptionsToggle from "./UserPageSubscriptionsToggle";

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
    selectClassName,
    disableWhenSingleOption,
  }: {
    selectClassName: string;
    disableWhenSingleOption: boolean;
  }) => {
    if (!subscribed) {
      return null;
    }

    return (
      <>
        <select
          className={selectClassName}
          value={selectedCount}
          disabled={
            (disableWhenSingleOption && props.eligibilityCount <= 1) ||
            props.readonly ||
            isSubmitting ||
            props.minting_today
          }
          onChange={(e) => {
            handleCountChange(e.target.value).catch(() => undefined);
          }}
          style={{ minWidth: "3ch" }}
          aria-label={`Select subscription quantity for ${props.title}`}
        >
          {countOptions.map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
        <span className="tw-text-iron-400">/ {props.eligibilityCount}</span>
      </>
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
              <UserPageSubscriptionsToggle
                disabled={isToggleDisabled}
                id={id}
                checked={subscribed}
                onChange={submit}
                ariaLabel={`Toggle subscription for ${props.title} #${props.subscription.token_id}`}
              />
              <span className="tw-flex tw-min-w-16 tw-items-center tw-gap-1">
                {renderCountSelector({
                  selectClassName:
                    "tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-2 tw-py-1 tw-text-iron-300 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500/25",
                  disableWhenSingleOption: false,
                })}
              </span>
            </div>
          )}
        </div>
        {finalWithMetadata && (
          <div className="tw-mt-2 tw-pr-2 tw-text-sm tw-text-iron-400">
            Phase: {finalWithMetadata.phase} - Subscription Position:{" "}
            {finalWithMetadata.phasePosition.toLocaleString()} /{" "}
            {finalWithMetadata.phaseSubscriptions.toLocaleString()} - Airdrop
            Address: {formatAddress(finalWithMetadata.airdropAddress)} -
            Subscription Count: x{finalWithMetadata.subscribedCount}
          </div>
        )}
        {props.minting_today && (
          <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-400">
            <span
              data-tooltip-id={`minting-today-${props.subscription.token_id}`}
            >
              Minting Today{" "}
              <FontAwesomeIcon icon={faInfoCircle} height={"20px"} />
            </span>
            <Tooltip
              id={`minting-today-${props.subscription.token_id}`}
              place="right"
              style={{
                backgroundColor: "#f8f9fa",
                color: "#212529",
                padding: "4px 8px",
              }}
            >
              No changes allowed on minting day
            </Tooltip>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-black/20 tw-px-4 tw-py-3 tw-transition-colors tw-duration-200 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-white/[0.025] motion-reduce:tw-transition-none">
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-2">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
            <span className="tw-font-medium tw-text-iron-100">
              {props.title} #{props.subscription.token_id}
            </span>
            {props.date && (
              <span className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-sm tw-text-iron-300">
                <span>
                  SZN{displayedSeasonNumberFromIndex(props.date.seasonIndex)}
                </span>
                <span aria-hidden="true">·</span>
                {props.minting_today ? (
                  <>
                    <span
                      className="tw-inline-flex tw-items-center tw-gap-1"
                      data-tooltip-id={`minting-today-${props.subscription.token_id}`}
                    >
                      Minting Today
                      <FontAwesomeIcon
                        icon={faInfoCircle}
                        className="tw-size-4"
                        aria-hidden="true"
                      />
                    </span>
                    <Tooltip
                      id={`minting-today-${props.subscription.token_id}`}
                      place="right"
                      style={{
                        backgroundColor: "#f8f9fa",
                        color: "#212529",
                        padding: "4px 8px",
                      }}
                    >
                      No changes allowed on minting day
                    </Tooltip>
                  </>
                ) : (
                  <span>{formatFullDate(props.date.utcDay, "utc")}</span>
                )}
              </span>
            )}
          </div>
          {finalWithMetadata && (
            <span className="tw-break-words tw-text-sm tw-leading-5 tw-text-iron-400">
              Phase: {finalWithMetadata.phase} - Subscription Position:{" "}
              {finalWithMetadata.phasePosition.toLocaleString()} /{" "}
              {finalWithMetadata.phaseSubscriptions.toLocaleString()} - Airdrop
              Address: {formatAddress(finalWithMetadata.airdropAddress)} -
              Subscription Count: x{finalWithMetadata.subscribedCount}
            </span>
          )}
        </div>
        <div className="tw-flex tw-w-full tw-flex-shrink-0 tw-items-center tw-justify-end tw-gap-3 sm:tw-w-auto">
          {isSubmitting && <Spinner />}
          <UserPageSubscriptionsToggle
            disabled={isToggleDisabled}
            id={id}
            checked={subscribed}
            onChange={submit}
            ariaLabel={`Toggle subscription for ${props.title} #${props.subscription.token_id}`}
          />
          {subscribed && (
            <span className="tw-flex tw-min-w-16 tw-items-center tw-gap-1">
              {renderCountSelector({
                selectClassName:
                  "tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-2 tw-py-1 tw-text-iron-300 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500/25",
                disableWhenSingleOption: true,
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
