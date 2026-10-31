"use client";

import { useState } from "react";
import { useFactSnapshot } from "@/components/explained/facts/FactsProvider";
import { fill } from "@/components/explained/i18n";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import { Seg } from "@/components/explained/lens/controls";
import Lens, { Readout } from "@/components/explained/lens/Lens";
import { Glyph } from "@/components/explained/marks/glyphs";
import Hash from "@/components/explained/marks/Hash";
import StampLine from "@/components/explained/marks/StampLine";
import type { SupportedLocale } from "@/i18n/locales";
import { fmt, isFact } from "@/lib/explained/facts";
import { formatCount, formatUtcInstant } from "@/lib/explained/format";
import { k } from "./_lib/copy";
import { pageFacts } from "./_lib/facts";
import { rich } from "@/components/explained/rich";
import {
  ANCHOR_WORDS,
  STATEMENT_WORDS,
  WORD_GROUPS,
  decodeStatement,
  differingWords,
  type DecodedWord,
  type WordGroup,
} from "./_lib/statement";

/**
 * Model · The words (TDH-DESIGN.md §5.12, the statement proof A binds): the
 * real public values of proof A for 2026-10-11, decoded word by word, with
 * the group the reader picks lit and what that group binds and who checks
 * it. Break it puts program B's own run of the same day beside them: every
 * word equal but the anchor's two, which each prover picks (P53 §4.6).
 */

/** P53 §4.6's encoding, one line a group, as the exact rule beside the words. */
const RULE_LINES: readonly {
  readonly text: string;
  readonly group: WordGroup | null;
}[] = [
  { text: "TStatementV1 = abi.encode(", group: null },
  { text: "  tag, networkId, cycleDay, tdhRuleId,", group: "day" },
  { text: "  prevCutNumber, prevCutHash,", group: "start" },
  { text: "  cutNumber, cutHash, cutTimestamp,", group: "end" },
  { text: "  nextHash,", group: "end" },
  { text: "  anchorNumber, anchorHash,", group: "anchor" },
  { text: "  prevHistoryRoot, prevHistoryCount,", group: "start" },
  { text: "  historyRoot, historyCount,", group: "read" },
  { text: "  floorsHash,", group: "read" },
  { text: "  walletRoot, walletCount, identityCount,", group: "result" },
  { text: "  totalTDH, tokenRoot, tokenCount,", group: "result" },
  { text: "  accountingRoot, cycleRoot)", group: "result" },
];

function WordValue({
  word,
  locale,
}: {
  readonly word: DecodedWord;
  readonly locale: SupportedLocale;
}) {
  if (word.value === null) {
    return <Hash value={word.hex} locale={locale} short={[6, 4]} />;
  }
  const count = formatCount(locale, Number(word.value));
  if (word.word.kind === "time") {
    return (
      <span className="tw-font-mono tw-text-[13px] tw-text-iron-50 md:tw-text-sm">
        {count}
        <span className="tw-ml-2 tw-font-sans tw-text-iron-400">
          {formatUtcInstant(new Date(Number(word.value) * 1000).toISOString())}
        </span>
      </span>
    );
  }
  return (
    <span className="tw-font-mono tw-text-[13px] tw-text-iron-50 md:tw-text-sm">
      {count}
    </span>
  );
}

function BColumn({
  a,
  b,
  locale,
}: {
  readonly a: DecodedWord;
  readonly b: DecodedWord | undefined;
  readonly locale: SupportedLocale;
}) {
  if (!b) return null;
  if (a.hex === b.hex) {
    return (
      <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-[13px] tw-font-semibold tw-text-iron-300">
        <Glyph kind="tested" className="tw-size-3" />
        {fill(locale, k("words.same"))}
      </span>
    );
  }
  return (
    <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-0.5">
      <WordValue word={b} locale={locale} />
      <span className="tw-text-[13px] tw-font-semibold tw-text-iron-50">
        {fill(locale, k("words.differs"))}
      </span>
    </span>
  );
}

export default function StatementWords({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const snapshot = useFactSnapshot();
  const facts = pageFacts(snapshot, locale);
  const [group, setGroup] = useState<WordGroup>("result");
  const [compare, setCompare] = useState(false);

  const wordsA = facts.strings("proofs.day.wordsA");
  const wordsB = facts.strings("proofs.day.wordsB");
  const decoded = {
    a: wordsA ? decodeStatement(wordsA) : null,
    b: wordsB ? decodeStatement(wordsB) : null,
  };
  const countFact = facts.entry("proofs.statement.words");
  const words =
    countFact && isFact(countFact)
      ? fmt(countFact, locale)
      : String(STATEMENT_WORDS.length);
  const date = facts.entry("proofs.day.date");
  const dateText = date && isFact(date) ? fmt(date, locale) : "";

  const inGroup = STATEMENT_WORDS.filter((word) => word.group === group).length;
  const differs =
    decoded.a && decoded.b ? differingWords(decoded.a, decoded.b) : [];
  const equal = STATEMENT_WORDS.length - differs.length;
  const lit = (word: DecodedWord) =>
    compare ? ANCHOR_WORDS.includes(word.index) : word.word.group === group;
  const litCount = compare ? ANCHOR_WORDS.length : inGroup;

  const readout = compare ? (
    <Readout
      big={`${formatCount(locale, equal)} / ${words}`}
      unit={fill(locale, k("words.equalUnit"))}
      say={fill(locale, k("words.brokenSay"))}
    />
  ) : (
    <Readout
      big={formatCount(locale, inGroup)}
      unit={fill(locale, k("words.unit"), { words })}
      say={fill(locale, k(`words.say.${group}`))}
    />
  );

  return (
    <Lens
      id="words"
      label={fill(locale, k("words.label"), { words })}
      question={fill(locale, k("words.question"), { date: dateText })}
      broken={compare}
      locale={locale}
      stage={
        <div>
          <Seg
            label={fill(locale, k("words.groups"))}
            attr="group"
            value={compare ? null : group}
            onChange={(next) => {
              setCompare(false);
              setGroup(next);
            }}
            options={WORD_GROUPS.map((value) => ({
              value,
              label: fill(locale, k(`words.group.${value}`)),
            }))}
          />
          {decoded.a ? (
            <table
              className="tw-mt-5 tw-w-full tw-border-collapse"
              aria-label={fill(locale, k("words.aria"), { date: dateText })}
              data-words=""
            >
              <thead className="tw-sr-only md:tw-not-sr-only">
                <tr>
                  <th
                    scope="col"
                    className="tw-w-9 tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-pb-2 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400"
                  >
                    #
                  </th>
                  <th
                    scope="col"
                    className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-pb-2 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400"
                  >
                    {fill(locale, k("words.colWord"))}
                  </th>
                  <th
                    scope="col"
                    className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-pb-2 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400"
                  >
                    {fill(locale, k("words.colA"))}
                  </th>
                  {compare && (
                    <th
                      scope="col"
                      className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-pb-2 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400"
                    >
                      {fill(locale, k("words.colB"))}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {decoded.a.map((word) => {
                  const on = lit(word);
                  return (
                    <tr
                      key={word.word.name}
                      className={`tw-grid tw-grid-cols-[28px_minmax(0,1fr)] tw-gap-x-2 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-1.5 md:tw-table-row md:tw-py-0 ${on ? "tw-bg-primary-400/[0.08]" : "max-md:tw-hidden"}`}
                      data-word={word.index}
                      data-lit={on ? "1" : "0"}
                    >
                      <td
                        className={`tw-py-0 tw-align-top tw-text-[13px] tw-font-semibold md:tw-border-0 md:tw-border-l-2 md:tw-border-solid md:tw-py-[5px] md:tw-pl-2 ${on ? "tw-text-primary-300 md:tw-border-primary-400" : "tw-text-iron-400 md:tw-border-transparent"}`}
                      >
                        {word.index}
                      </td>
                      <td
                        className={`tw-py-0 tw-font-mono tw-text-[13px] md:tw-py-[5px] md:tw-text-sm ${on ? "tw-text-iron-50" : "tw-text-iron-400"}`}
                      >
                        {word.word.name}
                      </td>
                      <td className="tw-col-start-2 tw-py-0 md:tw-py-[5px]">
                        {compare && (
                          <span
                            className="tw-mr-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400 md:tw-hidden"
                            aria-hidden="true"
                          >
                            {fill(locale, k("words.colA"))}
                          </span>
                        )}
                        <WordValue word={word} locale={locale} />
                      </td>
                      {compare && (
                        <td className="tw-col-start-2 tw-py-0 md:tw-py-[5px]">
                          <span
                            className="tw-mr-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400 md:tw-hidden"
                            aria-hidden="true"
                          >
                            {fill(locale, k("words.colB"))}
                          </span>
                          <BColumn
                            a={word}
                            b={decoded.b?.[word.index]}
                            locale={locale}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
          {decoded.a ? (
            <p
              className="tw-m-0 tw-mt-3 tw-text-[15px] tw-leading-[22px] tw-text-iron-400 md:tw-hidden"
              data-words-more=""
            >
              {fill(locale, k(compare ? "words.moreSame" : "words.more"), {
                count: formatCount(locale, STATEMENT_WORDS.length - litCount),
              })}
            </p>
          ) : (
            <p className="tw-m-0 tw-mt-5 tw-text-iron-400">
              {facts.print("proofs.day.wordsA")}
            </p>
          )}
        </div>
      }
      rule={{
        lines: RULE_LINES.map((line) => ({
          text: line.text,
          on: compare
            ? line.group === "anchor"
            : line.group !== null && line.group === group,
        })),
        source: rich(locale, k("words.ruleSource"), {
          wordBytes: facts.print("proofs.statement.wordBytes"),
          bytes: facts.print("proofs.statement.bytes"),
        }),
      }}
      readout={readout}
      breakIt={
        <BreakIt
          id="anchors"
          pressed={compare}
          onToggle={() => setCompare((value) => !value)}
          label={breakItLabel(locale, fill(locale, k("words.breakEdge")))}
        />
      }
      stamp={
        <StampLine
          locale={locale}
          marks={[
            { kind: "proved", refText: fill(locale, k("words.colA")) },
            { kind: "tested", refText: fill(locale, k("words.colB")) },
          ]}
          tag={{ kind: "real" }}
        />
      }
    />
  );
}
