import Link from "next/link";
import type { ReactNode } from "react";
import AgreementBars, {
  type AgreementPair,
} from "@/components/explained/evidence/AgreementBars";
import type { ResultDay } from "@/components/explained/evidence/DayRibbon";
import { HonestyBox } from "@/components/explained/evidence/notes";
import ProvenanceTrail, {
  type TrailStep,
} from "@/components/explained/evidence/ProvenanceTrail";
import FactValue from "@/components/explained/facts/FactValue";
import Lanes, { type Lane } from "@/components/explained/figures/Lanes";
import Hash from "@/components/explained/marks/Hash";
import HashStripes from "@/components/explained/marks/HashStripes";
import { EX_LAYOUT, EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import type { Fact, FactBook } from "@/lib/explained/facts";
import { formatCount, formatUtcClock } from "@/lib/explained/format";
import ProofsDoor from "../../proofs/ProofsDoor";
import { pt, type CheckKey } from "./copy";
import { FactText } from "@/components/explained/facts/FactText";
import { rich } from "@/components/explained/rich";
import {
  checkState,
  checkStateOf,
  snapshotInstant,
  type DayView,
} from "./dayModel";

/**
 * The daily check's three sections (TDH-DESIGN.md §4.4): how the check
 * runs (01), how far a green day goes (02), and who can repeat each step
 * today (03). Every count, hash and time is a fact of the latest day.
 */
const CAPTION = "tw-m-0 tw-text-[15px] tw-leading-[23px] tw-text-iron-400";
const MONO = "tw-font-mono tw-text-[13px] tw-normal-case tw-text-iron-300";

/** A section's statement row: the number and label, the heading, the prose beside it. */
function Statement({
  no,
  label,
  title,
  headingId,
  children,
}: {
  readonly no: string;
  readonly label: string;
  readonly title: string;
  readonly headingId: string;
  readonly children: ReactNode;
}) {
  return (
    <div className={EX_LAYOUT.stmt}>
      <div>
        <span className={`${EX_TEXT.label} tw-mb-3.5 tw-block`}>
          <span className="tw-text-primary-300">{no}</span>
          {` · ${label}`}
        </span>
        <h2
          className={`${EX_TEXT.stmt} max-[359px]:tw-text-2xl max-[359px]:tw-leading-[30px]`}
          id={headingId}
        >
          {title}
        </h2>
      </div>
      <div className={`${EX_TEXT.body} lg:tw-pt-1.5`}>{children}</div>
    </div>
  );
}

function midnightOf(day: DayView, locale: SupportedLocale): ReactNode {
  const date = day.text("date");
  return (
    <FactText fact={day.fact("date")} locale={locale}>
      {date === null ? "" : formatUtcClock(locale, snapshotInstant(date))}
    </FactText>
  );
}

function hashValue(fact: Fact | null, locale: SupportedLocale): ReactNode {
  return <FactValue fact={fact} locale={locale} className={MONO} />;
}

function liveLaneTitle(day: DayView, locale: SupportedLocale): string {
  const state = checkState(day);
  if (state === "notCompared") {
    return pt(locale, "explained.tdh.check.lanes.liveNotCompared");
  }
  const equal = day.num("agree.live.identities.equal");
  const total = day.num("agree.live.identities.total");
  if (equal === null || total === null) {
    // The day file was not read: say so, never "equal" from two unknowns.
    return pt(locale, "explained.tdh.check.lanes.notRead");
  }
  return equal === total
    ? pt(locale, "explained.tdh.check.lanes.liveEqual")
    : pt(locale, "explained.tdh.check.lanes.liveDiffers", {
        differ: formatCount(locale, total - equal),
      });
}

function lanes(day: DayView, locale: SupportedLocale): Lane[] {
  const program = (n: number) =>
    pt(locale, "explained.tdh.check.lanes.program", {
      number: formatCount(locale, n),
    });
  const records = day.text("recordsSha");
  const same = records !== null && records === day.text("recordsSha.python");
  let recordsTitle: CheckKey = "explained.tdh.check.lanes.recordsDiffer";
  if (records === null) recordsTitle = "explained.tdh.check.lanes.notRead";
  else if (same) recordsTitle = "explained.tdh.check.lanes.recordsSame";
  return [
    {
      kicker: pt(locale, "explained.tdh.check.lanes.eth"),
      title: pt(locale, "explained.tdh.check.lanes.ethTitle"),
      cap: rich(locale, "explained.tdh.check.lanes.ethCap", {
        block: <FactValue fact={day.fact("cutoff")} locale={locale} />,
        midnight: midnightOf(day, locale),
      }),
    },
    {
      kicker: pt(locale, "explained.tdh.check.lanes.input"),
      title: pt(locale, "explained.tdh.check.lanes.inputTitle"),
      cap: rich(locale, "explained.tdh.check.lanes.inputCap", {
        hash: hashValue(day.fact("inputSha"), locale),
      }),
    },
    {
      pair: [
        {
          kicker: program(1),
          title: pt(locale, "explained.tdh.check.eq.rust"),
          cap: rich(locale, "explained.tdh.check.lanes.rustCap", {
            commit: hashValue(day.fact("builds.rust.commit"), locale),
            runtime: (
              <FactValue
                fact={day.fact("builds.rust.runtime")}
                locale={locale}
              />
            ),
          }),
        },
        {
          kicker: program(2),
          title: pt(locale, "explained.tdh.check.eq.python"),
          cap: rich(locale, "explained.tdh.check.lanes.pythonCap", {
            commit: hashValue(day.fact("builds.python.commit"), locale),
            runtime: (
              <FactValue
                fact={day.fact("builds.python.runtime")}
                locale={locale}
              />
            ),
          }),
        },
      ],
    },
    {
      kicker: pt(locale, "explained.tdh.check.lanes.records"),
      title: pt(locale, recordsTitle),
      cap:
        records === null ? (
          hashValue(null, locale)
        ) : (
          <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-1.5">
            <HashStripes hex={records} />
            {hashValue(day.fact("recordsSha"), locale)}
          </span>
        ),
    },
    {
      // The kicker is set in capitals; the domain keeps its case.
      kicker: rich(locale, "explained.tdh.check.lanes.live", {
        site: <span className="tw-normal-case">6529.io</span>,
      }),
      title: liveLaneTitle(day, locale),
      cap: rich(locale, "explained.tdh.check.lanes.liveCap", {
        hash: hashValue(day.fact("liveSha"), locale),
      }),
      ok:
        records !== null &&
        day.num("agree.live.identities.equal") ===
          day.num("agree.live.identities.total") &&
        checkState(day) !== "notCompared",
    },
  ];
}

function agreementPairs(
  day: DayView,
  locale: SupportedLocale
): AgreementPair[] {
  const live = pt(locale, "explained.tdh.check.agree.live");
  return [
    {
      who: pt(locale, "explained.tdh.check.agree.python"),
      sub: pt(locale, "explained.tdh.check.agree.pythonSub"),
      equal: day.fact("agree.python.identities.equal"),
      total: day.fact("agree.python.identities.total"),
      unit: pt(locale, "explained.tdh.check.agree.identitiesEqual"),
    },
    {
      who: live,
      sub: pt(locale, "explained.tdh.check.agree.identities"),
      equal: day.fact("agree.live.identities.equal"),
      total: day.fact("agree.live.identities.total"),
      unit: pt(locale, "explained.tdh.check.agree.identitiesEqual"),
    },
    {
      who: live,
      sub: pt(locale, "explained.tdh.check.agree.wallets"),
      equal: day.fact("agree.live.wallets.equal"),
      total: day.fact("agree.live.wallets.total"),
      unit: pt(locale, "explained.tdh.check.agree.walletsEqual"),
    },
  ];
}

const CLASSES = [
  ["A", "explained.tdh.check.classes.a"],
  ["B", "explained.tdh.check.classes.b"],
  ["C", "explained.tdh.check.classes.c"],
  ["D", "explained.tdh.check.classes.d"],
] as const satisfies readonly (readonly [string, CheckKey])[];

function ClassesCaption({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const daysFact = book.maybe<ResultDay[]>("tdh.days");
  const days = daysFact?.value ?? [];
  const differing = days.filter(
    (day) =>
      checkStateOf(day.verdict, {
        identitiesEqual: day.identitiesEqual,
        identitiesTotal: day.identitiesTotal,
      }) !== "equal"
  ).length;
  const count = (value: number) => (
    <FactText fact={daysFact} locale={locale}>
      {formatCount(locale, value)}
    </FactText>
  );
  return (
    <p className={`${CAPTION} tw-mt-3`}>
      {differing === 0
        ? pt(locale, "explained.tdh.check.classes.none")
        : rich(locale, "explained.tdh.check.classes.some", {
            days: count(differing),
            total: count(days.length),
          })}{" "}
      {pt(locale, "explained.tdh.check.classes.known")}
    </p>
  );
}

export function HowTheCheckRuns({
  book,
  day,
  locale,
}: {
  readonly book: FactBook;
  readonly day: DayView;
  readonly locale: SupportedLocale;
}) {
  const records = day.text("recordsSha");
  const same = records !== null && records === day.text("recordsSha.python");
  return (
    <section
      className={`${EX_LAYOUT.section} tw-scroll-mt-24`}
      id="classes"
      aria-labelledby="check-runs"
    >
      <Statement
        no="01"
        label={pt(locale, "explained.tdh.check.runs.label")}
        title={pt(locale, "explained.tdh.check.runs.title")}
        headingId="check-runs"
      >
        <p className={EX_LAYOUT.paragraph}>
          {pt(locale, "explained.tdh.check.runs.body")}
        </p>
      </Statement>
      <figure className="tw-m-0 tw-mt-12">
        <Lanes
          lanes={lanes(day, locale)}
          label={pt(locale, "explained.tdh.check.lanes.label")}
          locale={locale}
        />
      </figure>
      <div className="tw-mt-12">
        <AgreementBars pairs={agreementPairs(day, locale)} locale={locale} />
        <p className={`${CAPTION} tw-mt-3`}>
          {pt(locale, "explained.tdh.check.agree.caption")}
          {records !== null && (
            <>
              {" "}
              {pt(
                locale,
                same
                  ? "explained.tdh.check.agree.rootsSame"
                  : "explained.tdh.check.agree.rootsDiffer"
              )}
            </>
          )}
        </p>
      </div>
      <ul className="tw-m-0 tw-mt-12 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
        {CLASSES.map(([name, key]) => (
          <li
            key={name}
            className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-px-[22px] tw-py-5"
          >
            <span className={EX_TEXT.label}>
              {pt(locale, "explained.tdh.check.classes.name", { name })}
            </span>
            <p className="tw-m-0 tw-mt-2 tw-text-[15px] tw-leading-6 tw-text-iron-300">
              {pt(locale, key)}
            </p>
          </li>
        ))}
      </ul>
      <ClassesCaption book={book} locale={locale} />
    </section>
  );
}

function bold(text: string): ReactNode {
  return <b className="tw-font-semibold tw-text-iron-50">{text}</b>;
}

export function ReadItRight({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const shows = (["shows1", "shows2", "shows3"] as const).map((key) => ({
    text: pt(locale, `explained.tdh.check.read.${key}`),
  }));
  const doesNot = (["not1", "not2", "not3"] as const).map((key) => ({
    text: (
      <>
        {bold(pt(locale, `explained.tdh.check.read.${key}Title`))}{" "}
        {pt(locale, `explained.tdh.check.read.${key}`)}
      </>
    ),
  }));
  doesNot.push({
    text: (
      <>
        {bold(pt(locale, "explained.tdh.check.read.not4Title"))}{" "}
        {rich(
          locale,
          book.maybe("tdh.cutover.checkedAt") === null
            ? "explained.tdh.check.read.not4"
            : "explained.tdh.check.read.not4Late",
          {
            cutover: (
              <FactValue
                fact={book.maybe("tdh.cutover.about")}
                locale={locale}
              />
            ),
            checked: (
              <FactValue
                fact={book.maybe("tdh.cutover.checkedAt")}
                locale={locale}
              />
            ),
          }
        )}
      </>
    ),
  });
  return (
    <section
      className={`${EX_LAYOUT.section} tw-scroll-mt-24`}
      id="diff"
      aria-labelledby="check-read"
    >
      <Statement
        no="02"
        label={pt(locale, "explained.tdh.check.read.label")}
        title={pt(locale, "explained.tdh.check.read.title")}
        headingId="check-read"
      >
        <p className={EX_LAYOUT.paragraph}>
          {pt(locale, "explained.tdh.check.read.body")}
        </p>
      </Statement>
      <div className="tw-mt-12">
        <HonestyBox shows={shows} doesNot={doesNot} locale={locale} />
      </div>
    </section>
  );
}

function trailSteps(day: DayView, locale: SupportedLocale): TrailStep[] {
  const t = (key: CheckKey) => pt(locale, key);
  const cutoff = day.fact("cutoff");
  return [
    {
      title: t("explained.tdh.check.trail.eth"),
      sub: pt(locale, "explained.tdh.check.trail.ethSub", {
        block:
          cutoff === null ? "–" : formatCount(locale, Number(cutoff.value)),
      }),
      who: "node",
    },
    {
      title: t("explained.tdh.check.trail.input"),
      sub: t("explained.tdh.check.trail.inputSub"),
      who: "source",
    },
    {
      title: t("explained.tdh.check.trail.rust"),
      sub: t("explained.tdh.check.trail.rustSub"),
      who: "source",
    },
    {
      title: t("explained.tdh.check.trail.python"),
      sub: t("explained.tdh.check.trail.pythonSub"),
      who: "record",
    },
    {
      title: t("explained.tdh.check.trail.live"),
      sub: t("explained.tdh.check.trail.liveSub"),
      who: "anyone",
    },
    {
      title: t("explained.tdh.check.trail.file"),
      sub: t("explained.tdh.check.trail.fileSub"),
      who: "anyone",
    },
    {
      title: t("explained.tdh.check.trail.yours"),
      sub: t("explained.tdh.check.trail.yoursSub"),
      who: "spec",
    },
  ];
}

/** The command that checks the day's file, with its hash as the index states it. */
function CheckCommand({
  day,
  locale,
}: {
  readonly day: DayView;
  readonly locale: SupportedLocale;
}) {
  const url = day.text("file.url");
  const hash = day.text("file.sha256");
  if (url === null || hash === null) {
    return <FactValue fact={null} locale={locale} />;
  }
  return (
    <pre
      className="tw-m-0 tw-mt-3 tw-whitespace-pre-wrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-[#0a0a0c] tw-px-4 tw-py-3.5 tw-font-mono tw-text-[13px] tw-leading-[22px] tw-text-iron-300 [overflow-wrap:anywhere] md:tw-text-sm"
      data-fact={day.id("file.sha256")}
    >
      <span className="tw-text-iron-400">
        {pt(locale, "explained.tdh.check.cmd.comment")}
      </span>
      {`\ncurl -s ${url} \\\n  | sha256sum\n`}
      <span className="tw-text-iron-400">
        {`# ${hash.slice(0, 40)}\n# ${hash.slice(40)}  ${pt(locale, "explained.tdh.check.cmd.expect")}`}
      </span>
    </pre>
  );
}

export function CheckItYourself({
  day,
  locale,
}: {
  readonly day: DayView;
  readonly locale: SupportedLocale;
}) {
  const root = day.text("roots.cycle");
  return (
    <section
      className={`${EX_LAYOUT.section} tw-scroll-mt-24`}
      id="check"
      aria-labelledby="check-yourself"
    >
      <Statement
        no="03"
        label={pt(locale, "explained.tdh.check.self.label")}
        title={pt(locale, "explained.tdh.check.self.title")}
        headingId="check-yourself"
      >
        <p className={EX_LAYOUT.paragraph}>
          {pt(locale, "explained.tdh.check.self.body")}
        </p>
      </Statement>
      {/* The trail's one number is the snapshot block, a fact of the day. */}
      <div
        className="tw-mt-12 tw-scroll-mt-24"
        id="provenance"
        data-fact={day.id("cutoff")}
      >
        <ProvenanceTrail steps={trailSteps(day, locale)} locale={locale} />
      </div>
      <div className="tw-mt-12 tw-grid tw-grid-cols-1 tw-gap-x-6 tw-gap-y-8 lg:tw-grid-cols-2">
        <div>
          <span className={EX_TEXT.label}>
            {pt(locale, "explained.tdh.check.cmd.label")}
          </span>
          <CheckCommand day={day} locale={locale} />
        </div>
        <div>
          <span className={EX_TEXT.label}>
            {pt(locale, "explained.tdh.check.build.label")}
          </span>
          <p className="tw-m-0 tw-mt-3 tw-max-w-[660px] tw-text-[15px] tw-leading-6 tw-text-iron-300">
            {rich(locale, "explained.tdh.check.build.body", {
              specification: (
                <Link className={EX_LINK} href="/network/tdh/specification">
                  {pt(locale, "explained.tdh.check.build.specification")}
                </Link>
              ),
              size: (
                <FactText fact={day.fact("roots.cycle")} locale={locale}>
                  {root === null
                    ? "–"
                    : formatCount(locale, root.replace(/^0x/, "").length / 2)}
                </FactText>
              ),
              root:
                root === null ? (
                  <FactValue fact={null} locale={locale} />
                ) : (
                  <Hash value={root} locale={locale} />
                ),
              vectors: (
                <Link className={EX_LINK} href="/network/tdh/implementations">
                  {pt(locale, "explained.tdh.check.build.vectors")}
                </Link>
              ),
            })}
          </p>
        </div>
      </div>
      {/* A green day is a check; a proof of a day goes further. */}
      <div className="tw-mt-12">
        <ProofsDoor from="check" locale={locale} />
      </div>
    </section>
  );
}
