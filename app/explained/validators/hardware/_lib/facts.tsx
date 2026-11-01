import type { ReactNode } from "react";
import { kt } from "@/components/explained/i18n";
import type { SupportedLocale } from "@/i18n/locales";
import type {
  Fact,
  FactId,
  FactSnapshot,
  FactValue,
} from "@/lib/explained/facts";
import { formatUtcLongDay } from "@/lib/explained/format";
import { CARD } from "./card";
import { hw } from "./copy";
import { CLOUD, NODE_ROWS } from "./cloud";
import { FACTS, MACHINES, type HwFactId } from "./data";
import {
  DRIVES,
  IDLE,
  PART_TIERS,
  PARTS,
  SLEEP,
  SPEND,
  type Said,
} from "./partGuide";
import { nb } from "./nb";
import { SOURCES, type HwSource, type SourceId } from "./sources";

/**
 * The hardware page's facts layer. The kit's registry holds the facts every
 * chapter shares; this page's numbers (prices, specs, measurements) are its
 * own, kept in `data.ts` with their sources. They print the way the kit's
 * `FactValue` prints a fact: with `data-fact`, so the gates can see every
 * number came from a source, and a title that names the source and the day
 * it was read. They also join the page's fact snapshot, so "Every number's
 * source, as JSON" lists them.
 */
const PREFIX = "hw.";

/** "Hetzner's cloud plan pages, read Oct 31, 2026", or "…, an estimate". */
export function sourceText(source: HwSource, locale: SupportedLocale): string {
  const day = formatUtcLongDay(locale, source.read);
  if ("estimate" in source && source.estimate) {
    return hw(locale, "source.estimate", { source: source.name, date: day });
  }
  if ("thirdParty" in source && source.thirdParty) {
    return hw(locale, "source.thirdParty", { source: source.name, date: day });
  }
  return hw(locale, "source.read", { source: source.name, date: day });
}

export function sourceTitle(id: SourceId, locale: SupportedLocale): string {
  return kt(locale, "explained.kit.facts.source", {
    source: sourceText(SOURCES[id], locale),
  });
}

export { nb };

/** One number of the page, printed with its source. */
export function Hw({
  id,
  locale,
  className,
}: {
  readonly id: HwFactId;
  readonly locale: SupportedLocale;
  readonly className?: string;
}) {
  const fact = FACTS[id];
  return (
    <span
      className={className}
      data-fact={`${PREFIX}${id}`}
      title={sourceTitle(fact.source, locale)}
    >
      {nb(fact.text)}
    </span>
  );
}

/**
 * Anything quoted from one source, numbers included: a row of a price
 * table, a sentence of the owner's card. The element carries the source.
 */
export function Sourced({
  id,
  source,
  locale,
  as: Tag = "span",
  className,
  children,
}: {
  /** A stable id for the gates and the JSON: "cloud.aws.t4g.large". */
  readonly id: string;
  readonly source: SourceId;
  readonly locale: SupportedLocale;
  readonly as?: "span" | "div" | "p" | "tr" | "li";
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <Tag
      className={className}
      data-fact={`${PREFIX}${id}`}
      title={sourceTitle(source, locale)}
    >
      {children}
    </Tag>
  );
}

/** A sentence of the owner's approved card, printed as written. */
export function CardText({
  id,
  locale,
  children,
  className,
  as = "span",
}: {
  readonly id: string;
  readonly locale: SupportedLocale;
  readonly children: ReactNode;
  readonly className?: string;
  readonly as?: "span" | "div";
}) {
  return (
    <Sourced
      id={`card.${id}`}
      source="card"
      locale={locale}
      as={as}
      {...(className === undefined ? {} : { className })}
    >
      {children}
    </Sourced>
  );
}

function asKitFact(
  id: string,
  value: FactValue,
  source: SourceId,
  locale: SupportedLocale
): Fact {
  const from = SOURCES[source];
  return {
    // The kit's ids are typed to its registry; this page's facts keep their
    // own "hw." namespace, which no registry id uses.
    id: `${PREFIX}${id}` as FactId,
    value,
    format: "text",
    source: {
      kind: "site",
      ref: sourceText(from, locale),
      ...("url" in from ? { url: from.url } : {}),
      refresh: hw(locale, "source.refresh"),
    },
  };
}

/**
 * The kit's snapshot with this page's facts added: the card, every fact of
 * `data.ts`, so the JSON download lists each number with its source.
 */
export function withPageFacts(
  snapshot: FactSnapshot,
  locale: SupportedLocale
): FactSnapshot {
  const facts: Record<string, Fact> = {};
  for (const [id, def] of Object.entries(FACTS) as [
    HwFactId,
    (typeof FACTS)[HwFactId],
  ][]) {
    facts[`${PREFIX}${id}`] = asKitFact(id, def.text, def.source, locale);
  }
  facts[`${PREFIX}card.lede`] = asKitFact(
    "card.lede",
    CARD.lede,
    "card",
    locale
  );
  for (const provider of CLOUD) {
    for (const row of provider.rows) {
      const id = `cloud.${provider.id}.${row.id}`;
      facts[`${PREFIX}${id}`] = asKitFact(
        id,
        {
          type: row.type,
          size: row.size,
          total: row.total,
          machine: row.machine,
        },
        provider.source,
        locale
      );
    }
  }
  for (const row of MACHINES) {
    const id = `machine.${row.id}`;
    facts[`${PREFIX}${id}`] = asKitFact(
      id,
      { machine: row.machine, price: row.price },
      row.source,
      locale
    );
  }
  for (const row of NODE_ROWS) {
    const id = `node.${row.id}`;
    facts[`${PREFIX}${id}`] = asKitFact(
      id,
      { option: row.option, total: row.total },
      row.source,
      locale
    );
  }
  for (const [id, said] of partFacts()) {
    facts[`${PREFIX}${id}`] = asKitFact(id, said.text, said.source, locale);
  }
  for (const row of DRIVES) {
    const id = `drive.${row.id}`;
    facts[`${PREFIX}${id}`] = asKitFact(
      id,
      { drive: row.drive, alone: row.alone, node: row.node },
      row.source,
      locale
    );
  }
  for (const row of IDLE) {
    const id = `idle.${row.id}`;
    facts[`${PREFIX}${id}`] = asKitFact(
      id,
      { machine: row.machine, watts: row.watts, year: row.year },
      "power",
      locale
    );
  }
  return { asOf: snapshot.asOf, facts: { ...snapshot.facts, ...facts } };
}

/**
 * Every line of the part-by-part guide with the id it prints under:
 * "part.gpu.answer", "part.memory.tier.good", "part.cpu.uses.2", "spend.1".
 * The drive and idle-power tables join under "drive.*" and "idle.*".
 */
export function partFacts(): [string, Said][] {
  const out: [string, Said][] = [];
  for (const part of PARTS) {
    const base = `part.${part.id}`;
    out.push([`${base}.answer`, part.answer], [`${base}.why`, part.why]);
    part.uses.forEach((said, index) => {
      out.push([`${base}.uses.${index + 1}`, said]);
    });
    if ("text" in part.tiers) {
      out.push([`${base}.tier.all`, part.tiers]);
    } else {
      for (const tier of PART_TIERS) {
        out.push([`${base}.tier.${tier}`, part.tiers[tier]]);
      }
    }
    if (part.avoid !== undefined) {
      out.push([`${base}.avoid`, part.avoid]);
    }
  }
  out.push([
    "part.power.sleep",
    {
      text: SLEEP.map((row) => `${row.os}: ${row.cmd}`).join("; "),
      source: "sleep",
    },
  ]);
  SPEND.forEach((said, index) => {
    out.push([`spend.${index + 1}`, said]);
  });
  return out;
}
