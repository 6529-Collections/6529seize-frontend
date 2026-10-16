import type { ReactNode } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhDisclosure from "./TdhDisclosure";
import TdhSource from "./TdhSource";

/**
 * A section's provenance in one place: a closed "Sources" disclosure at the
 * section's end holding every chip the section cites, and an optional note
 * (what P, D, DEV and BUG numbers are, or which build a figure is from).
 * Sentences carry no chips of their own, so the prose reads as prose; the
 * rule blocks keep the one chip in their caption.
 */
export default function TdhSourcesNote({
  locale,
  refs,
  note,
  className = "tw-mt-6",
}: {
  readonly locale: SupportedLocale;
  readonly refs: readonly string[];
  readonly note?: ReactNode;
  readonly className?: string;
}) {
  if (refs.length === 0 && note === undefined) {
    return null;
  }
  const unique = [...new Set(refs)];
  return (
    <TdhDisclosure
      className={`${className} tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-1`}
      summaryClassName="tw-text-[13px]"
      summary={
        unique.length > 0
          ? t(locale, "network.tdh.shared.sourcesCount", {
              count: formatInteger(locale, unique.length),
            })
          : t(locale, "network.tdh.shared.sources")
      }
    >
      <div className="tw-max-w-[38em] tw-space-y-2 tw-pb-2 tw-pl-6 tw-text-[13px] tw-leading-6 tw-text-iron-300">
        {unique.length > 0 && <TdhSource refs={unique} locale={locale} block />}
        {note !== undefined && <div className="tw-m-0">{note}</div>}
      </div>
    </TdhDisclosure>
  );
}
