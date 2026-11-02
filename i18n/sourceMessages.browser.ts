import { registerSourceMessages } from "@/i18n/messageRegistry";
import { EN_US_ROOT_MESSAGES } from "@/i18n/messages/en-US";

// Turbopack browser bundles resolve `@/i18n/sourceMessages` to this file (see
// `turbopack.resolveAlias` in config/nextConfig.ts). Every page bundles the
// root dictionary; a feature namespace from `@/i18n/namespaces` registers
// itself when a module that imports it loads. The exports mirror
// `./sourceMessages.ts`.
registerSourceMessages(EN_US_ROOT_MESSAGES);

// The initial load plus one retry per page load. A Turbopack chunk that
// failed usually keeps failing until the page reloads.
const MAX_COMPLETE_DICTIONARY_LOADS = 2;

const reportedKeys = new Set<string>();
let completeDictionaryLoads = 0;
let completeDictionaryLoad: Promise<unknown> | null = null;

function loadCompleteDictionary(): void {
  if (
    completeDictionaryLoad !== null ||
    completeDictionaryLoads >= MAX_COMPLETE_DICTIONARY_LOADS
  ) {
    return;
  }
  completeDictionaryLoads += 1;
  completeDictionaryLoad = import("@/i18n/messages/en-US.complete").then(
    (module) => registerSourceMessages(module.EN_US_MESSAGES),
    () => {
      completeDictionaryLoad = null;
    }
  );
}

function reportUnregisteredKey(key: string): void {
  if (reportedKeys.has(key)) {
    return;
  }
  reportedKeys.add(key);
  console.error(
    `[i18n] No en-US source message is registered for "${key}". Import its namespace from @/i18n/namespaces in the module that uses it.`
  );
  // Loaded only on a miss, so the monitoring code stays out of every page.
  import("@/utils/monitoring/i18nMonitoring")
    .then((module) => module.reportUnregisteredMessageKey(key))
    .catch(() => undefined);
}

/**
 * A key whose namespace this bundle has not registered: the module that uses
 * it does not import its `@/i18n/namespaces` module. Report it once, render no
 * text rather than a raw key, and load the complete dictionary so copy that
 * renders later is complete.
 *
 * This deliberately differs from the server, which registers every key and
 * throws for an unknown one. A key that reaches this function was rendered
 * with its copy on the server, so during hydration the empty text mismatches
 * the server HTML and React re-renders that subtree on the client. Every
 * browser module must therefore import the namespaces whose keys it names;
 * `__tests__/i18n/messageNamespaces.test.ts` enforces that statically, and
 * this path is only the safety net for a key that slips through.
 */
export function resolveMissingSourceMessage(key: string): string {
  reportUnregisteredKey(key);
  loadCompleteDictionary();
  return "";
}
