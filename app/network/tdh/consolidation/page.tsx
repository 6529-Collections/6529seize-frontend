import type { Metadata } from "next";
import Link from "next/link";
import WalletGraph from "@/components/explained/figures/WalletGraph";
import type { ReactNode } from "react";
import FactValue from "@/components/explained/facts/FactValue";
import { kt } from "@/components/explained/i18n";
import Mark from "@/components/explained/marks/Mark";
import Track from "@/components/explained/marks/Track";
import { chapterById, HUB_HREF } from "@/components/explained/shell/chapters";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import PrevNext from "@/components/explained/shell/PrevNext";
import { EX_BUTTON, EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { loadFactBook } from "@/lib/explained/feed.server";
import type { FactBook } from "@/lib/explained/facts";
import { formatCount } from "@/lib/explained/format";
import {
  resolveExplainedLocale,
  type ExplainedParams,
} from "@/lib/explained/locale.server";
import { RecordValue } from "@/components/explained/layout/RecordValue";
import { FactText } from "@/components/explained/facts/FactText";
import {
  EdRow,
  GoLink,
  PageHead,
  pageLink,
  Para,
  Section,
  Statement,
  StatementLabel,
  You,
} from "@/components/explained/layout/rows";
import { rich } from "@/components/explained/rich";
import { wt, type WalletsKey } from "./copy";
import PairPicture from "./PairPicture";
import SignOrder from "./SignOrder";
import WalletsLens from "./WalletsLens";
import {
  CONFORMANCE_SOURCE,
  RANDOM_LINK_GRAPHS,
  gateText,
  groupingVectorsPassed,
} from "./walletFacts";
import WhyPicker from "./WhyPicker";

const ROUTE = "/network/tdh/consolidation";
/** 6529.io's guided consolidation setup. */
const GUIDED_SETUP_HREF = "/safe-collecting/build-consolidation";
const DESIGN_HREF = "/network/tdh/consolidation/design";

/**
 * 2 Your wallets (TDH-DESIGN.md §4.3): why a number changed, first; the
 * four-wallet rule (D136) with its model; the safe way to add a fourth
 * wallet; what to know before starting; questions. Old anchors of the
 * consolidation guide land in their sections.
 */
/**
 * The page's subject beside its opening: four wallets, every pair linked
 * both ways, one identity; D's links fresh, made after the gate.
 */
const HERO_WALLETS = [
  { id: "A", x: 0.22, y: 0.24 },
  { id: "B", x: 0.78, y: 0.24 },
  { id: "C", x: 0.22, y: 0.76 },
  { id: "D", x: 0.78, y: 0.76 },
] as const;
const HERO_LINKS = [
  { a: "A", b: "B", kind: "old" },
  { a: "A", b: "C", kind: "old" },
  { a: "B", b: "C", kind: "old" },
  { a: "A", b: "D", kind: "fresh" },
  { a: "B", b: "D", kind: "fresh" },
  { a: "C", b: "D", kind: "fresh" },
] as const;

export default async function TdhYourWalletsPage({
  searchParams,
}: {
  readonly searchParams: Promise<ExplainedParams>;
}) {
  const locale = await resolveExplainedLocale(await searchParams);
  const book = await loadFactBook();
  const gate = book.get<string>("rules.gateActivation");
  const when = gateText(gate, locale);
  const chapter = chapterById("tdh");
  const n = (id: string) =>
    [...chapter.read, ...chapter.check].find((entry) => entry.id === id)?.n;
  const day = (text: string) => (
    <FactText fact={gate} locale={locale}>
      {text}
    </FactText>
  );
  const B = "tw-font-semibold tw-text-iron-50";

  // Each answer is an element in a prop of the client picker, so its parts
  // arrive there as a list: each carries its own key.
  // A server component of its own: the client picker receives each answer
  // already rendered, not elements to reconcile.
  const answer = (verdict: WalletsKey, body: ReactNode, extra?: ReactNode) => (
    <WhyAnswer verdict={wt(locale, verdict)} body={body} extra={extra} />
  );

  // Why did my number change: each cause and its answer.
  const why = [
    {
      key: "moved",
      label: wt(locale, "explained.tdh.wallets.why.moved"),
      answer: answer(
        "explained.tdh.wallets.why.movedVerdict",
        wt(locale, "explained.tdh.wallets.why.movedBody"),
        <div>
          {[
            <div key="picture" className="tw-mt-3">
              <PairPicture locale={locale} />
            </div>,
            <p key="caption" className={`tw-m-0 tw-mt-2 ${EX_TEXT.cap}`}>
              {wt(locale, "explained.tdh.wallets.why.movedCaption")}
            </p>,
          ]}
        </div>
      ),
    },
    {
      key: "added",
      label: wt(locale, "explained.tdh.wallets.why.added"),
      answer: answer(
        "explained.tdh.wallets.why.addedVerdict",
        rich(locale, "explained.tdh.wallets.why.addedBody", {
          how: (
            <a className={EX_LINK} href="#add">
              {wt(locale, "explained.tdh.wallets.why.addedHow")}
            </a>
          ),
        })
      ),
    },
    {
      key: "sold",
      label: wt(locale, "explained.tdh.wallets.why.sold"),
      answer: answer(
        "explained.tdh.wallets.why.soldVerdict",
        wt(locale, "explained.tdh.wallets.why.soldBody")
      ),
    },
    {
      key: "unlinked",
      label: wt(locale, "explained.tdh.wallets.why.unlinked"),
      answer: answer(
        "explained.tdh.wallets.why.unlinkedVerdict",
        wt(locale, "explained.tdh.wallets.why.unlinkedBody")
      ),
    },
    {
      key: "newcard",
      label: wt(locale, "explained.tdh.wallets.why.newcard"),
      answer: answer(
        "explained.tdh.wallets.why.newcardVerdict",
        wt(locale, "explained.tdh.wallets.why.newcardBody")
      ),
    },
  ];

  return (
    <ExplainedShell
      chapter="tdh"
      page="wallets"
      crumbs={[
        { label: kt(locale, "explained.kit.map.hub"), href: HUB_HREF },
        {
          label: kt(locale, "explained.kit.map.chapterTitle", {
            number: chapter.number ?? "",
            title: kt(locale, "explained.kit.map.tdh"),
          }),
          href: "/network/tdh",
        },
        { label: kt(locale, "explained.kit.map.tdh.wallets") },
      ]}
      live={{ fact: book.maybe("page.readAt"), kind: "read" }}
      facts={book.snapshot()}
      locale={locale}
    >
      <article data-ex-article="" lang={locale}>
        <span id="consolidation-status" />
        <span id="consolidation-benefits" />
        <PageHead
          eyebrow={
            <>
              {wt(locale, "explained.tdh.wallets.eyebrow.chapter")}{" "}
              <span>{chapter.number}</span>
              {" · "}
              <You>{n("wallets")}</You>{" "}
              {kt(locale, "explained.kit.map.tdh.wallets")}
            </>
          }
          title={wt(locale, "explained.tdh.wallets.title")}
          titleClassName="tw-max-w-[940px]"
          aside={
            <figure className="tw-m-0" aria-hidden="true">
              <WalletGraph
                wallets={HERO_WALLETS}
                links={HERO_LINKS}
                groups={[["A", "B", "C", "D"]]}
                locale={locale}
              />
            </figure>
          }
          lede={rich(locale, "explained.tdh.wallets.lede", {
            date: day(when.long),
          })}
        >
          <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-x-[18px] tw-gap-y-1.5">
            <Mark kind="decided" refText="D136" locale={locale} />
            <FactText fact={gate} locale={locale}>
              <Track
                maturity="live"
                label={wt(locale, "explained.tdh.wallets.liveOn")}
                refText={wt(locale, "explained.tdh.wallets.since", {
                  date: when.day,
                })}
                locale={locale}
              />
            </FactText>
          </div>
          <div className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-2.5 md:tw-mt-[30px]">
            <Link className={EX_BUTTON.cta} href={GUIDED_SETUP_HREF}>
              {wt(locale, "explained.tdh.wallets.setup")}
            </Link>
            <Link className={EX_BUTTON.secondary} href="/network/tdh#explain">
              {wt(locale, "explained.tdh.wallets.explain")}
            </Link>
          </div>
        </PageHead>

        <Section id="why" tight>
          <span id="consolidation-change" />
          <span id="consolidation-wallets" />
          <EdRow
            no="01"
            label={wt(locale, "explained.tdh.wallets.why.label")}
            wide
          >
            <h2 className={EX_TEXT.h2}>
              {wt(locale, "explained.tdh.wallets.why.title")}
            </h2>
          </EdRow>
          <EdRow wide labelOnPhone={false} className="tw-mt-6">
            <WhyPicker
              label={wt(locale, "explained.tdh.wallets.why.group")}
              options={why.map(({ key, label }) => ({ key, label }))}
              answers={Object.fromEntries(
                why.map((option) => [option.key, option.answer])
              )}
              footer={
                <p className="tw-m-0 tw-mt-4 tw-text-[15px] tw-leading-6 tw-text-iron-300">
                  {wt(locale, "explained.tdh.wallets.why.explain")}{" "}
                  <Link className={EX_LINK} href="/network/tdh#explain">
                    {wt(locale, "explained.tdh.wallets.why.open")}
                  </Link>
                </p>
              }
            />
          </EdRow>
        </Section>

        <Section id="four">
          <Statement
            label={
              <StatementLabel mark="02">
                {wt(locale, "explained.tdh.wallets.rule.label")}
              </StatementLabel>
            }
            title={wt(locale, "explained.tdh.wallets.rule.title")}
          >
            <Para>
              {rich(locale, "explained.tdh.wallets.rule.body", {
                gate: day(when.full),
              })}
            </Para>
          </Statement>
          <div className="tw-mt-12">
            <WalletsLens
              locale={locale}
              start="missing"
              label={wt(locale, "explained.tdh.wallets.lens.label")}
              question={wt(locale, "explained.tdh.wallets.lens.question")}
              withRule
              caption={wt(locale, "explained.tdh.wallets.lens.caption", {
                date: when.day,
              })}
              groups={[
                {
                  label: wt(locale, "explained.tdh.wallets.lens.cases"),
                  options: [
                    {
                      value: "three",
                      label: wt(locale, "explained.tdh.wallets.lens.three"),
                    },
                    {
                      value: "missing",
                      label: wt(locale, "explained.tdh.wallets.lens.missing"),
                    },
                    {
                      value: "oldfour",
                      label: wt(locale, "explained.tdh.wallets.lens.oldfour", {
                        date: when.day,
                      }),
                    },
                  ],
                },
                {
                  label: wt(locale, "explained.tdh.wallets.lens.adding"),
                  lead: wt(locale, "explained.tdh.wallets.lens.addD"),
                  options: [
                    {
                      value: "step1",
                      label: wt(locale, "explained.tdh.wallets.lens.step1", {
                        step: formatCount(locale, 1),
                      }),
                    },
                    { value: "step2", label: formatCount(locale, 2) },
                    { value: "step3", label: formatCount(locale, 3) },
                    {
                      value: "batch",
                      label: wt(locale, "explained.tdh.wallets.lens.batch"),
                    },
                  ],
                },
              ]}
            />
          </div>
        </Section>

        <Section id="add">
          <span id="consolidation-steps" />
          <EdRow
            no="03"
            label={wt(locale, "explained.tdh.wallets.add.label")}
            wide
          >
            <h2 className={EX_TEXT.h2}>
              {wt(locale, "explained.tdh.wallets.add.title")}
            </h2>
            <ol className="tw-m-0 tw-mt-6 tw-grid tw-max-w-[760px] tw-list-none tw-gap-4 tw-p-0">
              {(
                [
                  [
                    "explained.tdh.wallets.add.oneLead",
                    "explained.tdh.wallets.add.one",
                  ],
                  [
                    "explained.tdh.wallets.add.twoLead",
                    "explained.tdh.wallets.add.two",
                  ],
                ] as const
              ).map(([lead, rest], index) => (
                <li
                  key={lead}
                  className="tw-relative tw-pl-[42px] md:tw-pl-[46px]"
                >
                  <span
                    className="tw-absolute tw-left-0 tw-top-0 tw-grid tw-size-[30px] tw-place-items-center tw-rounded-full tw-border-[1.5px] tw-border-solid tw-border-primary-400 tw-text-sm tw-font-bold tw-text-primary-300"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <p className={`tw-m-0 ${EX_TEXT.body}`}>
                    <b className={B}>{wt(locale, lead)}</b> {wt(locale, rest)}
                  </p>
                </li>
              ))}
            </ol>
            <SignOrder locale={locale} />
            <dl className="tw-m-0 tw-mt-8 tw-grid tw-grid-cols-1 tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-text-base tw-leading-[26px] md:tw-grid-cols-[max-content_minmax(0,1fr)] md:tw-text-[18px] md:tw-leading-[29px]">
              {(
                [
                  [
                    "explained.tdh.wallets.add.costLabel",
                    wt(locale, "explained.tdh.wallets.add.cost"),
                  ],
                  [
                    "explained.tdh.wallets.add.resignLabel",
                    rich(locale, "explained.tdh.wallets.add.resign", {
                      date: day(when.dayYear),
                    }),
                  ],
                  [
                    "explained.tdh.wallets.add.avoidLabel",
                    wt(locale, "explained.tdh.wallets.add.avoid"),
                  ],
                ] as const
              ).map(([term, text]) => (
                <div key={term} className="tw-contents">
                  <dt className="tw-m-0 tw-pt-3 tw-text-iron-400 md:tw-border-0 md:tw-border-b md:tw-border-solid md:tw-border-iron-900 md:tw-py-3 md:tw-pr-7">
                    {wt(locale, term)}
                  </dt>
                  <dd className="tw-m-0 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-pb-3 tw-pt-0.5 md:tw-py-3">
                    <p className="tw-m-0 tw-max-w-[760px] tw-text-base tw-leading-[26px] tw-text-iron-50 md:tw-text-[18px] md:tw-leading-[29px]">
                      {text}
                    </p>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="tw-m-0 tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
              <Link className={EX_BUTTON.cta} href={GUIDED_SETUP_HREF}>
                {wt(locale, "explained.tdh.wallets.setup")}
              </Link>
              <span className="tw-text-[15px] tw-leading-6 tw-text-iron-400">
                {wt(locale, "explained.tdh.wallets.add.setupNote")}
              </span>
            </p>
          </EdRow>
        </Section>

        <Section id="before">
          <span id="consolidation-before" />
          <EdRow
            no="04"
            label={wt(locale, "explained.tdh.wallets.before.label")}
            wide
            labelIsHeading
          >
            <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2 md:tw-gap-5">
              {(
                [
                  [
                    "explained.tdh.wallets.before.profileTitle",
                    "explained.tdh.wallets.before.profile",
                  ],
                  [
                    "explained.tdh.wallets.before.keyTitle",
                    "explained.tdh.wallets.before.key",
                  ],
                  [
                    "explained.tdh.wallets.before.votesTitle",
                    "explained.tdh.wallets.before.votes",
                  ],
                  [
                    "explained.tdh.wallets.before.managerTitle",
                    "explained.tdh.wallets.before.manager",
                  ],
                ] as const
              ).map(([title, body]) => (
                <div
                  key={title}
                  className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-px-[22px] tw-py-5"
                >
                  <h3
                    className={`${EX_TEXT.h4} md:tw-text-[20px] md:tw-leading-7`}
                  >
                    {wt(locale, title)}
                  </h3>
                  <p className="tw-m-0 tw-mt-2 tw-text-base tw-leading-[26px] tw-text-iron-300 md:tw-text-[18px] md:tw-leading-[29px]">
                    {wt(locale, body)}
                  </p>
                </div>
              ))}
            </div>
          </EdRow>
        </Section>

        <Section id="faq">
          <span id="consolidation-faq" />
          <span id="consolidation-under" />
          <EdRow
            no="05"
            label={wt(locale, "explained.tdh.wallets.faq.label")}
            wide
            labelIsHeading
          >
            {(
              [
                [
                  "explained.tdh.wallets.faq.roundQ",
                  "explained.tdh.wallets.faq.roundA",
                ],
                [
                  "explained.tdh.wallets.faq.laterQ",
                  "explained.tdh.wallets.faq.laterA",
                ],
                [
                  "explained.tdh.wallets.faq.oldQ",
                  "explained.tdh.wallets.faq.oldA",
                ],
                [
                  "explained.tdh.wallets.faq.expireQ",
                  "explained.tdh.wallets.faq.expireA",
                ],
                [
                  "explained.tdh.wallets.faq.validatorsQ",
                  "explained.tdh.wallets.faq.validatorsA",
                ],
              ] as const
            ).map(([question, answerKey], index) => (
              <details
                key={question}
                open={index === 0}
                className="tw-group tw-border-0 tw-border-t tw-border-solid tw-border-iron-900"
              >
                <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-py-4 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 [&::-webkit-details-marker]:tw-hidden">
                  <span>
                    {question === "explained.tdh.wallets.faq.oldQ"
                      ? rich(locale, question, { date: day(when.day) })
                      : wt(locale, question)}
                  </span>
                  <span
                    className="tw-flex-none tw-font-medium tw-text-iron-400 group-open:tw-hidden"
                    aria-hidden="true"
                  >
                    +
                  </span>
                  <span
                    className="tw-hidden tw-flex-none tw-font-medium tw-text-iron-400 group-open:tw-inline"
                    aria-hidden="true"
                  >
                    –
                  </span>
                </summary>
                <p className="tw-m-0 tw-hidden tw-max-w-[560px] tw-pb-4 tw-text-[15px] tw-leading-6 tw-text-iron-300 group-open:tw-block">
                  {wt(locale, answerKey)}
                </p>
              </details>
            ))}
            <p className="tw-m-0 tw-mt-6">
              <GoLink href={DESIGN_HREF}>
                {wt(locale, "explained.tdh.wallets.faq.under")}
              </GoLink>
            </p>
          </EdRow>
        </Section>

        <PrevNext
          locale={locale}
          prev={pageLink(
            "/network/tdh/how-it-works",
            kt(locale, "explained.kit.map.tdh.how"),
            n("how")
          )}
          next={pageLink(
            "/network/tdh/verification",
            kt(locale, "explained.kit.map.tdh.check"),
            n("check")
          )}
        />
      </article>
      <HowWeKnow
        locale={locale}
        title={wt(locale, "explained.tdh.wallets.title")}
        slug="tdh-your-wallets"
        rows={howWeKnow(book, locale)}
      />
    </ExplainedShell>
  );
}

function howWeKnow(book: FactBook, locale: SupportedLocale) {
  return [
    {
      title: wt(locale, "explained.tdh.wallets.hwk.rule"),
      body: rich(locale, "explained.tdh.wallets.hwk.ruleBody", {
        head: (
          <>
            6529chain{" "}
            <FactValue fact={book.maybe("rules.chainHead")} locale={locale} />
          </>
        ),
        graphs: (
          <RecordValue
            id={RANDOM_LINK_GRAPHS.id}
            source={RANDOM_LINK_GRAPHS.source}
            locale={locale}
          >
            {formatCount(locale, RANDOM_LINK_GRAPHS.value)}
          </RecordValue>
        ),
      }),
    },
    {
      title: wt(locale, "explained.tdh.wallets.hwk.model"),
      body: rich(locale, "explained.tdh.wallets.hwk.modelBody", {
        pass: (
          <RecordValue
            id="engine.conformance.grouping"
            source={CONFORMANCE_SOURCE}
            locale={locale}
          >
            {formatCount(locale, groupingVectorsPassed())}
          </RecordValue>
        ),
      }),
    },
    {
      title: wt(locale, "explained.tdh.wallets.hwk.setup"),
      body: wt(locale, "explained.tdh.wallets.hwk.setupBody"),
    },
  ];
}

export function generateMetadata(): Metadata {
  return getAppMetadata(
    {
      title: wt(DEFAULT_LOCALE, "explained.tdh.wallets.meta.title"),
      description: wt(DEFAULT_LOCALE, "explained.tdh.wallets.meta.description"),
    },
    { canonicalPath: ROUTE }
  );
}

/** One answer of Why did my number change: its verdict, its body, a figure. */
function WhyAnswer({
  verdict,
  body,
  extra,
}: {
  readonly verdict: string;
  readonly body: ReactNode;
  readonly extra?: ReactNode;
}) {
  return (
    <div>
      <p className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-7 tw-tracking-[-0.015em] tw-text-iron-50 md:tw-text-[26px] md:tw-leading-8">
        {verdict}
      </p>
      <p className="tw-m-0 tw-mt-3 tw-text-[15px] tw-leading-6 tw-text-iron-300">
        {body}
      </p>
      {extra}
    </div>
  );
}
