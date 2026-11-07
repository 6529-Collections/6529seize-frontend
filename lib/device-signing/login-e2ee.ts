import { isE2eeEnabled } from "@/config/e2eeEnv";
import type { PreparedLoginE2eeDevice } from "@/lib/e2ee/login-device";
import { isAnyDeviceGrantPossible } from "./login-grant";
import { withinTimeBudget } from "./time-budget";

/**
 * NC8: folds the encrypted-messages device grant into the sign-in grant.
 * The first sign-in on a browser can download the MLS module, so the key is
 * prepared within a budget; past it the sign-in grants signing only and
 * encrypted messages keep their own grant prompt.
 */
export type LoginE2eeDevice = PreparedLoginE2eeDevice;

/**
 * The module download starts when the wallet modal opens or a wallet
 * connects (prefetchLoginE2eeDevice), so by sign-in it is usually ready and
 * this wait is near zero. The budget only bounds a slow or stuck download:
 * at most this long before the signature request, never a blocked sign-in.
 */
const PREPARE_BUDGET_MS = 5000;
/**
 * "Turn on encrypted messages" waits longer: the user asked for the key, and
 * the separate grant prompt it would fall back to needs the same module.
 */
const TURN_ON_PREPARE_BUDGET_MS = 15_000;

const canHoldE2eeDevice = (): boolean =>
  isE2eeEnabled() &&
  typeof WebAssembly === "object" &&
  typeof globalThis.indexedDB !== "undefined";

let prefetching: Promise<void> | null = null;

/**
 * Starts loading the MLS module and the code that creates the key before a
 * sign-in needs them, so the budget is rarely reached. Only sessions that can
 * ask for a combined grant (a website sign-in or an app grant in 6529 Mobile
 * and Desktop) download it here. Never throws; a failed download is retried
 * on the next call.
 */
export function prefetchLoginE2eeDevice(): void {
  if (prefetching || !canHoldE2eeDevice() || !isAnyDeviceGrantPossible(null)) {
    return;
  }
  prefetching = import("@/lib/e2ee/login-device")
    .then(({ preloadLoginE2eeDevice }) => preloadLoginE2eeDevice())
    .catch(() => {
      prefetching = null;
    });
}

/** Never throws: any problem means a sign-in that grants signing only. */
export async function prepareLoginE2eeDevice({
  required = false,
}: {
  /** The sign-in is for turning on encrypted messages. */
  readonly required?: boolean | undefined;
} = {}): Promise<LoginE2eeDevice | null> {
  if (!canHoldE2eeDevice()) {
    return null;
  }
  const task = import("@/lib/e2ee/login-device").then(
    async ({ createLoginE2eeDevice }) => await createLoginE2eeDevice()
  );
  try {
    const device = await withinTimeBudget(
      task,
      required ? TURN_ON_PREPARE_BUDGET_MS : PREPARE_BUDGET_MS
    );
    if (!device) {
      // Too slow for this sign-in; release the key if it arrives later.
      task.then((late) => late.dispose()).catch(() => undefined);
    }
    return device;
  } catch {
    return null;
  }
}

export const toE2eeNonceParams = (
  device: LoginE2eeDevice
): { readonly mls_device_key: string; readonly mls_ciphersuite: string } => ({
  mls_device_key: device.deviceKeyHex,
  mls_ciphersuite: String(device.ciphersuite),
});
