import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import TdhCopyButton from "./TdhCopyButton";
import TdhRuleClamp from "./TdhRuleClamp";
import TdhSource from "./TdhSource";
import scrollStyles from "./tdhScroll.module.css";

/** The `<pre>`'s wrapping and scrolling for each wrap mode. */
function preClass(wrap: "anywhere" | "words" | "none" | "code"): string {
  if (wrap === "none") {
    return `tw-overflow-x-auto tw-whitespace-pre ${scrollStyles["shade"] ?? ""}`;
  }
  if (wrap === "code") {
    return `max-sm:tw-overflow-x-auto tw-whitespace-pre sm:tw-whitespace-pre-wrap sm:tw-bg-transparent ${scrollStyles["shadePhone"] ?? ""}`;
  }
  return "tw-whitespace-pre-wrap tw-bg-transparent";
}

/** The `<code>`'s box: as wide as its longest line where lines never wrap. */
function codeClass(wrap: "anywhere" | "words" | "none" | "code"): string {
  if (wrap === "none") {
    return "tw-inline-block tw-min-w-full";
  }
  if (wrap === "code") {
    return "tw-inline-block tw-min-w-full sm:tw-block";
  }
  return "tw-block";
}

/** Blocks longer than this get line numbers. */
const NUMBERED_FROM = 8;
/** Blocks this long show their first lines on phones, and a button. */
const CLAMPED_FROM = 16;

/**
 * Text that breaks only between words: each word is a box of its own, so a
 * flag such as `--day` or a file name never splits at its hyphen; a word
 * longer than the whole line still breaks inside, as a last resort.
 */
function Words({ text }: { readonly text: string }): ReactNode {
  const nodes: ReactNode[] = [];
  let offset = 0;
  for (const part of text.split(/( +)/)) {
    if (part.startsWith(" ") || part.length === 0) {
      nodes.push(part);
    } else {
      nodes.push(
        <span
          key={`at-${offset}`}
          className="tw-inline-block tw-max-w-full tw-indent-0 [overflow-wrap:anywhere]"
        >
          {part}
        </span>
      );
    }
    offset += part.length;
  }
  return nodes;
}

/** A line with its `#` comment, if any, set apart in a quieter colour. */
function Line({
  text,
  words,
  inlineComments = false,
}: {
  readonly text: string;
  readonly words: boolean;
  /** Keep a trailing comment beside its code at every width. */
  readonly inlineComments?: boolean;
}): ReactNode {
  const body = (value: string) => (words ? <Words text={value} /> : value);
  // A comment-only line, indented or not, is quiet as a whole.
  if (text.trimStart().startsWith("#")) {
    return <span className="tw-text-iron-400">{body(text)}</span>;
  }
  const index = text.indexOf("  #");
  if (index < 0) {
    return text.length > 0 ? body(text) : " ";
  }
  // A trailing comment: beside its code from `sm`, on a line of its own on
  // phones, so a narrow column never splits it from its code mid-sentence.
  const comment = text.slice(index);
  const padding = /^ */.exec(comment)?.[0] ?? "";
  if (inlineComments) {
    return (
      <>
        {body(text.slice(0, index))}
        {padding}
        <span className="tw-text-iron-400">
          {body(comment.slice(padding.length))}
        </span>
      </>
    );
  }
  return (
    <>
      {body(text.slice(0, index))}
      <span className="tw-hidden sm:tw-inline">{padding}</span>
      <span className="tw-block tw-text-iron-400 sm:tw-inline">
        {body(comment.slice(padding.length))}
      </span>
    </>
  );
}

/**
 * A rule block (plan §4.3): a formula or pseudocode exactly as P26 writes it,
 * or P26's prose rules restated line for line ("condensed"), with a caption
 * naming its section and a copy button. Comments are quieter and long blocks
 * are numbered. A line too long for its column wraps with a hanging indent,
 * so nothing scrolls sideways at any width; commands (`wrap="words"`) wrap
 * only between words, so what to type is never split inside a flag. Code
 * (`wrap="code"`, the default for every rule block and Lean) keeps its lines and
 * indentation on phones, where a wrapped line would read as a new statement:
 * below `sm` it scrolls sideways inside its frame, with shadows at the cut
 * edges, and from `sm` it wraps like the rest.
 */
export default function TdhRuleBlock({
  code,
  source,
  locale,
  label,
  title,
  tone = "exact",
  wrap = tone === "plain" ? "anywhere" : "code",
}: {
  readonly code: string;
  readonly source?: string;
  readonly locale: SupportedLocale;
  readonly label?: string;
  /** The block's heading; "Exact rule" unless the block is not a rule. */
  readonly title?: string;
  readonly tone?: "exact" | "condensed" | "plain";
  /**
   * `words` for commands: break lines only between words. `none` for
   * column-aligned blocks: lines never wrap, and the block scrolls sideways
   * inside its frame when it is wider than its column. `code`: as `none`
   * on phones, as `anywhere` from `sm`.
   */
  readonly wrap?: "anywhere" | "words" | "none" | "code";
}) {
  const caption = label ?? source ?? t(locale, "network.tdh.shared.rule");
  const heading = title ?? t(locale, "network.tdh.shared.rule");
  const lines = code.split("\n");
  const numbered = lines.length >= NUMBERED_FROM;
  const aligned = wrap === "none";
  const clamp = (pre: ReactNode): ReactNode =>
    lines.length >= CLAMPED_FROM ? (
      <TdhRuleClamp
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
  const codeMode = wrap === "code";
  const accent = {
    exact: "tw-border-l-primary-400/70",
    condensed: "tw-border-l-iron-500",
    plain: "tw-border-l-white/[0.07]",
  }[tone];
  return (
    <figure
      className={`tw-m-0 tw-min-w-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-l-2 tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 ${accent}`}
    >
      <figcaption className="tw-flex tw-min-h-11 tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-py-0 tw-pl-3 tw-pr-2">
        <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-300">
          <span>{heading}</span>
          {source && <TdhSource refs={[source]} locale={locale} />}
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
          className={`tw-m-0 tw-px-3 tw-py-4 tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-100 sm:tw-px-4 ${preClass(wrap)}`}
          {...(aligned || codeMode
            ? { "data-tdh-scroll": "", tabIndex: 0, role: "region" }
            : {})}
        >
          <code className={`tw-font-mono tw-text-iron-100 ${codeClass(wrap)}`}>
            {lines.map((text, index) => (
              <span key={index} className="tw-flex">
                {numbered && (
                  <span
                    aria-hidden="true"
                    className="tw-w-7 tw-shrink-0 tw-select-none tw-pr-3 tw-text-right tw-text-iron-500"
                  >
                    {index + 1}
                  </span>
                )}
                {aligned && (
                  <span className="tw-whitespace-pre">
                    {text.length > 0 ? text : " "}
                  </span>
                )}
                {codeMode && (
                  <span className="tw-whitespace-pre sm:tw-min-w-0 sm:tw-flex-1 sm:tw-whitespace-pre-wrap sm:tw-pl-[2ch] sm:-tw-indent-[2ch] sm:[overflow-wrap:anywhere]">
                    <Line text={text} words={false} inlineComments />
                  </span>
                )}
                {!aligned && !codeMode && (
                  <span
                    className={`tw-min-w-0 tw-flex-1 tw-whitespace-pre-wrap tw-pl-[2ch] -tw-indent-[2ch] ${wrap === "words" ? "" : "[overflow-wrap:anywhere]"}`}
                  >
                    <Line text={text} words={wrap === "words"} />
                  </span>
                )}
              </span>
            ))}
          </code>
        </pre>
      )}
    </figure>
  );
}
