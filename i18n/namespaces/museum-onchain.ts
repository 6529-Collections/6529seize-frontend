import { registerSourceMessages } from "@/i18n/messageRegistry";
import museumOnchainMessages from "@/i18n/messages/museumOnchain.en-US.json";

/**
 * en-US copy for the unlinked on-chain Museum preview under
 * `/museum/network-onchain`. Import this module from every module that uses
 * these keys in a browser; see `i18n/messages/en-US.complete.ts`.
 */
export const MUSEUM_ONCHAIN_MESSAGES = registerSourceMessages(
  museumOnchainMessages
);
