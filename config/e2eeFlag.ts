/**
 * Pure flag parsing for end-to-end encrypted messages (D109). Kept free of
 * runtime env imports so `config/nextConfig.ts` can use it while building
 * security headers from the build-time env.
 *
 * The flag is on only when the baked value is exactly "true". Any other value,
 * including unset, keeps the feature off (production default).
 */
export function isE2eeFlagEnabled(value: unknown): boolean {
  return value === "true";
}
