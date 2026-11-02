import { isLocalDevAuthTestSeamEnabled } from "@/services/auth/devAuthTestOverride";

type TypedDataInput = {
  readonly domain: object;
  readonly types: object;
  readonly primaryType: string;
  readonly message: object;
};

type E2eeTestSigner = (typedData: TypedDataInput) => Promise<string>;

/** Name of the page global a local browser test may install. */
export const E2EE_TEST_SIGNER_GLOBAL = "__e2eeTestSignTypedData";

/**
 * Local browser-test seam for the single wallet signature of enrollment.
 * Dev-auth sessions have no connected wallet, so multi-user Playwright tests
 * install a per-browser signer backed by a throwaway test key. It is used only
 * under the same gate as the dev-auth test override (USE_DEV_AUTH, a
 * development-like build, localhost); everywhere else this returns null and
 * the real wallet signs.
 */
export function getE2eeTestSigner(): E2eeTestSigner | null {
  if (!isLocalDevAuthTestSeamEnabled()) {
    return null;
  }
  const candidate: unknown = Reflect.get(globalThis, E2EE_TEST_SIGNER_GLOBAL);
  if (typeof candidate !== "function") {
    return null;
  }
  return async (typedData) => {
    const signature: unknown = await Reflect.apply(candidate, globalThis, [
      typedData,
    ]);
    if (typeof signature !== "string") {
      throw new TypeError("E2EE test signer returned no signature");
    }
    return signature;
  };
}
