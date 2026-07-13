import type { ReactNode } from "react";

import { formatInteger, formatNumber, formatPercent } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import {
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
  "tw-m-0 tw-space-y-3 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-primary-300";
const NESTED_LIST_CLASS =
  "tw-mt-3 tw-space-y-3 tw-pl-5 tw-text-iron-400 marker:tw-text-iron-600";
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
  const oneCardGasSavings = formatPercent(locale, 0.8, 0);
  const tenCardGasSavings = formatPercent(locale, 0.98, 0);

  return (
    <>
      <section
        aria-labelledby="subscription-how-it-works-heading"
        className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-px-1 tw-py-16 sm:tw-px-2 sm:tw-py-20"
      >
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="subscription-how-it-works-heading"
        >
          {m(locale, "about.subscriptions.how.title")}
        </h2>

        <div className="tw-mt-9 tw-grid tw-grid-cols-1 tw-gap-5 lg:tw-grid-cols-2">
          <ReferencePanel
            title={m(locale, "about.subscriptions.reference.funding.title")}
          >
            <ul className={LIST_CLASS}>
              <li>
                {m(locale, "about.subscriptions.reference.funding.send")}
              </li>
              <li>
                <strong className="tw-font-medium tw-text-iron-50">
                  {m(
                    locale,
                    "about.subscriptions.reference.funding.nonRefundableLead"
                  )}
                </strong>{" "}
                {m(
                  locale,
                  "about.subscriptions.reference.funding.nonRefundableBody"
                )}
              </li>
              <li>
                {m(
                  locale,
                  "about.subscriptions.reference.funding.calculator"
                )}
              </li>
              <li>
                {m(locale, "about.subscriptions.reference.funding.profile")}
              </li>
              <li>
                {m(locale, "about.subscriptions.reference.funding.deadline")}
              </li>
            </ul>
          </ReferencePanel>

          <ReferencePanel
            title={m(locale, "about.subscriptions.reference.modes.title")}
          >
            <ul className={LIST_CLASS}>
              <li>{m(locale, "about.subscriptions.reference.modes.auto")}</li>
              <li>
                {m(locale, "about.subscriptions.reference.modes.optOut")}
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
              </li>
              <li>
                {m(locale, "about.subscriptions.reference.modes.manual")}
              </li>
            </ul>
          </ReferencePanel>
        </div>

        <div className="tw-mt-5 tw-space-y-5">
          <ReferencePanel
            title={m(
              locale,
              "about.subscriptions.reference.delegation.title"
            )}
          >
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
                {m(
                  locale,
                  "about.subscriptions.reference.delegation.order"
                )}
                <ul className={NESTED_LIST_CLASS}>
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
                </ul>
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
          </ReferencePanel>

          <ReferencePanel
            title={m(locale, "about.subscriptions.reference.phases.title")}
          >
            <ul className={LIST_CLASS}>
              <li>{m(locale, "about.subscriptions.reference.phases.same")}</li>
              <li>{m(locale, "about.subscriptions.reference.phases.zero")}</li>
              <li>
                {m(locale, "about.subscriptions.reference.phases.oneTwo")}
                <ul className={NESTED_LIST_CLASS}>
                  <li>
                    {m(
                      locale,
                      "about.subscriptions.reference.phases.unavailable"
                    )}
                  </li>
                  <li>
                    {m(
                      locale,
                      "about.subscriptions.reference.phases.order"
                    )}
                  </li>
                </ul>
              </li>
              <li>
                {m(locale, "about.subscriptions.reference.phases.guarantee")}
              </li>
              <li>
                {m(locale, "about.subscriptions.reference.phases.popular")}
              </li>
            </ul>
          </ReferencePanel>
        </div>
      </section>

      <section
        aria-labelledby="subscription-gas-savings-heading"
        className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-px-1 tw-py-16 sm:tw-px-2 sm:tw-py-20"
      >
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="subscription-gas-savings-heading"
        >
          {m(locale, "about.subscriptions.reference.gas.title")}
        </h2>
        <div className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-mt-9 tw-p-6 sm:tw-p-8`}>
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

      <section
        aria-labelledby="subscription-remote-minting-heading"
        className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-px-1 tw-py-16 sm:tw-px-2 sm:tw-py-20"
      >
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="subscription-remote-minting-heading"
        >
          {m(locale, "about.subscriptions.reference.remote.title")}
        </h2>
        <ul className="tw-m-0 tw-mt-9 tw-grid tw-list-none tw-grid-cols-1 tw-gap-5 tw-p-0 md:tw-grid-cols-3">
          {REMOTE_MESSAGE_KEYS.map((messageKey) => (
            <li
              className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-p-6 tw-text-sm tw-leading-6 tw-text-iron-300`}
              key={messageKey}
            >
              {m(locale, messageKey)}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function ReferencePanel({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <div className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-p-6 sm:tw-p-8`}>
      <h3 className="tw-m-0 tw-text-xl tw-font-medium tw-text-iron-50">
        {title}
      </h3>
      <div className="tw-mt-6">{children}</div>
    </div>
  );
}
