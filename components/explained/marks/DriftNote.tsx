import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { formatList } from "@/i18n/format";
import { kt } from "../i18n";
import { Glyph } from "./glyphs";

/**
 * A newer decision touches this block (EXPLAINED.md §3 rule 7): the note
 * names it and says what it changes, on the line it touches. A dashed
 * border, a left rule and the dashed clock; never amber. The drift check
 * reads `data-drift-by` from the rendered page and `by` from the source.
 */
export default function DriftNote({
  by,
  locale,
  children,
  inline = false,
}: {
  /** The decisions that came after: ["D136", "D137"]. */
  readonly by: readonly string[];
  readonly locale: SupportedLocale;
  readonly children: ReactNode;
  /** A receipt row's note: smaller, without its own label line. */
  readonly inline?: boolean;
}) {
  const label = kt(
    locale,
    by.length > 1 ? "explained.kit.drift.many" : "explained.kit.drift.one"
  );
  const named = formatList(locale, by);
  if (inline) {
    return (
      <div
        className="tw-rounded-r-md tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-400 tw-bg-white/[0.025] tw-px-3 tw-py-2 tw-text-sm tw-leading-[21px] tw-text-iron-300"
        data-drift-by={by.join(" ")}
      >
        <Glyph
          kind="drift"
          className="tw-mr-1 tw-inline tw-size-3 tw-align-[-1px]"
        />
        <b className="tw-font-semibold tw-text-iron-50">{`${label} (${named}). `}</b>
        {children}
      </div>
    );
  }
  return (
    <aside
      className="tw-grid tw-grid-cols-[18px_minmax(0,1fr)] tw-gap-3 tw-rounded-lg tw-border tw-border-l-[3px] tw-border-dashed tw-border-iron-700 tw-border-l-iron-400 tw-bg-white/[0.02] tw-px-[18px] tw-py-4 tw-text-base tw-leading-[25px] tw-text-iron-300"
      style={{ borderLeftStyle: "solid" }}
      aria-label={`${label}: ${named}`}
      data-drift-by={by.join(" ")}
    >
      <Glyph kind="drift" className="tw-mt-1 tw-size-4" />
      <div>
        <span className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
          {`${label} · ${named}`}
        </span>
        {children}
      </div>
    </aside>
  );
}
