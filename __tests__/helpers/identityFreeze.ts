/**
 * Sets NEXT_PUBLIC_IDENTITY_FREEZE_AT for a test. The test file mocks
 * `@/config/env` so `publicEnv` reads it from here:
 *
 * jest.mock("@/config/env", () => {
 *   const actual = jest.requireActual("@/config/env");
 *   return {
 *     ...actual,
 *     get publicEnv() {
 *       return {
 *         ...actual.publicEnv,
 *         NEXT_PUBLIC_IDENTITY_FREEZE_AT: (
 *           globalThis as { __identityFreezeAt?: string }
 *         ).__identityFreezeAt,
 *       };
 *     },
 *   };
 * });
 */
export function setIdentityFreezeAt(value: string | undefined): void {
  (globalThis as { __identityFreezeAt?: string | undefined }).__identityFreezeAt =
    value;
}

/**
 * Sets NEXT_PUBLIC_IDENTITY_SWITCH_ON_AT for a test, read the same way as
 * `__identityFreezeAt` above, from `__identitySwitchOnAt`.
 */
export function setIdentitySwitchOnAt(value: string | undefined): void {
  (
    globalThis as { __identitySwitchOnAt?: string | undefined }
  ).__identitySwitchOnAt = value;
}
