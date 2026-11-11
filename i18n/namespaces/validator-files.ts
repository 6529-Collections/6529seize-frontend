import { registerSourceMessages } from "@/i18n/messageRegistry";
import validatorFilesMessages from "@/i18n/messages/validatorFiles.en-US.json";

/**
 * en-US copy for the validator download page's file table, `/validator`.
 * Import this module from every module that uses these keys in a browser;
 * see `i18n/messages/en-US.complete.ts`.
 */
export const VALIDATOR_FILES_MESSAGES = registerSourceMessages(
  validatorFilesMessages
);
