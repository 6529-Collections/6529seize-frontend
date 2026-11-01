import type { Metadata } from "next";
import { REGISTRY_V14 } from "@/components/explained/engine/tdh";
import FactValue from "@/components/explained/facts/FactValue";
import { kt } from "@/components/explained/i18n";
import { chapterById, HUB_HREF } from "@/components/explained/shell/chapters";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import { EX_TEXT } from "@/components/explained/tokens";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { loadFactBook } from "@/lib/explained/feed.server";
import type { FactBook } from "@/lib/explained/facts";
import { formatCount } from "@/lib/explained/format";
import {
  resolveExplainedLocale,
  type ExplainedParams,
} from "@/lib/explained/locale.server";
import { RecordValue } from "../../how-it-works/_kit/RecordValue";
import { FactText } from "@/components/explained/facts/FactText";
import {
  EdRow,
  PageHead,
  Para,
  Section,
  You,
} from "../../how-it-works/_kit/layout";
import { rich } from "@/components/explained/rich";
import { wt } from "../copy";
import WalletsLens from "../WalletsLens";
import { RANDOM_LINK_GRAPHS, gateText } from "../walletFacts";
import { dt } from "./copy";
import ProtectsBox from "./ProtectsBox";

const ROUTE = "/network/tdh/consolidation/design";

/** Registrations for `n` wallets, every pair both ways: n × (n − 1). */
function registrations(wallets: number): number {
  return wallets * (wallets - 1);
}

/**
 * Shelf S3, Consolidation design (TDH-DESIGN.md §4.7): registrations pair
 * by pair, the signing-order model starting on "D signs last", what the
 * rule protects and does not, and how it was tested. Old anchors of the
 * design page land in their sections.
 */
export default async function TdhConsolidationDesignPage({
  searchParams,
}: {
  readonly searchParams: Promise<ExplainedParams>;
}) {
  const locale = await resolveExplainedLocale(await searchParams);
  const book = await loadFactBook();
  const gate = book.get<string>("rules.gateActivation");
  const max = book.get<number>("rules.maxWallets");
  const when = gateText(gate, locale);
  const chapter = chapterById("tdh");
  const shelfNo = chapter.shelf.findIndex((entry) => entry.id === "design") + 1;
  const count = (wallets: number) => (
    <FactText fact={max} locale={locale}>
      {formatCount(locale, registrations(wallets))}
    </FactText>
  );
  const sizes = Array.from({ length: max.value - 1 }, (_, index) => index + 2);
  const statKeys = [
    "explained.tdh.design.rule.statTwo",
    "explained.tdh.design.rule.statThree",
    "explained.tdh.design.rule.statFour",
  ] as const;

  return (
    <ExplainedShell
      chapter="tdh"
      page="design"
      crumbs={[
        { label: kt(locale, "explained.kit.map.hub"), href: HUB_HREF },
        {
          label: kt(locale, "explained.kit.map.chapterTitle", {
            number: chapter.number ?? "",
            title: kt(locale, "explained.kit.map.tdh"),
          }),
          href: "/network/tdh",
        },
        { label: kt(locale, "explained.kit.map.tdh.design") },
      ]}
      live={{ fact: book.maybe("page.readAt"), kind: "read" }}
      facts={book.snapshot()}
      locale={locale}
    >
      <article data-ex-article="" lang={locale}>
        <PageHead
          reference
          eyebrow={
            <>
              {dt(locale, "explained.tdh.design.eyebrow.shelf")}
              {" · "}
              <You>{`S${shelfNo}`}</You>
              {" · "}
              {dt(locale, "explained.tdh.design.eyebrow.kind")}
            </>
          }
          title={dt(locale, "explained.tdh.design.title")}
          titleClassName="tw-max-w-[900px] [text-wrap:balance]"
          lede={dt(locale, "explained.tdh.design.lede")}
        />

        <Section tight>
          <span id="consolidation-rules" />
          <span id="consolidation-remove" />
          <EdRow
            no="1"
            label={dt(locale, "explained.tdh.design.rule.label")}
            wide
          >
            <h2 className={EX_TEXT.h2}>
              {dt(locale, "explained.tdh.design.rule.title")}
            </h2>
            <Para className="tw-mt-4">
              {rich(locale, "explained.tdh.design.rule.body", {
                useCase: (
                  <RecordValue
                    id="rules.consolidationUseCase"
                    source="P26 §6.1, §10: consolidation_use_case, the TDH v1.4 registry"
                    locale={locale}
                  >
                    {String(REGISTRY_V14.consolidation_use_case)}
                  </RecordValue>
                ),
                two: count(2),
                three: count(3),
                four: count(4),
              })}
            </Para>
            <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-3 sm:tw-gap-5">
              {sizes.map((wallets, index) => {
                const key = statKeys[index];
                if (!key) return null;
                return (
                  <div key={wallets}>
                    <span className={`tw-block ${EX_TEXT.numL}`}>
                      {count(wallets)}
                    </span>
                    <span className={`tw-mt-1 tw-block ${EX_TEXT.cap}`}>
                      {rich(locale, key, {
                        date: (
                          <FactText fact={gate} locale={locale}>
                            {when.day}
                          </FactText>
                        ),
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </EdRow>
        </Section>

        <Section tight>
          <span id="consolidation-add" />
          <span id="consolidation-order" />
          <EdRow
            no="2"
            label={dt(locale, "explained.tdh.design.order.label")}
            wide
            labelIsHeading
          >
            <WalletsLens
              locale={locale}
              start="batch"
              label={dt(locale, "explained.tdh.design.order.lensLabel")}
              question={dt(locale, "explained.tdh.design.order.question")}
              withRule={false}
              caption={wt(locale, "explained.tdh.wallets.lens.caption", {
                date: when.day,
              })}
              groups={[
                {
                  label: dt(locale, "explained.tdh.design.order.group"),
                  options: [
                    {
                      value: "step1",
                      label: dt(locale, "explained.tdh.design.order.first"),
                    },
                    {
                      value: "step2",
                      label: dt(locale, "explained.tdh.design.order.second"),
                    },
                    {
                      value: "step3",
                      label: dt(locale, "explained.tdh.design.order.third"),
                    },
                    {
                      value: "batch",
                      label: wt(locale, "explained.tdh.wallets.lens.batch"),
                    },
                  ],
                },
              ]}
            />
          </EdRow>
        </Section>

        <Section tight>
          <span id="consolidation-why" />
          <span id="consolidation-protects" />
          <span id="consolidation-start" />
          <span id="consolidation-tested" />
          <EdRow
            no="3"
            label={dt(locale, "explained.tdh.design.protects.label")}
            wide
            labelIsHeading
          >
            <ProtectsBox
              protects={{
                label: dt(locale, "explained.tdh.design.protects.yes"),
                items: [
                  dt(locale, "explained.tdh.design.protects.outside"),
                  rich(locale, "explained.tdh.design.protects.old", {
                    date: (
                      <FactText fact={gate} locale={locale}>
                        {when.dayYear}
                      </FactText>
                    ),
                  }),
                ],
              }}
              doesNot={{
                label: dt(locale, "explained.tdh.design.protects.no"),
                items: [
                  dt(locale, "explained.tdh.design.protects.keys"),
                  dt(locale, "explained.tdh.design.protects.manager"),
                ],
              }}
            />
            <Para className="tw-mt-6">
              {rich(locale, "explained.tdh.design.protects.tested", {
                graphs: (
                  <RecordValue
                    id={RANDOM_LINK_GRAPHS.id}
                    source={RANDOM_LINK_GRAPHS.source}
                    locale={locale}
                  >
                    {formatCount(locale, RANDOM_LINK_GRAPHS.value)}
                  </RecordValue>
                ),
              })}
            </Para>
          </EdRow>
        </Section>
      </article>
      <HowWeKnow
        locale={locale}
        title={dt(locale, "explained.tdh.design.title")}
        slug="tdh-consolidation-design"
        rows={howWeKnow(book, locale)}
      />
    </ExplainedShell>
  );
}

function howWeKnow(book: FactBook, locale: SupportedLocale) {
  return [
    {
      title: dt(locale, "explained.tdh.design.hwk.rule"),
      body: rich(locale, "explained.tdh.design.hwk.ruleBody", {
        head: (
          <FactValue fact={book.maybe("rules.p26Commit")} locale={locale} />
        ),
      }),
    },
    {
      title: dt(locale, "explained.tdh.design.hwk.analysis"),
      body: dt(locale, "explained.tdh.design.hwk.analysisBody"),
    },
    {
      title: dt(locale, "explained.tdh.design.hwk.model"),
      body: dt(locale, "explained.tdh.design.hwk.modelBody"),
    },
  ];
}

export function generateMetadata(): Metadata {
  return getAppMetadata(
    {
      title: dt(DEFAULT_LOCALE, "explained.tdh.design.meta.title"),
      description: dt(DEFAULT_LOCALE, "explained.tdh.design.meta.description"),
    },
    { canonicalPath: ROUTE }
  );
}
