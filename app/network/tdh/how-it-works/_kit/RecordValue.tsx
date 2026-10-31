import type { ReactNode } from "react";
import { kt } from "@/components/explained/i18n";
import type { SupportedLocale } from "@/i18n/locales";

/**
 * A value from a record the facts layer does not hold yet (the engine's
 * conformance record, a row of the decision record), printed with its id
 * and its source like a fact. Each use is listed for promotion into
 * `lib/explained/registry`. A value derived from a fact takes the kit's
 * `FactText` instead.
 */
export function RecordValue({
  id,
  source,
  locale,
  children,
}: {
  readonly id: string;
  readonly source: string;
  readonly locale: SupportedLocale;
  readonly children: ReactNode;
}) {
  return (
    <span
      data-fact={id}
      data-fact-record=""
      title={kt(locale, "explained.kit.facts.source", { source })}
    >
      {children}
    </span>
  );
}
