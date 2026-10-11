"use client";

import Link from "next/link";
import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import NetworkReferenceNavigation from "@/components/network/NetworkReferenceNavigation";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import {
  CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS,
  CONSOLIDATION_WALLET_LIMIT,
} from "@/constants/consolidation.constants";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  TDHRelatedLinks,
  TDHSectionNavigation,
  useTDHSectionHashFocus,
} from "../TDHPageNavigation";
import TDHSection, { TDH_FOCUS, TDH_PANEL, TDH_TEXT } from "../TDHSection";
import ConsolidationOrderSimulator from "./ConsolidationOrderSimulator";

type ConsolidationKey = Extract<
  MessageKey,
  `network.tdhConsolidation.${string}`
>;

const NAVIGATION = [
  { id: "consolidation-rules", key: "rules" },
  { id: "consolidation-add", key: "add" },
  { id: "consolidation-order", key: "order" },
  { id: "consolidation-remove", key: "remove" },
  { id: "consolidation-why", key: "why" },
  { id: "consolidation-protects", key: "protects" },
  { id: "consolidation-start", key: "start" },
  { id: "consolidation-tested", key: "tested" },
  { id: "consolidation-faq", key: "faq" },
] as const;
const NAVIGATION_IDS = NAVIGATION.map((item) => item.id);

const RULES = [
  "pairs",
  "limit",
  "newest",
  "collector",
  "expiry",
  "effects",
] as const;

// Registrations and transactions for each change; see the rules above. A
// group of n wallets has n(n-1)/2 pairs, each registered in both directions.
const CHANGES = [
  { key: "newThree", registrations: 6, transactions: [3], order: "any" },
  { key: "newFour", registrations: 12, transactions: [4], order: "any" },
  { key: "addFourth", registrations: 6, transactions: [4], order: "newLast" },
  {
    key: "addTwo",
    registrations: 10,
    transactions: [4],
    order: "newWalletsLast",
  },
  { key: "leave", registrations: null, transactions: [1], order: "leave" },
  { key: "replace", registrations: 6, transactions: [4, 1], order: "replace" },
  {
    key: "replaceInFour",
    registrations: 6,
    transactions: [1, 4],
    order: "replaceInFour",
  },
  { key: "lost", registrations: null, transactions: [3], order: "lost" },
] as const;

interface RuleComparison {
  readonly key: "mesh" | "majority" | "fanout" | "single";
  readonly signers: "all" | "two" | "one";
  readonly transactions: number;
  // Whether an outside wallet can join the full consolidation when an attacker
  // controls 0, 1, 2 or 3 of its wallets. Found by exhaustive search over the
  // registrations those wallets could sign.
  readonly addable: readonly [boolean, boolean, boolean, boolean];
}

const RULE_COMPARISON: readonly RuleComparison[] = [
  {
    key: "mesh",
    signers: "all",
    transactions: 4,
    addable: [false, false, false, true],
  },
  {
    key: "majority",
    signers: "two",
    transactions: 3,
    addable: [false, false, true, true],
  },
  {
    key: "fanout",
    signers: "one",
    transactions: 2,
    addable: [false, true, true, true],
  },
  {
    key: "single",
    signers: "one",
    transactions: 2,
    addable: [false, true, true, true],
  },
];

const CONTROLLED_WALLET_COUNTS = [0, 1, 2, 3] as const;

const PROTECTIONS = [
  { key: "adding", kind: "does" },
  { key: "old", kind: "does" },
  { key: "keys", kind: "doesNot" },
  { key: "managers", kind: "advice" },
  { key: "lock", kind: "advice" },
] as const;

const PROTECTION_LABELS: Record<
  (typeof PROTECTIONS)[number]["kind"],
  ConsolidationKey
> = {
  does: "network.tdhConsolidation.protects.doesLabel",
  doesNot: "network.tdhConsolidation.protects.doesNotLabel",
  advice: "network.tdhConsolidation.protects.adviceLabel",
};

const FAQ = ["friend", "before", "tdh", "profile", "order", "expiry"] as const;

// Point-in-time snapshot of the public API used for the analysis on this
// page, taken before the fourth-wallet start date and shown with its date.
// Refresh it if the analysis is re-run.
const LIVE_SNAPSHOT = {
  date: Date.UTC(2026, 9, 10),
  total: 673,
  two: 496,
  three: 177,
  ungatedChanges: 1,
} as const;
const RANDOM_GRAPHS = 500;
const RANDOM_SEQUENCES = 1000;

const GROUPING_SOURCE =
  "https://github.com/6529-Collections/6529seize-backend/blob/main/src/consolidation-tools.ts";
const TRACKING_ISSUE =
  "https://github.com/6529-Collections/6529seize-frontend/issues/4214";

const TABLE_HEADER =
  "tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400";
const TABLE_CELL =
  "tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 tw-align-top tw-text-sm tw-leading-6 tw-text-iron-300";
const DISCLOSURE =
  "tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 last:tw-border-b-0";
const SUMMARY = `tw-cursor-pointer tw-py-4 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100 ${TDH_FOCUS}`;
const LINK = `tw-text-primary-300 ${TDH_FOCUS}`;

function activationDate(locale: SupportedLocale) {
  return formatDate(locale, CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export default function TDHConsolidationPage() {
  const locale = useBrowserLocale();
  useSetTitle(t(locale, "network.tdhConsolidation.pageTitle"));
  useTDHSectionHashFocus(NAVIGATION_IDS);
  const date = activationDate(locale);
  const limit = formatInteger(locale, CONSOLIDATION_WALLET_LIMIT);

  return (
    <div className={NETWORK_REFERENCE_PAGE_CLASSES}>
      <AboutContentsDropdown
        className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
        currentHref="/network/tdh/consolidation"
        desktopFlush
        withDivider
      />
      <article className="tw-mx-auto tw-max-w-6xl tw-pb-8 tw-pt-7 sm:tw-pt-10">
        <header className="tw-pb-8 sm:tw-pb-10">
          <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-3xl">
            {t(locale, "network.tdhConsolidation.title")}
          </h1>
          <p className="tw-mb-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-200">
            {t(locale, "network.tdhConsolidation.intro", { date, limit })}
          </p>
          <TDHSectionNavigation
            label={t(locale, "network.tdhConsolidation.nav")}
            items={NAVIGATION.map(({ id, key }) => ({
              id,
              label: t(locale, `network.tdhConsolidation.nav.${key}`),
            }))}
          />
        </header>

        <TDHSection
          id="consolidation-rules"
          title={t(locale, "network.tdhConsolidation.rules.title")}
          description={t(locale, "network.tdhConsolidation.rules.description")}
        >
          <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 sm:tw-grid-cols-2">
            {RULES.map((rule) => (
              <li key={rule} className={`${TDH_PANEL} tw-p-5`}>
                <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-7 tw-text-iron-100">
                  {t(locale, `network.tdhConsolidation.rules.${rule}.title`)}
                </h3>
                <p className={`${TDH_TEXT} tw-mt-2`}>
                  {t(locale, `network.tdhConsolidation.rules.${rule}.body`, {
                    date,
                    limit,
                  })}
                </p>
              </li>
            ))}
          </ul>
        </TDHSection>

        <AddWalletSection locale={locale} />

        <TDHSection
          id="consolidation-order"
          title={t(locale, "network.tdhConsolidation.order.title")}
          description={t(locale, "network.tdhConsolidation.order.description")}
        >
          <ConsolidationOrderSimulator locale={locale} />
        </TDHSection>

        <TDHSection
          id="consolidation-remove"
          title={t(locale, "network.tdhConsolidation.remove.title")}
        >
          <div className="tw-space-y-4">
            {(["leave", "replace", "lost", "split"] as const).map((key) => (
              <p key={key} className={TDH_TEXT}>
                {t(locale, `network.tdhConsolidation.remove.${key}`)}
              </p>
            ))}
          </div>
        </TDHSection>

        <WhyEveryPairSection locale={locale} />

        <TDHSection
          id="consolidation-protects"
          title={t(locale, "network.tdhConsolidation.protects.title")}
        >
          <ul className="tw-m-0 tw-list-none tw-space-y-4 tw-p-0">
            {PROTECTIONS.map(({ key, kind }) => (
              <li key={key} className={`${TDH_PANEL} tw-p-5`}>
                <p className="tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
                  {t(locale, PROTECTION_LABELS[kind])}
                </p>
                <p className={`${TDH_TEXT} tw-mt-2`}>
                  {t(locale, `network.tdhConsolidation.protects.${key}`)}
                </p>
              </li>
            ))}
          </ul>
        </TDHSection>

        <TDHSection
          id="consolidation-start"
          title={t(locale, "network.tdhConsolidation.start.title")}
        >
          <div className="tw-space-y-4">
            <p className={TDH_TEXT}>
              {t(locale, "network.tdhConsolidation.start.body", { date })}
            </p>
            <p className={`${TDH_PANEL} ${TDH_TEXT} tw-p-5`}>
              {t(locale, "network.tdhConsolidation.start.data", {
                snapshotDate: formatDate(locale, LIVE_SNAPSHOT.date, {
                  dateStyle: "long",
                  timeZone: "UTC",
                }),
                total: formatInteger(locale, LIVE_SNAPSHOT.total),
                two: formatInteger(locale, LIVE_SNAPSHOT.two),
                three: formatInteger(locale, LIVE_SNAPSHOT.three),
                ungated: formatInteger(locale, LIVE_SNAPSHOT.ungatedChanges),
              })}
            </p>
          </div>
        </TDHSection>

        <TDHSection
          id="consolidation-tested"
          title={t(locale, "network.tdhConsolidation.tested.title")}
        >
          <div className="tw-space-y-4">
            <p className={TDH_TEXT}>
              {t(locale, "network.tdhConsolidation.tested.port", {
                total: formatInteger(locale, LIVE_SNAPSHOT.total),
              })}
            </p>
            <p className={TDH_TEXT}>
              {t(locale, "network.tdhConsolidation.tested.exhaustive")}
            </p>
            <p className={TDH_TEXT}>
              {t(locale, "network.tdhConsolidation.tested.properties", {
                graphs: formatInteger(locale, RANDOM_GRAPHS),
                sequences: formatInteger(locale, RANDOM_SEQUENCES),
              })}
            </p>
            <div className="tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-3 tw-text-sm">
              <Link className={LINK} href={GROUPING_SOURCE}>
                {t(locale, "network.tdhConsolidation.tested.source")}
              </Link>
              <Link className={LINK} href={TRACKING_ISSUE}>
                {t(locale, "network.tdhConsolidation.tested.issue")}
              </Link>
            </div>
          </div>
        </TDHSection>

        <TDHSection
          id="consolidation-faq"
          title={t(locale, "network.tdhConsolidation.faq.title")}
        >
          {FAQ.map((key) => (
            <details key={key} className={DISCLOSURE}>
              <summary className={SUMMARY}>
                {t(locale, `network.tdhConsolidation.faq.${key}.title`)}
              </summary>
              <p className={`${TDH_TEXT} tw-pb-5`}>
                {t(locale, `network.tdhConsolidation.faq.${key}.body`, {
                  date,
                })}
              </p>
            </details>
          ))}
        </TDHSection>

        <TDHSection
          id="consolidation-related"
          title={t(locale, "network.tdhConsolidation.related")}
        >
          <TDHRelatedLinks
            links={(
              [
                ["/network/tdh", "tdh"],
                ["/delegation/consolidation-use-cases", "guide"],
                ["/delegation/wallet-checker", "checker"],
                ["/delegation/delegation-center", "center"],
              ] as const
            ).map(([href, key]) => ({
              href,
              title: t(locale, `network.tdhConsolidation.related.${key}.title`),
              description: t(
                locale,
                `network.tdhConsolidation.related.${key}.description`
              ),
            }))}
          />
        </TDHSection>

        <NetworkReferenceNavigation
          currentHref="/network/tdh/consolidation"
          locale={locale}
        />
      </article>
    </div>
  );
}

function AddWalletSection({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <TDHSection
      id="consolidation-add"
      title={t(locale, "network.tdhConsolidation.add.title")}
      description={t(locale, "network.tdhConsolidation.add.description")}
    >
      <div className="tw-space-y-6">
        <ol className="tw-m-0 tw-list-none tw-space-y-4 tw-p-0">
          {(["step1", "step2"] as const).map((step, index) => (
            <li
              key={step}
              className="tw-grid tw-grid-cols-[2rem_minmax(0,1fr)] tw-gap-3"
            >
              <span className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-sm tw-font-medium tw-text-iron-200">
                {formatInteger(locale, index + 1)}
              </span>
              <p className={`${TDH_TEXT} tw-self-center`}>
                {t(locale, `network.tdhConsolidation.add.${step}`)}
              </p>
            </li>
          ))}
        </ol>
        <p className="tw-m-0 tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-600 tw-pl-4 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "network.tdhConsolidation.add.why")}
        </p>
        <div className={`${TDH_PANEL} tw-overflow-x-auto`}>
          <table className="tw-m-0 tw-w-full tw-border-collapse tw-border-0">
            <caption className="tw-sr-only">
              {t(locale, "network.tdhConsolidation.add.table.caption")}
            </caption>
            <thead className="tw-bg-iron-900/80">
              <tr>
                {(
                  ["change", "registrations", "transactions", "order"] as const
                ).map((column) => (
                  <th key={column} scope="col" className={TABLE_HEADER}>
                    {t(locale, `network.tdhConsolidation.add.table.${column}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHANGES.map((change) => (
                <tr key={change.key}>
                  <th
                    scope="row"
                    className={`${TABLE_CELL} tw-text-left tw-font-medium tw-text-iron-100`}
                  >
                    {t(
                      locale,
                      `network.tdhConsolidation.add.row.${change.key}`
                    )}
                  </th>
                  <td className={TABLE_CELL}>
                    {change.registrations === null
                      ? t(locale, "network.tdhConsolidation.add.notApplicable")
                      : formatInteger(locale, change.registrations)}
                  </td>
                  <td className={`${TABLE_CELL} tw-whitespace-nowrap`}>
                    {change.transactions
                      .map((count) => formatInteger(locale, count))
                      .join(" + ")}
                  </td>
                  <td className={TABLE_CELL}>
                    {t(
                      locale,
                      `network.tdhConsolidation.add.order.${change.order}`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link
          className={`${LINK} tw-text-sm`}
          href="/delegation/delegation-center"
        >
          {t(locale, "network.tdhConsolidation.add.cta")}
        </Link>
      </div>
    </TDHSection>
  );
}

function WhyEveryPairSection({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <TDHSection
      id="consolidation-why"
      title={t(locale, "network.tdhConsolidation.why.title")}
      description={t(locale, "network.tdhConsolidation.why.description")}
    >
      <div className="tw-space-y-6">
        <div className={`${TDH_PANEL} tw-overflow-x-auto`}>
          <table className="tw-m-0 tw-w-full tw-border-collapse tw-border-0">
            <caption className="tw-sr-only">
              {t(locale, "network.tdhConsolidation.why.table.caption")}
            </caption>
            <thead className="tw-bg-iron-900/80">
              <tr>
                {(["rule", "signers", "transactions", "problem"] as const).map(
                  (column) => (
                    <th key={column} scope="col" className={TABLE_HEADER}>
                      {t(
                        locale,
                        `network.tdhConsolidation.why.table.${column}`
                      )}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {RULE_COMPARISON.map((rule) => (
                <tr key={rule.key}>
                  <th
                    scope="row"
                    className={`${TABLE_CELL} tw-text-left tw-font-medium tw-text-iron-100`}
                  >
                    {t(locale, `network.tdhConsolidation.why.rule.${rule.key}`)}
                  </th>
                  <td className={TABLE_CELL}>
                    {t(
                      locale,
                      `network.tdhConsolidation.why.signers.${rule.signers}`
                    )}
                  </td>
                  <td className={TABLE_CELL}>
                    {formatInteger(locale, rule.transactions)}
                  </td>
                  <td className={TABLE_CELL}>
                    {t(
                      locale,
                      `network.tdhConsolidation.why.problem.${rule.key}`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tw-space-y-3">
          <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-7 tw-text-iron-100">
            {t(locale, "network.tdhConsolidation.why.matrix.title")}
          </h3>
          <p className={TDH_TEXT}>
            {t(locale, "network.tdhConsolidation.why.matrix.description")}
          </p>
          <div className={`${TDH_PANEL} tw-overflow-x-auto`}>
            <table className="tw-m-0 tw-w-full tw-border-collapse tw-border-0">
              <caption className="tw-sr-only">
                {t(locale, "network.tdhConsolidation.why.matrix.caption")}
              </caption>
              <thead className="tw-bg-iron-900/80">
                <tr>
                  <th scope="col" className={TABLE_HEADER}>
                    {t(locale, "network.tdhConsolidation.why.matrix.rule")}
                  </th>
                  {CONTROLLED_WALLET_COUNTS.map((count) => (
                    <th key={count} scope="col" className={TABLE_HEADER}>
                      {t(
                        locale,
                        "network.tdhConsolidation.why.matrix.controls",
                        {
                          count: formatInteger(locale, count),
                        }
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RULE_COMPARISON.map((rule) => (
                  <tr key={rule.key}>
                    <th
                      scope="row"
                      className={`${TABLE_CELL} tw-text-left tw-font-medium tw-text-iron-100`}
                    >
                      {t(
                        locale,
                        `network.tdhConsolidation.why.rule.${rule.key}`
                      )}
                    </th>
                    {CONTROLLED_WALLET_COUNTS.map((count) => (
                      <td
                        key={count}
                        className={`${TABLE_CELL} ${
                          rule.addable[count]
                            ? "tw-text-error"
                            : "tw-text-iron-300"
                        }`}
                      >
                        {t(
                          locale,
                          rule.addable[count]
                            ? "network.tdhConsolidation.why.matrix.yes"
                            : "network.tdhConsolidation.why.matrix.no"
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className={TDH_TEXT}>
          {t(locale, "network.tdhConsolidation.why.conclusion")}
        </p>
      </div>
    </TDHSection>
  );
}
