/**
 * The culture context (time zone, locale, calendar) is never sent: the app
 * lets people choose which time zone others see.
 */
export function withoutCultureContext<T extends Record<string, unknown>>(
  contexts: T
): T {
  const rest: Record<string, unknown> = { ...contexts };
  delete rest["culture"];
  return rest as T;
}
