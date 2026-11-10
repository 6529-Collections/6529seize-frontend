import { registerSourceMessages } from "@/i18n/messageRegistry";
import validatorAuthorizeMessages from "@/i18n/messages/validatorAuthorize.en-US.json";

/**
 * en-US copy for the validator's phone authorization page,
 * `/validator/authorize`. Import this module from every module that uses
 * these keys in a browser; see `i18n/messages/en-US.complete.ts`.
 */
export const VALIDATOR_AUTHORIZE_MESSAGES = registerSourceMessages(
  validatorAuthorizeMessages
);
