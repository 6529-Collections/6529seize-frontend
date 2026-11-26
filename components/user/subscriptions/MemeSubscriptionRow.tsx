"use client";

import {
  getDropdownTriggerClasses,
  getEmbeddedDropdownClasses,
} from "@/components/utils/select/dropdown/dropdownTriggerStyles";

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
import Link from "next/link";
import SubscriptionHeaderLinks, {
  SubscriptionBalanceLabel,
} from "./SubscriptionHeaderLinks";
import UserPageSubscriptionsToggle from "./UserPageSubscriptionsToggle";
import { useSubscriptionAllocationStatus } from "./useSubscriptionAllocationStatus";
import {
  postSubscriptionChange,
  subscriptionSigningToast,
} from "./subscriptionChangeRequest";

const SUBSCRIPTION_COUNT_SELECT_CLASS = `${getEmbeddedDropdownClasses({ height: 40, y: 0, left: 12, right: 20, text: "sm", leading: "none" })} tw-w-12 [color-scheme:dark] disabled:tw-text-iron-500`;

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
      className={`tw-inline-flex tw-items-center tw-whitespace-nowrap tw-text-sm tw-font-normal tw-leading-5 max-md:tw-text-xs max-md:tw-leading-[17px] ${subscribed ? "tw-text-emerald-300" : "tw-text-iron-400"}`}
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
    controlsLoading?: boolean | undefined;
    controlsUnavailable?: boolean | undefined;
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
  const dateTooltipId = useId();
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
      const response = await postSubscriptionChange<SubscribeBody>({
        endpoint: `subscriptions/${props.profileKey}/subscription`,
        body: {
          contract: props.subscription.contract,
          token_id: props.subscription.token_id,
          subscribed: subscribe,
        } satisfies SubscribeBody,
        change: {
          type: "subs.card",
          contract: props.subscription.contract,
          tokenId: props.subscription.token_id,
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
      setToast(
        subscriptionSigningToast(e, locale) ?? {
          type: "error",
          title: "Couldn't update this subscription.",
          description: "Please try again.",
          details: getToastErrorDetails(
            e,
            "Could not change token subscription."
          ),
        }
      );
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

      const response =
        await postSubscriptionChange<UpdateSubscriptionCountBody>({
          endpoint: `subscriptions/${props.profileKey}/subscription-count`,
          body: {
            contract: props.subscription.contract,
            token_id: props.subscription.token_id,
            count: value,
          } satisfies UpdateSubscriptionCountBody,
          change: {
            type: "subs.count",
            contract: props.subscription.contract,
            tokenId: props.subscription.token_id,
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
      setToast(
        subscriptionSigningToast(e, locale) ?? {
          type: "error",
          title: "Couldn't update subscription count.",
          description: "Please try again.",
          details: getToastErrorDetails(
            e,
            "Could not update subscription count."
          ),
        }
      );
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
          className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1 tw-whitespace-nowrap tw-text-sm tw-font-normal tw-tabular-nums tw-leading-5 max-md:tw-text-xs max-md:tw-leading-[17px]"
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
        className={`${getDropdownTriggerClasses({ variant: "regular", metrics: { height: isCompact ? 44 : "subscription" } })} tw-inline-flex tw-flex-shrink-0 tw-items-center focus-within:tw-ring-2 focus-within:tw-ring-primary-400 ${isCountSelectDisabled ? "tw-cursor-not-allowed" : "tw-cursor-pointer desktop-hover:hover:tw-bg-iron-800"}`}
      >
        <span className="tw-relative tw-inline-flex tw-items-center">
          <select
            className={
              isCompact
                ? SUBSCRIPTION_COUNT_SELECT_CLASS
                : `${getEmbeddedDropdownClasses({ height: "subscription", y: 0, left: 10, right: 24, text: "meta" })} tw-w-12 tw-rounded-lg [color-scheme:dark] disabled:tw-opacity-40`
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
  let controls: ReactElement;
  if (props.controlsLoading) {
    controls = (
      <span
        aria-hidden="true"
        className="tw-h-6 tw-w-28 tw-animate-pulse tw-rounded-lg tw-bg-iron-800 motion-reduce:tw-animate-none"
      />
    );
  } else if (props.controlsUnavailable) {
    controls = (
      <span className="tw-text-sm tw-text-iron-500">
        {t(locale, "subscriptions.details.unavailable")}
      </span>
    );
  } else {
    controls = (
      <>
        {isSubmitting && <Spinner />}
        {props.readonly &&
          renderCountSelector({ disableWhenSingleOption: true })}
        {props.readonly ? (
          <ReadOnlySubscriptionStatus subscribed={subscribed} />
        ) : (
          <UserPageSubscriptionsToggle
            disabled={isToggleDisabled}
            id={id}
            checked={subscribed}
            onChange={submit}
            ariaLabel={`Toggle subscription for ${props.title} #${props.subscription.token_id}`}
          />
        )}
      </>
    );
  }

  const fullDate = props.date
    ? formatUtcDate(locale, props.date.utcDay, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="tw-px-4 tw-py-4 md:tw-px-5 md:tw-py-5">
      <div className="tw-flex tw-min-w-0 tw-flex-row tw-items-start tw-gap-3 md:tw-items-center md:tw-gap-5">
        {props.artwork && <div className="tw-shrink-0">{props.artwork}</div>}
        {!props.artwork && props.date && (
          <>
            <button
              type="button"
              aria-label={fullDate}
              aria-describedby={dateTooltipId}
              data-tooltip-id={dateTooltipId}
              className="tw-flex tw-min-h-11 tw-w-12 tw-flex-none tw-flex-col tw-items-center tw-justify-center tw-gap-px tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 md:tw-hidden"
            >
              <span
                aria-hidden="true"
                className="tw-text-[10px] tw-font-semibold tw-uppercase tw-leading-3 tw-tracking-[0.06em] tw-text-iron-500"
              >
                {formatUtcDate(locale, props.date.utcDay, { month: "short" })}
              </span>
              <span
                aria-hidden="true"
                className="tw-text-lg tw-font-semibold tw-leading-[22px] tw-text-iron-300"
              >
                {formatUtcDate(locale, props.date.utcDay, { day: "numeric" })}
              </span>
            </button>
            <Tooltip
              id={dateTooltipId}
              openEvents={{ mouseover: true, focus: true, click: true }}
              globalCloseEvents={{ escape: true, clickOutsideAnchor: true }}
              place="top"
              positionStrategy="fixed"
              offset={8}
              delayShow={250}
              opacity={1}
              style={TOOLTIP_STYLES}
            >
              {fullDate}
            </Tooltip>
          </>
        )}
        <div className="tw-grid tw-w-full tw-min-w-0 tw-flex-1 tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-2 tw-gap-y-1 tw-@container/drop-row md:tw-w-auto md:tw-gap-x-5">
          {props.date && (
            <div
              className={`tw-col-span-full tw-col-start-1 tw-row-start-2 tw-flex tw-min-w-0 tw-flex-nowrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-whitespace-nowrap tw-text-meta tw-font-normal tw-tabular-nums tw-leading-[18px] tw-text-iron-400 md:tw-col-span-1 md:tw-row-start-1 md:tw-flex-wrap md:tw-whitespace-normal md:tw-text-base md:tw-font-semibold md:tw-leading-6 ${subscribed ? "md:tw-text-iron-100" : ""}`}
            >
              {props.minting_today ? (
                <MintingTodayLabel
                  tokenId={props.subscription.token_id}
                  locale={locale}
                  showIndicator
                  className="tw-text-meta tw-font-normal tw-leading-[18px] tw-text-primary-300 md:tw-text-base md:tw-font-semibold md:tw-leading-6"
                />
              ) : (
                <time
                  dateTime={props.date.utcDay.toISOString()}
                  className="tw-min-w-0 tw-break-words"
                >
                  <span className="md:tw-hidden">
                    {props.artwork
                      ? fullDate
                      : formatUtcDate(locale, props.date.utcDay, {
                          weekday: "short",
                        })}
                  </span>
                  <span className="tw-hidden md:tw-inline">{fullDate}</span>
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
            className={`tw-col-start-1 tw-row-start-1 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-1.5 tw-text-[15px] tw-font-medium tw-tabular-nums tw-leading-5 md:tw-row-start-2 md:tw-text-sm md:tw-font-normal md:tw-text-iron-400 ${subscribed ? "tw-text-iron-100" : "tw-text-iron-300"} ${props.readonly ? "" : "max-md:tw-col-span-full max-md:@[220px]/drop-row:tw-col-span-1"}`}
          >
            <Link
              href={`/the-memes/${props.subscription.token_id}`}
              prefetch={false}
              className="tw-whitespace-normal tw-break-words tw-text-inherit tw-no-underline tw-decoration-white/20 tw-underline-offset-[3px] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-underline md:tw-whitespace-nowrap"
            >
              {props.title} #
              {formatInteger(locale, props.subscription.token_id)}
            </Link>
          </span>
          <div
            className={`tw-col-start-2 tw-row-start-1 tw-flex tw-shrink-0 tw-items-center tw-justify-end tw-gap-2 tw-self-center tw-justify-self-end md:tw-row-span-2 md:tw-gap-3 ${props.readonly ? "max-md:tw-flex-col-reverse max-md:tw-items-end max-md:tw-gap-0 max-md:tw-text-xs max-md:tw-leading-[17px]" : "max-md:tw-col-start-1 max-md:tw-row-start-3 max-md:tw-justify-self-start max-md:@[220px]/drop-row:tw-col-start-2 max-md:@[220px]/drop-row:tw-row-start-1 max-md:@[220px]/drop-row:tw-justify-self-end"}`}
          >
            {!props.readonly &&
              !props.controlsLoading &&
              !props.controlsUnavailable &&
              subscribed && (
                <span className="tw-inline-flex tw-shrink-0">
                  {renderCountSelector({ disableWhenSingleOption: true })}
                </span>
              )}
            {controls}
          </div>
          {allocationDetails && props.minting_today && (
            <button
              type="button"
              aria-expanded={showAllocationDetails}
              aria-controls={allocationDetailsId}
              onClick={() => setShowAllocationDetails((open) => !open)}
              className="tw-col-span-full tw-col-start-1 tw-inline-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-1.5 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-text-sm tw-font-normal tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-100 md:tw-hidden"
            >
              {t(locale, "subscriptions.upcoming.more")}
              <ChevronDownIcon
                aria-hidden="true"
                className={`tw-size-4 ${showAllocationDetails ? "tw-rotate-180" : ""}`}
              />
            </button>
          )}
          {!props.readonly &&
            !props.controlsLoading &&
            !props.controlsUnavailable &&
            props.minting_today &&
            isToggleDisabled && (
              <p className="tw-col-span-full tw-mb-0 tw-mt-0.5 tw-text-meta tw-font-normal tw-leading-[18px] tw-text-iron-500 md:tw-hidden">
                {t(locale, "profile.subscriptions.mintingToday.tooltip")}
              </p>
            )}
          {hasNoAllocation && (
            <output className="tw-col-span-full tw-text-meta tw-font-normal tw-leading-5 tw-text-iron-500">
              {t(locale, "profile.subscriptions.noAllocation")}
            </output>
          )}
          {allocationDetails && (
            <div className="tw-col-span-full tw-text-iron-500 md:tw-mt-1.5">
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
      </div>
    </div>
  );
}
