import {
  getEncryptedConversationRoute,
  getEncryptedMessagesRoute,
  getMessagesBaseRoute,
} from "@/helpers/navigation.helpers";

/** Query parameter a chat link carries when it was opened from Messages. */
export const E2EE_CHAT_FROM_PARAM = "from";
const FROM_MESSAGES = "messages";

/** A chat link from the Messages list; its Back returns to Messages. */
export const getEncryptedConversationRouteFromMessages = (g: string): string =>
  `${getEncryptedConversationRoute(g)}?${E2EE_CHAT_FROM_PARAM}=${FROM_MESSAGES}`;

/**
 * Where a chat's Back returns, from its own `from` parameter: Messages when it
 * was opened there, otherwise the encrypted list. Only these two lists are
 * possible, and the URL keeps the choice across reloads.
 */
export const getE2eeChatReturnRoute = (from: string | null): string =>
  from === FROM_MESSAGES
    ? getMessagesBaseRoute(false)
    : getEncryptedMessagesRoute();
