import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

/**
 * Source references cited by the TDH pages (plan §4.4). Every reference to
 * the specification, a deviation, an old-backend issue, a decision or the
 * evidence resolves to an anchor on the specification page, so no chip links
 * to a private repository. P53, P38, P52 and P28 are in 6529's private design
 * repository, so their chips have no link.
 */

const SPECIFICATION_PATH = "/network/tdh/specification";

const PRIVATE_DOCUMENTS = new Set(["P53", "P38", "P52", "P28"]);
const EVIDENCE: Record<string, { anchor: string; key: MessageKey }> = {
  "Replay 2026-10-11": {
    anchor: "evidence-replay",
    key: "network.tdh.shared.source.replay",
  },
  "Clean room 2026-10-11": {
    anchor: "evidence-clean-room",
    key: "network.tdh.shared.source.cleanRoom",
  },
  "Comparison Oct 14–15": {
    anchor: "evidence-comparison",
    key: "network.tdh.shared.source.comparison",
  },
  "Difftest Oct 15–16": {
    anchor: "evidence-difftest",
    key: "network.tdh.shared.source.difftest",
  },
};

interface ResolvedSource {
  readonly label: string;
  readonly href: string | null;
  readonly accessibleName: string;
}

/** The specification anchor of a P26 section: "5.2" becomes "s5-2". */
function specificationAnchor(section: string): string {
  return `s${section.replaceAll(".", "-")}`;
}

export function resolveSource(
  locale: SupportedLocale,
  reference: string
): ResolvedSource {
  const p26 = /^P26 §([\d.]+)$/.exec(reference);
  if (p26?.[1]) {
    return {
      label: reference,
      href: `${SPECIFICATION_PATH}#${specificationAnchor(p26[1])}`,
      accessibleName: t(locale, "network.tdh.shared.source.p26", {
        section: p26[1],
      }),
    };
  }
  if (reference === "P26 header") {
    return {
      label: "P26",
      href: `${SPECIFICATION_PATH}#top`,
      accessibleName: t(locale, "network.tdh.shared.source.p26Header"),
    };
  }
  const deviation = /^(DEV|BUG)-(\d+)$/.exec(reference);
  if (deviation?.[1] && deviation[2]) {
    const isDeviation = deviation[1] === "DEV";
    return {
      label: reference,
      href: `${SPECIFICATION_PATH}#${deviation[1].toLowerCase()}-${deviation[2]}`,
      accessibleName: t(
        locale,
        isDeviation
          ? "network.tdh.shared.source.dev"
          : "network.tdh.shared.source.bug",
        { id: reference }
      ),
    };
  }
  if (/^D\d{2,4}$/.test(reference)) {
    return {
      label: reference,
      href: `${SPECIFICATION_PATH}#${reference.toLowerCase()}`,
      accessibleName: t(locale, "network.tdh.shared.source.decision", {
        id: reference,
      }),
    };
  }
  const evidence = EVIDENCE[reference];
  if (evidence) {
    return {
      label: reference,
      href: `${SPECIFICATION_PATH}#${evidence.anchor}`,
      accessibleName: t(locale, evidence.key),
    };
  }
  const privateDocument = /^(P\d+) §([\d.]+)$/.exec(reference);
  if (privateDocument?.[1] && privateDocument[2]) {
    const document = privateDocument[1];
    if (PRIVATE_DOCUMENTS.has(document)) {
      return {
        label: reference,
        href: null,
        accessibleName: t(locale, "network.tdh.shared.source.private", {
          document: t(
            locale,
            `network.tdh.shared.source.doc.${document}` as MessageKey
          ),
          section: privateDocument[2],
        }),
      };
    }
  }
  throw new Error(`Unknown TDH source reference: ${reference}`);
}
