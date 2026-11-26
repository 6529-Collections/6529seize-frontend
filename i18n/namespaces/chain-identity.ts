import { registerSourceMessages } from "@/i18n/messageRegistry";
import chainIdentityMessages from "@/i18n/messages/chainIdentity.en-US.json";

/**
 * en-US copy for the 6529 Network identity page, `/network/identity`, and
 * the Delegation Center's 6529 Network delegations. Import this module from
 * every module that uses these keys in a browser; see
 * `i18n/messages/en-US.complete.ts`.
 */
export const CHAIN_IDENTITY_MESSAGES = registerSourceMessages(
  chainIdentityMessages
);
