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

import {
  assertLocalSandboxBaseURL,
  dismissNextDevTools,
  getSandboxApiOrigin,
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
// Mirror services/auth/devAuthTestOverride.ts and components/e2ee/
// e2eeTestSigner.ts; kept literal so the test process never loads the app's
// runtime env config.
const DEV_AUTH_TEST_WALLET_KEY = "6529-dev-auth-test-wallet";
const DEV_AUTH_TEST_JWT_KEY = "6529-dev-auth-test-jwt";
const TEST_SIGNER_GLOBAL = "__e2eeTestSignTypedData";

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
  /** Wallet signature prompts answered in this browser (enrollment). */
  signatureCount(): number;
  close(): Promise<void>;
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
    async (typedData: Parameters<PrivateKeyAccount["signTypedData"]>[0]) => {
      signatures += 1;
      return user.account.signTypedData(typedData);
    }
  );
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

export async function gotoEncrypted(page: Page, path = "/messages/encrypted") {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await dismissNextDevTools(page);
}
