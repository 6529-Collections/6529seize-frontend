import { EN_US_ROOT_MESSAGES } from "@/i18n/messages/en-US";
import { AI_DOWNLOAD_MESSAGES } from "@/i18n/namespaces/ai-download";
import { ARTWORK_DOCUMENTATION_MESSAGES } from "@/i18n/namespaces/artwork-documentation";
import { DESKTOP_DOWNLOAD_MESSAGES } from "@/i18n/namespaces/desktop-download";
import { MUSEUM_MESSAGES } from "@/i18n/namespaces/museum";
import { MUSEUM_ONCHAIN_MESSAGES } from "@/i18n/namespaces/museum-onchain";
import { NETWORK_TDH_MESSAGES } from "@/i18n/namespaces/network-tdh";
import { NETWORK_TDH_CONSOLIDATION_MESSAGES } from "@/i18n/namespaces/network-tdh-consolidation";
import { PROVENANCE_GOVERNANCE_MESSAGES } from "@/i18n/namespaces/provenance-governance";
import { VALIDATOR_AUTHORIZE_MESSAGES } from "@/i18n/namespaces/validator-authorize";
import { VALIDATOR_FILES_MESSAGES } from "@/i18n/namespaces/validator-files";

/**
 * The complete en-US source dictionary: the root dictionary plus every feature
 * namespace in `@/i18n/namespaces`. Server rendering, Jest and webpack builds
 * register all of it (`@/i18n/sourceMessages`). Turbopack browser bundles
 * register only the root dictionary, each namespace when a module that imports
 * it loads, and this module only as a fallback for a missing key.
 *
 * To move a namespace out of the root dictionary, remove its spread from
 * `EN_US_ROOT_MESSAGES`, add an `@/i18n/namespaces` module for it, and spread
 * that module's messages here.
 */
export const EN_US_MESSAGES = {
  ...EN_US_ROOT_MESSAGES,
  ...AI_DOWNLOAD_MESSAGES,
  ...ARTWORK_DOCUMENTATION_MESSAGES,
  ...DESKTOP_DOWNLOAD_MESSAGES,
  ...MUSEUM_MESSAGES,
  ...MUSEUM_ONCHAIN_MESSAGES,
  ...NETWORK_TDH_MESSAGES,
  ...NETWORK_TDH_CONSOLIDATION_MESSAGES,
  ...PROVENANCE_GOVERNANCE_MESSAGES,
  ...VALIDATOR_AUTHORIZE_MESSAGES,
  ...VALIDATOR_FILES_MESSAGES,
} as const;

export type MessageKey = keyof typeof EN_US_MESSAGES;
