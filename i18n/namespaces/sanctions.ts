import { registerSourceMessages } from "@/i18n/messageRegistry";
import sanctionsMessages from "@/i18n/messages/sanctions.en-US.json";

/**
 * en-US copy for the public sanctions page (`/sanctions`). Import this module
 * from every module that uses these keys in a browser; see
 * `i18n/messages/en-US.complete.ts`.
 */
export const SANCTIONS_MESSAGES = registerSourceMessages(sanctionsMessages);
