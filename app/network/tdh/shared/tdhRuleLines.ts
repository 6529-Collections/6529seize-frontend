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

const KEYWORDS: Record<RuleLanguage, ReadonlySet<string>> = {
  pseudo: new Set([
    "if",
    "elif",
    "else",
    "for",
    "each",
    "in",
    "while",
    "repeat",
    "and",
    "or",
    "not",
    "unless",
    "skip",
    "continue",
    "emit",
    "append",
    "remove",
    "pop",
    "invalid",
    "none",
    "true",
    "false",
    "MUST",
    "NOT",
  ]),
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

const TOKEN = /("[^"\n]*")|(0x[0-9a-fA-F…]+|\b\d[\d,.]*\b)|([A-Za-z_]\w*)/g;

/** A line's code as tokens: keywords, numbers, strings and rule names. */
export function ruleTokens(
  text: string,
  language: RuleLanguage = "pseudo"
): RuleToken[] {
  const keywords = KEYWORDS[language];
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
    const [whole, string, number, word] = match;
    if (string) {
      push("string", whole);
    } else if (number) {
      push("number", whole);
    } else if (word && keywords.has(word)) {
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
