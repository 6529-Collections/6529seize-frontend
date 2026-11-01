import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { kt } from "@/components/explained/i18n";
import DriftNote from "@/components/explained/marks/DriftNote";
import Hash from "@/components/explained/marks/Hash";
import Mark from "@/components/explained/marks/Mark";
import Track from "@/components/explained/marks/Track";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import { EX_TEXT } from "@/components/explained/tokens";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { loadFactBook } from "@/lib/explained/feed.server";
import { PlaceLinks, pagePlace } from "@/components/explained/shell/place";
import {
  Caption,
  CodeName,
  Contents,
  FactsList,
  PageHead,
} from "@/components/explained/reference/parts";
import SpecificationAnchors from "./SpecificationAnchors";
import SpecReference from "./SpecReference";
import SpecRules from "./SpecRules";
import { specContext, type SpecKey } from "./specShared";

/**
 * Shelf S1, the TDH v1.4 specification (TDH-DESIGN.md §4.7): contents at
 * the top, "This version" with both of P26's true marks, the rules' change
 * of name, then every section of P26 restated: §5.2 with the exact floor
 * and FirstGM's adjustment, §8.1 with the half-cent trap, §9's roots as the
 * target, §10's registry with D136's two fields, §11 and §12 by ID, §13
 * conformance. Every registry number is read from the registry.
 */
export const revalidate = 600;

/** P26 changes with a new text, not on a schedule. */
const P26_CADENCE_MINUTES = 60 * 24 * 30;

const SECTIONS: readonly (readonly [string, SpecKey])[] = [
  ["s1", "explained.tdh.spec.s1.title"],
  ["s2", "explained.tdh.spec.s2.title"],
  ["s3", "explained.tdh.spec.s3.title"],
  ["s4", "explained.tdh.spec.s4.title"],
  ["s5", "explained.tdh.spec.s5.title"],
  ["s6", "explained.tdh.spec.s6.title"],
  ["s7", "explained.tdh.spec.s7.title"],
  ["s8", "explained.tdh.spec.s8.title"],
  ["s9", "explained.tdh.spec.s9.title"],
  ["s10", "explained.tdh.spec.s10.title"],
  ["s11", "explained.tdh.spec.s11.title"],
  ["s12", "explained.tdh.spec.s12.title"],
  ["s13", "explained.tdh.spec.s13.title"],
];

export default async function SpecificationPage() {
  const locale = DEFAULT_LOCALE;
  const book = await loadFactBook();
  const ctx = specContext(book, locale);
  const place = pagePlace("tdh", "spec", locale);
  const { m, s, p } = ctx;
  const reported = p.text("tdh.latest.ruleVersion");
  const current = p.text("rules.version");
  const hash = (id: "rules.registry" | "rules.ruleId", name: string) => {
    const fact = book.maybe<string>(id);
    return fact ? (
      <span data-fact={id}>
        <Hash
          value={fact.value}
          locale={locale}
          short={[4, 2]}
          copy
          name={name}
        />
      </span>
    ) : (
      p.v(id)
    );
  };
  return (
    <ExplainedShell
      chapter="tdh"
      page="spec"
      crumbs={[
        { label: kt(locale, "explained.kit.map.hub"), href: "/explained" },
        {
          label: kt(locale, "explained.kit.map.chapterTitle", {
            number: place.chapterNumber,
            title: kt(locale, "explained.kit.map.tdh"),
          }),
          href: "/network/tdh",
        },
        { label: t(locale, "explained.tdh.spec.crumb") },
      ]}
      live={{
        fact: book.maybe("rules.p26Date"),
        kind: "file",
        cadenceMinutes: P26_CADENCE_MINUTES,
      }}
      facts={book.snapshot()}
      locale={locale}
    >
      <SpecificationAnchors />
      <article data-ex-article="" lang={locale}>
        <PageHead
          eyebrow={m("explained.tdh.spec.eyebrow", {
            n: <span>{place.n}</span>,
          })}
          title={m("explained.tdh.spec.title")}
          lede={m("explained.tdh.spec.lede")}
        />

        <div className="tw-mt-10 tw-grid tw-grid-cols-1 tw-items-start tw-gap-10 lg:tw-mt-12 lg:tw-grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <span className={`${EX_TEXT.label} tw-mb-3 tw-block`}>
              {m("explained.tdh.spec.contents")}
            </span>
            <Contents
              label={s("explained.tdh.spec.contents")}
              items={[
                ...SECTIONS.map(([id, title], index) => ({
                  href: `#${id}`,
                  no: String(index + 1),
                  title: m(title, {
                    count: p.v("spec.deviations.inForce"),
                  }),
                })),
                {
                  href: "/network/tdh/implementations",
                  no: "→",
                  title: m("explained.tdh.spec.toc.vectors"),
                },
              ]}
            />
          </div>
          <aside
            id="this-version"
            className="tw-scroll-mt-24 tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-p-6"
            aria-label={s("explained.tdh.spec.version.label")}
          >
            <span className={`${EX_TEXT.label} tw-block`}>
              {m("explained.tdh.spec.version.label")}
            </span>
            <div className="tw-mt-3">
              <FactsList
                rows={[
                  {
                    key: "rule",
                    term: m("explained.tdh.spec.version.rule"),
                    value: <CodeName>{p.v("rules.version")}</CodeName>,
                  },
                  {
                    key: "registry",
                    term: m("explained.tdh.spec.version.registry"),
                    value: hash(
                      "rules.registry",
                      s("explained.tdh.spec.version.registry")
                    ),
                  },
                  {
                    key: "ruleId",
                    term: m("explained.tdh.spec.version.ruleId"),
                    value: hash(
                      "rules.ruleId",
                      s("explained.tdh.spec.version.ruleId")
                    ),
                  },
                  {
                    key: "vectors",
                    term: m("explained.tdh.spec.version.vectors"),
                    value: p.v("rules.vectors"),
                  },
                  {
                    key: "source",
                    term: m("explained.tdh.spec.version.source"),
                    value: m("explained.tdh.spec.version.sourceValue", {
                      commit: <CodeName>{p.v("rules.p26Commit")}</CodeName>,
                      date: p.v("rules.p26Date"),
                    }),
                  },
                ]}
              />
            </div>
            <div className="tw-mt-4 tw-flex tw-flex-col tw-items-start tw-gap-2">
              <Mark
                kind="proposed"
                locale={locale}
                size="sm"
                refText={s("explained.tdh.spec.version.proposed")}
              />
              <Track
                maturity="live"
                locale={locale}
                size="sm"
                refText={s(
                  p.num("tdh.days.equal") !== null &&
                    p.num("tdh.days.equal") === p.num("tdh.days.compared")
                    ? "explained.tdh.spec.version.live"
                    : "explained.tdh.spec.version.liveSome"
                )}
              />
            </div>
            <Caption className="tw-mt-3">
              {m("explained.tdh.spec.version.private")}
            </Caption>
          </aside>
        </div>

        <div className="tw-mt-8">
          <DriftNote by={["D136", "D137"]} locale={locale}>
            {m(
              reported === null || current === null
                ? "explained.tdh.spec.transitionUnread"
                : reported !== current
                  ? "explained.tdh.spec.transition"
                  : "explained.tdh.spec.transitionDone",
              {
                date: p.v("names.renamedAt", "long"),
                old: <CodeName>{p.v("names.v10.name")}</CodeName>,
                wallets: p.v("names.v10.maxWallets"),
                registry: <CodeName wrap>{p.v("names.v10.registry")}</CodeName>,
                current: <CodeName>{p.v("rules.version")}</CodeName>,
              }
            )}
          </DriftNote>
        </div>

        <SpecRules ctx={ctx} />
        <SpecReference ctx={ctx} />

        <PlaceLinks place={place} locale={locale} />
        <HowWeKnow
          locale={locale}
          title={t(locale, "explained.tdh.spec.title")}
          slug="tdh-specification"
          rows={[
            {
              title: s("explained.tdh.spec.hwk.p26"),
              body: m("explained.tdh.spec.hwk.p26Body", {
                commit: p.v("rules.p26Commit"),
                date: p.v("rules.p26Date", "long"),
              }),
            },
            {
              title: s("explained.tdh.spec.hwk.standing"),
              body: m("explained.tdh.spec.hwk.standingBody"),
            },
            {
              title: s("explained.tdh.spec.hwk.registry"),
              body: m("explained.tdh.spec.hwk.registryBody", {
                vector: <CodeName>28-registry-hash</CodeName>,
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
      title: t(DEFAULT_LOCALE, "explained.tdh.spec.meta.title"),
      description: t(DEFAULT_LOCALE, "explained.tdh.spec.meta.description"),
    },
    { canonicalPath: "/network/tdh/specification" }
  );
}
