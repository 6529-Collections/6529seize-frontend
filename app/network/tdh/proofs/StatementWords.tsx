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
 * it. "Beside program B" puts program B's own run of the same day beside
 * them: every word equal but the anchor's two, which each prover picks (P53
 * §4.6). Break it changes one bit of the total, and the verifier refuses the
 * changed bytes, as the tests on the first real proofs showed for every word.
 */

/** The word Break it changes: totalTDH, the number a reader cares about. */
const FLIPPED_WORD = 20;

/** One bit changed: the word's lowest bit. */
function flipped(word: DecodedWord): DecodedWord {
  const hex = word.hex.replace(/^0x/, "");
  const last = Number.parseInt(hex.slice(-1), 16) ^ 1;
  const next = `0x${hex.slice(0, -1)}${last.toString(16)}`;
  return {
    ...word,
    hex: next,
    value: word.value === null ? null : word.value ^ 1n,
  };
}

type WordPick = WordGroup | "b";

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
  tone = "tw-text-iron-50",
}: {
  readonly word: DecodedWord;
  readonly locale: SupportedLocale;
  /** The value's colour: rose for a changed word. */
  readonly tone?: string;
}) {
  if (word.value === null) {
    return <Hash value={word.hex} locale={locale} short={[6, 4]} />;
  }
  const count = formatCount(locale, Number(word.value));
  if (word.word.kind === "time") {
    return (
      <span className={`tw-font-mono tw-text-[13px] md:tw-text-sm ${tone}`}>
        {count}
        <span className="tw-ml-2 tw-font-sans tw-text-iron-400">
          {formatUtcInstant(new Date(Number(word.value) * 1000).toISOString())}
        </span>
      </span>
    );
  }
  return (
    <span className={`tw-font-mono tw-text-[13px] md:tw-text-sm ${tone}`}>
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
  const [pick, setPick] = useState<WordPick>("result");
  const [flip, setFlip] = useState(false);
  const compare = !flip && pick === "b";
  const group: WordGroup = pick === "b" ? "anchor" : pick;

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
    flip
      ? word.index === FLIPPED_WORD
      : compare
        ? ANCHOR_WORDS.includes(word.index)
        : word.word.group === group;
  const litCount = flip ? 1 : compare ? ANCHOR_WORDS.length : inGroup;
  // The block numbers a reader can look up on any explorer today: the cut,
  // the block after it and the anchor, whose hashes are words 7, 9 and 11.
  const blockOf = (name: string): number | null => {
    const value = decoded.a?.find((entry) => entry.word.name === name)?.value;
    return value === null || value === undefined ? null : Number(value);
  };
  const printBlock = (block: number | null) =>
    block === null ? "" : formatCount(locale, block);
  const cutBlock = blockOf("cutNumber");
  const lookUp = {
    anchor: printBlock(blockOf("anchorNumber")),
    cut: printBlock(cutBlock),
    next: printBlock(cutBlock === null ? null : cutBlock + 1),
  };
  const flippedName = STATEMENT_WORDS[FLIPPED_WORD]?.name ?? "";

  const readout = flip ? (
    <Readout
      big={fill(locale, k("words.flipBig"))}
      say={rich(locale, k("words.flipSay"), {
        word: formatCount(locale, FLIPPED_WORD),
        name: <code className="tw-font-mono">{flippedName}</code>,
        bytes: facts.print("proofs.statement.bytes"),
        words,
      })}
    />
  ) : compare ? (
    <Readout
      big={`${formatCount(locale, equal)} / ${words}`}
      unit={fill(locale, k("words.equalUnit"))}
      say={fill(locale, k("words.brokenSay"))}
    />
  ) : (
    <Readout
      big={formatCount(locale, inGroup)}
      unit={fill(locale, k("words.unit"), { words })}
      say={fill(locale, k(`words.say.${group}`), lookUp)}
    />
  );

  return (
    <Lens
      id="words"
      label={fill(locale, k("words.label"), { words })}
      question={fill(locale, k("words.question"), { date: dateText })}
      broken={flip}
      locale={locale}
      stage={
        <div>
          <Seg<WordPick>
            label={fill(locale, k("words.groups"))}
            attr="group"
            value={flip ? null : pick}
            onChange={(next) => {
              setFlip(false);
              setPick(next);
            }}
            options={[
              ...WORD_GROUPS.map((value) => ({
                value,
                label: fill(locale, k(`words.group.${value}`)),
              })),
              { value: "b" as const, label: fill(locale, k("words.group.b")) },
            ]}
          />
          {decoded.a ? (
            <table
              className="tw-mt-5 tw-w-full tw-border-collapse max-lg:tw-block"
              aria-label={fill(locale, k("words.aria"), { date: dateText })}
              data-words=""
            >
              <thead className="tw-sr-only lg:tw-not-sr-only">
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
              <tbody className="max-lg:tw-block">
                {decoded.a.map((word) => {
                  const on = lit(word);
                  return (
                    <tr
                      key={word.word.name}
                      className={`tw-grid tw-grid-cols-[28px_minmax(0,1fr)] tw-gap-x-2 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-1.5 lg:tw-table-row lg:tw-py-0 ${on ? "" : "max-lg:tw-hidden"}`}
                      data-word={word.index}
                      data-lit={on ? "1" : "0"}
                    >
                      <td
                        className={`tw-py-0 tw-align-top tw-text-[13px] tw-font-semibold lg:tw-border-0 lg:tw-border-l-2 lg:tw-border-solid lg:tw-py-[5px] lg:tw-pl-2 ${on ? "tw-text-primary-300 lg:tw-border-primary-400" : "tw-text-iron-400 lg:tw-border-transparent"}`}
                      >
                        {word.index}
                      </td>
                      <td
                        className={`tw-py-0 tw-font-mono tw-text-[13px] lg:tw-py-[5px] lg:tw-text-sm ${on ? "tw-text-iron-50" : "tw-text-iron-400"}`}
                      >
                        {word.word.name}
                      </td>
                      <td className="tw-col-start-2 tw-py-0 lg:tw-py-[5px]">
                        {compare && (
                          <span
                            className="tw-mr-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400 lg:tw-hidden"
                            aria-hidden="true"
                          >
                            {fill(locale, k("words.colA"))}
                          </span>
                        )}
                        {flip && word.index === FLIPPED_WORD ? (
                          <span className="tw-inline-flex tw-flex-wrap tw-items-baseline tw-gap-x-2">
                            <WordValue
                              word={flipped(word)}
                              locale={locale}
                              tone="tw-text-error"
                            />
                            <s className="tw-text-iron-400">
                              <WordValue
                                word={word}
                                locale={locale}
                                tone="tw-text-iron-400"
                              />
                            </s>
                          </span>
                        ) : (
                          <WordValue word={word} locale={locale} />
                        )}
                      </td>
                      {compare && (
                        <td className="tw-col-start-2 tw-py-0 lg:tw-py-[5px]">
                          <span
                            className="tw-mr-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400 lg:tw-hidden"
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
              className="tw-m-0 tw-mt-3 tw-text-[15px] tw-leading-[22px] tw-text-iron-400 lg:tw-hidden"
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
          on: flip
            ? line.text.includes("totalTDH")
            : compare
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
          id="flip"
          pressed={flip}
          onToggle={() => setFlip((value) => !value)}
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
          // The flipped bit is made up for the model: Simulated, as the
          // failing pair above is; the real proof's words are Real.
          tag={{ kind: flip ? "simulated" : "real" }}
        />
      }
    />
  );
}
