"use client";

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
import TdhArrowLink from "../../shared/TdhArrowLink";
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
import TDHSection, { TDH_PANEL, TDH_TEXT } from "../../TDHSection";
import ConsolidationOrderSimulator from "../ConsolidationOrderSimulator";

type ConsolidationKey = Extract<
  MessageKey,
  `network.tdhConsolidation.${string}`
>;

const NAVIGATION = [
  { id: "consolidation-rules", key: "rules" },
  { id: "tdh-v1", key: "tdhv1" },
  { id: "consolidation-add", key: "add" },
  { id: "consolidation-order", key: "order" },
  { id: "consolidation-remove", key: "remove" },
  { id: "consolidation-why", key: "why" },
  { id: "consolidation-protects", key: "protects" },
  { id: "consolidation-start", key: "start" },
  { id: "consolidation-tested", key: "tested" },
] as const;
const NAVIGATION_IDS = NAVIGATION.map((item) => item.id);

const RULES = ["pairs", "limit", "newest", "collector", "expiry"] as const;

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

/** The rules table's column widths from xl, so short headers do not wrap. */
const WHY_COLUMN_WIDTH = {
  rule: "xl:tw-w-[34%]",
  signers: "xl:tw-w-[12%] xl:tw-whitespace-nowrap",
  transactions: "xl:tw-w-[14%]",
  problem: "xl:tw-w-[40%]",
} as const;

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

/**
 * The backend's grouping code, pinned to its latest change (ee74952,
 * October 12, 2026: the four-wallet rule and its settings); the live dry run
 * of October 10 with its 673 consolidations is recorded in the tracking
 * issue.
 */
const GROUPING_SOURCE =
  "https://github.com/6529-Collections/6529seize-backend/blob/ee74952d3a6161e5a0ccb4fb960949a8ff6cb8d8/src/consolidation-tools.ts";
const TRACKING_ISSUE =
  "https://github.com/6529-Collections/6529seize-frontend/issues/4214";

/** Where each wallet of the four-wallet example sits in its drawing. */
const SPLIT_WALLETS = {
  D: [110, 28],
  A: [32, 96],
  B: [110, 96],
  C: [188, 96],
} as const;
/** D's three links, in the order they were confirmed. */
const SPLIT_LINKS = [
  { to: "A", inside: false },
  { to: "B", inside: true },
  { to: "C", inside: true },
] as const;

/**
 * TDH-v1's split of a group of four, drawn as on How it works step 10:
 * D's links numbered in the order they were confirmed, the identity of
 * three outlined, and A, left over, in a ring of its own.
 */
function FourWalletSplit({ locale }: { readonly locale: SupportedLocale }) {
  const [dx, dy] = SPLIT_WALLETS.D;
  return (
    <svg
      viewBox="0 0 222 126"
      role="img"
      aria-label={t(locale, "network.tdhConsolidation.tdhv1.figure")}
      className="tw-block tw-h-auto tw-w-full tw-max-w-[15rem] tw-shrink-0"
    >
      <rect
        x={84}
        y={4}
        width={132}
        height={116}
        rx={22}
        strokeWidth={1.5}
        className="tw-fill-primary-500/10 tw-stroke-primary-400/70"
      />
      <circle
        cx={SPLIT_WALLETS.A[0]}
        cy={SPLIT_WALLETS.A[1]}
        r={22}
        strokeWidth={1.5}
        className="tw-fill-teal-400/10 tw-stroke-teal-300/70"
      />
      {SPLIT_LINKS.map((link) => {
        const [x, y] = SPLIT_WALLETS[link.to];
        return (
          <line
            key={link.to}
            x1={dx}
            y1={dy}
            x2={x}
            y2={y}
            strokeWidth={link.inside ? 3 : 1.5}
            strokeDasharray={link.inside ? undefined : "4 3"}
            className={
              link.inside ? "tw-stroke-iron-200" : "tw-stroke-iron-400"
            }
          />
        );
      })}
      {SPLIT_LINKS.map((link, index) => {
        const [x, y] = SPLIT_WALLETS[link.to];
        const mx = (dx + x) / 2;
        const my = (dy + y) / 2;
        return (
          <g key={`order-${link.to}`}>
            <circle
              cx={mx}
              cy={my}
              r={10}
              strokeWidth={1}
              className="tw-fill-iron-950 tw-stroke-primary-400/70"
            />
            <text
              x={mx}
              y={my + 4.5}
              textAnchor="middle"
              fontSize={12}
              className="tw-fill-primary-300 tw-font-semibold tw-tabular-nums"
            >
              {formatInteger(locale, index + 1)}
            </text>
          </g>
        );
      })}
      {Object.entries(SPLIT_WALLETS).map(([name, [x, y]]) => (
        <g key={name}>
          <circle
            cx={x}
            cy={y}
            r={14}
            strokeWidth={1.5}
            className="tw-fill-iron-900 tw-stroke-iron-300"
          />
          <text
            x={x}
            y={y + 5}
            textAnchor="middle"
            fontSize={14}
            className="tw-fill-iron-50 tw-font-semibold"
          >
            {name}
          </text>
        </g>
      ))}
    </svg>
  );
}

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
          <p className={`tw-mb-0 tw-mt-4 tw-max-w-[38em] ${TDH_LEDE}`}>
            {limits
              ? t(locale, "network.tdhConsolidation.design.intro", {
                  date,
                  limit,
                })
              : pendingLimits}
          </p>
          <div className="tw-mt-4 tw-flex tw-max-w-4xl tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-amber-400/40 tw-bg-amber-400/[0.05] tw-p-4 sm:tw-flex-row sm:tw-items-center sm:tw-gap-6 sm:tw-p-5">
            <div className="tw-min-w-0 tw-flex-1">
              <p className="tw-m-0 tw-text-base tw-font-semibold tw-leading-7 tw-text-iron-50">
                {t(locale, "network.tdhConsolidation.tdhv1.rule")}
              </p>
              <p className="tw-m-0 tw-mt-1 tw-max-w-[38em] tw-text-sm tw-leading-6 tw-text-iron-200">
                {t(locale, "network.tdhConsolidation.tdhv1.example")}
                <TdhSource refs={["P26 §6.3", "D132"]} locale={locale} />
              </p>
              <TdhArrowLink href="#tdh-v1" className="tw-mt-1">
                {t(locale, "network.tdhConsolidation.design.statusLink")}
              </TdhArrowLink>
            </div>
            <FourWalletSplit locale={locale} />
          </div>
          <p className="tw-mb-0 tw-mt-3 tw-flex tw-max-w-[36em] tw-flex-wrap tw-items-center tw-gap-x-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            <span>
              {t(locale, "network.tdhConsolidation.design.guideNote")}
            </span>
            <TdhArrowLink href="/network/tdh/consolidation">
              {t(locale, "network.tdhConsolidation.design.guideLink")}
            </TdhArrowLink>
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
          {/* Two columns that each fill from the top, so a short card never
              sits beside a long one with a hole under it. */}
          <ul className="tw-m-0 tw-list-none tw-gap-4 tw-p-0 sm:tw-columns-2">
            {RULES.map((rule) => (
              <li
                key={rule}
                className={`${TDH_PANEL} tw-mb-4 tw-break-inside-avoid tw-p-5`}
              >
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
          <div className={`${TDH_PANEL} tw-p-5`}>
            <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-leading-7 tw-text-iron-100">
              {t(locale, "network.tdhConsolidation.rules.effects.title")}
            </h3>
            <p className={`${TDH_TEXT} tw-mt-2 tw-max-w-[38em]`}>
              {t(locale, "network.tdhConsolidation.rules.effects.body")}
            </p>
          </div>
        </TDHSection>

        <TDHSection
          id="tdh-v1"
          title={t(locale, "network.tdhConsolidation.tdhv1.title")}
        >
          <div className="tw-max-w-[36em] tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-amber-400/70 tw-bg-amber-400/[0.05] tw-py-3 tw-pl-4 tw-pr-3 tw-text-base tw-leading-7 tw-text-iron-200">
            <p className="tw-m-0">
              {t(locale, "network.tdhConsolidation.tdhv1Note")}
              <TdhSource refs={["P26 §6.3", "D132"]} locale={locale} />
            </p>
            <TdhArrowLink href="/network/tdh/how-it-works#step-10">
              {t(locale, "network.tdhConsolidation.tdhv1RuleLink")}
            </TdhArrowLink>
          </div>
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
            <div className="tw-flex tw-flex-wrap tw-gap-x-6">
              <TdhArrowLink href={GROUPING_SOURCE}>
                {t(locale, "network.tdhConsolidation.tested.source")}
              </TdhArrowLink>
              <TdhArrowLink href={TRACKING_ISSUE}>
                {t(locale, "network.tdhConsolidation.tested.issue")}
              </TdhArrowLink>
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
        <p className="tw-m-0 tw-max-w-[38em] tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-600 tw-pl-4 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "network.tdhConsolidation.add.why")}
        </p>
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-amber-200">
          {t(locale, "network.tdhConsolidation.add.tableStatus")}
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
        <TdhArrowLink href="/safe-collecting/build-consolidation">
          {t(locale, "network.tdhConsolidation.add.cta")}
        </TdhArrowLink>
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
            className: WHY_COLUMN_WIDTH[column],
            ...(column === "signers"
              ? {
                  title: t(
                    locale,
                    "network.tdhConsolidation.why.table.signersTitle"
                  ),
                }
              : {}),
          }))}
          rows={RULE_COMPARISON.map((rule) => ({
            key: rule.key,
            cells: [
              t(locale, `network.tdhConsolidation.why.rule.${rule.key}`),
              t(locale, `network.tdhConsolidation.why.signers.${rule.signers}`),
              formatInteger(locale, rule.transactions),
              t(locale, `network.tdhConsolidation.why.problem.${rule.key}`),
            ],
            cellClassNames: {
              1: "xl:tw-whitespace-nowrap",
              2: "tw-tabular-nums",
            },
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
