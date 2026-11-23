import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { MUSEUM_ONCHAIN_MESSAGES } from "@/i18n/namespaces/museum-onchain";
import type { OnchainLabeler } from "@/lib/museum/onchain/presentation";
import type { OnchainTextGroupKind } from "@/lib/museum/onchain/texts";

const locale = DEFAULT_LOCALE;

function isKey(key: string): key is MessageKey {
  return Object.hasOwn(MUSEUM_ONCHAIN_MESSAGES, key);
}

/**
 * Copy for a registry or profile value. A value the messages do not list is
 * shown as itself, labelled, so a new kind stays visible without being
 * misnamed.
 */
export function registryValueLabel(prefix: string, value: string): string {
  const key = `museum.onchain.${prefix}.${value}`;
  return isKey(key)
    ? t(locale, key)
    : t(locale, "museum.onchain.unlistedCode", { code: value });
}

const TEXT_GROUP_KEYS: Readonly<Record<OnchainTextGroupKind, MessageKey>> = {
  accession: "museum.onchain.textGroup.accession",
  proposedGift: "museum.onchain.textGroup.proposedGift",
  program: "museum.onchain.textGroup.program",
  programWorks: "museum.onchain.textGroup.programWorks",
  programArtists: "museum.onchain.textGroup.programArtists",
  institutionalPractice: "museum.onchain.textGroup.institutionalPractice",
  institutionalProfiles: "museum.onchain.textGroup.institutionalProfiles",
  policies: "museum.onchain.textGroup.policies",
  dataArchitecture: "museum.onchain.textGroup.dataArchitecture",
  documentation: "museum.onchain.textGroup.documentation",
  contributing: "museum.onchain.textGroup.contributing",
  other: "museum.onchain.textGroup.other",
};

function relationPhrase(kind: string, source: string, target: string): string {
  const key = `museum.onchain.relation.${kind}`;
  return isKey(key)
    ? t(locale, key, { source, target })
    : t(locale, "museum.onchain.relation.other", { source, target });
}

/** A family's kind, falling back to the family's own name. */
function recordKindLabel(
  prefix: "recordKind" | "recordKinds",
  family: string,
  kind: string
): string {
  const key = `museum.onchain.${prefix}.${family}.${kind}`;
  return isKey(key) ? t(locale, key) : registryValueLabel("family", family);
}

export const onchainLabeler: OnchainLabeler = {
  entityGroup: (key) => registryValueLabel("entityGroup", key),
  entitySingular: (key) => registryValueLabel("entity", key),
  family: (recordType) => registryValueLabel("family", recordType),
  recordKind: (family, kind) => recordKindLabel("recordKind", family, kind),
  recordKindPlural: (family, kind) =>
    recordKindLabel("recordKinds", family, kind),
  documentKind: (kind) => registryValueLabel("documentKind", kind),
  relation: relationPhrase,
  textGroup: (kind) => t(locale, TEXT_GROUP_KEYS[kind]),
  unverifiedGroup: () => t(locale, "museum.onchain.unverified.heading"),
};
