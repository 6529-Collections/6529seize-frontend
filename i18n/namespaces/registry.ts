import { EN_US_MESSAGES } from "@/i18n/messages/en-US";

// `t()` reads en-US source copy from EN_US_MESSAGES. Route namespaces are left
// out of that object as bundled, so their copy does not ship with every page.
// Each module that reads a namespace's copy imports `@/i18n/namespaces/<name>`,
// which adds the copy to the same object before that module runs. `t()` then
// finds it with no change to how it looks up copy, and other locales still
// fall back to it.
// EN_US_MESSAGES is deliberately not frozen: freezing it would break this
// registration at runtime with no type error.
// Read copy through `t()`. Code that reads EN_US_MESSAGES directly sees only
// the namespaces registered so far.
const sourceMessages: Record<string, string> = EN_US_MESSAGES;

export function registerNamespaceMessages(
  messages: Readonly<Record<string, string>>
): void {
  Object.assign(sourceMessages, messages);
}
