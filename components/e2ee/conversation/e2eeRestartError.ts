import type { SupportedLocale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages";
import type { E2eeConversation } from "@/lib/e2ee/types";
import { getE2eeActionErrorKey, getE2eeErrorCode } from "../e2eeErrors";
import { getConversationTitle } from "../e2eeFormat";

export interface RestartError {
  readonly key: MessageKey;
  readonly params: Record<string, string>;
}

/** Copy for a failed continue (restart, or resending an unsent message). */
export function getRestartError(
  locale: SupportedLocale,
  error: unknown,
  conversation: E2eeConversation,
  selfProfileId: string | null,
  fallback: MessageKey = "e2ee.banner.restartFailed"
): RestartError {
  if (getE2eeErrorCode(error) === "E2EE_NO_DEVICES") {
    return conversation.kind === "dm"
      ? {
          key: "e2ee.superseded.noDevices.dm",
          params: {
            name: getConversationTitle(locale, conversation, selfProfileId),
          },
        }
      : { key: "e2ee.superseded.noDevices.group", params: {} };
  }
  return {
    key: getE2eeActionErrorKey(error, fallback),
    params: {},
  };
}
