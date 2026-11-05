"use client";

import { AuthContext } from "@/components/auth/Auth";
import { Spinner } from "@/components/dotLoader/DotLoader";
import type { SeasonMintRow } from "@/components/meme-calendar/meme-calendar.helpers";
import { displayedSeasonNumberFromIndex } from "@/components/meme-calendar/meme-calendar.helpers";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import { formatAddress } from "@/helpers/Helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { commonApiPost } from "@/services/api/common-api";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useQueryClient } from "@tanstack/react-query";
import {
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { Tooltip } from "react-tooltip";
import SubscriptionHeaderLinks, {
  SubscriptionBalanceLabel,
} from "./SubscriptionHeaderLinks";
import UserPageSubscriptionsToggle from "./UserPageSubscriptionsToggle";
import { useSubscriptionAllocationStatus } from "./useSubscriptionAllocationStatus";

const SUBSCRIPTION_COUNT_SELECT_CLASS =
  "tw-h-10 tw-w-12 tw-cursor-pointer tw-appearance-none tw-border-0 tw-bg-transparent tw-py-0 tw-pl-3 tw-pr-5 tw-text-sm tw-leading-none tw-text-iron-200 [color-scheme:dark] focus:tw-outline-none disabled:tw-cursor-not-allowed disabled:tw-text-iron-500";

function MintingTodayLabel({
  tokenId,
  locale,
  className = "",
  showIndicator = false,
}: {
  readonly tokenId: number;
  readonly locale: ReturnType<typeof useBrowserLocale>;
  readonly className?: string | undefined;
  readonly showIndicator?: boolean;
}) {
  const tooltipId = `minting-today-${tokenId}`;

  return (
    <>
      <button
        type="button"
        className={`tw-inline-flex tw-min-h-6 tw-items-center tw-gap-1 tw-whitespace-nowrap tw-rounded-sm tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${className}`}
        data-tooltip-id={tooltipId}
        aria-describedby={tooltipId}
      >
        {showIndicator && (
          <span
            aria-hidden="true"
            className="tw-relative tw-mr-1 tw-inline-flex tw-size-2 tw-shrink-0 tw-items-center tw-justify-center"
          >
            <span className="tw-absolute tw-size-3.5 tw-animate-ping tw-rounded-full tw-bg-primary-300 tw-opacity-30 motion-reduce:tw-animate-none" />
            <span className="tw-relative tw-size-2 tw-rounded-full tw-bg-primary-300" />
          </span>
        )}
        {t(locale, "profile.subscriptions.mintingToday.label")}
        <FontAwesomeIcon
          icon={faInfoCircle}
          className={
            showIndicator ? "tw-size-[13px] tw-opacity-75" : "tw-size-4"
          }
          aria-hidden="true"
        />
      </button>
      <Tooltip
        id={tooltipId}
        openEvents={{ mouseover: true, focus: true, click: true }}
        globalCloseEvents={{ escape: true, clickOutsideAnchor: true }}
        place="top"
        positionStrategy="fixed"
        offset={8}
        delayShow={250}
        opacity={1}
        style={TOOLTIP_STYLES}
      >
        <span
          className={showIndicator ? "tw-text-meta tw-font-normal" : undefined}
        >
          {t(locale, "profile.subscriptions.mintingToday.tooltip")}
        </span>
      </Tooltip>
    </>
  );
}

function ReadOnlySubscriptionStatus({
  subscribed,
}: Readonly<{ subscribed: boolean }>) {
  const locale = useBrowserLocale();
  return (
    <span
      className={`tw-inline-flex tw-items-center tw-whitespace-nowrap tw-text-sm tw-font-normal tw-leading-5 ${subscribed ? "tw-text-emerald-300" : "tw-text-iron-400"}`}
    >
      {t(
        locale,
        subscribed
          ? "subscriptions.upcoming.subscribed"
          : "subscriptions.upcoming.notSubscribed"
      )}
    </span>
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
    artwork?: ReactElement | undefined;
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
  const allocationDetailsId = useId();
  const [showAllocationDetails, setShowAllocationDetails] = useState(false);

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

  const { final, hasNoAllocation } = useSubscriptionAllocationStatus({
    profileKey: props.profileKey,
    contract: props.subscription.contract,
    tokenId: props.subscription.token_id,
    first: props.first,
    subscribed,
  });

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
      !subscribed ||
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
  }, [final, props.first, subscribed]);

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

    if (props.readonly && !isCompact) {
      return (
        <span
          role="group"
          aria-label={t(locale, "subscriptions.upcoming.quantity", {
            title: props.title,
            token: formatInteger(locale, props.subscription.token_id),
          })}
          className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1 tw-whitespace-nowrap tw-text-sm tw-font-normal tw-tabular-nums tw-leading-5"
        >
          <span className="tw-font-normal tw-text-iron-100">
            {formatInteger(
              locale,
              Math.max(0, Math.min(selectedCount, props.eligibilityCount))
            )}
          </span>{" "}
          <span className="tw-text-iron-500">
            / {formatInteger(locale, props.eligibilityCount)}
          </span>
        </span>
      );
    }

    const isCountSelectDisabled =
      props.eligibilityCount < 1 ||
      (disableWhenSingleOption && props.eligibilityCount <= 1) ||
      props.readonly ||
      isSubmitting ||
      props.minting_today;

    return (
      <span
        className={`tw-inline-flex tw-flex-shrink-0 tw-items-center tw-rounded-lg tw-ring-1 tw-ring-inset tw-transition-shadow focus-within:tw-ring-2 focus-within:tw-ring-primary-400 ${isCountSelectDisabled ? "tw-cursor-not-allowed" : "tw-cursor-pointer"} ${isCompact ? "tw-h-11 tw-bg-iron-900 tw-ring-white/[0.03]" : "tw-h-11 tw-bg-transparent tw-ring-white/[0.12] md:tw-h-9"}`}
      >
        <span className="tw-relative tw-inline-flex tw-items-center">
          <select
            className={
              isCompact
                ? SUBSCRIPTION_COUNT_SELECT_CLASS
                : "tw-h-11 tw-w-12 tw-cursor-pointer tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-transparent tw-py-0 tw-pl-2.5 tw-pr-6 tw-text-meta tw-font-medium tw-text-iron-200 [color-scheme:dark] focus:tw-outline-none disabled:tw-cursor-not-allowed disabled:tw-opacity-40 md:tw-h-9"
            }
            value={Math.max(0, Math.min(selectedCount, props.eligibilityCount))}
            disabled={isCountSelectDisabled}
            onChange={(e) => {
              handleCountChange(e.target.value).catch(() => undefined);
            }}
            aria-label={`Select subscription quantity for ${props.title}`}
          >
            {props.eligibilityCount < 1 && (
              <option value={0} className="tw-bg-iron-900 tw-text-iron-100">
                0
              </option>
            )}
            {countOptions.map((num) => (
              <option
                key={num}
                value={num}
                className="tw-bg-iron-900 tw-text-iron-100"
              >
                {formatInteger(locale, num)}
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
        <span
          className={`tw-pl-1 tw-pr-3 tw-leading-none tw-text-iron-500 ${isCompact ? "tw-text-sm" : "tw-text-meta tw-font-medium"}`}
        >
          / {formatInteger(locale, props.eligibilityCount)}
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

  const allocationDetails = finalWithMetadata && (
    <span
      className={`tw-flex tw-flex-wrap tw-gap-x-5 tw-text-meta tw-font-normal tw-tabular-nums ${props.minting_today ? "tw-flex-col tw-gap-y-1.5 tw-leading-[19px] md:tw-flex-row md:tw-gap-y-0.5" : "tw-gap-y-1"}`}
    >
      <span>Phase: {finalWithMetadata.phase}</span>
      <span>
        Subscription Position:{" "}
        {formatInteger(locale, finalWithMetadata.phasePosition)} /{" "}
        {formatInteger(locale, finalWithMetadata.phaseSubscriptions)}
      </span>
      <span>
        Airdrop Address: {formatAddress(finalWithMetadata.airdropAddress)}
      </span>
      <span>Subscription Count: x{finalWithMetadata.subscribedCount}</span>
    </span>
  );
  const textColumn = props.artwork ? "tw-col-start-2" : "tw-col-start-1";
  const controlColumn = props.artwork ? "tw-col-start-3" : "tw-col-start-2";
  const ownerColumns = props.artwork
    ? "sm:tw-grid-cols-[auto_minmax(0,1fr)_auto_auto]"
    : "sm:tw-grid-cols-[minmax(0,1fr)_auto_auto]";
  const countColumn = props.artwork ? "sm:tw-col-start-3" : "sm:tw-col-start-2";
  const ownerCountPlacement = `tw-col-start-1 ${props.artwork ? "tw-col-span-full tw-row-start-4 sm:tw-col-span-1" : "tw-row-start-3"} sm:tw-row-start-2 ${countColumn}`;
  const countPlacement = props.readonly
    ? `tw-row-start-3 ${textColumn}`
    : ownerCountPlacement;
  const allocationDetailsRow =
    props.artwork && !props.readonly
      ? "tw-row-start-5 sm:tw-row-start-4"
      : "tw-row-start-4";
  const toggleColumn = props.artwork
    ? "sm:tw-col-start-4"
    : "sm:tw-col-start-3";
  const visitorPlacement = props.artwork
    ? "tw-col-span-2 tw-col-start-2 tw-row-start-3 tw-justify-end tw-self-end md:tw-self-center"
    : "tw-col-span-full tw-col-start-1 tw-row-start-3 tw-justify-between @[18rem]/subscription-row:tw-col-span-1 @[18rem]/subscription-row:tw-col-start-2 @[18rem]/subscription-row:tw-row-start-2 @[18rem]/subscription-row:tw-justify-end";
  const visitorTitleSpan = props.artwork
    ? "tw-col-span-2"
    : "tw-col-span-full @[18rem]/subscription-row:tw-col-span-1";

  return (
    <div
      className={
        props.minting_today
          ? "tw-px-4 tw-py-4 tw-@container/subscription-row sm:tw-px-5 sm:tw-py-[18px]"
          : "tw-px-4 tw-py-4 tw-@container/subscription-row md:tw-px-5 md:tw-py-5"
      }
    >
      <div
        className={`tw-grid tw-min-w-0 tw-items-center md:tw-flex md:tw-justify-between md:tw-gap-5 ${props.minting_today ? "tw-gap-x-4 tw-gap-y-0.5 sm:tw-gap-x-5" : "tw-gap-x-2 tw-gap-y-1"} ${props.artwork ? "tw-grid-cols-[auto_minmax(0,1fr)_auto]" : "tw-grid-cols-[minmax(0,1fr)_auto]"} ${props.readonly ? "" : ownerColumns}`}
      >
        {props.artwork && (
          <div className="tw-col-start-1 tw-row-span-3 tw-row-start-1 tw-shrink-0">
            {props.artwork}
          </div>
        )}
        <div
          className={`tw-contents md:tw-flex md:tw-min-w-0 md:tw-flex-1 md:tw-flex-col ${props.minting_today ? "md:tw-gap-0.5" : "md:tw-gap-2"}`}
        >
          {props.date && (
            <div
              className={`tw-row-start-1 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-[17px] tw-font-semibold tw-tabular-nums md:tw-text-base ${props.artwork ? "tw-col-span-2" : "tw-col-span-full"} ${textColumn} ${subscribed ? "tw-text-iron-100" : "tw-text-iron-400"}`}
            >
              {props.minting_today ? (
                <MintingTodayLabel
                  tokenId={props.subscription.token_id}
                  locale={locale}
                  showIndicator
                  className="tw-text-[17px] tw-font-semibold tw-leading-[22px] tw-text-primary-300 md:tw-text-base"
                />
              ) : (
                <time
                  dateTime={props.date.utcDay.toISOString()}
                  className="tw-min-w-0 tw-break-words"
                >
                  {formatUtcDate(locale, props.date.utcDay, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              )}
              <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-text-meta tw-font-normal tw-text-iron-400">
                <span className="tw-text-iron-600" aria-hidden="true">
                  /
                </span>
                <span>
                  SZN{displayedSeasonNumberFromIndex(props.date.seasonIndex)}
                </span>
              </span>
            </div>
          )}
          <span
            className={`tw-row-start-2 tw-min-w-0 tw-break-words tw-text-[15px] tw-font-normal tw-tabular-nums tw-text-iron-400 md:tw-text-sm ${props.minting_today ? "tw-leading-5" : ""} ${textColumn} ${props.readonly ? visitorTitleSpan : ""}`}
          >
            {props.title} #{props.subscription.token_id}
          </span>
          {hasNoAllocation && (
            <output className="tw-col-span-full tw-text-meta tw-font-normal tw-leading-5 tw-text-iron-500">
              {t(locale, "profile.subscriptions.noAllocation")}
            </output>
          )}
          {allocationDetails && (
            <div
              className={
                props.minting_today
                  ? `tw-col-span-full tw-text-iron-500 md:tw-mt-1.5 ${allocationDetailsRow}`
                  : "tw-col-span-full tw-text-iron-500"
              }
            >
              {props.minting_today && (
                <button
                  type="button"
                  aria-expanded={showAllocationDetails}
                  aria-controls={allocationDetailsId}
                  onClick={() => setShowAllocationDetails((open) => !open)}
                  className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-text-sm tw-font-normal tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-100 md:tw-hidden"
                >
                  {t(locale, "subscriptions.upcoming.more")}
                  <ChevronDownIcon
                    aria-hidden="true"
                    className={`tw-size-4 ${showAllocationDetails ? "tw-rotate-180" : ""}`}
                  />
                </button>
              )}
              <div
                id={allocationDetailsId}
                className={
                  props.minting_today && !showAllocationDetails
                    ? "tw-hidden md:tw-block"
                    : undefined
                }
              >
                {allocationDetails}
              </div>
            </div>
          )}
        </div>
        <div
          className={
            props.readonly
              ? `tw-flex tw-shrink-0 tw-items-center tw-gap-2 md:tw-justify-end md:tw-gap-3 ${visitorPlacement}`
              : "tw-contents md:tw-flex md:tw-shrink-0 md:tw-items-center md:tw-gap-3"
          }
        >
          {subscribed && (
            <span
              className={`tw-inline-flex tw-items-center tw-gap-2 ${countPlacement}`}
            >
              {renderCountSelector({ disableWhenSingleOption: true })}
            </span>
          )}
          {props.readonly ? (
            <ReadOnlySubscriptionStatus subscribed={subscribed} />
          ) : (
            <span
              className={`tw-row-start-2 tw-flex tw-items-center tw-justify-end tw-gap-2 ${controlColumn} ${toggleColumn}`}
            >
              {isSubmitting && <Spinner />}
              <UserPageSubscriptionsToggle
                disabled={isToggleDisabled}
                id={id}
                checked={subscribed}
                onChange={submit}
                ariaLabel={`Toggle subscription for ${props.title} #${props.subscription.token_id}`}
              />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
