import type { ReactNode } from "react";
import { HalfPair } from "@/components/explained/evidence/AssuranceLadder";
import Mark from "@/components/explained/marks/Mark";
import { EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { k } from "./_lib/copy";
import type { PageFacts } from "./_lib/facts";
import { rich } from "@/components/explained/rich";

/**
 * The record so far: each step of the proofs as a tile on one line, in the
 * order it happened, the way the daily check's ribbon lays out days. The
 * last tile is the next step, dashed and undated, since dates are "about"
 * until they happen (EXPLAINED.md §10).
 */
interface Tile {
  readonly id: string;
  readonly when: ReactNode;
  readonly mark: ReactNode;
  readonly title: ReactNode;
  readonly body: ReactNode;
  readonly next?: boolean;
}

export default function RecordStrip({
  locale,
  facts,
}: {
  readonly locale: SupportedLocale;
  readonly facts: PageFacts;
}) {
  const tiles: readonly Tile[] = [
    {
      id: "first",
      when: facts.print("proofs.milestones.firstProofs"),
      mark: <Mark kind="proved" locale={locale} size="sm" />,
      title: rich(locale, k("record.first.title")),
      body: rich(locale, k("record.first.body")),
    },
    {
      id: "pair",
      when: facts.print("proofs.pair.provedOn"),
      mark: <HalfPair a b locale={locale} />,
      title: rich(locale, k("record.pair.title")),
      body: rich(locale, k("record.pair.body"), {
        gas: facts.print("proofs.pair.submitGas"),
      }),
    },
    {
      id: "day",
      when: facts.print("proofs.day.provedOn"),
      mark: <HalfPair a b={false} locale={locale} />,
      title: rich(locale, k("record.day.title")),
      body: rich(locale, k("record.day.body"), {
        date: facts.print("proofs.day.date"),
        hours: facts.print("site.proofA.provedHours"),
        minutes: facts.print("site.proofA.provedMinutes"),
      }),
    },
    {
      id: "v14",
      when: facts.print("proofs.milestones.pairV14"),
      mark: <HalfPair a b locale={locale} />,
      title: rich(locale, k("record.v14.title")),
      body: rich(locale, k("record.v14.body"), {
        cycle: facts.print("proofs.pairV14.cycle"),
        real: facts.cycleDate("proofs.pairV14.cycle"),
      }),
    },
    {
      id: "next",
      when: rich(locale, k("record.next.when")),
      mark: <Mark kind="notYet" locale={locale} size="sm" />,
      title: rich(locale, k("record.next.title")),
      body: rich(locale, k("record.next.body")),
      next: true,
    },
  ];
  return (
    <div>
      <h2 className={`${EX_TEXT.label} tw-m-0`}>
        {rich(locale, k("record.label"))}
      </h2>
      <ol
        className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-1 tw-gap-2.5 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-5"
        data-fig="record"
      >
        {tiles.map((tile) => (
          <li
            key={tile.id}
            className={`tw-flex tw-flex-col tw-gap-2 tw-rounded-xl tw-border tw-px-4 tw-py-3.5 ${tile.next ? "tw-border-dashed tw-border-iron-700" : "tw-border-solid tw-border-iron-800 tw-bg-iron-950"}`}
            data-record={tile.id}
          >
            <span className="tw-text-[13px] tw-font-semibold tw-leading-5 tw-text-iron-400">
              {tile.when}
            </span>
            <span>{tile.mark}</span>
            <b className="tw-text-base tw-font-semibold tw-leading-[22px] tw-text-iron-50">
              {tile.title}
            </b>
            <span className="tw-text-[15px] tw-leading-[22px] tw-text-iron-300">
              {tile.body}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
