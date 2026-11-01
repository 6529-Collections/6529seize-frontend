import EnglishOnlyNote from "@/components/explained/shell/EnglishOnlyNote";
import {
  resolveExplainedLocale,
  type ExplainedParams,
} from "@/lib/explained/locale.server";
import type { Metadata } from "next";
import BoostHistory, { type BoostStep } from "./BoostHistory";
import { getAppMetadata } from "@/components/providers/metadata";
import { kt } from "@/components/explained/i18n";
import Mark from "@/components/explained/marks/Mark";
import Track from "@/components/explained/marks/Track";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import { formatCents } from "@/lib/explained/format";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { loadFactBook } from "@/lib/explained/feed.server";
import type {
  BeforeRow,
  VersionRow,
} from "@/lib/explained/registry/referenceFacts";
import { PlaceLinks, pagePlace } from "@/components/explained/shell/place";
import LegacyAnchors from "@/components/explained/shell/LegacyAnchors";
import {
  Caption,
  CodeName,
  EdSection,
  PageHead,
  Prose,
  StackTable,
} from "@/components/explained/reference/parts";
import { FactScope, FactText } from "@/components/explained/facts/FactText";
import { plain, rich, type RichValues } from "@/components/explained/rich";
import { printers } from "@/components/explained/facts/printers";

/**
 * Shelf S4, Versions and boosts (TDH-DESIGN.md §4.7), at the Historic
 * boosts route it replaces: every TDH version 6529.io has run with its
 * dates, full-set boost and paying seasons, today's values computed by the
 * engine on the real editions with their date (never a date fixed in
 * code), and the specification's two names for the rules.
 */
export const revalidate = 600;

type VersionsKey = Extract<MessageKey, `explained.tdh.versions.${string}`>;

const RULES_VERSION = "rules.version";

/** Anchors of the Historic boosts page, and where they land. */
const MOVED: Readonly<Record<string, string>> = {
  "historic-versions-heading": "on-site",
  current: "tdh-1-4",
};

export default async function VersionsPage({
  searchParams,
}: {
  readonly searchParams?: Promise<ExplainedParams>;
} = {}) {
  // The language the reader asked for: this page is English only for now.
  const requested = searchParams
    ? await resolveExplainedLocale(await searchParams)
    : DEFAULT_LOCALE;
  const locale = DEFAULT_LOCALE;
  const book = await loadFactBook();
  const place = pagePlace("tdh", "versions", locale);
  const p = printers(book, locale);
  const m = (key: VersionsKey, values?: RichValues) =>
    rich(locale, key, values);
  const s = (key: VersionsKey, params?: Readonly<Record<string, string>>) =>
    plain(locale, key, params);
  // Once the daily comparison's builds report the new name, the old one is
  // history only.
  const reportedVersion = p.text("tdh.latest.ruleVersion");
  const buildsMoved =
    reportedVersion !== null && reportedVersion === p.text(RULES_VERSION);
  const pastFact = book.maybe<VersionRow[]>("versions.past");
  const past = pastFact?.value ?? [];
  // The boost 6529.io's code applied before v1.1, from its first commit.
  const beforeFact = book.maybe<BeforeRow>("versions.before");
  const before = beforeFact?.value ?? null;
  const since = p.text("versions.current.since");
  // The step line: every past schedule, oldest first, then today's.
  const todayFullSet = p.num("engine.boost.fullSet");
  const ceilingValue = p.num("rules.fullSetCeiling");
  const readAt = p.text("page.readAt");
  const historySteps: BoostStep[] = [
    ...(before
      ? [
          {
            version: "0",
            label: s("explained.tdh.versions.before.tag"),
            from: before.from,
            to: before.to,
            fullSet: before.fullSet,
          },
        ]
      : []),
    ...[...past]
      .sort((a, b) => a.from.localeCompare(b.from))
      .map((row) => ({
        version: row.version,
        from: row.from,
        to: row.to,
        fullSet: row.fullSet,
      })),
    ...(since !== null && todayFullSet !== null && readAt !== null
      ? [
          {
            version: p.text("versions.current.number") ?? "",
            from: since,
            to: readAt.slice(0, 10),
            fullSet: todayFullSet,
            current: true,
          },
        ]
      : []),
  ];
  const firstYear = [
    ...(before ? [before.from] : []),
    ...past.map((row) => row.from),
    since ?? "",
  ]
    .filter(Boolean)
    .sort()[0]
    ?.slice(0, 4);
  /** "Mar 29, 2024": every date in the table, the current row's included. */
  const day = (iso: string) =>
    formatUtcDate(locale, iso, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const pastText = (children: string) => (
    <FactText fact={pastFact} locale={locale}>
      {children}
    </FactText>
  );
  const beforeText = (children: string) => (
    <FactText fact={beforeFact} locale={locale}>
      {children}
    </FactText>
  );
  const rows = [
    {
      key: "tdh-1-4",
      id: "tdh-1-4",
      cells: {
        version: (
          <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
            <span>
              {m("explained.tdh.versions.name", {
                version: p.v("versions.current.number"),
              })}
            </span>
            <Track maturity="live" locale={locale} size="sm" />
          </span>
        ),
        when: m("explained.tdh.versions.current.when", {
          fourWallets: p.v("versions.fourWallets"),
          from: (
            <FactText
              fact={book.maybe("versions.current.since")}
              locale={locale}
            >
              {since ? day(since) : ""}
            </FactText>
          ),
        }),
        fullSet: m("explained.tdh.versions.current.fullSet", {
          today: p.v("engine.boost.fullSet"),
          ceiling: p.v("rules.fullSetCeiling"),
        }),
        seasons: m("explained.tdh.versions.current.seasons", {
          last: p.v("rules.lastBoostedSeason"),
          paying: p.v("engine.seasons.paying"),
        }),
      },
    },
    ...past.map((row) => ({
      key: row.id,
      id: row.id,
      cells: {
        version: m("explained.tdh.versions.name", {
          version: pastText(row.version),
        }),
        when: m("explained.tdh.versions.past.when", {
          from: pastText(day(row.from)),
          to: pastText(day(row.to)),
        }),
        fullSet: pastText(formatCents(locale, row.fullSet)),
        seasons: m("explained.tdh.versions.past.seasons", {
          last: pastText(formatInteger(locale, row.maxSeason)),
        }),
      },
    })),
    ...(before
      ? [
          {
            key: before.id,
            id: before.id,
            cells: {
              version: m("explained.tdh.versions.before.name"),
              when: m("explained.tdh.versions.before.when", {
                from: beforeText(day(before.from)),
                to: beforeText(day(before.to)),
              }),
              fullSet: m("explained.tdh.versions.before.fullSet", {
                full: beforeText(formatCents(locale, before.fullSet)),
                max: beforeText(formatCents(locale, before.fullSetMax)),
              }),
              seasons: m("explained.tdh.versions.before.seasons", {
                high: beforeText(formatCents(locale, before.partialHigh)),
                low: beforeText(formatCents(locale, before.partialLow)),
              }),
            },
          },
        ]
      : []),
  ];
  return (
    <ExplainedShell
      chapter="tdh"
      page="versions"
      crumbs={[
        { label: kt(locale, "explained.kit.map.hub"), href: "/explained" },
        {
          label: kt(locale, "explained.kit.map.chapterTitle", {
            number: place.chapterNumber,
            title: kt(locale, "explained.kit.map.tdh"),
          }),
          href: "/network/tdh",
        },
        { label: t(locale, "explained.tdh.versions.crumb") },
      ]}
      live={{ fact: book.maybe("memes.readAt"), kind: "read" }}
      facts={book.snapshot()}
      locale={locale}
    >
      <LegacyAnchors moved={MOVED} />
      <article data-ex-article="" lang={locale}>
        <EnglishOnlyNote requested={requested} />
        <PageHead
          eyebrow={m("explained.tdh.versions.eyebrow", {
            n: <span>{place.n}</span>,
          })}
          title={m("explained.tdh.versions.title")}
          lede={m("explained.tdh.versions.lede")}
        />

        <EdSection
          id="on-site"
          no="1"
          label={m("explained.tdh.versions.site.label", {
            site: <span className="tw-normal-case">6529.io</span>,
          })}
          title={m("explained.tdh.versions.site.title", {
            count: pastText(
              formatInteger(locale, past.length + 1 + (before ? 1 : 0))
            ),
            year: pastText(firstYear ?? ""),
          })}
        >
          <Prose>{m("explained.tdh.versions.site.body")}</Prose>
          <div className="tw-mt-6">
            <StackTable
              from="lg"
              caption={s("explained.tdh.versions.table")}
              columns={[
                {
                  key: "version",
                  label: s("explained.tdh.versions.col.version"),
                },
                { key: "when", label: s("explained.tdh.versions.col.when") },
                {
                  key: "fullSet",
                  label: s("explained.tdh.versions.col.fullSet"),
                  numeric: true,
                },
                {
                  key: "seasons",
                  label: s("explained.tdh.versions.col.seasons"),
                  numeric: true,
                },
              ]}
              rows={rows}
            />
            <Caption className="tw-mt-2">
              {m("explained.tdh.versions.tableSource")}
            </Caption>
          </div>
          {historySteps.length > 1 && ceilingValue !== null && (
            <figure
              className="tw-m-0 tw-mt-10"
              aria-label={s("explained.tdh.versions.chart.label")}
            >
              <BoostHistory
                steps={historySteps}
                ceiling={ceilingValue}
                label={s("explained.tdh.versions.chart.label")}
                ceilingLabel={s("explained.tdh.versions.chart.ceiling", {
                  ceiling: p.f("rules.fullSetCeiling"),
                })}
                locale={locale}
              />
              <figcaption className="tw-mt-2 tw-text-[15px] tw-leading-6 tw-text-iron-400">
                {s("explained.tdh.versions.chart.caption")}
              </figcaption>
            </figure>
          )}
          <Caption className="tw-mt-8 tw-scroll-mt-24" id="boost-figures">
            {m("explained.tdh.versions.note", {
              max: p.v("engine.boost.todayMax"),
              gradients: p.v("rules.gradientMax"),
              ceiling: p.v("engine.boost.ceiling"),
              last: p.v("rules.lastBoostedSeason"),
              date: p.v("memes.readOn", "long"),
            })}
          </Caption>
        </EdSection>

        <EdSection
          id="names"
          no="2"
          label={m("explained.tdh.versions.spec.label")}
          title={m("explained.tdh.versions.spec.title")}
        >
          <Prose>{m("explained.tdh.versions.spec.body")}</Prose>
          <FactScope ids={[RULES_VERSION, "names.v10.name"]}>
            <ol
              className="tw-m-0 tw-mt-4 tw-list-none tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-p-0"
              aria-label={s("explained.tdh.versions.spec.list")}
            >
              <li className="tw-grid tw-grid-cols-1 tw-gap-x-[18px] tw-gap-y-2 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-4 md:tw-grid-cols-[minmax(0,1fr)_190px]">
                <div>
                  <span className="tw-block tw-font-mono tw-text-base tw-text-iron-50">
                    {p.v(RULES_VERSION)}
                  </span>
                  <p className="tw-m-0 tw-mt-1.5 tw-max-w-[660px] tw-text-iron-300">
                    {m("explained.tdh.versions.v14.body", {
                      date: p.v("names.renamedAt", "long"),
                      registry: (
                        <CodeName wrap>{p.v("rules.registry")}</CodeName>
                      ),
                      ruleId: <CodeName wrap>{p.v("rules.ruleId")}</CodeName>,
                    })}
                  </p>
                </div>
                <span>
                  <Mark
                    kind="decided"
                    locale={locale}
                    size="sm"
                    refText={s("explained.tdh.versions.v14.mark")}
                  />
                </span>
              </li>
              <li className="tw-grid tw-grid-cols-1 tw-gap-x-[18px] tw-gap-y-2 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-4 md:tw-grid-cols-[minmax(0,1fr)_190px]">
                <div>
                  <span className="tw-block tw-font-mono tw-text-base tw-text-iron-400">
                    {p.v("names.v10.name")}
                  </span>
                  <p className="tw-m-0 tw-mt-1.5 tw-max-w-[660px] tw-text-iron-300">
                    {m(
                      reportedVersion === null
                        ? "explained.tdh.versions.v10.bodyUnread"
                        : buildsMoved
                          ? "explained.tdh.versions.v10.bodyMoved"
                          : "explained.tdh.versions.v10.body",
                      {
                        date: p.v("names.renamedAt", "long"),
                        wallets: p.v("names.v10.maxWallets"),
                        registry: (
                          <CodeName wrap>{p.v("names.v10.registry")}</CodeName>
                        ),
                        current: <CodeName>{p.v(RULES_VERSION)}</CodeName>,
                      }
                    )}
                  </p>
                </div>
                {/* Retired is a standing, not evidence: plain words, never
                    the Not yet glyph, which answers "how do we know". */}
                <span className="tw-text-[15px] tw-font-semibold tw-text-iron-400">
                  {s("explained.tdh.versions.v10.mark")}
                </span>
              </li>
            </ol>
          </FactScope>
        </EdSection>

        <PlaceLinks place={place} locale={locale} />
        <HowWeKnow
          locale={locale}
          title={t(locale, "explained.tdh.versions.title")}
          slug="tdh-versions-and-boosts"
          rows={[
            {
              title: s("explained.tdh.versions.hwk.versions"),
              body: m("explained.tdh.versions.hwk.versionsBody", {
                source: (
                  <FactText fact={pastFact} locale={locale}>
                    {pastFact?.source.ref}
                  </FactText>
                ),
              }),
            },
            ...(beforeFact
              ? [
                  {
                    title: s("explained.tdh.versions.hwk.before"),
                    body: m("explained.tdh.versions.hwk.versionsBody", {
                      source: (
                        <FactText fact={beforeFact} locale={locale}>
                          {beforeFact.source.ref}
                        </FactText>
                      ),
                    }),
                  },
                ]
              : []),
            {
              title: s("explained.tdh.versions.hwk.names"),
              body: m("explained.tdh.versions.hwk.namesBody", {
                commit: p.v("rules.p26Commit"),
              }),
            },
            {
              title: s("explained.tdh.versions.hwk.today"),
              body: m("explained.tdh.versions.hwk.todayBody", {
                time: p.v("memes.readAt"),
              }),
            },
          ]}
        />
      </article>
    </ExplainedShell>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "explained.tdh.versions.meta.title"),
      description: t(DEFAULT_LOCALE, "explained.tdh.versions.meta.description"),
    },
    { canonicalPath: "/network/tdh/historic-boosts" }
  );
}
