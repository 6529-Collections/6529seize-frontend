import { registerSourceMessages } from "@/i18n/messageRegistry";
import { EN_US_ROOT_MESSAGES } from "@/i18n/messages/en-US";

// Turbopack browser bundles resolve `@/i18n/sourceMessages` to this file (see
// `turbopack.resolveAlias` in config/nextConfig.ts). Every page bundles the
// root dictionary; a feature namespace from `@/i18n/namespaces` registers
// itself when a module that imports it loads. The exports mirror
// `./sourceMessages.ts`.
registerSourceMessages(EN_US_ROOT_MESSAGES);

const reportedKeys = new Set<string>();
let completeDictionaryLoad: Promise<unknown> | null = null;

function loadCompleteDictionary(): void {
  completeDictionaryLoad ??= import("@/i18n/messages/en-US.complete").then(
    (module) => registerSourceMessages(module.EN_US_MESSAGES),
    () => {
      // Ask again on the next miss. A Turbopack chunk that failed usually
      // keeps failing until the page reloads.
      completeDictionaryLoad = null;
    }
  );
}

/**
 * A key whose namespace this bundle has not registered: the module that uses
 * it does not import its `@/i18n/namespaces` module. Report it once, render no
 * text rather than a raw key, and load the complete dictionary so copy that
 * renders later is complete.
 */
export function resolveMissingSourceMessage(key: string): string {
  if (!reportedKeys.has(key)) {
    reportedKeys.add(key);
    console.error(
      `[i18n] No en-US source message is registered for "${key}". Import its namespace from @/i18n/namespaces in the module that uses it.`
    );
  }
  loadCompleteDictionary();
  return "";
}
