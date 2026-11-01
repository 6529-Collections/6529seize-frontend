import type { ReactNode } from "react";
import { LimitNote } from "@/components/explained/evidence/notes";
import { fill } from "@/components/explained/i18n";
import Hash from "@/components/explained/marks/Hash";
import Mark from "@/components/explained/marks/Mark";
import { EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { factText, isFact } from "@/lib/explained/facts";
import { k } from "./_lib/copy";
import type { PageFacts } from "./_lib/facts";
import { rich } from "@/components/explained/rich";
import Section, { Para } from "./Section";

/**
 * 03 · Why two: what makes the pair two checks and not one (P52 §3.7,
 * D119), programs A and B side by side with what each has proved, the two
 * real cases that show why, and what the two still share.
 */

interface Row {
  readonly id: string;
  readonly label: ReactNode;
  readonly a: ReactNode;
  readonly b: ReactNode;
}

function HashFact({
  facts,
  id,
  locale,
}: {
  readonly facts: PageFacts;
  readonly id: "proofs.a.vkey" | "proofs.b.imageId";
  readonly locale: SupportedLocale;
}) {
  const entry = facts.entry(id);
  if (!entry || !isFact(entry)) return <>{facts.print(id)}</>;
  return (
    <span data-fact={id}>
      <Hash
        value={factText(entry)}
        locale={locale}
        copy
        name={fill(
          locale,
          k(id === "proofs.a.vkey" ? "table.keyName" : "table.imageName")
        )}
      />
    </span>
  );
}

function ProgramsTable({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  const a = fill(locale, k("table.a"));
  const b = fill(locale, k("table.b"));
  const rows: readonly Row[] = [
    {
      id: "code",
      label: rich(locale, k("table.code")),
      a: rich(locale, k("table.codeA")),
      b: rich(locale, k("table.codeB")),
    },
    {
      id: "runs",
      label: rich(locale, k("table.runs")),
      a: facts.print("proofs.a.zkvm"),
      b: facts.print("proofs.b.zkvm"),
    },
    {
      id: "wrap",
      label: rich(locale, k("table.wrap")),
      a: rich(locale, k("table.wrapValue"), {
        wrapper: facts.print("proofs.a.wrapper"),
        bytes: facts.print("proofs.pair.proofBytesA"),
      }),
      b: rich(locale, k("table.wrapValue"), {
        wrapper: facts.print("proofs.b.wrapper"),
        bytes: facts.print("proofs.pair.sealBytesB"),
      }),
    },
    {
      id: "identity",
      label: rich(locale, k("table.identity")),
      a: rich(locale, k("table.identityA"), {
        key: <HashFact facts={facts} id="proofs.a.vkey" locale={locale} />,
      }),
      b: rich(locale, k("table.identityB"), {
        image: <HashFact facts={facts} id="proofs.b.imageId" locale={locale} />,
      }),
    },
    {
      id: "day",
      label: rich(locale, k("table.day"), {
        date: facts.print("proofs.day.date"),
        rule: facts.print("proofs.day.ruleVersion"),
      }),
      a: (
        <>
          <Mark kind="proved" locale={locale} size="sm" />{" "}
          {rich(locale, k("table.dayA"), {
            hours: facts.print("site.proofA.provedHours"),
            minutes: facts.print("site.proofA.provedMinutes"),
          })}
        </>
      ),
      b: (
        <>
          <Mark kind="notYet" locale={locale} size="sm" />{" "}
          {rich(locale, k("table.dayB"), {
            low: facts.print("proofs.dayB.gpuHoursLow"),
            high: facts.print("proofs.dayB.gpuHoursHigh"),
          })}
        </>
      ),
    },
    {
      id: "pair",
      label: rich(locale, k("table.pair"), {
        cycle: facts.print("proofs.pairV14.cycle"),
      }),
      a: (
        <>
          <Mark kind="proved" locale={locale} size="sm" />{" "}
          {rich(locale, k("table.pairA"), {
            steps: facts.print("proofs.pairV14.stepsA"),
          })}
        </>
      ),
      b: (
        <>
          <Mark kind="proved" locale={locale} size="sm" />{" "}
          {rich(locale, k("table.pairB"), {
            steps: facts.print("proofs.pairV14.stepsB"),
            words: facts.print("proofs.statement.words"),
          })}
        </>
      ),
    },
  ];
  const head =
    "tw-border-0 tw-border-b tw-border-solid tw-border-iron-700 tw-py-2.5 tw-pr-4 tw-text-left tw-align-bottom tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400";
  const cell =
    "tw-block tw-border-0 tw-py-1 tw-align-top tw-text-[15px] tw-leading-6 tw-text-iron-300 md:tw-table-cell md:tw-border-b md:tw-border-solid md:tw-border-iron-900 md:tw-py-3.5 md:tw-pr-4";
  const phoneLabel = (text: string) => (
    <span
      className="tw-mb-0.5 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.1em] tw-text-iron-400 md:tw-hidden"
      aria-hidden="true"
    >
      {text}
    </span>
  );
  return (
    // Named by aria-label: an absolutely positioned sr-only caption adds an
    // anonymous column to the table's layout.
    <table
      className="tw-w-full tw-border-collapse"
      data-programs=""
      aria-label={fill(locale, k("table.caption"))}
    >
      <thead className="tw-hidden md:tw-table-header-group">
        <tr>
          <th scope="col" className={`${head} tw-w-[22%]`}>
            {fill(locale, k("table.row"))}
          </th>
          <th scope="col" className={head}>
            {a}
          </th>
          <th scope="col" className={head}>
            {b}
          </th>
        </tr>
      </thead>
      <tbody className="tw-block md:tw-table-row-group">
        {rows.map((row) => (
          <tr
            key={row.id}
            className="tw-block tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3 md:tw-table-row md:tw-py-0"
            data-row={row.id}
          >
            <th
              scope="row"
              className="tw-block tw-border-0 tw-pb-1 tw-text-left tw-align-top tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-iron-50 md:tw-table-cell md:tw-border-b md:tw-border-solid md:tw-border-iron-900 md:tw-py-3.5 md:tw-pr-4"
            >
              {row.label}
            </th>
            <td className={cell}>
              {phoneLabel(a)}
              {row.a}
            </td>
            <td className={cell}>
              {phoneLabel(b)}
              {row.b}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Case({
  title,
  children,
}: {
  readonly title: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-[22px] tw-py-5">
      <h3 className={EX_TEXT.h4}>{title}</h3>
      <p className="tw-m-0 tw-mt-2 tw-text-[15px] tw-leading-6 tw-text-iron-300">
        {children}
      </p>
    </div>
  );
}

export default function TwoPrograms({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  return (
    <Section
      id="two"
      number="03"
      label={fill(locale, k("s3.label"))}
      heading={rich(locale, k("s3.heading"))}
      figure={
        <div className="tw-grid tw-gap-8">
          <ProgramsTable locale={locale} facts={facts} />
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
            <Case title={rich(locale, k("case.flaw.title"))}>
              {rich(locale, k("case.flaw.body"), {
                date: facts.print("proofs.sp1Advisory.published"),
                id: facts.print("proofs.sp1Advisory.id"),
                fixed: facts.print("proofs.sp1Advisory.fixed"),
                earlier: facts.print("proofs.sp1Advisory.earlier"),
              })}
            </Case>
            <Case title={rich(locale, k("case.review.title"))}>
              {rich(locale, k("case.review.body"), {
                date: facts.print("proofs.vectorFinding.date"),
                count: facts.print("proofs.vectorFinding.vectors"),
              })}
            </Case>
          </div>
          <LimitNote title={rich(locale, k("s3.limitTitle"))}>
            {rich(locale, k("s3.limitBody"), {
              wrapper: facts.print("proofs.a.wrapper"),
            })}
          </LimitNote>
        </div>
      }
    >
      <Para>{rich(locale, k("s3.p1"))}</Para>
      <Para>{rich(locale, k("s3.p2"))}</Para>
    </Section>
  );
}
