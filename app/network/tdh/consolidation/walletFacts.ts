import conformance from "@/components/explained/engine/conformance.json";
import type { SupportedLocale } from "@/i18n/locales";
import type { Fact } from "@/lib/explained/facts";
import { formatUtcLongDay } from "@/lib/explained/format";
import {
  secondsOf,
  utcClock,
  utcDay,
  utcDayYear,
} from "@/components/explained/layout/time";

/**
 * Values the Your wallets and Consolidation design pages print beyond the
 * facts layer's: the gate's date in its three forms, derived from
 * `rules.gateActivation`; the engine's grouping vectors, counted in its
 * conformance record; and the size of D136's check against 6529.io's code,
 * from the decision record. The last two are candidates for
 * `lib/explained/registry`.
 */

/**
 * "Oct 15", "Oct 15, 2026", "October 15, 2026" (a lede's: no abbreviation
 * dot to read as a sentence's end) and "Oct 15, 2026, 00:00 UTC".
 */
export function gateText(
  gate: Fact<string>,
  locale: SupportedLocale
): {
  readonly day: string;
  readonly dayYear: string;
  readonly long: string;
  readonly full: string;
} {
  const seconds = secondsOf(gate.value);
  return {
    day: utcDay(locale, seconds),
    dayYear: utcDayYear(locale, seconds),
    long: formatUtcLongDay(locale, gate.value),
    full: `${utcDayYear(locale, seconds)}, ${utcClock(locale, seconds)} UTC`,
  };
}

/** P26's grouping vectors (scope "clusters") the engine passes. */
export function groupingVectorsPassed(): number {
  return conformance.vectors.filter(
    (vector) => vector.scope === "clusters" && vector.status === "pass"
  ).length;
}

/** Where the engine's conformance record says it was checked. */
export const CONFORMANCE_SOURCE = `components/explained/engine/conformance.json, P26 at 6529chain ${conformance.specification.commit.slice(0, 7)}`;

/**
 * D136's check of P26's rule against 6529.io's own grouping code. The
 * decision record (6529chain design/README.md, P26's row, from 5e51595)
 * says "checked against 6529.io's own code on 100,000 random link graphs
 * and the real rows".
 */
export const RANDOM_LINK_GRAPHS = {
  id: "record.d136.randomLinkGraphs",
  value: 100_000,
  source:
    "6529chain design/README.md, P26's row (D136): checked against 6529.io's own code on random link graphs and the real rows",
} as const;
