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
  "tw-m-0 tw-space-y-3 tw-pl-5 tw-text-sm tw-leading-6 tw-text-white/50 marker:tw-text-white/30";
const NESTED_LIST_CLASS =
  "tw-mt-3 tw-space-y-3 tw-pl-5 tw-text-white/40 marker:tw-text-white/20";
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
      <Delegation locale={locale} />
      <GasSavings locale={locale} />
      <RemoteMinting locale={locale} />
    </>
  );
}

function HowItWorks({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="subscription-how-it-works-heading"
      className="tw-px-1 tw-pb-24 sm:tw-px-2 sm:tw-pb-32"
    >
      <div className="tw-mb-16 tw-text-center">
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="subscription-how-it-works-heading"
        >
          {m(locale, "about.subscriptions.how.title")}
        </h2>
      </div>

      <div className="tw-grid tw-grid-cols-1 tw-gap-8 lg:tw-grid-cols-2">
        <RulePanel
          accentClassName="tw-border-t-orange-500/50"
          number="1"
          title={m(locale, "about.subscriptions.reference.funding.title")}
        >
          <div className="tw-space-y-4 tw-text-sm tw-leading-6 tw-text-white/50">
            <p className="tw-m-0">
              {m(locale, "about.subscriptions.reference.funding.send")}
            </p>
            <p className="tw-m-0">
              {m(locale, "about.subscriptions.reference.funding.calculator")}
            </p>
            <p className="tw-m-0">
              {m(locale, "about.subscriptions.reference.funding.profile")}
            </p>

            <div className="tw-mt-6 tw-rounded-lg tw-border tw-border-solid tw-border-orange-500/20 tw-bg-orange-500/10 tw-p-4 tw-text-orange-400/80">
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
              <p className="tw-mb-0 tw-mt-4">
                {m(locale, "about.subscriptions.reference.funding.deadline")}
              </p>
            </div>
          </div>
        </RulePanel>

        <RulePanel
          accentClassName="tw-border-t-[#00f0ff]/50"
          number="2"
          title={m(locale, "about.subscriptions.reference.modes.title")}
        >
          <div className="tw-space-y-6 tw-text-sm tw-leading-6 tw-text-white/50">
            <p className="tw-m-0">
              {m(locale, "about.subscriptions.reference.modes.auto")}
            </p>
            <div>
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
        </RulePanel>

        <RulePanel
          accentClassName="tw-border-t-[#7000ff]/50"
          className="lg:tw-col-span-2"
          number="3"
          title={m(locale, "about.subscriptions.reference.phases.title")}
        >
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-white/50">
            {m(locale, "about.subscriptions.reference.phases.same")}
          </p>

          <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-6 tw-text-sm tw-leading-6 tw-text-white/50 md:tw-grid-cols-2">
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

          <ul className={`${LIST_CLASS} tw-mt-6`}>
            <li>
              {m(locale, "about.subscriptions.reference.phases.guarantee")}
            </li>
            <li>
              {m(locale, "about.subscriptions.reference.phases.popular")}
            </li>
          </ul>
        </RulePanel>
      </div>
    </section>
  );
}

function Delegation({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="subscription-delegation-heading"
      className="tw-mx-auto tw-max-w-3xl tw-px-1 tw-pb-24 sm:tw-px-2"
    >
      <details
        className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-group tw-cursor-pointer tw-overflow-hidden`}
      >
        <summary className="tw-flex tw-min-h-16 tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-bg-iron-900/45 tw-px-6 tw-py-5 tw-text-white/80 tw-transition-colors hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-[#00f0ff]/50 sm:tw-px-8 [&::-webkit-details-marker]:tw-hidden">
          <span className="tw-flex tw-items-center tw-gap-3">
            <FontAwesomeIcon
              aria-hidden="true"
              className="tw-text-white/40"
              icon={faNetworkWired}
            />
            <span
              className="tw-text-lg tw-font-medium"
              id="subscription-delegation-heading"
            >
              {m(locale, "about.subscriptions.reference.delegation.title")}
            </span>
          </span>
          <FontAwesomeIcon
            aria-hidden="true"
            className="tw-shrink-0 tw-text-sm tw-text-white/30 tw-transition-transform tw-duration-300 group-open:-tw-rotate-180 motion-reduce:tw-transition-none"
            icon={faChevronDown}
          />
        </summary>
        <div className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/70 tw-px-6 tw-pb-8 tw-pt-5 sm:tw-px-8">
          <ul className={LIST_CLASS}>
            <li>
              {m(
                locale,
                "about.subscriptions.reference.delegation.intro"
              )}
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
              {m(
                locale,
                "about.subscriptions.reference.delegation.tapIntro"
              )}
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
    </section>
  );
}

function GasSavings({ locale }: { readonly locale: SupportedLocale }) {
  const oneCardGasSavings = formatPercent(locale, 0.8, 0);
  const tenCardGasSavings = formatPercent(locale, 0.98, 0);

  return (
    <section
      aria-labelledby="subscription-gas-savings-heading"
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/5 tw-px-1 tw-py-16 sm:tw-px-2 sm:tw-py-20"
    >
      <div className="tw-flex tw-items-center tw-gap-4">
        <span className="tw-flex tw-size-12 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#00f0ff]/10 tw-text-xl tw-text-[#00f0ff]">
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
        className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-mt-9 tw-border-t-2 tw-border-t-[#00f0ff]/50 tw-p-6 sm:tw-p-8`}
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
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/5 tw-px-1 tw-py-16 sm:tw-px-2 sm:tw-py-20"
    >
      <div className="tw-flex tw-items-center tw-gap-4">
        <span className="tw-flex tw-size-12 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#7000ff]/10 tw-text-xl tw-text-[#7000ff]">
          <FontAwesomeIcon aria-hidden="true" icon={faEarthAmericas} />
        </span>
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="subscription-remote-minting-heading"
        >
          {m(locale, "about.subscriptions.reference.remote.title")}
        </h2>
      </div>
      <ul className="tw-m-0 tw-mt-9 tw-grid tw-list-none tw-grid-cols-1 tw-gap-6 tw-p-0 md:tw-grid-cols-3">
        {REMOTE_MESSAGE_KEYS.map((messageKey) => (
          <li
            className={`${SUBSCRIPTIONS_INTERACTIVE_PANEL_CLASS} tw-p-6 tw-text-sm tw-leading-6 tw-text-white/40 sm:tw-p-8`}
            key={messageKey}
          >
            {m(locale, messageKey)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RulePanel({
  accentClassName,
  children,
  className = "",
  number,
  title,
}: {
  readonly accentClassName: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly number: string;
  readonly title: string;
}) {
  return (
    <div
      className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-border-t-2 tw-p-6 sm:tw-p-8 ${accentClassName} ${className}`}
    >
      <div className="tw-mb-6 tw-flex tw-items-center tw-gap-4">
        <span className="tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-text-sm tw-text-white/50">
          {number}
        </span>
        <h3 className="tw-m-0 tw-text-xl tw-font-medium tw-text-white/90">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
