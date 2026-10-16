import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import CaseSafe from "../shared/CaseSafe";
import TdhDisclosure from "../shared/TdhDisclosure";
import TdhStatusPill from "../shared/TdhStatusPill";
import { TDH_CARD, TDH_LINK } from "../shared/tdhStyles";
import type { FormalManifest, FormalStatus } from "@/lib/tdh/formal/manifest";
import type { TdhPill } from "../shared/TdhStatusPill";
import { LEAN_ROUND_5 } from "./leanResults";

/** Parts of the formal model page: the builds, what the model found, the legend. */

const LONG_DATE = { day: "numeric", month: "long", year: "numeric" } as const;

/** One build's figures: vectors, theorems and fact checks. */
interface BuildFigures {
  readonly vectorsPassed: number | null;
  readonly vectorsTotal: number | null;
  readonly vectorChecks: number | null;
  readonly theoremsTdh: number;
  readonly theoremsP53: number;
  readonly facts: number;
}

/** Where the published build's statuses were read from. */
type BuildSource =
  | {
      readonly kind: "published";
      readonly url: string;
      readonly sha256: string | null;
    }
  | {
      readonly kind: "bundled";
      readonly reason:
        | "unpublished"
        | "unavailable"
        | "invalid"
        | "unconfigured";
    };

function BuildFigureList({
  locale,
  figures,
}: {
  readonly locale: SupportedLocale;
  readonly figures: BuildFigures;
}) {
  const n = (value: number | null) =>
    value === null ? "–" : formatInteger(locale, value);
  const items = [
    {
      key: "theorems",
      value: t(locale, "network.tdh.formal.builds.theorems", {
        tdh: n(figures.theoremsTdh),
        p53: n(figures.theoremsP53),
      }),
      sub: t(locale, "network.tdh.formal.builds.theoremsSub"),
    },
    {
      key: "facts",
      value: t(locale, "network.tdh.formal.builds.facts", {
        facts: n(figures.facts),
      }),
      sub: t(locale, "network.tdh.formal.builds.factsSub"),
    },
  ] as const;
  return (
    <ul className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-grid-cols-1 tw-gap-x-5 tw-gap-y-2 tw-p-0 sm:tw-grid-cols-2">
      {items.map((item) => (
        <li key={item.key} className="tw-min-w-0">
          <span className="tw-block tw-text-base tw-font-semibold tw-tabular-nums tw-text-iron-50">
            {item.value}
          </span>
          <span className="tw-block tw-text-sm tw-leading-5 tw-text-iron-400">
            {item.sub}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A SHA-256 on its own line, small and breakable, with its label. */
function Sha({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
      {label}
      <code className="tw-mt-0.5 tw-block tw-break-all tw-font-mono tw-text-[13px] tw-text-iron-200">
        {value}
      </code>
    </p>
  );
}

const EYEBROW =
  "tw-m-0 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400";

/**
 * The builds behind the page, in one panel at the top: the published build,
 * whose manifest gives every status and count on the page, and, while the
 * feed has not published it, the next build committed with the model, in
 * the column beside it. Each build's figures appear here once, so no
 * paragraph below mixes two builds.
 */
export function BuildsPanel({
  locale,
  published,
  source,
  showNext,
}: {
  readonly locale: SupportedLocale;
  readonly published: BuildFigures & {
    readonly commit: string;
    readonly commitDate: string;
    readonly leanVersion: string;
    readonly specCommit: string | null;
    readonly generatedAt?: string;
  };
  readonly source: BuildSource;
  /** Whether a newer round is committed and not yet published. */
  readonly showNext: boolean;
}) {
  const r = LEAN_ROUND_5;
  const columns = showNext
    ? "lg:tw-grid-cols-2 lg:tw-divide-x lg:tw-divide-y-0"
    : "";
  return (
    <section
      aria-labelledby="tdh-builds-heading"
      className={`${TDH_CARD} tw-mt-4 tw-overflow-hidden`}
      data-tdh-builds=""
    >
      <h2 id="tdh-builds-heading" className="tw-sr-only">
        {t(locale, "network.tdh.formal.builds.title")}
      </h2>
      <div
        className={`tw-grid tw-grid-cols-1 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.07] ${columns}`}
      >
        <div
          className="tw-min-w-0 tw-p-4 sm:tw-p-5"
          data-tdh-manifest={source.kind}
        >
          <p className={EYEBROW}>
            {t(
              locale,
              source.kind === "published"
                ? "network.tdh.formal.builds.published"
                : "network.tdh.formal.builds.bundled"
            )}
          </p>
          <p className="tw-m-0 tw-mt-1 tw-text-base tw-font-semibold tw-text-iron-50">
            <CaseSafe
              text={t(locale, "network.tdh.formal.builds.model", {
                commit: published.commit.slice(0, 7),
                date: formatUtcDate(locale, published.commitDate, LONG_DATE),
              })}
            />
          </p>
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
            <CaseSafe
              text={t(locale, "network.tdh.formal.builds.spec", {
                version: published.leanVersion,
                spec: (published.specCommit ?? published.commit).slice(0, 7),
              })}
            />
          </p>
          <div className="tw-grid tw-gap-x-10 tw-gap-y-3 lg:tw-grid-cols-2">
            <div className="tw-min-w-0">
              <BuildFigureList locale={locale} figures={published} />
            </div>
            <div className="tw-min-w-0">
              {published.generatedAt !== undefined && (
                <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300 lg:tw-mt-0">
                  {t(locale, "network.tdh.formal.builds.generated", {
                    generated: formatUtcDate(locale, published.generatedAt, {
                      ...LONG_DATE,
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZoneName: "short",
                    }),
                  })}
                </p>
              )}
              <p className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(
                  locale,
                  source.kind === "published"
                    ? "network.tdh.formal.builds.source.published"
                    : `network.tdh.formal.builds.source.${source.reason}`
                )}
              </p>
              {source.kind === "published" && (
                <>
                  <a
                    href={source.url}
                    className={`${TDH_LINK} tw-mt-1 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-text-sm`}
                  >
                    <ArrowDownTrayIcon
                      aria-hidden="true"
                      className="tw-size-4"
                    />
                    {t(locale, "network.tdh.formal.manifest.json")}
                  </a>
                  {source.sha256 !== null && (
                    <Sha
                      label={t(locale, "network.tdh.formal.builds.shaServed")}
                      value={source.sha256}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {showNext && (
          <div className="tw-min-w-0 tw-p-4 sm:tw-p-5" data-tdh-round-note="">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <p className={EYEBROW}>
                {t(locale, "network.tdh.formal.builds.next")}
              </p>
              <TdhStatusPill pill="notPublished" locale={locale} size="sm" />
            </div>
            <p className="tw-m-0 tw-mt-1 tw-text-base tw-font-semibold tw-text-iron-50">
              <CaseSafe
                text={t(locale, "network.tdh.formal.builds.round", {
                  round: formatInteger(locale, r.round),
                  commit: r.commit,
                  date: formatUtcDate(locale, `${r.date}T00:00:00Z`, LONG_DATE),
                })}
              />
            </p>
            <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
              <CaseSafe
                text={t(locale, "network.tdh.formal.builds.specNext", {
                  spec: r.specCommit,
                })}
              />
            </p>
            <BuildFigureList locale={locale} figures={r} />
            <Sha
              label={t(locale, "network.tdh.formal.builds.shaCommitted", {
                commit: r.commit,
              })}
              value={r.manifestSha256}
            />
            <TdhDisclosure
              className="tw-mt-2"
              summary={t(locale, "network.tdh.formal.builds.changes", {
                round: formatInteger(locale, r.round),
              })}
            >
              <p className="tw-m-0 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(locale, "network.tdh.formal.newer.body", {
                  round: formatInteger(locale, r.round),
                  commit: r.commit,
                })}
              </p>
            </TdhDisclosure>
          </div>
        )}
      </div>
      {showNext && (
        <p className="tw-m-0 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/40 tw-px-4 tw-py-3 tw-text-sm tw-leading-6 tw-text-iron-300 sm:tw-px-5">
          {t(locale, "network.tdh.formal.builds.switch", {
            round: formatInteger(locale, r.round),
          })}
        </p>
      )}
    </section>
  );
}

/** What the model found, each settled in the specifications since. */
const FOUND = [
  "firstRule",
  "eligibility",
  "sums",
  "sinks",
  "cap",
  "incidents",
] as const;

export function FoundByModel({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className={`${TDH_CARD} tw-p-4 sm:tw-p-5`}>
      <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
        {t(locale, "network.tdh.formal.found.title")}
      </h3>
      <ul className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-gap-x-8 tw-gap-y-2.5 tw-p-0 xl:tw-grid-cols-2">
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
  "shownFalseEval",
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
          <dd className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400">
            {t(locale, `network.tdh.formal.legend.${status}`)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const ENTRY_GROUPS: readonly FormalStatus[] = [
  "proved",
  "counterexample",
  "deferred",
];

function manifestPill(entry: FormalManifest["theorems"][number]): TdhPill {
  if (entry.status === "counterexample") {
    return entry.checkedBy === "evaluation" ? "shownFalseEval" : "shownFalse";
  }
  return entry.status;
}

/**
 * Every entry of the proof manifest, by status, so each headline count can
 * be found and audited: the statements above group these entries.
 */
export function AllManifestEntries({
  locale,
  manifest,
}: {
  readonly locale: SupportedLocale;
  readonly manifest: FormalManifest;
}) {
  return (
    <TdhDisclosure
      tone="strong"
      summary={t(locale, "network.tdh.formal.allEntries.summary", {
        count: formatInteger(locale, manifest.theorems.length),
      })}
    >
      <div className="tw-space-y-5 tw-pb-2 tw-pl-6">
        {ENTRY_GROUPS.map((status) => {
          const entries = manifest.theorems.filter(
            (entry) => entry.status === status
          );
          if (entries.length === 0) {
            return null;
          }
          return (
            <section
              key={status}
              aria-label={t(locale, `network.tdh.formal.allEntries.${status}`, {
                count: formatInteger(locale, entries.length),
              })}
            >
              <h4 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                {t(locale, `network.tdh.formal.allEntries.${status}`, {
                  count: formatInteger(locale, entries.length),
                })}
              </h4>
              <ul className="tw-m-0 tw-mt-2 tw-list-none tw-p-0">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="tw-grid tw-min-w-0 tw-grid-cols-[minmax(0,1fr)] tw-gap-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.05] tw-py-2 first:tw-border-t-0 md:tw-grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:tw-gap-x-4"
                  >
                    <span className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
                      <code className="tw-min-w-0 tw-max-w-full tw-break-all tw-font-mono tw-text-xs tw-text-iron-100">
                        {entry.id}
                      </code>
                      <TdhStatusPill
                        pill={manifestPill(entry)}
                        locale={locale}
                        size="sm"
                      />
                      <span className="tw-text-xs tw-text-iron-400">
                        {t(
                          locale,
                          entry.library === "p53"
                            ? "network.tdh.formal.allEntries.p53"
                            : "network.tdh.formal.allEntries.tdh"
                        )}
                      </span>
                    </span>
                    {/* Theorem names in the text are long words: they may
                        break anywhere rather than run past a phone's edge. */}
                    <span className="tw-min-w-0 tw-max-w-[44em] tw-text-sm tw-leading-6 tw-text-iron-300 [overflow-wrap:anywhere]">
                      {entry.statement}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </TdhDisclosure>
  );
}
