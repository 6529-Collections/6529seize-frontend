"use client";

import Link from "next/link";

import BarList from "@/components/stream/diagrams/BarList";
import DiagramFigure from "@/components/stream/diagrams/DiagramFigure";
import Flow from "@/components/stream/diagrams/Flow";
import OrderBookTable from "@/components/stream/diagrams/OrderBookTable";
import SplitBar from "@/components/stream/diagrams/SplitBar";
import Steps from "@/components/stream/diagrams/Steps";
import TierComparison from "@/components/stream/diagrams/TierComparison";
import Timeline from "@/components/stream/diagrams/Timeline";
import {
  aboutHref,
  STREAM_ABOUT_KEYS,
  STREAM_ABOUT_PAGES,
  type StreamAboutPage as AboutPage,
} from "@/components/stream/layout/streamNavigation";
import { PageHeader, Section } from "@/components/stream/pages/common";
import { formatEth } from "@/components/stream/ui/EthAmount";
import { STREAM_FOCUS, STREAM_HELP } from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatPercent } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { clear } from "@/lib/stream/clearing";
import {
  CANONICAL_FEE_SHARE,
  FEDERATED_FEE_SHARE,
} from "@/lib/stream/constants";
import { candidateRows, stepTotalRows } from "@/lib/stream/editionViews";
import { ladderPrices } from "@/lib/stream/ladder";

function AboutNav({
  current,
  locale,
}: {
  readonly current: AboutPage;
  readonly locale: SupportedLocale;
}) {
  return (
    <nav aria-label={t(locale, "stream.about.nav")} className="tw-mb-6">
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-1 tw-p-0">
        {STREAM_ABOUT_PAGES.map((page) => (
          <li key={page}>
            <Link
              href={aboutHref(page)}
              aria-current={page === current ? "page" : undefined}
              className={`tw-inline-flex tw-rounded-lg tw-px-2.5 tw-py-1 tw-text-xs tw-no-underline ${STREAM_FOCUS} ${
                page === current
                  ? "tw-bg-iron-800 tw-text-iron-50"
                  : "tw-text-iron-400 hover:tw-bg-iron-900 hover:tw-text-iron-50"
              }`}
            >
              {t(locale, `stream.about.${STREAM_ABOUT_KEYS[page]}.nav`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const WORK_PATH = [
  "submit",
  "vote",
  "approve",
  "sign",
  "auction",
  "settle",
] as const;

function OverviewDiagrams({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <>
      <DiagramFigure caption={t(locale, "stream.diagram.path.caption")}>
        <Steps
          locale={locale}
          label={t(locale, "stream.diagram.path.label")}
          steps={WORK_PATH.map((step) => ({
            title: t(locale, `stream.diagram.path.${step}.title`),
            detail: t(locale, `stream.diagram.path.${step}.detail`),
          }))}
        />
      </DiagramFigure>
      <Section title={t(locale, "stream.tiers.title")}>
        <TierComparison locale={locale} />
      </Section>
    </>
  );
}

function AntiSnipeTimeline({ locale }: { readonly locale: SupportedLocale }) {
  const hour = 60;
  return (
    <DiagramFigure caption={t(locale, "stream.diagram.antiSnipe.caption")}>
      <Timeline
        start={0}
        end={24 * hour + 10}
        title={t(locale, "stream.diagram.antiSnipe.title")}
        description={t(locale, "stream.diagram.antiSnipe.description")}
        startLabel={t(locale, "stream.diagram.antiSnipe.start")}
        endLabel={t(locale, "stream.diagram.antiSnipe.end")}
        spans={[
          {
            from: 24 * hour - 15,
            to: 24 * hour,
            label: t(locale, "stream.diagram.antiSnipe.window"),
            tone: "accent",
          },
        ]}
        marks={[
          { at: 0, label: t(locale, "stream.diagram.antiSnipe.opens") },
          {
            at: 24 * hour - 10,
            label: t(locale, "stream.diagram.antiSnipe.lateBid"),
            tone: "warning",
          },
          {
            at: 24 * hour + 5,
            label: t(locale, "stream.diagram.antiSnipe.newEnd"),
            tone: "accent",
          },
        ]}
      />
    </DiagramFigure>
  );
}

/** The owner's worked example (PLAN Appendix C, trace 2), cleared by the real rule. */
function exampleBook() {
  const prices = ladderPrices();
  const live = new Array<number>(prices.length).fill(0);
  live[192] = 1;
  live[158] = 9;
  live[144] = 20;
  live[130] = 50;
  live[96] = 200;
  const result = clear(live, prices);
  return {
    result,
    rows: stepTotalRows(live, prices, 0, result),
    candidates: candidateRows(result, prices, 10_000),
  };
}

function EditionsExample({ locale }: { readonly locale: SupportedLocale }) {
  const { result, rows, candidates } = exampleBook();
  return (
    <>
      <DiagramFigure caption={t(locale, "stream.diagram.book.caption")}>
        <OrderBookTable
          rows={rows}
          count={result.count}
          clearingStep={result.step}
          locale={locale}
        />
      </DiagramFigure>
      <DiagramFigure
        caption={t(locale, "stream.diagram.why.caption")}
        className="tw-mt-4"
      >
        <BarList
          label={t(locale, "stream.edition.candidates")}
          marker={0.9}
          markerLabel={t(locale, "stream.edition.thresholdNote", {
            share: formatPercent(locale, 0.9, 0),
          })}
          items={candidates.map((candidate) => ({
            key: String(candidate.step),
            label: t(locale, "stream.edition.candidate", {
              count: formatInteger(locale, candidate.count),
              price: formatEth(locale, candidate.price),
            }),
            fraction: candidate.shareOfBestBps / 10_000,
            value: formatEth(locale, candidate.revenue),
            emphasis: candidate.chosen,
            ...(candidate.chosen
              ? { tag: t(locale, "stream.edition.tagSells") }
              : {}),
          }))}
        />
      </DiagramFigure>
    </>
  );
}

function CurationFlow({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <DiagramFigure caption={t(locale, "stream.diagram.curation.caption")}>
      <Flow
        label={t(locale, "stream.diagram.curation.label")}
        lanes={[
          {
            nodes: [
              {
                label: t(locale, "stream.diagram.curation.wave"),
                detail: t(locale, "stream.diagram.curation.offChain"),
                tone: "muted",
              },
              {
                label: t(locale, "stream.diagram.curation.signer"),
                detail: t(locale, "stream.diagram.curation.eip712"),
              },
              {
                label: t(locale, "stream.diagram.curation.registry"),
                detail: t(locale, "stream.diagram.curation.onChain"),
                tone: "accent",
              },
              { label: t(locale, "stream.diagram.curation.startable") },
            ],
          },
        ]}
      />
    </DiagramFigure>
  );
}

function FederatedDiagrams({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <>
      <DiagramFigure caption={t(locale, "stream.diagram.worlds.caption")}>
        <Flow
          label={t(locale, "stream.diagram.worlds.label")}
          lanes={[
            {
              title: t(locale, "stream.diagram.worlds.curated"),
              nodes: [
                { label: t(locale, "stream.diagram.worlds.vote") },
                {
                  label: t(locale, "stream.diagram.worlds.stream"),
                  tone: "accent",
                },
                { label: t(locale, "stream.diagram.worlds.adapters") },
              ],
            },
            {
              title: t(locale, "stream.diagram.worlds.federated"),
              nodes: [
                { label: t(locale, "stream.diagram.worlds.factory") },
                {
                  label: t(locale, "stream.diagram.worlds.own"),
                  tone: "accent",
                },
                { label: t(locale, "stream.diagram.worlds.adapters") },
              ],
            },
          ]}
        />
      </DiagramFigure>
      <Section title={t(locale, "stream.tiers.title")}>
        <TierComparison locale={locale} highlight="federated" />
      </Section>
    </>
  );
}

const CONTRACT_GROUPS = [
  "curation",
  "products",
  "sales",
  "money",
  "content",
  "governance",
] as const;

function ContractMap({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <DiagramFigure caption={t(locale, "stream.diagram.contracts.caption")}>
      <Flow
        label={t(locale, "stream.diagram.contracts.label")}
        lanes={[
          {
            nodes: CONTRACT_GROUPS.map((group) => ({
              label: t(locale, `stream.diagram.contracts.${group}.title`),
              detail: t(locale, `stream.diagram.contracts.${group}.detail`),
            })),
          },
        ]}
      />
    </DiagramFigure>
  );
}

function Splits({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
      <DiagramFigure caption={t(locale, "stream.diagram.split.canonical")}>
        <SplitBar feeShare={CANONICAL_FEE_SHARE} locale={locale} />
      </DiagramFigure>
      <DiagramFigure caption={t(locale, "stream.diagram.split.federated")}>
        <SplitBar feeShare={FEDERATED_FEE_SHARE} locale={locale} />
      </DiagramFigure>
    </div>
  );
}

function DeveloperStatus({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section id="status" className="tw-scroll-mt-24">
      <ul className="tw-m-0 tw-list-none tw-space-y-1.5 tw-p-0 tw-text-sm tw-text-iron-200">
        {(["audit", "network", "data", "federated"] as const).map((line) => (
          <li key={line}>
            {t(locale, `stream.about.developers.status.${line}`)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PageDiagrams({
  page,
  locale,
}: {
  readonly page: AboutPage;
  readonly locale: SupportedLocale;
}) {
  switch (page) {
    case "overview":
      return <OverviewDiagrams locale={locale} />;
    case "artists":
      return <Splits locale={locale} />;
    case "collectors":
      return <AntiSnipeTimeline locale={locale} />;
    case "editions":
      return <EditionsExample locale={locale} />;
    case "curation":
      return <CurationFlow locale={locale} />;
    case "federated":
      return <FederatedDiagrams locale={locale} />;
    case "how-it-works":
      return <ContractMap locale={locale} />;
    case "developers":
      return <DeveloperStatus locale={locale} />;
  }
}

/**
 * The explainer pages under /stream/about. The copy is a placeholder until the
 * owner approves the copy document; the diagrams use the shared primitives.
 */
export default function StreamAboutPage({
  page,
}: {
  readonly page: AboutPage;
}) {
  const locale = useBrowserLocale();
  const key = STREAM_ABOUT_KEYS[page];
  return (
    <article>
      <AboutNav current={page} locale={locale} />
      <PageHeader
        title={t(locale, `stream.about.${key}.title`)}
        intro={t(locale, `stream.about.${key}.intro`)}
      >
        <p className={`${STREAM_HELP} tw-mt-2`}>
          {t(locale, "stream.about.copyPending")}
        </p>
      </PageHeader>
      <PageDiagrams page={page} locale={locale} />
    </article>
  );
}
