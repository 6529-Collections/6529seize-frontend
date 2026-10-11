"use client";

import { formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import Link from "next/link";
import { DELEGATION_INLINE_LINK_CLASS_NAME } from "../delegation-ui";
import type { ConsolidationDeparture } from "./consolidation-groups";
import type { ConsolidationPlan } from "./consolidation-plan";

const CONSOLIDATION_TDH_EXPLAINER_PATH = "/network/tdh/consolidation";
const CONSOLIDATION_GUIDE_PATH =
  "/delegation/delegation-faq/register-consolidation";

const CONSOLIDATION_NOTICE_CLASS_NAME =
  "tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/40 tw-bg-amber-400/10 tw-p-4 tw-text-sm tw-leading-6 tw-text-amber-100";

const WARNING_KEYS = [
  "delegation.consolidationBuilder.warnings.control",
  "delegation.consolidationBuilder.warnings.merge",
  "delegation.consolidationBuilder.warnings.order",
  "delegation.consolidationBuilder.warnings.leave",
] as const;

/** What consolidating means, shown before any wallet is entered. */
export function ConsolidationBuilderWarnings(
  props: Readonly<{ locale: SupportedLocale }>
) {
  const { locale } = props;
  return (
    <section
      aria-labelledby="consolidation-builder-warnings"
      className="tw-mb-6 tw-rounded-lg tw-bg-iron-950 tw-p-4"
    >
      <h3
        id="consolidation-builder-warnings"
        className="tw-mb-2 tw-mt-0 tw-text-sm tw-font-semibold tw-text-iron-100"
      >
        {t(locale, "delegation.consolidationBuilder.warnings.title")}
      </h3>
      <ul className="tw-mb-3 tw-mt-0 tw-space-y-1 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300">
        {WARNING_KEYS.map((key) => (
          <li key={key}>{t(locale, key)}</li>
        ))}
      </ul>
      <div className="tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-2 tw-text-sm">
        <Link
          href={CONSOLIDATION_TDH_EXPLAINER_PATH}
          className={DELEGATION_INLINE_LINK_CLASS_NAME}
        >
          {t(locale, "delegation.consolidationBuilder.warnings.tdhLink")}
        </Link>
        <Link
          href={CONSOLIDATION_GUIDE_PATH}
          className={DELEGATION_INLINE_LINK_CLASS_NAME}
        >
          {t(locale, "delegation.consolidationBuilder.warnings.docsLink")}
        </Link>
      </div>
    </section>
  );
}

/**
 * Explains why the plan's steps wait, why older links are registered again,
 * and when the order of earlier registrations can split the consolidation.
 */
export function ConsolidationPlanNotices(
  props: Readonly<{
    locale: SupportedLocale;
    plan: Pick<
      ConsolidationPlan,
      "fourthSlotWait" | "reregistersStaleLinks" | "outOfOrder"
    >;
    activationDate: string;
  }>
) {
  const { locale, plan, activationDate } = props;
  const notices = [
    plan.fourthSlotWait === "all-steps" &&
      t(locale, "delegation.consolidationBuilder.fourthSlot.waits", {
        date: activationDate,
      }),
    plan.reregistersStaleLinks &&
      t(locale, "delegation.consolidationBuilder.fourthSlot.staleLinks", {
        date: activationDate,
      }),
    plan.outOfOrder && t(locale, "delegation.consolidationBuilder.outOfOrder"),
  ].filter((notice): notice is string => typeof notice === "string");

  return (
    <>
      {notices.map((notice) => (
        <p
          key={notice}
          className={`${CONSOLIDATION_NOTICE_CLASS_NAME} tw-mb-4 tw-mt-0`}
        >
          {notice}
        </p>
      ))}
    </>
  );
}

/** Names the wallets that will leave a consolidation they are in now. */
export function ConsolidationDepartureNotice(
  props: Readonly<{
    locale: SupportedLocale;
    departures: readonly ConsolidationDeparture[];
    getWalletLabel: (wallet: string) => string;
    getShortAddress: (wallet: string) => string;
  }>
) {
  const { locale, departures, getWalletLabel, getShortAddress } = props;
  if (departures.length === 0) {
    return null;
  }
  return (
    <ul
      className={`${CONSOLIDATION_NOTICE_CLASS_NAME} tw-mb-0 tw-mt-4 tw-list-none tw-space-y-1`}
    >
      {departures.map((departure) => (
        <li key={departure.separatedFrom.join(",")}>
          {t(locale, "delegation.consolidationBuilder.wallets.departure", {
            wallets: formatList(locale, departure.wallets.map(getWalletLabel)),
            others: formatList(
              locale,
              departure.separatedFrom.map(getShortAddress)
            ),
          })}
        </li>
      ))}
    </ul>
  );
}
