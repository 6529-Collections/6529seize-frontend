import { registerSourceMessages } from "@/i18n/messageRegistry";
import museumMessages from "@/i18n/messages/museum.en-US.json";

/**
 * en-US copy for the Network Museum. Import this module from every module
 * that uses these keys in a browser; see `i18n/messages/en-US.complete.ts`.
 */
export const MUSEUM_MESSAGES = registerSourceMessages(museumMessages);
