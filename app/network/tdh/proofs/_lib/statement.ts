/**
 * P53 §4.6's T statement, `TStatementV1`: the words both proof programs
 * commit, one 32-byte ABI word each, in this order. The page decodes the
 * real public values of proof A (and program B's run of the same day) from
 * the facts layer with these names; nothing here is a value.
 */

export type WordGroup = "day" | "start" | "end" | "anchor" | "read" | "result";

type WordKind = "uint" | "bytes32" | "tag" | "time";

interface StatementWord {
  readonly name: string;
  readonly group: WordGroup;
  readonly kind: WordKind;
}

export const STATEMENT_WORDS: readonly StatementWord[] = [
  { name: "tag", group: "day", kind: "tag" },
  { name: "networkId", group: "day", kind: "bytes32" },
  { name: "cycleDay", group: "day", kind: "uint" },
  { name: "tdhRuleId", group: "day", kind: "bytes32" },
  { name: "prevCutNumber", group: "start", kind: "uint" },
  { name: "prevCutHash", group: "start", kind: "bytes32" },
  { name: "cutNumber", group: "end", kind: "uint" },
  { name: "cutHash", group: "end", kind: "bytes32" },
  { name: "cutTimestamp", group: "end", kind: "time" },
  { name: "nextHash", group: "end", kind: "bytes32" },
  { name: "anchorNumber", group: "anchor", kind: "uint" },
  { name: "anchorHash", group: "anchor", kind: "bytes32" },
  { name: "prevHistoryRoot", group: "start", kind: "bytes32" },
  { name: "prevHistoryCount", group: "start", kind: "uint" },
  { name: "historyRoot", group: "read", kind: "bytes32" },
  { name: "historyCount", group: "read", kind: "uint" },
  { name: "floorsHash", group: "read", kind: "bytes32" },
  { name: "walletRoot", group: "result", kind: "bytes32" },
  { name: "walletCount", group: "result", kind: "uint" },
  { name: "identityCount", group: "result", kind: "uint" },
  { name: "totalTDH", group: "result", kind: "uint" },
  { name: "tokenRoot", group: "result", kind: "bytes32" },
  { name: "tokenCount", group: "result", kind: "uint" },
  { name: "accountingRoot", group: "result", kind: "bytes32" },
  { name: "cycleRoot", group: "result", kind: "bytes32" },
];

export const WORD_GROUPS: readonly WordGroup[] = [
  "day",
  "start",
  "end",
  "anchor",
  "read",
  "result",
];

/** The anchor's two words: each prover picks its own anchor, so the contract compares every other word. */
export const ANCHOR_WORDS: readonly number[] = [10, 11];

export interface DecodedWord {
  readonly index: number;
  readonly word: StatementWord;
  /** The 32 bytes as 0x-prefixed hex. */
  readonly hex: string;
  /** A uint word's value; null for a bytes32 word. */
  readonly value: bigint | null;
}

const HEX_WORD = /^[0-9a-f]{64}$/;

/** Decodes the words of one output; throws unless there is one 32-byte word per name. */
export function decodeStatement(words: readonly string[]): DecodedWord[] {
  if (words.length !== STATEMENT_WORDS.length) {
    throw new Error(
      `A statement has ${STATEMENT_WORDS.length} words; got ${words.length}.`
    );
  }
  return words.map((raw, index) => {
    const hex = raw.toLowerCase().replace(/^0x/, "");
    if (!HEX_WORD.test(hex)) {
      throw new Error(`Word ${index} is not 32 bytes of hex.`);
    }
    const word = STATEMENT_WORDS[index] as StatementWord;
    const numeric = word.kind === "uint" || word.kind === "time";
    return {
      index,
      word,
      hex: `0x${hex}`,
      value: numeric ? BigInt(`0x${hex}`) : null,
    };
  });
}

/** The words where two outputs differ, by index. */
export function differingWords(
  a: readonly DecodedWord[],
  b: readonly DecodedWord[]
): number[] {
  return a
    .filter((word, index) => word.hex !== b[index]?.hex)
    .map((word) => word.index);
}

/**
 * The D128 contract's comparison of the two outputs (its check 2): equal in
 * every word except the anchor's two, or the first word that differs.
 */
export function compareOutputs(
  a: readonly DecodedWord[],
  b: readonly DecodedWord[]
): { readonly accepted: true } | { readonly accepted: false; word: number } {
  const first = differingWords(a, b).find(
    (index) => !ANCHOR_WORDS.includes(index)
  );
  return first === undefined
    ? { accepted: true }
    : { accepted: false, word: first };
}
