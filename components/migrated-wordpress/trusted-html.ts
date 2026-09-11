import type { MigratedWordPressTrustedHtml } from "./types";

/**
 * The only constructor for MigratedWordPressTrustedHtml, the type the
 * migrated-wordpress renderer accepts at its dangerouslySetInnerHTML sink.
 *
 * The generic constraint rejects values typed as plain `string` (anything
 * that flowed in at runtime — CMS fields, fetch responses, user input) and
 * only accepts compile-time string literals authored in this repository,
 * so the "raw HTML string reaches the DOM" contract cannot silently widen
 * to runtime data. If a future migration needs runtime HTML, it must go
 * through a real sanitizer instead of this helper.
 */
export function migratedWordPressTrustedHtml<T extends string>(
  html: string extends T ? never : T
): MigratedWordPressTrustedHtml {
  return html as unknown as MigratedWordPressTrustedHtml;
}
