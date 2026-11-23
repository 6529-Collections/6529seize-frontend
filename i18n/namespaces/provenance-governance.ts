import { registerSourceMessages } from "@/i18n/messageRegistry";
import provenanceGovernanceMessages from "@/i18n/messages/provenanceGovernance.en-US.json";

/**
 * en-US copy for the unlinked provenance governance page under
 * `/provenance/governance`. Import this module from every module that uses
 * these keys in a browser; see `i18n/messages/en-US.complete.ts`.
 */
export const PROVENANCE_GOVERNANCE_MESSAGES = registerSourceMessages(
  provenanceGovernanceMessages
);
