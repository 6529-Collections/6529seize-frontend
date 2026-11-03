import { registerSourceMessages } from "@/i18n/messageRegistry";
import { ARTWORK_DOCUMENTATION_MESSAGES as ARTWORK_DOCUMENTATION_SOURCE } from "@/i18n/messages/artwork-documentation";

/**
 * en-US copy for artwork documentation: the documentation workspace, its
 * guidance, chapters and editorial text, and the Museum record copy it
 * shows. Import this module from every module that uses these keys in a
 * browser; see `i18n/messages/en-US.complete.ts`.
 */
export const ARTWORK_DOCUMENTATION_MESSAGES = registerSourceMessages(
  ARTWORK_DOCUMENTATION_SOURCE
);
