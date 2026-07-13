import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";

import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type SubscriptionMessageKey = Extract<
  MessageKey,
  `about.subscriptions.${string}`
>;

const m = (locale: SupportedLocale, key: SubscriptionMessageKey) =>
  t(locale, key);

const LIST_CLASS =
  "tw-m-0 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-iron-600";
const NESTED_LIST_CLASS =
  "tw-mt-2 tw-space-y-2 tw-pl-5 tw-text-iron-400 marker:tw-text-iron-600";

export default function AboutSubscriptionsReference({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section
      aria-labelledby="subscription-reference-heading"
      className="tw-px-1 tw-pt-14 sm:tw-px-2 sm:tw-pt-16"
    >
      <div className="tw-max-w-2xl">
        <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-500">
          {m(locale, "about.subscriptions.reference.eyebrow")}
        </p>
        <h2
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50 sm:tw-text-3xl"
          id="subscription-reference-heading"
        >
          {m(locale, "about.subscriptions.reference.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-400">
          {m(locale, "about.subscriptions.reference.body")}
        </p>
      </div>

      <div className="tw-mt-8 tw-space-y-3">
        <ReferenceDisclosure
          summary={m(locale, "about.subscriptions.reference.funding.summary")}
          title={m(locale, "about.subscriptions.reference.funding.title")}
        >
          <ul className={LIST_CLASS}>
            <li>{m(locale, "about.subscriptions.reference.funding.send")}</li>
            <li>
              <strong className="tw-font-semibold tw-text-iron-100">
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
              {m(locale, "about.subscriptions.reference.funding.calculator")}
            </li>
            <li>
              {m(locale, "about.subscriptions.reference.funding.profile")}
            </li>
            <li>
              {m(locale, "about.subscriptions.reference.funding.deadline")}
            </li>
          </ul>
        </ReferenceDisclosure>

        <ReferenceDisclosure
          summary={m(locale, "about.subscriptions.reference.modes.summary")}
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
            <li>{m(locale, "about.subscriptions.reference.modes.manual")}</li>
          </ul>
        </ReferenceDisclosure>

        <ReferenceDisclosure
          summary={m(
            locale,
            "about.subscriptions.reference.delegation.summary"
          )}
          title={m(locale, "about.subscriptions.reference.delegation.title")}
        >
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
        </ReferenceDisclosure>

        <ReferenceDisclosure
          summary={m(locale, "about.subscriptions.reference.phases.summary")}
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
                  {m(locale, "about.subscriptions.reference.phases.order")}
                </li>
              </ul>
            </li>
            <li>
              {m(locale, "about.subscriptions.reference.phases.guarantee")}
            </li>
            <li>{m(locale, "about.subscriptions.reference.phases.popular")}</li>
          </ul>
        </ReferenceDisclosure>

        <ReferenceDisclosure
          summary={m(locale, "about.subscriptions.reference.gas.summary")}
          title={m(locale, "about.subscriptions.reference.gas.title")}
        >
          <ul className={LIST_CLASS}>
            <li>
              {m(locale, "about.subscriptions.reference.gas.context")}
              <ul className={NESTED_LIST_CLASS}>
                <li>{m(locale, "about.subscriptions.reference.gas.gwei20")}</li>
                <li>
                  {m(locale, "about.subscriptions.reference.gas.gwei200")}
                </li>
              </ul>
            </li>
            <li>
              {m(locale, "about.subscriptions.reference.gas.transfer")}
              <ul className={NESTED_LIST_CLASS}>
                <li>
                  {m(locale, "about.subscriptions.reference.gas.oneCard")}
                </li>
                <li>
                  {m(locale, "about.subscriptions.reference.gas.tenCards")}
                </li>
              </ul>
            </li>
            <li>{m(locale, "about.subscriptions.reference.gas.absorbed")}</li>
          </ul>
        </ReferenceDisclosure>

        <ReferenceDisclosure
          summary={m(locale, "about.subscriptions.reference.remote.summary")}
          title={m(locale, "about.subscriptions.reference.remote.title")}
        >
          <ul className={LIST_CLASS}>
            <li>{m(locale, "about.subscriptions.reference.remote.busy")}</li>
            <li>
              {m(locale, "about.subscriptions.reference.remote.separate")}
            </li>
            <li>
              {m(locale, "about.subscriptions.reference.remote.timezones")}
            </li>
          </ul>
        </ReferenceDisclosure>
      </div>

      <p className="tw-mb-0 tw-mt-6 tw-text-sm tw-leading-6 tw-text-iron-400">
        {m(locale, "about.subscriptions.reference.reportLead")}{" "}
        <Link
          className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300 tw-no-underline tw-transition-colors"
          href="/tools/subscriptions-report"
        >
          {m(locale, "about.subscriptions.reference.reportLink")}
        </Link>
        .
      </p>
    </section>
  );
}

function ReferenceDisclosure({
  children,
  summary,
  title,
}: {
  readonly children: ReactNode;
  readonly summary: string;
  readonly title: string;
}) {
  return (
    <details className="tw-group tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.025] open:tw-bg-white/[0.04]">
      <summary className="tw-flex tw-min-h-16 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-rounded-xl tw-px-5 tw-py-4 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 [&::-webkit-details-marker]:tw-hidden">
        <span className="tw-min-w-0">
          <span className="tw-block tw-text-base tw-font-semibold tw-text-iron-100">
            {title}
          </span>
          <span className="tw-mt-1 tw-block tw-text-sm tw-leading-5 tw-text-iron-500">
            {summary}
          </span>
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className="tw-size-5 tw-shrink-0 tw-text-iron-500 tw-transition-transform tw-duration-200 group-open:tw-rotate-180 motion-reduce:tw-transition-none"
        />
      </summary>
      <div className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-px-5 tw-py-5 sm:tw-px-6">
        {children}
      </div>
    </details>
  );
}
