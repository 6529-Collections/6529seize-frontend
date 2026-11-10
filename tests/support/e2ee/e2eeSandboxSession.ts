import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  Page,
  TestInfo,
} from "@playwright/test";
import { expect } from "@playwright/test";
import {
  generatePrivateKey,
  privateKeyToAccount,
  type PrivateKeyAccount,
} from "viem/accounts";

import { grantTypedData } from "./fakeDeliveryService.cjs";
import {
  assertLocalSandboxBaseURL,
  dismissNextDevTools,
  getSandboxApiOrigin,
  hideNextDevOverlay,
  installLocalSandboxBrowserMutationGuard,
  type LocalSandboxBrowserMutationGuard,
} from "../localSandbox";
import {
  assertNoPageErrors,
  attachPageDiagnostics,
  type PageDiagnostics,
} from "../pageAssertions";

/**
 * Multi-user helpers for the local E2EE sandbox (D109). Each user gets a
 * browser context with its own storage, a dev-auth wallet and synthetic JWT
 * (through the localhost-only dev-auth test override) and a throwaway viem
 * key that answers the single enrollment signature. Keys are generated per
 * run and never leave the test process.
 */

export type E2eeUserKey = "alice" | "bob" | "carol" | "dave";

export interface E2eeSandboxUser {
  readonly key: E2eeUserKey;
  readonly profileId: string;
  readonly wallet: string;
  readonly account: PrivateKeyAccount;
}

export type E2eeSandboxUsers = Readonly<Record<E2eeUserKey, E2eeSandboxUser>>;

/** Generous: the sandbox has no WebSocket, so engines poll (5 s / 30 s). */
export const E2EE_SYNC_TIMEOUT_MS = 75_000;
export const E2EE_UI_TIMEOUT_MS = 30_000;

const USER_KEYS: readonly E2eeUserKey[] = ["alice", "bob", "carol", "dave"];
// Mirror services/auth/devAuthTestOverride.ts, components/e2ee/
// e2eeTestSigner.ts and components/auth/signedMessagesTestSigner.ts; kept
// literal so the test process never loads the app's runtime env config.
const DEV_AUTH_TEST_WALLET_KEY = "6529-dev-auth-test-wallet";
const DEV_AUTH_TEST_JWT_KEY = "6529-dev-auth-test-jwt";
const TEST_SIGNER_GLOBAL = "__e2eeTestSignTypedData";
const SIGNED_MESSAGES_TEST_SIGNER_GLOBAL = "__signedMessagesTestSignMessage";

const encodeJwtPart = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

/** Same synthetic, unsigned shape as the composer sandbox dev JWT. */
export function buildSyntheticJwt(wallet: string): string {
  return [
    encodeJwtPart({ alg: "none", typ: "JWT" }),
    encodeJwtPart({
      id: `local-e2ee-sandbox-${wallet.toLowerCase()}`,
      sub: wallet.toLowerCase(),
      iat: 1760000000,
      exp: 2000000000,
      role: "",
    }),
    "",
  ].join(".");
}

async function control<T>(
  baseURL: string | undefined,
  name: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(
    `${getSandboxApiOrigin(baseURL)}/__e2ee-sandbox/${name}`,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
  );
  const json = (await response.json()) as T;
  expect(response.ok, `E2EE sandbox control ${name}`).toBe(true);
  return json;
}

/** Fresh delivery service and four users with freshly generated wallets. */
export async function resetE2eeSandbox(
  baseURL: string | undefined
): Promise<E2eeSandboxUsers> {
  assertLocalSandboxBaseURL(baseURL);
  const accounts = Object.fromEntries(
    USER_KEYS.map((key) => [key, privateKeyToAccount(generatePrivateKey())])
  ) as Record<E2eeUserKey, PrivateKeyAccount>;
  const result = await control<{
    users: { key: E2eeUserKey; profileId: string; wallet: string }[];
  }>(baseURL, "reset", {
    wallets: Object.fromEntries(
      USER_KEYS.map((key) => [key, accounts[key].address.toLowerCase()])
    ),
  });
  const users = Object.fromEntries(
    result.users.map((user) => [
      user.key,
      { ...user, account: accounts[user.key] },
    ])
  ) as Record<E2eeUserKey, E2eeSandboxUser>;
  for (const key of USER_KEYS) {
    expect(users[key]?.profileId, `sandbox user ${key}`).toBeTruthy();
  }
  return users;
}

export const e2eeSandboxControls = {
  setDmPolicy: (
    baseURL: string | undefined,
    user: E2eeUserKey,
    policy: "EVERYONE" | "PEOPLE_I_FOLLOW" | "NOBODY"
  ) => control(baseURL, "policy", { user, dm_policy: policy }),
  block: (
    baseURL: string | undefined,
    blocker: E2eeUserKey,
    blocked: E2eeUserKey
  ) => control(baseURL, "block", { blocker, blocked, on: true }),
  /** Fails matching e2ee requests (all callers) until cleared. */
  addFault: (
    baseURL: string | undefined,
    fault: {
      readonly method: string;
      readonly path: string;
      readonly kind?: "commit" | "proposal";
      readonly status?: number;
    }
  ) => control(baseURL, "fault", fault),
  clearFaults: (baseURL: string | undefined) =>
    control<{ hits: number }>(baseURL, "clear-faults", {}),
  /** Serves a forged epoch_fp on messages to `viewer` (split view). */
  tamperEpochFp: (baseURL: string | undefined, viewer: E2eeUserKey | null) =>
    control(baseURL, "tamper", viewer ? { mode: "epoch_fp", viewer } : {}),
  state: (baseURL: string | undefined) =>
    control<E2eeSandboxState>(baseURL, "state"),
  plaintextScan: (baseURL: string | undefined, needles: readonly string[]) =>
    control<{
      scannedSources: number;
      scannedBytes: number;
      found: string[];
      foundInReports: string[];
    }>(baseURL, "plaintext-scan", { needles }),
  /**
   * D172: the server half of an earlier-suite device. The registered device
   * gets `grant` (v1, 0x004F, same key) after the server verifies its
   * wallet signature, and loses its KeyPackages. Returns the grant id.
   */
  legacySuiteDevice: (
    baseURL: string | undefined,
    user: E2eeUserKey,
    grant: LegacyGrant,
    walletSignature: string
  ) =>
    control<{ grant_id: string }>(baseURL, "legacy-suite-device", {
      user,
      grant,
      wallet_signature: walletSignature,
    }),
  /** D172: closes (false) or reopens the v1-grant transition window. */
  suiteWindow: (baseURL: string | undefined, open: boolean) =>
    control(baseURL, "suite-window", { open }),
};

export interface E2eeSandboxState {
  readonly groups: {
    readonly group: string;
    readonly epoch: number;
    readonly roster: { device_key: string; profile_id: string }[];
    readonly items: { seq: number; type: string; kind: string | null }[];
  }[];
  readonly devices: {
    device_key: string;
    profile_id: string;
    revoked_at: number | null;
  }[];
  readonly reports: {
    verified: boolean;
    sender_profile_id: string | null;
    reporter_profile_id: string;
    reason: string;
    body: string;
  }[];
  readonly notify: {
    group: string;
    sender_profile_id: string;
    hints: { profile_id: string; kind: string }[];
  }[];
}

/** The project's device emulation (viewport, touch, UA) for extra contexts. */
function deviceOptions(testInfo: TestInfo): BrowserContextOptions {
  const use = testInfo.project.use;
  const options: BrowserContextOptions = {};
  if (use.viewport !== undefined) options.viewport = use.viewport;
  if (use.userAgent !== undefined) options.userAgent = use.userAgent;
  if (use.deviceScaleFactor !== undefined)
    options.deviceScaleFactor = use.deviceScaleFactor;
  if (use.isMobile !== undefined) options.isMobile = use.isMobile;
  if (use.hasTouch !== undefined) options.hasTouch = use.hasTouch;
  if (use.locale !== undefined) options.locale = use.locale;
  return options;
}

export interface E2eeUserSession {
  readonly user: E2eeSandboxUser;
  readonly label: string;
  readonly context: BrowserContext;
  readonly page: Page;
  /**
   * Wallet signature prompts answered in this browser: the combined sign-in
   * (personal_sign) or a separate encryption grant (typed data).
   */
  signatureCount(): number;
  /**
   * Test-only: the next wallet signature prompt in this browser is declined,
   * as a wallet's "Reject" would (EIP-1193 code 4001). Off by default; one
   * prompt only.
   */
  rejectNextSignature(): void;
  close(): Promise<void>;
}

/** What a wallet's "Reject" throws (viem's UserRejectedRequestError shape). */
function walletRejection(): Error {
  const error = new Error("User rejected the request.");
  error.name = "UserRejectedRequestError";
  return Object.assign(error, { code: 4001 });
}

/**
 * Opens a browser for `user` with its own storage (a new device). Closing
 * the session loses that device's local state, like clearing site data.
 */
export async function openE2eeUser(
  browser: Browser,
  testInfo: TestInfo,
  baseURL: string | undefined,
  user: E2eeSandboxUser,
  label: string = user.key
): Promise<E2eeUserSession> {
  assertLocalSandboxBaseURL(baseURL);
  const context = await browser.newContext({
    ...deviceOptions(testInfo),
    ...(baseURL === undefined ? {} : { baseURL }),
  });
  let signatures = 0;
  let rejectNext = false;
  const answer = <T>(sign: () => Promise<T>): Promise<T> => {
    if (rejectNext) {
      rejectNext = false;
      return Promise.reject(walletRejection());
    }
    signatures += 1;
    return sign();
  };
  await context.addInitScript(
    ({ walletKey, jwtKey, wallet, jwt }) => {
      globalThis.localStorage.setItem(walletKey, wallet);
      globalThis.localStorage.setItem(jwtKey, jwt);
    },
    {
      walletKey: DEV_AUTH_TEST_WALLET_KEY,
      jwtKey: DEV_AUTH_TEST_JWT_KEY,
      wallet: user.wallet,
      jwt: buildSyntheticJwt(user.wallet),
    }
  );
  await context.exposeFunction(
    TEST_SIGNER_GLOBAL,
    async (typedData: Parameters<PrivateKeyAccount["signTypedData"]>[0]) =>
      answer(() => user.account.signTypedData(typedData))
  );
  await context.exposeFunction(
    SIGNED_MESSAGES_TEST_SIGNER_GLOBAL,
    async (message: string) =>
      answer(() => user.account.signMessage({ message }))
  );
  await hideNextDevOverlay(context);
  const guard: LocalSandboxBrowserMutationGuard =
    await installLocalSandboxBrowserMutationGuard(context, baseURL);
  const page = await context.newPage();
  const diagnostics: PageDiagnostics = attachPageDiagnostics(page);
  return {
    user,
    label,
    context,
    page,
    signatureCount: () => signatures,
    rejectNextSignature: () => {
      rejectNext = true;
    },
    async close() {
      guard.assertNoBlockedMutations();
      assertNoPageErrors(diagnostics);
      await context.close();
    },
  };
}

/** Closes every session, reporting the first guard or page-error failure. */
export async function closeE2eeUsers(
  sessions: readonly (E2eeUserSession | undefined)[]
): Promise<void> {
  const errors: unknown[] = [];
  for (const session of sessions) {
    if (!session) {
      continue;
    }
    try {
      await session.close();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) {
    throw errors[0];
  }
}

/** IndexedDB names of the engine's storage (lib/e2ee/storage.ts). */
const E2EE_DB = { name: "6529-e2ee", devices: "devices" } as const;

/** A grant as signed before grant v2 (D172): one suite, 0x004F. */
interface LegacyGrant {
  readonly wallet: string;
  readonly device_key: string;
  readonly ciphersuite: number;
  readonly issued_at: number;
  readonly expires_at: number;
  readonly origin: string;
}

interface StoredDeviceFields {
  readonly deviceKey: string;
  readonly grant: { readonly wallet: string; readonly origin: string };
}

/**
 * Reads this browser's stored device; with `change`, rewrites it to the v1
 * device in the same IndexedDB transaction.
 */
function updateStoredDevice(
  page: Page,
  profileId: string,
  change: {
    grant: LegacyGrant;
    grantId: string;
    walletSignature: string;
  } | null
): Promise<StoredDeviceFields | null> {
  return page.evaluate(
    async ({ db: names, profileId: id, change: update }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(names.name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(new Error(`IndexedDB open: ${String(request.error)}`));
      });
      try {
        return await new Promise<StoredDeviceFields | null>(
          (resolve, reject) => {
            const tx = db.transaction(
              names.devices,
              update ? "readwrite" : "readonly"
            );
            const store = tx.objectStore(names.devices);
            const read = store.get(id);
            let found: StoredDeviceFields | null = null;
            read.onsuccess = () => {
              const device = read.result as
                | (StoredDeviceFields & Record<string, unknown>)
                | undefined;
              if (!device) {
                return;
              }
              found = device;
              if (update) {
                // The v1 device: its grant, grant id and signature; no
                // combined sign-in grant id.
                const { loginGrantId: _login, ...rest } = device;
                store.put({
                  ...rest,
                  grant: update.grant,
                  grantId: update.grantId,
                  walletSignature: update.walletSignature,
                });
              }
            };
            tx.oncomplete = () => resolve(found);
            tx.onerror = () =>
              reject(new Error(`IndexedDB write: ${String(tx.error)}`));
          }
        );
      } finally {
        db.close();
      }
    },
    { db: E2EE_DB, profileId, change }
  );
}

/**
 * D172 seed: makes this browser's enrolled device one from before grant v2,
 * then reloads. The same device key gets a v1 grant for 0x004F signed by the
 * user's wallet (outside the browser, so no prompt is counted); the server
 * verifies it, and the stored device gets the same grant, grant id and
 * signature. On start the engine retires it: its conversations turn
 * read-only ("superseded"), `getUpgrade()` counts them and the device needs
 * one signature. Call it after the user enrolled, with no other tab of this
 * browser open.
 *
 * The browser runs only the current engine. It retires an earlier device at
 * start and makes groups on 0x004E only, which the server never admits a v1
 * device to, so a browser cannot enroll a v1 device before its conversations.
 * Here the conversations come first and their member credentials keep the
 * v2 grant id; after the move they are only read, never verified again. The
 * Jest suite (engine.suite-upgrade) enrolls genuine earlier devices on the
 * earlier engine, with their own 0x004F conversations, and checks those.
 */
export async function seedLegacySuiteBrowser(
  session: E2eeUserSession,
  baseURL: string | undefined
): Promise<void> {
  const stored = await updateStoredDevice(
    session.page,
    session.user.profileId,
    null
  );
  if (!stored) {
    throw new Error(`${session.label}: no stored encrypted-messages device`);
  }
  // Issued now for 30 days, ending on a whole minute like every grant.
  const issuedAt = Math.floor(Date.now() / 1000);
  const grant: LegacyGrant = {
    wallet: stored.grant.wallet.toLowerCase(),
    device_key: stored.deviceKey.toLowerCase(),
    ciphersuite: 0x004f,
    issued_at: issuedAt,
    expires_at: (Math.floor(issuedAt / 60) + 30 * 24 * 60) * 60,
    origin: stored.grant.origin,
  };
  const walletSignature = (
    await session.user.account.signTypedData(
      grantTypedData(grant) as Parameters<PrivateKeyAccount["signTypedData"]>[0]
    )
  ).toLowerCase();
  const { grant_id: grantId } = await e2eeSandboxControls.legacySuiteDevice(
    baseURL,
    session.user.key,
    grant,
    walletSignature
  );
  const rewritten = await updateStoredDevice(
    session.page,
    session.user.profileId,
    { grant, grantId, walletSignature }
  );
  expect(
    rewritten,
    `${session.label}: stored encrypted-messages device`
  ).not.toBeNull();
  await session.page.reload({ waitUntil: "domcontentloaded" });
  await dismissNextDevTools(session.page);
}

export async function gotoEncrypted(page: Page, path = "/messages/encrypted") {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await dismissNextDevTools(page);
}
