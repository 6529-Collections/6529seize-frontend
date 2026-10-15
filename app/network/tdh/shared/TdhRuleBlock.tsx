import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhCopyButton from "./TdhCopyButton";
import TdhSource from "./TdhSource";
import { TDH_FOCUS_RING } from "./tdhStyles";

/** Blocks longer than this get line numbers. */
const NUMBERED_FROM = 8;

/** A line with its `#` comment, if any, set apart in a quieter colour. */
function Line({ text }: { readonly text: string }): ReactNode {
  const index = text.startsWith("#") ? 0 : text.indexOf("  #");
  if (index < 0) {
    return text.length > 0 ? text : " ";
  }
  return (
    <>
      {text.slice(0, index)}
      <span className="tw-text-iron-500">{text.slice(index)}</span>
    </>
  );
}

/**
 * A rule block (plan §4.3): a formula or pseudocode exactly as P26 writes it,
 * or P26's prose rules restated line for line ("condensed"), with a caption
 * naming its section and a copy button. Comments are quieter, long blocks
 * are numbered, and on phones the block scrolls inside itself, so the page
 * never scrolls sideways.
 */
export default function TdhRuleBlock({
  code,
  source,
  locale,
  label,
  title,
  tone = "exact",
}: {
  readonly code: string;
  readonly source?: string;
  readonly locale: SupportedLocale;
  readonly label?: string;
  /** The block's heading; "Exact rule" unless the block is not a rule. */
  readonly title?: string;
  readonly tone?: "exact" | "condensed" | "plain";
}) {
  const caption = label ?? source ?? t(locale, "network.tdh.shared.rule");
  const heading = title ?? t(locale, "network.tdh.shared.rule");
  const lines = code.split("\n");
  const numbered = lines.length >= NUMBERED_FROM;
  const accent = {
    exact: "tw-border-l-primary-400/70",
    condensed: "tw-border-l-iron-500",
    plain: "tw-border-l-white/[0.07]",
  }[tone];
  return (
    <figure
      className={`tw-m-0 tw-min-w-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-l-2 tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 ${accent}`}
    >
      <figcaption className="tw-flex tw-min-h-11 tw-items-center tw-justify-between tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-py-0 tw-pl-3 tw-pr-2">
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
      <div className="tw-relative">
        <pre
          tabIndex={0}
          role="region"
          aria-label={t(locale, "network.tdh.shared.ruleRegion", { caption })}
          className={`tw-m-0 tw-overflow-x-auto tw-whitespace-pre tw-bg-transparent tw-py-4 tw-pr-8 tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-100 sm:tw-pr-4 ${numbered ? "tw-pl-2" : "tw-pl-4"} ${TDH_FOCUS_RING}`}
        >
          <code className="tw-block tw-w-max tw-min-w-full tw-font-mono tw-text-iron-100">
            {lines.map((text, index) => (
              <span key={index} className="tw-flex">
                {numbered && (
                  <span
                    aria-hidden="true"
                    className="tw-w-7 tw-shrink-0 tw-select-none tw-pr-3 tw-text-right tw-text-iron-600"
                  >
                    {index + 1}
                  </span>
                )}
                <span>
                  <Line text={text} />
                </span>
              </span>
            ))}
          </code>
        </pre>
        <span
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-w-8 tw-bg-gradient-to-l tw-from-iron-950 tw-to-transparent sm:tw-hidden"
        />
      </div>
    </figure>
  );
}
