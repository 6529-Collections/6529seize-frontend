/**
 * Parsing for the TDH rule blocks: a block's text as lines of code and
 * comments, and a line's code as tinted tokens. Pure functions, so the
 * layout can be tested without rendering.
 */

/** The comment marker and keywords of a block. */
export type RuleLanguage = "pseudo" | "lean" | "shell";

export interface RuleLine {
  /** `comment` for a line that is a comment from its first column on. */
  readonly kind: "code" | "comment";
  /** Leading spaces of the line as written. */
  readonly indent: number;
  /** The line's text after its indentation, without a trailing comment. */
  readonly code: string;
  /** The trailing comment, with its marker, or null. */
  readonly comment: string | null;
  /** Whether the comment only cites vectors or sections: short, one line. */
  readonly reference: boolean;
}

const MARKER: Record<RuleLanguage, string> = {
  pseudo: "#",
  shell: "#",
  lean: "--",
};

/** "# vector 67", "# vectors 85-87", "# §4.3, for a <= T"-style references. */
const REFERENCE = /^(?:#|--)\s*(?:vectors?\s[\d\s,–\-and]+|[§P][\d\s§.,]+)$/;

function leadingSpaces(text: string): number {
  return /^ */.exec(text)?.[0].length ?? 0;
}

/**
 * The lines of a block, with each trailing comment split from its code.
 * A comment written alone on an indented line, under the line it belongs
 * to (a vector reference, or the rest of a field's comment), joins that
 * line's comment; a comment in the first column heads the lines below it
 * and stays a line of its own.
 */
export function ruleLines(
  code: string,
  language: RuleLanguage = "pseudo"
): RuleLine[] {
  const marker = MARKER[language];
  const lines: RuleLine[] = [];
  for (const raw of code.split("\n")) {
    const indent = leadingSpaces(raw);
    const text = raw.slice(indent);
    if (text.startsWith(marker)) {
      const previous = lines.at(-1);
      if (indent > 0 && previous?.kind === "code" && previous.code) {
        const continuation = text.slice(marker.length).trim();
        const comment =
          previous.comment === null
            ? text.trim()
            : `${previous.comment} ${continuation}`;
        lines[lines.length - 1] = {
          ...previous,
          comment,
          reference: previous.comment === null && REFERENCE.test(text.trim()),
        };
        continue;
      }
      lines.push({
        kind: "comment",
        indent,
        code: text,
        comment: null,
        reference: false,
      });
      continue;
    }
    const at = text.indexOf(`  ${marker} `);
    if (at < 0) {
      lines.push({
        kind: "code",
        indent,
        code: text.trimEnd(),
        comment: null,
        reference: false,
      });
      continue;
    }
    const comment = text.slice(at).trim();
    lines.push({
      kind: "code",
      indent,
      code: text.slice(0, at).trimEnd(),
      comment,
      reference: REFERENCE.test(comment),
    });
  }
  return lines;
}

interface RuleToken {
  readonly kind: "keyword" | "number" | "string" | "name" | "text";
  readonly text: string;
}

/**
 * Pseudocode keywords, tinted only where they act as keywords: a statement
 * keyword at the start of a line's code (after its indentation), a second
 * one right after it (`repeat while`), and an action after a block's colon
 * (`...: skip`). Mid-line words such as "for the cycle", "in order" or
 * "or later" are English and stay plain, as do `and`, `or`, `not` and `in`,
 * which P26's pseudocode also uses as words.
 */
const PSEUDO_STATEMENTS: ReadonlySet<string> = new Set([
  "if",
  "elif",
  "else",
  "for",
  "while",
  "repeat",
  "unless",
]);
const PSEUDO_ACTIONS: ReadonlySet<string> = new Set([
  "append",
  "remove",
  "emit",
  "skip",
  "continue",
  "return",
  "pop",
]);

const KEYWORDS: Record<Exclude<RuleLanguage, "pseudo">, ReadonlySet<string>> = {
  lean: new Set([
    "theorem",
    "lemma",
    "def",
    "structure",
    "inductive",
    "where",
    "fun",
    "let",
    "have",
    "by",
    "match",
    "with",
    "if",
    "then",
    "else",
    "Prop",
    "Type",
  ]),
  shell: new Set(["lake", "python3", "validator", "build", "exe", "compute"]),
};

/**
 * Whether the word at `index` of a pseudocode line is a keyword there: the
 * line's first word or the word after it when both are statements, or an
 * action that starts the line or follows a colon.
 */
function isPseudoKeyword(text: string, index: number, word: string): boolean {
  const before = text.slice(0, index);
  if (before.trim() === "") {
    return PSEUDO_STATEMENTS.has(word) || PSEUDO_ACTIONS.has(word);
  }
  const previous = /([A-Za-z_]\w*)\s+$/.exec(before);
  if (
    previous?.[1] &&
    before.trim() === previous[1] &&
    PSEUDO_STATEMENTS.has(previous[1]) &&
    PSEUDO_STATEMENTS.has(word)
  ) {
    return true;
  }
  return PSEUDO_ACTIONS.has(word) && /:\s+$/.test(before);
}

/** Rule names of the specification: tinted as functions. */
const NAMES = new Set([
  "RATE",
  "BASE",
  "FINAL",
  "ADD",
  "HALFUP",
  "B64",
  "H",
  "TAG",
  "REGISTER",
  "REVOKE",
  "ROOT",
  "NODE",
  "TOP",
  "keccak256",
]);

/**
 * Strings; names that carry digits, kept whole and plain (a section like
 * §3.2, a rule version like tdh-v1.0, DEV-10, BUG-15, ERC-1155); numbers,
 * never digits that follow a "." or "§"; and words.
 */
const TOKEN =
  /("[^"\n]*")|(\b(?:DEV|BUG|ERC|EIP|IEEE|SHA)-\d+\b|\btdh-v\d[\d.]*|§\d[\d.]*)|(0x[0-9a-fA-F…]+|(?<![.§])\b\d[\d,.]*\b)|([A-Za-z_]\w*)/g;

/**
 * A line's code as tokens: keywords, numbers, strings and rule names.
 * `keywords: false` leaves keywords as plain text, for lines that read as
 * English.
 */
export function ruleTokens(
  text: string,
  language: RuleLanguage = "pseudo",
  options: { readonly keywords?: boolean } = {}
): RuleToken[] {
  const tintKeywords = options.keywords !== false;
  const isKeyword = (word: string, index: number): boolean => {
    if (!tintKeywords) {
      return false;
    }
    return language === "pseudo"
      ? isPseudoKeyword(text, index, word)
      : KEYWORDS[language].has(word);
  };
  const tokens: RuleToken[] = [];
  let last = 0;
  const push = (kind: RuleToken["kind"], value: string) => {
    const previous = tokens.at(-1);
    if (kind === "text" && previous?.kind === "text") {
      tokens[tokens.length - 1] = { kind, text: previous.text + value };
    } else if (value) {
      tokens.push({ kind, text: value });
    }
  };
  for (const match of text.matchAll(TOKEN)) {
    const { index } = match;
    push("text", text.slice(last, index));
    const [whole, string, identifier, number, word] = match;
    if (string) {
      push("string", whole);
    } else if (identifier) {
      push("text", whole);
    } else if (number) {
      push("number", whole);
    } else if (word && isKeyword(word, index)) {
      push("keyword", whole);
    } else if (word && NAMES.has(word)) {
      push("name", whole);
    } else {
      push("text", whole);
    }
    last = index + whole.length;
  }
  push("text", text.slice(last));
  return tokens;
}
