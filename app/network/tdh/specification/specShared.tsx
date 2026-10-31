import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages";
import type { FactBook } from "@/lib/explained/facts";
import type {
  ItemRow,
  RegistryRecord,
} from "@/lib/explained/registry/referenceFacts";
import { CodeName } from "@/components/explained/reference/parts";
import { plain, rich, type RichValues } from "@/components/explained/rich";
import { printers } from "@/components/explained/facts/printers";
import { registryValues } from "./specCode";

/**
 * What the specification's sections share: their copy
 * (explained.tdh.spec.*), the fact printers, the registry record the
 * formulas print, and the code names every message may name: binary64 and
 * the deviation IDs, set in mono.
 */
export type SpecKey = Extract<MessageKey, `explained.tdh.spec.${string}`>;

export interface SpecContext {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
  readonly m: (key: SpecKey, values?: RichValues) => ReactNode;
  readonly s: (
    key: SpecKey,
    params?: Readonly<Record<string, string | number>>
  ) => string;
  readonly p: ReturnType<typeof printers>;
  /** The registry's values the formulas print; null when it cannot be read. */
  readonly registry: ReturnType<typeof registryValues> | null;
  readonly deviations: readonly ItemRow[];
  readonly issues: readonly string[];
}

/** {binary64}, {dev2}, …: code names a message may name. */
function codeNames(deviations: readonly ItemRow[]): RichValues {
  const values: Record<string, ReactNode> = {
    binary64: <CodeName>binary64</CodeName>,
  };
  for (const item of deviations) {
    values[item.id.replace("DEV-", "dev")] = <CodeName>{item.id}</CodeName>;
  }
  return values;
}

export function specContext(
  book: FactBook,
  locale: SupportedLocale
): SpecContext {
  const p = printers(book, locale);
  const deviations = book.maybe<ItemRow[]>("spec.deviations")?.value ?? [];
  const names = codeNames(deviations);
  const record = book.maybe<RegistryRecord>("rules.registryRecord")?.value;
  return {
    book,
    locale,
    m: (key, values) => rich(locale, key, { ...names, ...values }),
    s: (key, params) => plain(locale, key, params),
    p,
    registry: record ? registryValues(record) : null,
    deviations,
    issues: book.maybe<string[]>("spec.issueIds")?.value ?? [],
  };
}
