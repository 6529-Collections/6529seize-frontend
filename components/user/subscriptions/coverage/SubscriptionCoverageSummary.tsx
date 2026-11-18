"use client";

import type { ReactNode } from "react";
import { MEMES_CONTRACT } from "@/constants/constants";
import { useSubscriptionAllocationStatus } from "../useSubscriptionAllocationStatus";
import { useId } from "react";
import ButtonLink from "@/components/utils/button/ButtonLink";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import Link from "next/link";
import {
  ArrowRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { ApiSubscriptionCoverageStatus as Status } from "@/generated/models/ApiSubscriptionCoverageStatus";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import {
  formatSubscriptionCoverageDate,
  formatSubscriptionCoverageDeadline,
  getFundedDropsLabel,
} from "./subscriptionCoverage.helpers";

import {
  FUNDED_COUNT_STATUSES,
  getPartiallyFundedSubscriptionDrop,
  getSubscriptionCoverageSummaryPresentation,
  hasPassedSubscriptionDeadline,
  isImmediateSubscriptionShortfall,
  isMintDayCoverageShortfall,
  isNextDropSubscriptionPaid,
  shouldCheckSubscriptionPayment,
  type MintDaySubscriptionStatus,
} from "./subscriptionCoverageSummary.helpers";
import { useSubscriptionCoverageClock } from "./useSubscriptionCoverageClock";

const DEFAULT_FORECAST_DROP_LIMIT = 24;

const STATUS_TEXT_CLASS = {
  neutral: "tw-text-iron-300",
  positive: "tw-text-emerald-400",
  caution: "tw-text-amber-200",
  danger: "tw-text-error",
  muted: "tw-text-iron-400",
};

function navigateToSubscriptionSection(
  event: { preventDefault(): void },
  sectionFragment: string
) {
  event.preventDefault();
  if (globalThis.location.hash === sectionFragment) {
    // Reuse the section's scroll/focus handler on repeated clicks too.
    globalThis.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  // Keep native hash navigation so the existing section hook restores focus.
  globalThis.location.hash = sectionFragment;
}

const STATE_DESCRIPTIONS: Partial<
  Record<Status, { readonly owner: MessageKey; readonly visitor?: MessageKey }>
> = {
  [Status.NotSetUp]: {
    owner: "subscriptions.coverage.notSetUp.description",
  },
  [Status.NoCurrentEligibility]: {
    owner: "subscriptions.coverage.noEligibility.description",
    visitor: "subscriptions.coverage.visitor.noEligibility",
  },
  [Status.NoUpcomingSelections]: {
    owner: "subscriptions.coverage.noSelections.description",
    visitor: "subscriptions.coverage.visitor.noSelections",
  },
  [Status.Unknown]: {
    owner: "subscriptions.coverage.unknown.description",
    visitor: "subscriptions.coverage.visitor.unknown",
  },
};

function getDescriptionKey(
  coverage: ApiSubscriptionCoverage | undefined,
  isOwner: boolean,
  mintDayStatus: MintDaySubscriptionStatus | undefined
): MessageKey | undefined {
  if (mintDayStatus === "paid") return "subscriptions.coverage.summary.paid";
  if (mintDayStatus === "unavailable")
    return "subscriptions.coverage.summary.paymentUnavailable";
  if (!coverage)
    return isOwner
      ? "subscriptions.coverage.unavailable"
      : "subscriptions.coverage.visitor.unavailable";
  if (FUNDED_COUNT_STATUSES.includes(coverage.status)) {
    return !coverage.next_unfunded && coverage.fully_funded_drops === 0
      ? "subscriptions.coverage.visitor.unknown"
      : undefined;
  }
  return STATE_DESCRIPTIONS[coverage.status]?.[isOwner ? "owner" : "visitor"];
}

function CoveragePoint({
  point,
  separator = ", ",
}: Readonly<{
  point: { token_id: number; mint_at: Date };
  separator?: string;
}>) {
  const locale = useBrowserLocale();
  return (
    <>
      <Link
        href={`/the-memes/${point.token_id}`}
        className="tw-whitespace-nowrap tw-text-iron-300 tw-no-underline tw-decoration-white/20 tw-underline-offset-[3px] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-underline"
      >
        {t(locale, "subscriptions.coverage.memeToken", {
          token: formatInteger(locale, point.token_id),
        })}
      </Link>
      <span>{separator}</span>
      <span className="tw-whitespace-nowrap">
        {formatSubscriptionCoverageDate(locale, point.mint_at)}
      </span>
    </>
  );
}

type SubscriptionCoverageSummaryProps = Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  isLoading: boolean;
  isOwner: boolean;
  profileKey?: string;
  showFundingPrompt?: boolean;
  isStale?: boolean;
  action?: ReactNode;
  topUpAction?:
    | ReactNode
    | ((primary: boolean, forFutureDrops?: boolean) => ReactNode);
  children?: ReactNode;
}>;

export default function SubscriptionCoverageSummary(
  props: SubscriptionCoverageSummaryProps
) {
  const now = useSubscriptionCoverageClock(
    isImmediateSubscriptionShortfall(props.coverage) && !props.isStale
  );
  if (props.profileKey && props.coverage) {
    return (
      <MintDayCoverageSummary
        {...props}
        profileKey={props.profileKey}
        coverage={props.coverage}
        now={now}
      />
    );
  }
  return <CoverageSummaryContent {...props} now={now} />;
}

function MintDayCoverageSummary(
  props: SubscriptionCoverageSummaryProps & {
    readonly profileKey: string;
    readonly coverage: ApiSubscriptionCoverage;
    readonly now: number;
  }
) {
  const shouldCheck =
    !props.isStale &&
    shouldCheckSubscriptionPayment(props.coverage, props.now);
  const { final, isLoading, isError } = useSubscriptionAllocationStatus({
    profileKey: props.profileKey,
    contract: MEMES_CONTRACT.toLowerCase(),
    tokenId: props.coverage.next_unfunded?.token_id ?? 0,
    first: true,
    subscribed: shouldCheck,
    waitForRefresh:
      shouldCheck &&
      hasPassedSubscriptionDeadline(props.coverage, props.now),
  });
  let mintDayStatus: MintDaySubscriptionStatus = "unpaid";
  if (isNextDropSubscriptionPaid(props.coverage, final)) mintDayStatus = "paid";
  else if (isError) mintDayStatus = "unavailable";
  else if (isLoading || final === undefined) mintDayStatus = "checking";
  return (
    <CoverageSummaryContent
      {...props}
      {...(shouldCheck ? { mintDayStatus } : {})}
    />
  );
}

function CoverageSummaryContent({
  coverage,
  isLoading,
  isOwner,
  showFundingPrompt = true,
  isStale = false,
  action,
  topUpAction,
  children,
  mintDayStatus,
  now,
}: SubscriptionCoverageSummaryProps & {
  readonly mintDayStatus?: MintDaySubscriptionStatus;
  readonly now: number;
}) {
  const locale = useBrowserLocale();
  const status = coverage?.status ?? Status.Unknown;
  const presentation = getSubscriptionCoverageSummaryPresentation(
    locale,
    coverage,
    mintDayStatus
  );
  const descriptionKey = getDescriptionKey(coverage, isOwner, mintDayStatus);
  const description = descriptionKey
    ? t(locale, descriptionKey, {
        token: coverage?.next_unfunded
          ? formatInteger(locale, coverage.next_unfunded.token_id)
          : "",
        meme: coverage?.next_unfunded
          ? t(locale, "subscriptions.coverage.memeToken", {
              token: formatInteger(locale, coverage.next_unfunded.token_id),
            })
          : "",
      })
    : undefined;
  const immediateShortfall = isImmediateSubscriptionShortfall(coverage);
  const pending =
    (isLoading && !coverage) ||
    mintDayStatus === "checking" ||
    (immediateShortfall && !isStale && now === 0);
  const paid = mintDayStatus === "paid";
  const paymentUnavailable = mintDayStatus === "unavailable";
  const deadlinePassed =
    !isStale &&
    mintDayStatus === "unpaid" &&
    hasPassedSubscriptionDeadline(coverage, now);
  const partial = getPartiallyFundedSubscriptionDrop(coverage);
  const showFundedCount = !!coverage && FUNDED_COUNT_STATUSES.includes(status);
  const fundedThrough =
    coverage && coverage.fully_funded_drops > 0
      ? coverage.funded_through
      : null;
  const deadline =
    showFundingPrompt && isOwner && !pending && !paid && !paymentUnavailable
      ? coverage?.next_unfunded?.top_up_deadline
      : null;
  const showNextUnfunded =
    !!coverage?.next_unfunded && !deadline && !paid && !pending;
  const showChooseDrops =
    showFundingPrompt &&
    isOwner &&
    presentation.action === "choose_drops" &&
    !pending;
  const showSetUp =
    showFundingPrompt && isOwner && status === Status.NotSetUp && !pending;
  const showHistory =
    showFundingPrompt && isOwner && deadlinePassed && !pending;
  const showActions =
    showFundingPrompt &&
    isOwner &&
    !pending &&
    (showChooseDrops || showSetUp || showHistory || !!topUpAction);
  let statusTone: keyof typeof STATUS_TEXT_CLASS =
    !isOwner && presentation.tone !== "positive"
      ? "neutral"
      : presentation.tone;
  let statusLabel = presentation.label;
  if (isStale) {
    statusTone = "muted";
    statusLabel = t(locale, "subscriptions.coverage.summary.lastKnown");
  } else if (deadlinePassed) {
    statusTone = "muted";
    statusLabel = t(locale, "subscriptions.coverage.summary.deadlinePassed");
  }
  const showStatus =
    showFundedCount &&
    !pending &&
    !paymentUnavailable &&
    (isOwner ||
      !immediateShortfall ||
      paid ||
      isStale ||
      deadlinePassed ||
      paymentUnavailable);
  let headline = presentation.label;
  if (paid) headline = t(locale, "subscriptions.coverage.summary.paidTitle");
  else if (paymentUnavailable) headline = presentation.label;
  else if (immediateShortfall && !isStale && coverage?.next_unfunded) {
    const today =
      isOwner && !deadlinePassed && isMintDayCoverageShortfall(coverage, now);
    let headlineKey: MessageKey = "subscriptions.coverage.summary.uncovered";
    if (partial)
      headlineKey = "subscriptions.coverage.summary.partiallyCovered";
    if (today)
      headlineKey = partial
        ? "subscriptions.coverage.summary.partiallyCoveredToday"
        : "subscriptions.coverage.summary.uncoveredToday";
    headline = t(locale, headlineKey, {
      token: formatInteger(locale, coverage.next_unfunded.token_id),
    });
  } else if (
    showFundedCount &&
    coverage.fully_funded_drops === DEFAULT_FORECAST_DROP_LIMIT
  )
    headline = t(locale, "subscriptions.coverage.summary.nextFundedDrops", {
      count: formatInteger(locale, coverage.fully_funded_drops),
    });
  else if (showFundedCount)
    headline = getFundedDropsLabel(locale, coverage.fully_funded_drops);

  const primaryTopUp =
    !isStale &&
    !paid &&
    !deadlinePassed &&
    (presentation.tone === "danger" || presentation.tone === "caution");
  let topUp: ReactNode;
  if (showFundingPrompt && isOwner && !pending && !showSetUp) {
    if (typeof topUpAction === "function") {
      topUp = deadlinePassed
        ? topUpAction(false, true)
        : topUpAction(primaryTopUp);
    } else topUp = topUpAction;
  }
  let deadlineMessage: MessageKey = "subscriptions.coverage.topUpBy";
  if (partial)
    deadlineMessage =
      partial.missing_mints === 1
        ? "subscriptions.coverage.summary.partialDeadline.one"
        : "subscriptions.coverage.summary.partialDeadline.many";
  if (deadlinePassed || isStale)
    deadlineMessage = "subscriptions.coverage.summary.expiredDeadline";
  let sectionAction:
    | { hash: string; label: MessageKey; primary: boolean }
    | undefined;
  if (showSetUp)
    sectionAction = {
      hash: "#profile-subscriptions-settings",
      label: "subscriptions.coverage.action.setUp",
      primary: true,
    };
  else if (showChooseDrops)
    sectionAction = {
      hash: "#profile-subscriptions-upcoming",
      label: "subscriptions.coverage.action.chooseDrops",
      primary: true,
    };
  else if (showHistory)
    sectionAction = {
      hash: "#profile-subscriptions-history",
      label: "subscriptions.coverage.summary.viewHistory",
      primary: false,
    };

  return (
    <>
      <div className="tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-gap-x-5">
        <div
          className={`tw-min-w-0 ${showChooseDrops ? "sm:tw-col-span-full" : ""}`}
        >
          {showStatus && (
            <span
              id="profile-subscriptions-overview-status"
              className={`tw-mb-2 tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-leading-5 ${STATUS_TEXT_CLASS[statusTone]}`}
            >
              <span
                aria-hidden="true"
                className="tw-size-1.5 tw-shrink-0 tw-rounded-full tw-bg-current"
              />
              {statusLabel}
            </span>
          )}
          <h2
            id="profile-subscriptions-overview-title"
            tabIndex={-1}
            aria-describedby={
              pending
                ? undefined
                : [
                    showStatus ? "profile-subscriptions-overview-status" : null,
                    showFundingPrompt && description
                      ? "profile-subscriptions-overview-description"
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
            }
            className={`tw-m-0 tw-font-semibold tw-tracking-tight focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${pending ? "tw-text-sm tw-font-normal tw-text-iron-400" : "tw-text-2xl tw-text-iron-100 sm:tw-text-[28px] sm:tw-leading-9"}`}
          >
            {pending ? t(locale, "subscriptions.coverage.loading") : headline}
          </h2>
          {!isOwner &&
            partial &&
            !paid &&
            !paymentUnavailable &&
            !pending &&
            !isStale && (
              <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(locale, "subscriptions.coverage.summary.partialEditions", {
                  funded: formatInteger(locale, partial.funded_mints),
                  total: formatInteger(locale, partial.requested_mints),
                })}
              </p>
            )}
          {showFundingPrompt && !pending && description && (
            <p
              id="profile-subscriptions-overview-description"
              className="tw-mb-0 tw-mt-2 tw-text-pretty tw-text-sm tw-leading-6 tw-text-iron-400"
            >
              {paid && coverage?.next_unfunded
                ? tRich(locale, "subscriptions.coverage.summary.paid", {
                    meme: (
                      <CoveragePoint
                        key="meme"
                        point={coverage.next_unfunded}
                      />
                    ),
                  })
                : description}
            </p>
          )}
          {fundedThrough && (
            <p className="tw-mb-0 tw-mt-2 tw-text-pretty tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(locale, "subscriptions.coverage.fundedThrough")}{" "}
              <CoveragePoint point={fundedThrough} separator=" · " />
            </p>
          )}
          {deadline && coverage?.next_unfunded && (
            <p className="tw-mb-0 tw-mt-3 tw-text-pretty tw-rounded-lg tw-bg-white/[0.04] tw-px-3 tw-py-2.5 tw-text-sm tw-leading-6 tw-text-iron-200">
              {tRich(locale, deadlineMessage, {
                deadline: (
                  <span
                    key="deadline"
                    className="tw-font-medium tw-text-iron-100"
                  >
                    {formatSubscriptionCoverageDeadline(locale, deadline)}
                  </span>
                ),
                token: formatInteger(locale, coverage.next_unfunded.token_id),
                count: partial
                  ? formatInteger(locale, partial.missing_mints)
                  : "",
              })}
            </p>
          )}
        </div>
        {showActions && (
          <div
            className={`tw-grid tw-w-full tw-gap-2 sm:tw-w-auto sm:tw-self-end ${showChooseDrops ? "tw-grid-cols-2 sm:tw-col-start-1 sm:tw-flex sm:tw-justify-self-start" : "tw-grid-cols-1 sm:tw-col-start-2"}`}
          >
            {sectionAction && (
              <ButtonLink
                href={sectionAction.hash}
                onNavigate={(event) => {
                  if (sectionAction)
                    navigateToSubscriptionSection(event, sectionAction.hash);
                }}
                variant={sectionAction.primary ? "primary" : "secondary"}
                size={null}
                className="tw-min-h-11 tw-min-w-0 tw-px-3 tw-py-1.5 tw-text-sm sm:tw-min-h-9"
              >
                {t(locale, sectionAction.label)}
                {showChooseDrops && (
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="tw-hidden tw-size-4 sm:tw-block"
                  />
                )}
              </ButtonLink>
            )}
            {!showSetUp && !showHistory && topUp}
          </div>
        )}
      </div>
      <div
        id="subscription-overview-actions"
        className="tw-mt-6 tw-grid tw-min-w-0 tw-grid-cols-[minmax(0,1fr)_max-content] tw-gap-x-4 tw-gap-y-0.5 tw-text-sm max-[383px]:tw-grid-cols-1 sm:tw-mt-auto sm:tw-flex sm:tw-flex-row sm:tw-flex-wrap sm:tw-gap-x-5 sm:tw-gap-y-3 sm:tw-pt-6"
      >
        {action}
        <SubscriptionCoverageForecast
          coverage={coverage}
          isLoading={pending}
          description={!coverage ? description : undefined}
        />
        {paid && coverage && (
          <p className="tw-col-span-full tw-m-0 tw-text-sm tw-text-iron-400">
            {t(locale, "subscriptions.coverage.summary.remainingBalance", {
              funded: getFundedDropsLabel(locale, coverage.fully_funded_drops),
            })}
          </p>
        )}
        {showNextUnfunded && coverage?.next_unfunded && (
          <dl className="tw-col-span-full tw-m-0 tw-flex tw-min-w-0 tw-items-baseline tw-justify-between tw-gap-3 tw-text-sm sm:tw-justify-start sm:tw-gap-2">
            <dt className="tw-shrink-0 tw-text-iron-500">
              {t(locale, "subscriptions.coverage.nextUnfunded")}
            </dt>
            <dd className="tw-m-0 tw-min-w-0 tw-text-right tw-font-medium tw-text-iron-100 sm:tw-text-left">
              <CoveragePoint point={coverage.next_unfunded} />
            </dd>
          </dl>
        )}
      </div>
      {showHistory && topUp && <div className="tw-mt-4">{topUp}</div>}
      {children}
    </>
  );
}

function SubscriptionCoverageForecast({
  coverage,
  isLoading,
  description,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  isLoading: boolean;
  description: string | undefined;
}>) {
  const locale = useBrowserLocale();
  const tooltipId = useId();
  return (
    <div
      className="tw-col-start-2 tw-row-span-3 tw-row-start-1 tw-grid tw-min-w-0 tw-grid-rows-subgrid tw-items-start tw-gap-y-0.5 tw-text-sm max-[383px]:tw-col-start-1 max-[383px]:tw-row-start-auto sm:tw-row-span-1 sm:tw-flex sm:tw-items-center sm:tw-justify-start sm:tw-gap-2"
      aria-busy={isLoading}
    >
      <div className="tw-flex tw-min-h-6 tw-items-center tw-gap-1 tw-text-sm tw-font-normal tw-text-iron-500">
        <span>{t(locale, "subscriptions.coverage.allocated")}</span>
        {!isLoading && (
          <button
            type="button"
            aria-label={t(locale, "subscriptions.coverage.allocated")}
            aria-describedby={tooltipId}
            data-tooltip-id={tooltipId}
            className="-tw-mx-3.5 -tw-my-2.5 tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-100 sm:-tw-mx-1.5 sm:tw-size-7"
          >
            <InformationCircleIcon className="tw-size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="tw-m-0 tw-flex tw-min-h-7 tw-items-center tw-whitespace-nowrap tw-text-base tw-font-semibold tw-tabular-nums tw-text-iron-100 sm:tw-min-h-6 sm:tw-text-sm sm:tw-font-medium">
        {isLoading && (
          <span
            aria-hidden="true"
            className="tw-h-4 tw-w-24 tw-animate-pulse tw-rounded-md tw-bg-iron-800 motion-reduce:tw-animate-none"
          />
        )}
        {!isLoading &&
          (coverage
            ? `${formatInteger(locale, coverage.allocated_mints)} ${t(locale, "subscriptions.coverage.allocatedUnit")}`
            : t(locale, "subscriptions.details.unavailable"))}
      </p>
      {!isLoading && (
        <BodyPortalTooltip
          id={tooltipId}
          place="top"
          offset={8}
          delayShow={250}
          opacity={1}
          openEvents={{ mouseover: true, focus: true, click: true }}
          globalCloseEvents={{ escape: true, clickOutsideAnchor: true }}
          style={TOOLTIP_STYLES}
        >
          <div className="tw-max-w-[min(18rem,calc(100vw-2rem))] tw-text-pretty tw-text-meta tw-font-normal">
            <p className="tw-mb-1 tw-mt-0 tw-font-normal">
              {t(locale, "subscriptions.coverage.title")}
            </p>
            {coverage && description && (
              <p className="tw-mb-1 tw-mt-0">{description}</p>
            )}
            {coverage && (
              <p className="tw-m-0">
                {t(locale, "subscriptions.coverage.basis")}
              </p>
            )}
            {!coverage && <p className="tw-m-0">{description}</p>}
          </div>
        </BodyPortalTooltip>
      )}
    </div>
  );
}
