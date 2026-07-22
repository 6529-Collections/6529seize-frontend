import {
  faChevronDown,
  faEarthAmericas,
  faGasPump,
  faNetworkWired,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";

import { formatInteger, formatNumber, formatPercent } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import {
  SUBSCRIPTIONS_INTERACTIVE_PANEL_CLASS,
  SUBSCRIPTIONS_PANEL_CLASS,
  SUBSCRIPTIONS_SECTION_HEADING_CLASS,
} from "./aboutSubscriptionsStyles";

type SubscriptionMessageKey = Extract<
  MessageKey,
  `about.subscriptions.${string}`
>;

const m = (
  locale: SupportedLocale,
  key: SubscriptionMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

const LIST_CLASS =
  "tw-m-0 tw-space-y-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-300 marker:tw-text-iron-600 sm:tw-space-y-3";
const NESTED_LIST_CLASS =
  "tw-mt-2 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400 marker:tw-text-iron-600 sm:tw-mt-3 sm:tw-space-y-3";
const TIMELINE_ITEM_CLASS =
  "tw-relative tw-grid tw-grid-cols-[2rem_minmax(0,1fr)] tw-gap-3 sm:tw-grid-cols-[2.5rem_minmax(0,1fr)] sm:tw-gap-5";
const TIMELINE_MARKER_CLASS =
  "tw-relative tw-z-10 tw-flex tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-bg-black tw-text-sm sm:tw-size-10";
const REMOTE_MESSAGE_KEYS = [
  "about.subscriptions.reference.remote.busy",
  "about.subscriptions.reference.remote.separate",
  "about.subscriptions.reference.remote.timezones",
] as const satisfies readonly SubscriptionMessageKey[];

export default function AboutSubscriptionsReference({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <HowItWorks locale={locale} />
      <GasSavings locale={locale} />
      <RemoteMinting locale={locale} />
    </>
  );
}

function HowItWorks({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="subscription-how-it-works-heading"
      className="tw-px-1 tw-pb-8 sm:tw-px-2 sm:tw-pb-12"
    >
      <div className="tw-mb-4 sm:tw-mb-5">
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="subscription-how-it-works-heading"
        >
          {m(locale, "about.subscriptions.how.title")}
        </h2>
      </div>

      <div className="tw-relative tw-max-w-5xl tw-space-y-8 sm:tw-space-y-12">
        <div
          aria-hidden="true"
          className="tw-absolute tw-bottom-4 tw-left-4 tw-top-4 tw-w-px tw-bg-iron-800 sm:tw-left-5"
        />

        <TimelineStep
          markerClassName="tw-border-orange-500/40 tw-text-orange-400"
          number="1"
          title={m(locale, "about.subscriptions.reference.funding.title")}
        >
          <div className="tw-space-y-3 tw-text-base tw-leading-7 tw-text-iron-300 sm:tw-space-y-4">
            <p className="tw-m-0">
              {m(locale, "about.subscriptions.reference.funding.send")}
            </p>
            <div className="tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-orange-500/20 tw-bg-orange-500/10 tw-p-4 tw-text-sm tw-text-orange-400/80 sm:tw-mt-6">
              <p className="tw-m-0 tw-flex tw-items-start tw-gap-2">
                <FontAwesomeIcon
                  aria-hidden="true"
                  className="tw-mt-1 tw-shrink-0 tw-text-orange-400"
                  icon={faTriangleExclamation}
                />
                <span>
                  <strong className="tw-font-medium tw-text-orange-400">
                    {m(
                      locale,
                      "about.subscriptions.reference.funding.nonRefundableLead"
                    )}
                  </strong>{" "}
                  {m(
                    locale,
                    "about.subscriptions.reference.funding.nonRefundableBody"
                  )}
                </span>
              </p>
            </div>
            <p className="tw-m-0">
              {m(locale, "about.subscriptions.reference.funding.calculator")}
            </p>
            <p className="tw-m-0">
              {m(locale, "about.subscriptions.reference.funding.profile")}
            </p>
            <p className="tw-m-0">
              {m(locale, "about.subscriptions.reference.funding.deadline")}
            </p>
          </div>
        </TimelineStep>

        <TimelineStep
          markerClassName="tw-border-[#00f0ff]/40 tw-text-[#00f0ff]"
          number="2"
          title={m(locale, "about.subscriptions.reference.modes.title")}
        >
          <div className="tw-space-y-4 tw-text-base tw-leading-7 tw-text-iron-300 sm:tw-space-y-6">
            <p className="tw-m-0">
              {m(locale, "about.subscriptions.reference.modes.auto")}
            </p>
            <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60 tw-p-4">
              <p className="tw-m-0">
                {m(locale, "about.subscriptions.reference.modes.optOut")}
              </p>
              <ul className={NESTED_LIST_CLASS}>
                <li>
                  {m(
                    locale,
                    "about.subscriptions.reference.modes.optOutDeadline"
                  )}
                </li>
                <li>
                  {m(
                    locale,
                    "about.subscriptions.reference.modes.revealTiming"
                  )}
                </li>
                <li>
                  {m(locale, "about.subscriptions.reference.modes.schedule")}
                </li>
              </ul>
            </div>
            <p className="tw-m-0">
              {m(locale, "about.subscriptions.reference.modes.manual")}
            </p>
          </div>
        </TimelineStep>

        <Delegation locale={locale} />

        <TimelineStep
          markerClassName="tw-border-[#7000ff]/40 tw-text-[#8f5cff]"
          number="3"
          title={m(locale, "about.subscriptions.reference.phases.title")}
        >
          <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300">
            {m(locale, "about.subscriptions.reference.phases.same")}
          </p>

          <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 tw-text-base tw-leading-7 tw-text-iron-300 sm:tw-mt-6 sm:tw-gap-6 md:tw-grid-cols-2">
            <div className="tw-space-y-3">
              <p className="tw-m-0">
                {m(locale, "about.subscriptions.reference.phases.zero")}
              </p>
            </div>
            <div>
              <p className="tw-m-0">
                {m(locale, "about.subscriptions.reference.phases.oneTwo")}
              </p>
              <ul className={NESTED_LIST_CLASS}>
                <li>
                  {m(
                    locale,
                    "about.subscriptions.reference.phases.unavailable"
                  )}
                </li>
                <li>
                  {m(locale, "about.subscriptions.reference.phases.order")}
                </li>
              </ul>
            </div>
          </div>

          <ul className={`${LIST_CLASS} tw-mt-4 sm:tw-mt-6`}>
            <li>
              {m(locale, "about.subscriptions.reference.phases.guarantee")}
            </li>
            <li>{m(locale, "about.subscriptions.reference.phases.popular")}</li>
          </ul>
        </TimelineStep>
      </div>
    </section>
  );
}

function Delegation({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className={TIMELINE_ITEM_CLASS}>
      <span
        aria-hidden="true"
        className={`${TIMELINE_MARKER_CLASS} tw-border-iron-700 tw-text-iron-500`}
      >
        <FontAwesomeIcon
          className="tw-text-xs sm:tw-text-sm"
          icon={faNetworkWired}
        />
      </span>
      <details
        className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-group tw-cursor-pointer tw-overflow-hidden`}
      >
        <summary className="tw-flex tw-min-h-12 tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-bg-iron-900/45 tw-px-4 tw-py-3 tw-text-iron-100 tw-transition-colors hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-[#00f0ff]/50 sm:tw-px-6 [&::-webkit-details-marker]:tw-hidden">
          <h3
            className="tw-m-0 tw-text-base tw-font-medium sm:tw-text-lg"
            id="subscription-delegation-heading"
          >
            {m(locale, "about.subscriptions.reference.delegation.title")}
          </h3>
          <FontAwesomeIcon
            aria-hidden="true"
            className="tw-shrink-0 tw-text-sm tw-text-iron-500 tw-transition-transform tw-duration-300 group-open:-tw-rotate-180 motion-reduce:tw-transition-none"
            icon={faChevronDown}
          />
        </summary>
        <div className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/70 tw-p-4 sm:tw-p-6">
          <ul className={LIST_CLASS}>
            <li>
              {m(locale, "about.subscriptions.reference.delegation.intro")}
            </li>
            <li>
              {m(
                locale,
                "about.subscriptions.reference.delegation.noDelegation"
              )}
            </li>
            <li>
              {m(
                locale,
                "about.subscriptions.reference.delegation.noConsolidation"
              )}
            </li>
            <li>
              {m(locale, "about.subscriptions.reference.delegation.order")}
              <ol className={NESTED_LIST_CLASS}>
                <li>
                  {m(
                    locale,
                    "about.subscriptions.reference.delegation.orderMemesAirdrop"
                  )}
                </li>
                <li>
                  {m(
                    locale,
                    "about.subscriptions.reference.delegation.orderMemesAll"
                  )}
                </li>
                <li>
                  {m(
                    locale,
                    "about.subscriptions.reference.delegation.orderAnyAirdrop"
                  )}
                </li>
                <li>
                  {m(
                    locale,
                    "about.subscriptions.reference.delegation.orderAnyAll"
                  )}
                </li>
              </ol>
            </li>
            <li>
              {m(locale, "about.subscriptions.reference.delegation.tapIntro")}
              <ul className={NESTED_LIST_CLASS}>
                <li>
                  {m(
                    locale,
                    "about.subscriptions.reference.delegation.tapSend"
                  )}
                </li>
                <li>
                  {m(
                    locale,
                    "about.subscriptions.reference.delegation.tapAirdrop"
                  )}
                </li>
              </ul>
            </li>
            <li>
              {m(
                locale,
                "about.subscriptions.reference.delegation.singleAddress"
              )}
            </li>
          </ul>
        </div>
      </details>
    </div>
  );
}

function GasSavings({ locale }: { readonly locale: SupportedLocale }) {
  const oneCardGasSavings = formatPercent(locale, 0.8, 0);
  const tenCardGasSavings = formatPercent(locale, 0.98, 0);

  return (
    <section
      aria-labelledby="subscription-gas-savings-heading"
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-px-1 tw-py-6 sm:tw-px-2 sm:tw-py-10"
    >
      <div className="tw-flex tw-items-center tw-gap-3 sm:tw-gap-4">
        <span className="tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#00f0ff]/10 tw-text-lg tw-text-[#00f0ff] sm:tw-size-12 sm:tw-text-xl">
          <FontAwesomeIcon aria-hidden="true" icon={faGasPump} />
        </span>
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="subscription-gas-savings-heading"
        >
          {m(locale, "about.subscriptions.reference.gas.title")}
        </h2>
      </div>
      <div
        className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-mt-4 tw-border-t-2 tw-border-t-[#00f0ff]/50 tw-p-4 sm:tw-mt-5 sm:tw-p-6`}
      >
        <ul className={LIST_CLASS}>
          <li>
            {m(locale, "about.subscriptions.reference.gas.context", {
              cardPrice: formatNumber(locale, 0.06529, {
                minimumFractionDigits: 5,
                maximumFractionDigits: 5,
              }),
            })}
            <ul className={NESTED_LIST_CLASS}>
              <li>
                {m(locale, "about.subscriptions.reference.gas.gwei20", {
                  gwei: formatInteger(locale, 20),
                  percent: formatPercent(locale, 0.034, 1),
                })}
              </li>
              <li>
                {m(locale, "about.subscriptions.reference.gas.gwei200", {
                  gwei: formatInteger(locale, 200),
                  percent: formatPercent(locale, 0.337, 1),
                })}
              </li>
            </ul>
          </li>
          <li>
            {m(locale, "about.subscriptions.reference.gas.transfer")}
            <ul className={NESTED_LIST_CLASS}>
              <li>
                {m(locale, "about.subscriptions.reference.gas.oneCard", {
                  percent: oneCardGasSavings,
                })}
              </li>
              <li>
                {m(locale, "about.subscriptions.reference.gas.tenCards", {
                  percent: tenCardGasSavings,
                })}
              </li>
            </ul>
          </li>
          <li>{m(locale, "about.subscriptions.reference.gas.absorbed")}</li>
        </ul>
      </div>
    </section>
  );
}

function RemoteMinting({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="subscription-remote-minting-heading"
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-px-1 tw-py-6 sm:tw-px-2 sm:tw-py-10"
    >
      <div className="tw-flex tw-items-center tw-gap-3 sm:tw-gap-4">
        <span className="tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#7000ff]/20 tw-text-lg tw-text-[#8f5cff] sm:tw-size-12 sm:tw-text-xl">
          <FontAwesomeIcon aria-hidden="true" icon={faEarthAmericas} />
        </span>
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="subscription-remote-minting-heading"
        >
          {m(locale, "about.subscriptions.reference.remote.title")}
        </h2>
      </div>
      <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 sm:tw-mt-5 md:tw-grid-cols-3 md:tw-gap-6">
        {REMOTE_MESSAGE_KEYS.map((messageKey) => (
          <li
            className={`${SUBSCRIPTIONS_INTERACTIVE_PANEL_CLASS} tw-p-4 tw-text-base tw-leading-7 tw-text-iron-400 md:tw-p-6`}
            key={messageKey}
          >
            {m(locale, messageKey)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function TimelineStep({
  children,
  markerClassName,
  number,
  title,
}: {
  readonly children: ReactNode;
  readonly markerClassName: string;
  readonly number: string;
  readonly title: string;
}) {
  return (
    <div className={TIMELINE_ITEM_CLASS}>
      <span className={`${TIMELINE_MARKER_CLASS} ${markerClassName}`}>
        {number}
      </span>
      <div className="tw-min-w-0">
        <h3 className="tw-m-0 tw-text-lg tw-font-medium tw-text-iron-100 sm:tw-text-xl">
          {title}
        </h3>
        <div className="tw-mt-4 sm:tw-mt-5">{children}</div>
      </div>
    </div>
  );
}
