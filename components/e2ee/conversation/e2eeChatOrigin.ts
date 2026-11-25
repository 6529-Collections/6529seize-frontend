import {
  getEncryptedMessagesRoute,
  getMessagesBaseRoute,
} from "@/helpers/navigation.helpers";

/** Conversation lists a chat can be opened from and returned to. */
const LIST_ROUTES = new Set([
  getMessagesBaseRoute(false),
  getEncryptedMessagesRoute(),
]);

let origin: { readonly g: string; readonly route: string } | null = null;

/** Records the list a chat row was opened from (Messages or encrypted list). */
export function rememberE2eeChatOrigin(g: string): void {
  const route = globalThis.location.pathname;
  origin = LIST_ROUTES.has(route) ? { g: g.toLowerCase(), route } : null;
}

/**
 * Where the chat's Back returns: the list it was opened from, so one tap gets
 * back there. Chats opened any other way return to the encrypted list.
 */
export function getE2eeChatReturnRoute(g: string): string {
  return origin?.g === g.toLowerCase()
    ? origin.route
    : getEncryptedMessagesRoute();
}
