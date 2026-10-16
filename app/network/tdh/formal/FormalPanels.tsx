import { formatInteger, formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhStatusPill from "../shared/TdhStatusPill";
import { TDH_CARD, TDH_LINK } from "../shared/tdhStyles";
import { LEAN_ROUND_5 } from "./leanResults";

/** Parts of the formal model page: round 5, what the model found, the legend. */

const LONG_DATE = { day: "numeric", month: "long", year: "numeric" } as const;

/**
 * One quiet line under the published build's figures, while the published
 * manifest records an earlier round of the model than 6529's design
 * repository has: the next build's headline figures and a link to them.
 */
export function NewerRoundLine({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const r = LEAN_ROUND_5;
  const n = (value: number) => formatInteger(locale, value);
  // One badge for the newer build; every figure on the page is the
  // published build's.
  return (
    <p className="tw-m-0 tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-text-sm tw-leading-6">
      <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-500/10 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-100">
        <span
          aria-hidden="true"
          className="tw-size-2 tw-shrink-0 tw-rounded-full tw-bg-primary-400"
        />
        {t(locale, "network.tdh.formal.newer.badge", {
          passed: n(r.vectorsPassed),
          total: n(r.vectorsTotal),
          tdh: n(r.theoremsTdh),
          p53: n(r.theoremsP53),
        })}
      </span>
      <a href="#next-build" className={TDH_LINK}>
        {t(locale, "network.tdh.formal.newer.lineLink")}
      </a>
    </p>
  );
}

/**
 * The next build, after the body: the newest round's own figures, from the
 * manifest committed with it, while the feed has not published it.
 */
export function NewerRound({ locale }: { readonly locale: SupportedLocale }) {
  const r = LEAN_ROUND_5;
  const n = (value: number) => formatInteger(locale, value);
  const stats = [
    {
      key: "vectors",
      value: t(locale, "network.tdh.formal.newer.vectors", {
        passed: n(r.vectorsPassed),
        total: n(r.vectorsTotal),
      }),
      sub: t(locale, "network.tdh.formal.newer.vectorsSub", {
        checks: n(r.vectorChecks),
        spec: r.specCommit,
      }),
    },
    {
      key: "theorems",
      value: t(locale, "network.tdh.formal.newer.theorems", {
        tdh: n(r.theoremsTdh),
        p53: n(r.theoremsP53),
      }),
      sub: t(locale, "network.tdh.formal.newer.theoremsSub"),
    },
    {
      key: "facts",
      value: t(locale, "network.tdh.formal.newer.facts", {
        facts: n(r.facts),
      }),
      sub: t(locale, "network.tdh.formal.newer.factsSub"),
    },
  ] as const;
  return (
    <div className={`${TDH_CARD} tw-p-4 sm:tw-p-5`} data-tdh-round-note>
      <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
        {t(locale, "network.tdh.formal.newer.title", {
          round: n(r.round),
          date: formatUtcDate(locale, `${r.date}T00:00:00Z`, LONG_DATE),
        })}
      </p>
      <ul className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-grid-cols-1 tw-gap-x-6 tw-gap-y-2 tw-p-0 sm:tw-grid-cols-3">
        {stats.map((stat) => (
          <li key={stat.key} className="tw-min-w-0">
            <span className="tw-block tw-text-base tw-font-semibold tw-tabular-nums tw-text-iron-50">
              {stat.value}
            </span>
            <span className="tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
              {stat.sub}
            </span>
          </li>
        ))}
      </ul>
      <p className="tw-m-0 tw-mt-3 tw-max-w-prose tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.formal.newer.body", {
          round: n(r.round),
          commit: r.commit,
        })}
      </p>
      <p className="tw-m-0 tw-mt-3 tw-max-w-prose tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "network.tdh.formal.newer.manifestSha", {
          commit: r.commit,
        })}
        <code className="tw-mt-0.5 tw-block tw-break-all tw-font-mono tw-text-xs tw-text-iron-200">
          {r.manifestSha256}
        </code>
      </p>
    </div>
  );
}

/** What the model found, each settled in the specifications since. */
const FOUND = [
  "firstRule",
  "eligibility",
  "sums",
  "sinks",
  "incidents",
] as const;

export function FoundByModel({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className={`${TDH_CARD} tw-p-4 sm:tw-p-5`}>
      <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
        {t(locale, "network.tdh.formal.found.title")}
      </h3>
      <ul className="tw-m-0 tw-mt-3 tw-list-none tw-space-y-2.5 tw-p-0">
        {FOUND.map((key) => (
          <li
            key={key}
            className="tw-grid tw-grid-cols-[1rem_minmax(0,1fr)] tw-gap-2 tw-text-sm tw-leading-6 tw-text-iron-300"
          >
            <span
              aria-hidden="true"
              className="tw-mt-2 tw-size-2 tw-rounded-full tw-bg-rose-400"
            />
            <span>
              <strong className="tw-font-semibold tw-text-iron-100">
                {t(locale, `network.tdh.formal.found.${key}.title`)}
              </strong>{" "}
              {t(locale, `network.tdh.formal.found.${key}.body`)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The statuses of the statements table, each with what it rests on. */
const PROOF_STATUSES = [
  "proved",
  "byDefinition",
  "checkedBuild",
  "shownFalse",
  "deferred",
] as const;

export function ProofLegend({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <dl className="tw-m-0 tw-grid tw-gap-x-6 tw-gap-y-2 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
      {PROOF_STATUSES.map((status) => (
        <div
          key={status}
          className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1"
        >
          <dt>
            <TdhStatusPill pill={status} locale={locale} size="sm" />
          </dt>
          <dd className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, `network.tdh.formal.legend.${status}`)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
