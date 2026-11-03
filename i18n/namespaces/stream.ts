import { registerSourceMessages } from "@/i18n/messageRegistry";
import { STREAM_MESSAGES } from "@/i18n/messages/stream";

// `stream.*` copy is used only by the /stream section. Every module that reads
// it with t() or tRich() imports this module for its side effect, so the copy
// is registered in the browser before that module runs. Shared code must not
// import it. Server rendering registers it with the complete dictionary
// (`i18n/messages/en-US.complete.ts`).
export const STREAM_NAMESPACE_MESSAGES =
  registerSourceMessages(STREAM_MESSAGES);
