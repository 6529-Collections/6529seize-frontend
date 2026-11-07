import { registerSourceMessages } from "@/i18n/messageRegistry";
import diagnosticsMessages from "@/i18n/messages/diagnostics.en-US.json";

/**
 * en-US copy for Send diagnostics and the crash prompt. Import this module
 * from every module that uses these keys in a browser; see
 * `i18n/messages/en-US.complete.ts`.
 */
export const DIAGNOSTICS_MESSAGES = registerSourceMessages(diagnosticsMessages);
