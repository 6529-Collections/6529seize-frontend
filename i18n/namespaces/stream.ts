import { STREAM_MESSAGES } from "@/i18n/messages/stream";
import { registerNamespaceMessages } from "@/i18n/namespaces/registry";

// `stream.*` copy is used only by the /stream section. Every module that reads
// it with t() or tRich() imports this module for its side effect, so the copy
// is registered before that module runs. Shared code must not import it.
registerNamespaceMessages(STREAM_MESSAGES);
