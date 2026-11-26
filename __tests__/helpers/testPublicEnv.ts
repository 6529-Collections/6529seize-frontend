import type { PublicEnv } from "@/config/env.schema";

/**
 * Overrides `publicEnv` values for a test. The test file mocks
 * `@/config/env` so `publicEnv` merges them in:
 *
 * jest.mock("@/config/env", () => {
 *   const actual = jest.requireActual("@/config/env");
 *   return {
 *     ...actual,
 *     get publicEnv() {
 *       return {
 *         ...actual.publicEnv,
 *         ...(globalThis as { __testPublicEnv?: object }).__testPublicEnv,
 *       };
 *     },
 *   };
 * });
 */
export function setTestPublicEnv(values: Partial<PublicEnv>): void {
  (globalThis as { __testPublicEnv?: Partial<PublicEnv> }).__testPublicEnv =
    values;
}
