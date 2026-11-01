import { STREAM_CORE_MESSAGES } from "@/i18n/messages/stream-core";
import { STREAM_PAGE_MESSAGES } from "@/i18n/messages/stream-pages";
import { STREAM_WORK_MESSAGES } from "@/i18n/messages/stream-work";

/** `stream.*`: the 6529 Stream section's route namespace (en-US source copy). */
export const STREAM_MESSAGES = {
  ...STREAM_CORE_MESSAGES,
  ...STREAM_PAGE_MESSAGES,
  ...STREAM_WORK_MESSAGES,
} as const;
