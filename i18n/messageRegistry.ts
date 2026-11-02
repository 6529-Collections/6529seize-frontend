/**
 * en-US source copy for a set of message keys: the root dictionary, the
 * complete dictionary, or one feature namespace from `@/i18n/namespaces`.
 */
export type SourceMessages = Readonly<Record<string, string>>;

// Dictionaries in registration order. Keys are unique across the root
// dictionary and every namespace (see __tests__/i18n/messageRegistry.test.ts),
// so the order never changes which copy a key resolves to.
const registeredDictionaries: SourceMessages[] = [];

/**
 * Makes `messages` available to `t()` in this bundle and returns it.
 * Registering the same dictionary again does nothing.
 */
export function registerSourceMessages<Messages extends SourceMessages>(
  messages: Messages
): Messages {
  if (!registeredDictionaries.includes(messages)) {
    registeredDictionaries.push(messages);
  }
  return messages;
}

/** The registered en-US copy for `key`, or `undefined` if none is registered. */
export function getSourceMessage(key: string): string | undefined {
  for (const dictionary of registeredDictionaries) {
    const message = dictionary[key];
    if (typeof message === "string") {
      return message;
    }
  }
  return undefined;
}
