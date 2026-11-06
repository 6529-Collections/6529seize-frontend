import { registerSourceMessages } from "@/i18n/messageRegistry";
import { STREAM_MESSAGES } from "@/i18n/messages/stream";

// Stream copy stays in its route namespace and uses the shared source registry.
export const STREAM_NAMESPACE_MESSAGES = registerSourceMessages(STREAM_MESSAGES);
