import { EN_US_MESSAGES } from "@/i18n/messages/en-US";

// `t()` reads en-US source copy from EN_US_MESSAGES. Route namespaces are left
// out of that object as bundled, so their copy does not ship with every page.
// A route adds its namespace to the same object when its bundle loads, before
// any of its components render. `t()` then finds it with no change to how it
// looks up copy, and other locales still fall back to it.
const sourceMessages: Record<string, string> = EN_US_MESSAGES;

export function registerNamespaceMessages(
  messages: Readonly<Record<string, string>>
): void {
  Object.assign(sourceMessages, messages);
}
