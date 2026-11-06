import { registerSourceMessages } from "@/i18n/messageRegistry";
import { EN_US_MESSAGES } from "@/i18n/messages/en-US.complete";

// Server rendering, SSR of client components, Jest and webpack builds register
// the complete en-US dictionary, so server output never depends on which
// namespaces a page imports. Turbopack browser bundles resolve
// `./sourceMessages.browser.ts` instead (see `turbopack.resolveAlias` in
// config/nextConfig.ts). Import this module only as `@/i18n/sourceMessages`
// so the alias applies.
registerSourceMessages(EN_US_MESSAGES);

/** Every key is registered here, so a missing key is a bug. */
export function resolveMissingSourceMessage(key: string): string {
  throw new Error(`Missing source message for key: ${key}`);
}
