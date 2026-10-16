import type { CSSProperties, ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import TdhCopyButton from "./TdhCopyButton";
import TdhRuleClamp from "./TdhRuleClamp";
import TdhSource from "./TdhSource";
import scrollStyles from "./tdhScroll.module.css";
import {
  ruleLines,
  ruleTokens,
  type RuleLanguage,
  type RuleLine,
} from "./tdhRuleLines";

/**
 * How a block's lines behave. One treatment for every block that is read as
 * text, and one for the blocks whose columns carry meaning:
 * - `code`: pseudocode. Lines keep their breaks and indentation; a long line
 *   wraps with a hanging indent at every width, so nothing scrolls and no
 *   token is cut at the edge. On phones a trailing comment drops below its
 *   line, at the line's continuation indent.
 * - `prose`: P26's prose rules restated line for line: wrapped the same way,
 *   with no keyword tinting, so English reads as English.
 * - `none`: lines never wrap, at any width; the block scrolls sideways when
 *   it is wider than its column, with a visible scrollbar (column-aligned
 *   tables, shell commands, whose soft wraps would read as `\`
 *   continuations).
 */
type RuleWrap = "code" | "prose" | "none";

/** Blocks longer than this get line numbers. */
const NUMBERED_FROM = 8;
/** Blocks this long show their first lines on phones, and a button. */
const CLAMPED_FROM = 16;
/** Blocks this long show their first lines at every width. */
const CLAMPED_EVERYWHERE_FROM = 28;

const TOKEN_CLASS = {
  keyword: "tw-text-violet-300",
  number: "tw-text-amber-200",
  string: "tw-text-emerald-200",
  name: "tw-text-sky-200",
  text: "",
} as const;

/**
 * Whether a line of pseudocode reads as code: it has an operator, a call or
 * a block's colon. A line of plain English inside pseudocode ("anything else
 * names no cycle") gets no keyword tinting, so "else" and "not" read as
 * words there.
 */
function readsAsCode(text: string): boolean {
  return /[=()[\]<>{}:+*]|->/.test(text);
}

/** One code fragment, tinted: keywords, numbers, strings and rule names. */
function Tinted({
  text,
  language,
  keywords,
}: {
  readonly text: string;
  readonly language: RuleLanguage;
  readonly keywords: boolean;
}): ReactNode {
  return ruleTokens(text, language, {
    keywords: keywords && (language !== "pseudo" || readsAsCode(text)),
  }).map((token, index) =>
    token.kind === "text" ? (
      token.text
    ) : (
      <span key={index} className={TOKEN_CLASS[token.kind]}>
        {token.text}
      </span>
    )
  );
}

/**
 * The grid's column template, with or without numbers: from `sm`, the code
 * column as wide as its longest commented line allows, and the comment
 * column the rest, never narrower than its longest word (a vector
 * reference keeps its line). The cells are `min-width: 0`, so the floor is
 * `min-content`, not `auto`, which would resolve to zero. Lines with no
 * comment span both, so they do not widen the code column. On phones a
 * wrapping block is one text column: each comment drops below its line.
 */
function gridClass(wrap: RuleWrap, numbered: boolean): string {
  // Where lines never wrap, the code column is as wide as its longest
  // commented line, so a comment never sits on its code.
  if (wrap === "none") {
    return numbered
      ? "tw-inline-grid tw-min-w-full tw-grid-cols-[auto_max-content_minmax(min-content,1fr)]"
      : "tw-inline-grid tw-min-w-full tw-grid-cols-[max-content_minmax(min-content,1fr)]";
  }
  return numbered
    ? "tw-grid tw-grid-cols-[auto_minmax(0,1fr)] sm:tw-grid-cols-[auto_minmax(0,max-content)_minmax(min-content,1fr)]"
    : "tw-grid tw-grid-cols-[minmax(0,1fr)] sm:tw-grid-cols-[minmax(0,max-content)_minmax(min-content,1fr)]";
}

/** Where the code column starts: after the line numbers, if any. */
function codeColumn(numbered: boolean): number {
  return numbered ? 2 : 1;
}

/**
 * The `white-space` of a cell. Scrolling blocks keep every space; wrapping
 * ones wrap between words, and a word longer than the line breaks inside.
 */
function cellWrap(wrap: RuleWrap): string {
  return wrap === "none"
    ? "tw-whitespace-pre"
    : "tw-whitespace-pre-wrap [overflow-wrap:anywhere]";
}

/**
 * The hanging indent of a wrapping line: its own indentation, then two more
 * columns for each continuation, so a wrapped line never lines up with a
 * real child line (four columns deeper). In a narrow block a deep indent
 * takes at most 45% of the width, so the text keeps room to wrap.
 */
function indentStyle(line: RuleLine, wrap: RuleWrap): CSSProperties {
  if (wrap === "none") {
    return {};
  }
  return {
    paddingLeft: `min(${line.indent + 2}ch, 45%)`,
    textIndent: "-2ch",
  };
}

/** A line's code: a heading comment as it is, code tinted, a blank kept. */
function LineCode({
  line,
  language,
  keywords,
}: {
  readonly line: RuleLine;
  readonly language: RuleLanguage;
  readonly keywords: boolean;
}): ReactNode {
  if (line.kind === "comment") {
    return line.code;
  }
  return line.code.length > 0 ? (
    <Tinted text={line.code} language={language} keywords={keywords} />
  ) : (
    " "
  );
}

function RuleRow({
  line,
  number,
  numbered,
  wrap,
  language,
  keywords,
}: {
  readonly line: RuleLine;
  readonly number: number;
  readonly numbered: boolean;
  readonly wrap: RuleWrap;
  readonly language: RuleLanguage;
  readonly keywords: boolean;
}) {
  const start = codeColumn(numbered);
  // A scrolling block keeps its indentation as spaces; a wrapping one
  // indents with padding, so its continuations hang.
  const lead = wrap === "none" ? " ".repeat(line.indent) : "";
  const codeStyle: CSSProperties = {
    gridColumn: line.comment === null ? `${start} / -1` : `${start}`,
    ...indentStyle(line, wrap),
  };
  // On phones a wrapping block's comment sits under its line, at the
  // line's continuation indent; from sm it joins the comment column.
  const commentStyle = {
    gridColumn: "-2 / -1",
    "--tdh-comment-indent": `min(${line.indent + 2}ch, 45%)`,
  } as CSSProperties;
  return (
    <>
      {numbered && (
        <span
          aria-hidden="true"
          style={{ gridColumn: "1" }}
          className="tw-select-none tw-pr-3 tw-text-right tw-text-iron-500"
        >
          {number}
        </span>
      )}
      <span
        style={codeStyle}
        className={`tw-min-w-0 ${cellWrap(wrap)} ${line.kind === "comment" ? "tw-text-iron-400" : ""}`}
      >
        {lead}
        <LineCode line={line} language={language} keywords={keywords} />
      </span>
      {line.comment !== null && (
        <span
          style={commentStyle}
          className={`tw-min-w-0 tw-text-iron-400 ${cellWrap(wrap)} ${
            wrap === "none"
              ? "tw-pl-[3ch]"
              : "max-sm:tw-pb-1 max-sm:tw-pl-[var(--tdh-comment-indent)] sm:tw-pl-[3ch]"
          } ${line.reference ? "sm:tw-whitespace-nowrap" : ""}`}
        >
          {line.comment}
        </span>
      )}
    </>
  );
}

/**
 * A rule block (plan §4.3): a formula or pseudocode exactly as P26 writes it,
 * or P26's prose rules restated line for line ("condensed"), with a caption
 * naming its section and a copy button that copies the text as written.
 *
 * Lines sit on a grid: code in one column and every trailing comment in a
 * second column, so the comments of a block share one left edge. A comment
 * written on a line of its own under its code (a vector reference, or the
 * rest of a field's comment) joins the comment column of the line above; a
 * comment at the start of a line heads the lines below it. Keywords,
 * numbers, strings and rule names are tinted. Long blocks are numbered;
 * very long ones show their first lines and a button.
 */
export default function TdhRuleBlock({
  code,
  source,
  locale,
  moreSources = [],
  label,
  title,
  tone = "exact",
  wrap = tone === "condensed" ? "prose" : "code",
  language = "pseudo",
}: {
  readonly code: string;
  readonly source?: string;
  /** Further sections the block draws on, chips after `source`. */
  readonly moreSources?: readonly string[];
  readonly locale: SupportedLocale;
  readonly label?: string;
  /** The block's heading; "Exact rule" unless the block is not a rule. */
  readonly title?: string;
  readonly tone?: "exact" | "condensed" | "plain";
  readonly wrap?: RuleWrap;
  /** Which comment marker and keywords the block uses. */
  readonly language?: RuleLanguage;
}) {
  const caption = label ?? source ?? t(locale, "network.tdh.shared.rule");
  const heading = title ?? t(locale, "network.tdh.shared.rule");
  const lines = ruleLines(code, language);
  const numbered = lines.length >= NUMBERED_FROM;
  const scrolls = wrap === "none";
  // P26's prose rules read as English: no keyword is tinted in them.
  const keywords = tone !== "condensed";
  const clamp = (pre: ReactNode): ReactNode =>
    lines.length >= CLAMPED_FROM ? (
      <TdhRuleClamp
        everywhere={lines.length >= CLAMPED_EVERYWHERE_FROM}
        more={t(locale, "network.tdh.shared.showAllLines", {
          count: formatInteger(locale, lines.length),
        })}
        less={t(locale, "network.tdh.shared.showFewerLines")}
      >
        {pre}
      </TdhRuleClamp>
    ) : (
      pre
    );
  const accent = {
    exact: "tw-border-l-primary-400/70",
    condensed: "tw-border-l-iron-500",
    plain: "tw-border-l-white/[0.07]",
  }[tone];
  const preScroll =
    wrap === "none"
      ? `tw-overflow-x-auto ${scrollStyles["shade"] ?? ""} ${scrollStyles["bar"] ?? ""}`
      : "";
  return (
    <figure
      className={`tw-m-0 tw-min-w-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-l-2 tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 ${accent}`}
    >
      <figcaption className="tw-flex tw-min-h-11 tw-items-start tw-justify-between tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-py-2 tw-pl-3 tw-pr-2">
        <span className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-pt-0.5 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-300">
          <span className="tw-min-w-0">{heading}</span>
          {source && (
            <TdhSource refs={[source, ...moreSources]} locale={locale} />
          )}
          {scrolls && (
            // Column-aligned lines run past a phone's edge: say so.
            <span className="tw-font-normal tw-text-iron-400 sm:tw-hidden">
              {t(locale, "network.tdh.shared.scrollHint")}
            </span>
          )}
        </span>
        <TdhCopyButton
          value={code}
          label={t(locale, "network.tdh.shared.copyNamed", {
            name: t(locale, "network.tdh.shared.ruleRegion", { caption }),
          })}
          copiedLabel={t(locale, "network.tdh.shared.copied")}
          failedLabel={t(locale, "network.tdh.shared.copyFailed")}
        />
      </figcaption>
      {clamp(
        <pre
          aria-label={t(locale, "network.tdh.shared.ruleRegion", { caption })}
          className={`tw-m-0 tw-bg-transparent tw-px-3 tw-py-4 tw-font-mono tw-text-[13px] tw-font-normal tw-leading-6 tw-text-iron-100 sm:tw-px-4 sm:tw-text-sm sm:tw-leading-[1.375rem] ${preScroll}`}
          {...(scrolls
            ? { "data-tdh-scroll": "", tabIndex: 0, role: "region" }
            : {})}
        >
          <code
            className={`tw-font-mono tw-text-iron-100 ${gridClass(wrap, numbered)}`}
          >
            {lines.map((line, index) => (
              <RuleRow
                key={index}
                line={line}
                number={index + 1}
                numbered={numbered}
                wrap={wrap}
                language={language}
                keywords={keywords}
              />
            ))}
          </code>
        </pre>
      )}
    </figure>
  );
}
