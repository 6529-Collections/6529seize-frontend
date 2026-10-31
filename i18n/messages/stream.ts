import { STREAM_CORE_MESSAGES } from "@/i18n/messages/stream-core";
import { STREAM_FEDERATED_MESSAGES } from "@/i18n/messages/stream-federated";
import { STREAM_PAGE_MESSAGES } from "@/i18n/messages/stream-pages";

/** `stream.*`: the 6529 Stream section's route namespace (en-US source copy). */
export const STREAM_MESSAGES = {
  ...STREAM_CORE_MESSAGES,
  ...STREAM_PAGE_MESSAGES,
  ...STREAM_FEDERATED_MESSAGES,
} as const;
