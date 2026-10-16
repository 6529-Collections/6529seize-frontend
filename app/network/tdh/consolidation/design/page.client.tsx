"use client";

import Link from "next/link";
import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import { useConsolidationPolicy } from "@/hooks/useConsolidationPolicy";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  TDHRelatedLinks,
  TDHSectionNavigation,
  useTDHSectionHashFocus,
} from "../../TDHPageNavigation";
import TdhSource from "../../shared/TdhSource";
import TdhStackTable from "../../shared/TdhStackTable";
import TdhTableFrame from "../../shared/TdhTableFrame";
import TdhSubnav from "../../shared/TdhSubnav";
import {
  TDH_CAPTION,
  TDH_H1,
  TDH_LEDE,
  TDH_TABLE,
  TDH_TD,
  TDH_TH,
  tdhNarrowCell,
} from "../../shared/tdhStyles";
import TDHSection, { TDH_FOCUS, TDH_PANEL, TDH_TEXT } from "../../TDHSection";
import ConsolidationOrderSimulator from "../ConsolidationOrderSimulator";

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

const LINK = `tw-text-primary-300 ${TDH_FOCUS}`;

function activationDate(
  locale: SupportedLocale,
  activationMs: number | undefined
) {
  if (activationMs === undefined)
    return t(locale, "network.tdhConsolidation.policy.pendingDate");
  return formatDate(locale, activationMs, {
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

export default function TDHConsolidationDesignPage() {
  const locale = useBrowserLocale();
  useSetTitle(t(locale, "network.tdhConsolidation.design.pageTitle"));
  useTDHSectionHashFocus(NAVIGATION_IDS);
  const { policy, limits } = useConsolidationPolicy();
  const date = activationDate(locale, policy?.activationMs);
  const limit = limits ? formatInteger(locale, limits.maxWallets) : "";
  const pendingLimits = t(
    locale,
    "network.tdhConsolidation.policy.pendingLimits"
  );

  return (
    <div className={NETWORK_REFERENCE_PAGE_CLASSES}>
      <AboutContentsDropdown
        className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
        currentHref="/network/tdh/consolidation"
        desktopFlush
        withDivider
      />
      <article className="tw-mx-auto tw-max-w-6xl tw-pb-8">
        <TdhSubnav current="/network/tdh/consolidation" locale={locale} />
        <header className="tw-pb-8 tw-pt-5 sm:tw-pb-10 sm:tw-pt-8">
          <h1 className={TDH_H1}>
            {t(locale, "network.tdhConsolidation.design.title")}
          </h1>
          <p className={`tw-mb-0 tw-mt-4 tw-max-w-3xl ${TDH_LEDE}`}>
            {limits
              ? t(locale, "network.tdhConsolidation.design.intro", {
                  date,
                  limit,
                })
              : pendingLimits}
          </p>
          <p className="tw-mb-0 tw-mt-3 tw-max-w-3xl tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-amber-400/70 tw-bg-amber-400/[0.05] tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-leading-6 tw-text-iron-200">
            {t(locale, "network.tdhConsolidation.tdhv1Note")}
            <TdhSource refs={["P26 §6.3", "D132"]} locale={locale} />{" "}
            <Link className={LINK} href="/network/tdh/how-it-works#step-10">
              {t(locale, "network.tdhConsolidation.tdhv1Link")}
            </Link>
          </p>
          <p className="tw-mb-0 tw-mt-3 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "network.tdhConsolidation.design.guideNote")}{" "}
            <Link className={LINK} href="/network/tdh/consolidation">
              {t(locale, "network.tdhConsolidation.design.guideLink")}
            </Link>
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
          <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-items-start tw-gap-4 tw-p-0 sm:tw-grid-cols-2">
            {RULES.map((rule) => (
              <li key={rule} className={`${TDH_PANEL} tw-p-5`}>
                <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-7 tw-text-iron-100">
                  {t(locale, `network.tdhConsolidation.rules.${rule}.title`)}
                </h3>
                <p className={`${TDH_TEXT} tw-mt-2`}>
                  {!limits && rule === "limit"
                    ? pendingLimits
                    : t(locale, `network.tdhConsolidation.rules.${rule}.body`, {
                        date,
                        limit,
                      })}
                </p>
                {rule === "limit" && (
                  <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-amber-200">
                    {t(locale, "network.tdhConsolidation.rules.limit.status")}
                  </p>
                )}
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
          <p className="tw-m-0 tw-mb-4 tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-amber-400/70 tw-bg-amber-400/[0.05] tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-leading-6 tw-text-iron-200">
            {t(locale, "network.tdhConsolidation.order.status")}
          </p>
          <ConsolidationOrderSimulator
            locale={locale}
            activationDate={date}
            limits={limits}
          />
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
                snapshotDate: formatDate(locale, LIVE_SNAPSHOT.date, {
                  dateStyle: "long",
                  timeZone: "UTC",
                }),
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
          id="consolidation-related"
          title={t(locale, "network.tdhConsolidation.related")}
        >
          <TDHRelatedLinks
            variant="list"
            links={(
              [
                ["/network/tdh/consolidation", "consolidationGuide"],
                ["/network/tdh", "tdh"],
                ["/safe-collecting/wallet-checker", "checker"],
                ["/safe-collecting", "center"],
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
        <TdhStackTable
          label={t(locale, "network.tdhConsolidation.add.table.caption")}
          columns={(
            ["change", "registrations", "transactions", "order"] as const
          ).map((column) => ({
            key: column,
            label: t(locale, `network.tdhConsolidation.add.table.${column}`),
          }))}
          rows={CHANGES.map((change) => ({
            key: change.key,
            cells: [
              t(locale, `network.tdhConsolidation.add.row.${change.key}`),
              change.registrations === null
                ? t(locale, "network.tdhConsolidation.add.notApplicable")
                : formatInteger(locale, change.registrations),
              change.transactions
                .map((count) => formatInteger(locale, count))
                .join(" + "),
              t(locale, `network.tdhConsolidation.add.order.${change.order}`),
            ],
            cellClassNames: { 1: "tw-tabular-nums", 2: "tw-tabular-nums" },
          }))}
        />
        <Link
          className={`${LINK} tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm`}
          href="/safe-collecting/build-consolidation"
        >
          {t(locale, "network.tdhConsolidation.add.cta")}
        </Link>
      </div>
    </TDHSection>
  );
}

/**
 * Who can add an outside wallet: four rules by how many of your wallets an
 * attacker controls, as one compact grid at every width (a phone included),
 * so the comparison stays a comparison. It scrolls inside its frame only in
 * a very narrow window.
 */
const RULE_TH = tdhNarrowCell(TDH_TH);
const RULE_TD = tdhNarrowCell(TDH_TD);
const COUNT_TH = TDH_TH.replace("tw-px-4", "tw-px-1.5");
const COUNT_TD = TDH_TD.replace("tw-px-4", "tw-px-1.5");

function AttackMatrix({ locale }: { readonly locale: SupportedLocale }) {
  const caption = t(locale, "network.tdhConsolidation.why.matrix.caption");
  return (
    <TdhTableFrame label={caption}>
      <table className={TDH_TABLE}>
        <caption className={TDH_CAPTION}>{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={`${RULE_TH} tw-min-w-[7rem]`}>
              {t(locale, "network.tdhConsolidation.why.matrix.rule")}
            </th>
            {CONTROLLED_WALLET_COUNTS.map((count) => (
              <th
                key={count}
                scope="col"
                className={`${COUNT_TH} tw-w-10 tw-text-center tw-tabular-nums sm:tw-w-14`}
              >
                <span aria-hidden="true">{formatInteger(locale, count)}</span>
                <span className="tw-sr-only">
                  {t(locale, "network.tdhConsolidation.why.matrix.controls", {
                    count: formatInteger(locale, count),
                  })}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RULE_COMPARISON.map((rule) => (
            <tr key={rule.key}>
              <th
                scope="row"
                className={`${RULE_TD} tw-font-medium tw-text-iron-100`}
              >
                {t(locale, `network.tdhConsolidation.why.rule.${rule.key}`)}
              </th>
              {CONTROLLED_WALLET_COUNTS.map((count) => (
                <td
                  key={count}
                  className={`${COUNT_TD} tw-text-center ${rule.addable[count] ? "tw-font-semibold tw-text-error" : "tw-text-iron-400"}`}
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
    </TdhTableFrame>
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
        <TdhStackTable
          label={t(locale, "network.tdhConsolidation.why.table.caption")}
          columns={(
            ["rule", "signers", "transactions", "problem"] as const
          ).map((column) => ({
            key: column,
            label: t(locale, `network.tdhConsolidation.why.table.${column}`),
          }))}
          rows={RULE_COMPARISON.map((rule) => ({
            key: rule.key,
            cells: [
              t(locale, `network.tdhConsolidation.why.rule.${rule.key}`),
              t(locale, `network.tdhConsolidation.why.signers.${rule.signers}`),
              formatInteger(locale, rule.transactions),
              t(locale, `network.tdhConsolidation.why.problem.${rule.key}`),
            ],
            cellClassNames: { 2: "tw-tabular-nums" },
          }))}
          inlineColumns={[1, 2]}
        />

        <div className="tw-space-y-3">
          <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-7 tw-text-iron-100">
            {t(locale, "network.tdhConsolidation.why.matrix.title")}
          </h3>
          <p className={TDH_TEXT}>
            {t(locale, "network.tdhConsolidation.why.matrix.description")}{" "}
            {t(locale, "network.tdhConsolidation.why.matrix.columns")}
          </p>
          <AttackMatrix locale={locale} />
        </div>

        <p className={TDH_TEXT}>
          {t(locale, "network.tdhConsolidation.why.conclusion")}
        </p>
      </div>
    </TDHSection>
  );
}
