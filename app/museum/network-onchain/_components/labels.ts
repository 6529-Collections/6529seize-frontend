import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { MUSEUM_ONCHAIN_MESSAGES } from "@/i18n/namespaces/museum-onchain";
import type {
  OnchainLabeler,
  OnchainTextGroupKind,
} from "@/lib/museum/onchain/presentation";

const locale = DEFAULT_LOCALE;

function isKey(key: string): key is MessageKey {
  return Object.hasOwn(MUSEUM_ONCHAIN_MESSAGES, key);
}

/**
 * Copy for a registry value. A value the messages do not list is shown as
 * itself, labelled, so a new type stays visible without being misnamed.
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

export const onchainLabeler: OnchainLabeler = {
  entityTypePlural: (type) => registryValueLabel("entityType", type),
  entityTypeSingular: (type) => registryValueLabel("entitySingular", type),
  recordType: (literal) => registryValueLabel("recordType", literal),
  recordTypePlural: (literal) =>
    registryValueLabel("recordTypePlural", literal),
  relationType: (type) => registryValueLabel("relationType", type),
  textGroup: (kind) => t(locale, TEXT_GROUP_KEYS[kind]),
};
