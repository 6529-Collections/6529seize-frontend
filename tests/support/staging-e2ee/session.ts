import { randomBytes } from "node:crypto";

import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  ConsoleMessage,
  Page,
  Response,
  TestInfo,
} from "@playwright/test";
import { expect } from "@playwright/test";

import {
  installStagingAccessUnlock,
  seedStagingAccessCookie,
} from "../../testHelpers";
import { attachRedactedTextArtifact } from "../artifactRedaction";
import {
  decideReadonlyRequest,
  sanitizeReadonlyRequestUrl,
} from "../readonlyMutationGuard";
import {
  installScriptedWallet,
  type InstalledScriptedWallet,
  SCRIPTED_WALLET_NAME,
  SCRIPTED_WALLET_RDNS,
  ScriptedWalletKey,
} from "../scriptedWallet";
import { E2eeNetworkEvidence } from "./evidence";

/**
 * Real users on staging.6529.io for the opt-in E2EE pack (D109). Each user
 * is a fresh throwaway wallet that signs in through the app's own connect
 * modal, gets a clearly test-only profile, and turns on encrypted messages
 * with its own wallet signature. Each session is a separate browser context:
 * a separate device with its own IndexedDB.
 */

export const STAGING_ORIGIN = "https://staging.6529.io";
const STAGING_API_ORIGIN = "https://api.staging.6529.io";
export const ENCRYPTED_ROUTE = "/messages/encrypted";

/** First visit: route chunks, the 1.7 MB MLS WebAssembly module, key setup. */
export const FIRST_LOAD_TIMEOUT_MS = 120_000;
export const UI_TIMEOUT_MS = 45_000;
/** Delivery normally wakes over WebSocket; engines also poll every few s. */
export const SYNC_TIMEOUT_MS = 90_000;
/** Members add a person's new device after a random 5-30 s delay (8.4). */
export const DEVICE_ADD_TIMEOUT_MS = 30_000 + 2 * SYNC_TIMEOUT_MS;
const SIGN_IN_TIMEOUT_MS = 120_000;

/** Opt-in: set only by the `e2ee-staging` pack. */
export function stagingE2eeOptInProblem(
  baseURL: string | undefined
): string | null {
  if (process.env["PLAYWRIGHT_E2EE_STAGING"] !== "1") {
    return "Encrypted DM staging journey is opt-in: run the e2ee-staging pack (PLAYWRIGHT_E2EE_STAGING=1).";
  }
  if (baseURL !== STAGING_ORIGIN) {
    return `Encrypted DM staging journey runs only against ${STAGING_ORIGIN}, not ${baseURL ?? "an unset base URL"}.`;
  }
  return null;
}

export function hasStagingAccessCode(): boolean {
  return Boolean(
    process.env["PLAYWRIGHT_STAGING_ACCESS_CODE"] || process.env["STAGING_AUTH"]
  );
}

export interface StagingE2eeUser {
  readonly label: string;
  readonly key: ScriptedWalletKey;
  /** Profile handles allow 3-15 word characters; this one is 14. */
  readonly handle: string;
  profileId: string | null;
}

export function createThrowawayUser(label: string): StagingE2eeUser {
  return {
    label,
    key: ScriptedWalletKey.random(),
    handle: `e2eeqa_${randomBytes(8).toString("hex").slice(0, 7)}`,
    profileId: null,
  };
}

interface ConsoleEntry {
  readonly type: string;
  readonly text: string;
  readonly url: string;
}

export interface StagingE2eeSession {
  readonly user: StagingE2eeUser;
  /** "A", "B (second device)" and so on, for failure messages. */
  readonly label: string;
  readonly context: BrowserContext;
  readonly page: Page;
  readonly wallet: InstalledScriptedWallet;
  readonly evidence: E2eeNetworkEvidence;
  readonly console: ConsoleEntry[];
  readonly pageErrors: string[];
  /** Writes aimed at production 6529 hosts (must stay empty). */
  readonly productionWrites: string[];
  /** Third-party writes the guard dropped (telemetry and the like). */
  readonly droppedWrites: string[];
  /**
   * The sign-in challenge the wallet signed (the last session-nonce answer
   * before login), or null before signing in. NC8: when it is a combined
   * grant it also enrolled this browser for encrypted messages.
   */
  signInMessage: string | null;
  /**
   * Whether the wallet already had a profile when it signed in. A combined
   * sign-in grant (NC8) enrolls only such a wallet: a new wallet has no
   * profile to hold the key yet, so its sign-in grants signing only and the
   * enrollment button signs in once more with the combined grant.
   */
  hadProfileAtSignIn: boolean;
  /** The id of the device grant the latest sign-in stored, if any. */
  signInGrantId: string | null;
  close(): Promise<void>;
}

const PRODUCTION_6529_HOSTS = new Set([
  "6529.io",
  "www.6529.io",
  "api.6529.io",
]);
const STAGING_FIRST_PARTY_HOST = /(?:^|\.)staging\.6529\.io$/u;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * This pack writes throwaway data to staging, so the read-only guard is off.
 * In its place: staging first-party writes pass, writes to production 6529
 * hosts are dropped and fail the run, and other third-party writes follow
 * the read-only guard's telemetry and RPC classification and are dropped
 * unless known to be read-only.
 */
async function installStatefulStagingGuard(
  context: BrowserContext,
  productionWrites: string[],
  droppedWrites: string[]
): Promise<void> {
  await context.route("**/*", async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    if (SAFE_METHODS.has(method)) {
      await route.continue();
      return;
    }
    let hostname = "";
    try {
      hostname = new URL(request.url()).hostname;
    } catch {
      await route.continue();
      return;
    }
    const label = `${method} ${sanitizeReadonlyRequestUrl(request.url())}`;
    if (STAGING_FIRST_PARTY_HOST.test(hostname)) {
      await route.continue();
      return;
    }
    if (PRODUCTION_6529_HOSTS.has(hostname)) {
      productionWrites.push(label);
      await route.abort("blockedbyclient");
      return;
    }
    const decision = decideReadonlyRequest({
      baseURL: STAGING_ORIGIN,
      method,
      postData: request.postData(),
      readonly: true,
      url: request.url(),
    });
    if (decision.action === "allow") {
      await route.continue();
      return;
    }
    droppedWrites.push(`${label} (${decision.reason})`);
    await route.abort("blockedbyclient");
  });
}

/** The project's device emulation for extra contexts. */
function deviceOptions(testInfo: TestInfo): BrowserContextOptions {
  const use = testInfo.project.use;
  return {
    ...(use.viewport === undefined ? {} : { viewport: use.viewport }),
    ...(use.userAgent === undefined ? {} : { userAgent: use.userAgent }),
    ...(use.deviceScaleFactor === undefined
      ? {}
      : { deviceScaleFactor: use.deviceScaleFactor }),
    ...(use.isMobile === undefined ? {} : { isMobile: use.isMobile }),
    ...(use.hasTouch === undefined ? {} : { hasTouch: use.hasTouch }),
    ...(use.locale === undefined ? {} : { locale: use.locale }),
  };
}

function recordConsole(entries: ConsoleEntry[], message: ConsoleMessage) {
  const type = message.type();
  if (type !== "error" && type !== "warning") {
    return;
  }
  entries.push({ type, text: message.text(), url: message.location().url });
}

/** A new browser context for `user`: one more device of that person. */
export async function openStagingSession(
  browser: Browser,
  testInfo: TestInfo,
  user: StagingE2eeUser,
  label: string
): Promise<StagingE2eeSession> {
  const context = await browser.newContext({
    ...deviceOptions(testInfo),
    baseURL: STAGING_ORIGIN,
  });
  const productionWrites: string[] = [];
  const droppedWrites: string[] = [];
  const consoleEntries: ConsoleEntry[] = [];
  const pageErrors: string[] = [];
  try {
    await seedStagingAccessCookie(context, STAGING_ORIGIN);
    await installStatefulStagingGuard(context, productionWrites, droppedWrites);
    const wallet = await installScriptedWallet(context, user.key);
    const evidence = new E2eeNetworkEvidence(STAGING_ORIGIN);
    await evidence.attach(context);
    const page = await context.newPage();
    await installStagingAccessUnlock(page);
    evidence.watchPage(page);
    page.on("console", (message) => recordConsole(consoleEntries, message));
    page.on("pageerror", (error) => {
      pageErrors.push(error.stack ?? error.message);
    });
    return {
      user,
      label,
      context,
      page,
      wallet,
      evidence,
      console: consoleEntries,
      pageErrors,
      productionWrites,
      droppedWrites,
      signInMessage: null,
      hadProfileAtSignIn: false,
      signInGrantId: null,
      close: () => context.close(),
    };
  } catch (error) {
    await context.close();
    throw error;
  }
}

export async function gotoStaging(page: Page, path: string) {
  return await page.goto(path, { waitUntil: "domcontentloaded" });
}

const ENCRYPTED_ROUTE_TITLE = /Encrypted messages/u;
const ENCRYPTED_COPY = /encrypted messages/iu;

/**
 * Whether this staging deployment serves the encrypted messages routes. With
 * NEXT_PUBLIC_E2EE_DM_ENABLED off the page 404s; builds without the feature
 * (main, production) resolve the path as an ordinary `/messages/[wave]`
 * thread instead. Only the feature's own page carries its title and copy.
 */
export async function probeEncryptedRoute(
  browser: Browser,
  testInfo: TestInfo
): Promise<{ readonly available: boolean; readonly detail: string }> {
  const context = await browser.newContext({
    ...deviceOptions(testInfo),
    baseURL: STAGING_ORIGIN,
  });
  try {
    await seedStagingAccessCookie(context, STAGING_ORIGIN);
    const page = await context.newPage();
    await installStagingAccessUnlock(page);
    const response = await gotoStaging(page, ENCRYPTED_ROUTE);
    const status = response?.status() ?? null;
    const path = new URL(page.url()).pathname;
    const copy = page.getByText(ENCRYPTED_COPY).first();
    const looksEncrypted = async () =>
      ENCRYPTED_ROUTE_TITLE.test(await page.title()) ||
      (await copy.isVisible().catch(() => false));
    let found = await looksEncrypted();
    for (
      const deadline = Date.now() + 20_000;
      !found && status === 200 && Date.now() < deadline;
      found = await looksEncrypted()
    ) {
      await page.waitForTimeout(500);
    }
    return {
      available: status === 200 && path === ENCRYPTED_ROUTE && found,
      detail: `HTTP ${status ?? "none"}, path ${path}, title "${await page.title()}"`,
    };
  } finally {
    await context.close();
  }
}

async function dismissCookieBanner(page: Page) {
  const reject = page.getByRole("button", { name: "Reject Non-Essential" });
  if (await reject.isVisible().catch(() => false)) {
    await reject.click();
  }
}

/** The device grant id a session-v2 login stored; never reads its tokens. */
async function storedGrantId(loginResponse: Response): Promise<string | null> {
  const body = (await loginResponse.json().catch(() => null)) as {
    device_grant?: { id?: unknown } | null;
  } | null;
  const id = body?.device_grant?.id;
  return typeof id === "string" ? id.toLowerCase() : null;
}

/**
 * Signs in through the app's own flow: the Connect button opens the wallet
 * modal, the scripted wallet is picked and approves the connection, then
 * signs the sign-in message, and the session-v2 login must succeed.
 */
export async function signInThroughWalletModal(session: StagingE2eeSession) {
  const { page, wallet } = session;
  session.hadProfileAtSignIn = Boolean(session.user.profileId);
  await gotoStaging(page, "/");
  await dismissCookieBanner(page);

  const login = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/auth/session-login",
    { timeout: SIGN_IN_TIMEOUT_MS }
  );
  // Awaited below; keep an earlier failure from leaving it unhandled.
  login.catch(() => undefined);
  let lastChallenge: string | null = null;
  // The challenge is parsed off the response event; awaited before use.
  let nonceParsed: Promise<void> = Promise.resolve();
  const onNonce = (response: Response) => {
    if (new URL(response.url()).pathname !== "/api/auth/session-nonce") {
      return;
    }
    nonceParsed = response
      .json()
      .then((body: { signable_message?: unknown }) => {
        if (typeof body.signable_message === "string") {
          lastChallenge = body.signable_message;
        }
      })
      .catch(() => undefined);
  };
  page.on("response", onNonce);
  await page.waitForLoadState("load");
  // Collapsed sidebars and the mobile header label it "Connect".
  const connect = page
    .getByRole("button", { name: /^Connect(?: Wallet)?$/u })
    .first();
  // AppKit lists EIP-6963 wallets by their rdns test id; fall back to name.
  const walletOption = page
    .getByTestId(`wallet-selector-${SCRIPTED_WALLET_RDNS}`)
    .or(page.getByRole("button", { name: SCRIPTED_WALLET_NAME }))
    .first();
  // A click before hydration is lost, and the first click lazy-loads the
  // wallet stack: click again only while the modal is still absent.
  await expect(async () => {
    if (!(await walletOption.isVisible())) {
      await connect.click({ timeout: 10_000 });
    }
    await expect(walletOption).toBeVisible({ timeout: 20_000 });
  }, `${session.label}: the wallet modal did not list the scripted "${SCRIPTED_WALLET_NAME}" (EIP-6963)`).toPass(
    { timeout: SIGN_IN_TIMEOUT_MS, intervals: [1_000] }
  );
  await walletOption.click();

  await expect
    .poll(() => wallet.isAuthorized(), {
      message: `${session.label}: the app never requested the scripted wallet's accounts`,
      timeout: UI_TIMEOUT_MS,
    })
    .toBe(true);

  // The app either asks for the signature itself or shows its sign-in modal.
  const signButton = page
    .getByRole("dialog", { name: "Sign in to 6529" })
    .getByRole("button", { name: "Sign message" });
  await expect
    .poll(
      async () =>
        wallet.count("personal_sign") > 0 ||
        (await signButton.isVisible().catch(() => false)),
      {
        message: `${session.label}: neither a sign-in signature request nor the sign-in modal appeared`,
        timeout: SIGN_IN_TIMEOUT_MS,
      }
    )
    .toBe(true);
  if (wallet.count("personal_sign") === 0) {
    await signButton.click();
  }

  const loginResponse = await login;
  page.off("response", onNonce);
  await nonceParsed;
  session.signInMessage = lastChallenge;
  expect(
    loginResponse.ok(),
    `${session.label}: session-v2 login answered HTTP ${loginResponse.status()}`
  ).toBe(true);
  session.signInGrantId = await storedGrantId(loginResponse);
  expect(wallet.count("personal_sign")).toBeGreaterThan(0);
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          (
            globalThis.localStorage.getItem("6529-wallet-active-address") ?? ""
          ).toLowerCase()
        ),
      {
        message: `${session.label}: the app did not store the signed-in wallet`,
        timeout: UI_TIMEOUT_MS,
      }
    )
    .toBe(wallet.address.toLowerCase());
}

interface ProfileApiResult {
  readonly step: "token" | "availability" | "create";
  readonly ok: boolean;
  readonly status: number;
  readonly profileId: string | null;
  readonly handle: string | null;
  readonly error: string | null;
}

/**
 * Creates the user's throwaway profile with the browser's own session, the
 * same request the profile set-up form sends. Runs in the page so the access
 * token and staging access code never reach the test process.
 */
export async function createThrowawayProfile(session: StagingE2eeSession) {
  const { page, user } = session;
  const apiOrigin = STAGING_API_ORIGIN;
  const result = await page.evaluate(
    async ({ apiOrigin: api, handle, address }): Promise<ProfileApiResult> => {
      const cookie = (name: string) => {
        const entry = document.cookie
          .split("; ")
          .find((part) => part.startsWith(`${name}=`));
        return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
      };
      let token = cookie("wallet-auth");
      if (!token) {
        const accounts = JSON.parse(
          globalThis.localStorage.getItem("6529-wallet-accounts") ?? "[]"
        ) as { address?: string; jwt?: string | null }[];
        token =
          accounts.find(
            (account) =>
              account.address?.toLowerCase() === address.toLowerCase()
          )?.jwt ?? null;
      }
      const empty = { profileId: null, handle: null, error: null };
      if (!token) {
        return { step: "token", ok: false, status: 0, ...empty };
      }
      const staging = cookie("x-6529-auth");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(staging ? { "x-6529-auth": staging } : {}),
      };
      const availability = await fetch(
        `${api}/api/profiles/${encodeURIComponent(handle)}/availability`,
        { headers }
      );
      const available = (await availability.json().catch(() => null)) as {
        available?: boolean;
        message?: string;
      } | null;
      if (!availability.ok || available?.available !== true) {
        return {
          step: "availability",
          ok: false,
          status: availability.status,
          ...empty,
          error: available?.message ?? null,
        };
      }
      const created = await fetch(`${api}/api/profiles`, {
        method: "POST",
        headers,
        body: JSON.stringify({ handle, classification: "PSEUDONYM" }),
      });
      const body = (await created.json().catch(() => null)) as {
        id?: string;
        handle?: string;
        error?: string;
      } | null;
      return {
        step: "create",
        ok: created.ok,
        status: created.status,
        profileId: body?.id ?? null,
        handle: body?.handle ?? null,
        error: created.ok ? null : (body?.error ?? null),
      };
    },
    { apiOrigin, handle: user.handle, address: session.wallet.address }
  );
  expect(
    result.ok,
    `${session.label}: creating throwaway profile ${user.handle} failed at ${result.step} (HTTP ${result.status}${result.error ? `: ${result.error}` : ""})`
  ).toBe(true);
  expect(result.handle?.toLowerCase()).toBe(user.handle.toLowerCase());
  user.profileId = result.profileId;
  // The app caches the profileless identity; reload to pick up the profile.
  await page.reload({ waitUntil: "domcontentloaded" });
}

function enrollmentHeading(page: Page) {
  return page.getByRole("heading", { name: "Turn on encrypted messages" });
}

export function enrollmentButton(page: Page) {
  return page.getByRole("button", {
    name: "Turn on encrypted messages (one signature)",
  });
}

/** What the encrypted messages gate shows instead of chats, if anything. */
const GATE_STATES = [
  { state: "enrollment", text: "Turn on encrypted messages" },
  {
    state: "no connected wallet (the scripted wallet did not reconnect)",
    text: "Connect the wallet for this profile to use encrypted messages.",
  },
  {
    state: "browser unsupported (WebAssembly, IndexedDB or Web Crypto)",
    text: "This browser can’t use encrypted messages",
  },
  {
    state: "engine failed to start",
    text: "Encrypted messages couldn’t start",
  },
  { state: "device limit reached", text: "Too many devices" },
  {
    state: "proxy session",
    text: "Not available while acting as a proxy",
  },
] as const;

async function gateState(page: Page): Promise<string> {
  for (const { state, text } of GATE_STATES) {
    if (
      await page
        .getByText(text, { exact: true })
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      if (state === "engine failed to start") {
        const code = await page
          .getByText(/^Error code: /u)
          .first()
          .textContent()
          .catch(() => null);
        return `${state}${code ? ` (${code})` : ""}`;
      }
      return state;
    }
  }
  return "loading";
}

/** Gate states that will not resolve into the enrollment card by waiting. */
const TERMINAL_GATE_STATE =
  /^(?:browser unsupported|engine failed|device limit|proxy session)/u;

/**
 * Waits for the enrollment card. The "no wallet" state is normal while the
 * wallet reconnects and the profile loads; a terminal state (unsupported
 * browser, engine error with its code, device limit) fails at once.
 */
export async function expectEnrollmentCard(session: StagingE2eeSession) {
  const { page } = session;
  const deadline = Date.now() + FIRST_LOAD_TIMEOUT_MS;
  let state = await gateState(page);
  while (
    state !== "enrollment" &&
    !TERMINAL_GATE_STATE.test(state) &&
    Date.now() < deadline
  ) {
    await page.waitForTimeout(1_000);
    state = await gateState(page);
  }
  expect(
    state,
    `${session.label}: encrypted messages showed "${state}" instead of the enrollment card`
  ).toBe("enrollment");
  await expect(enrollmentHeading(session.page)).toBeVisible();
  await expect(enrollmentButton(session.page)).toBeEnabled({
    timeout: FIRST_LOAD_TIMEOUT_MS,
  });
}

const COMBINED_GRANT_RESOURCE = "- urn:6529:mls-device-grant:v1:";

/** NC8: the sign-in challenge also granted an encrypted-messages key. */
const signedInWithCombinedGrant = (session: StagingE2eeSession): boolean =>
  session.signInMessage?.includes(COMBINED_GRANT_RESOURCE) === true;

/**
 * NC8: the combined sign-in enrolled this browser. That takes a wallet that
 * already had a profile; a new wallet signs in with a signing-only grant
 * (the server omits the MLS key without a profile), so it turns encrypted
 * messages on from the enrollment button instead.
 */
const enrolledByCombinedSignIn = (session: StagingE2eeSession): boolean =>
  session.hadProfileAtSignIn && signedInWithCombinedGrant(session);

/**
 * NC8: a combined sign-in already enrolled this device. Encrypted messages
 * open without the enrollment card, the device registers through
 * POST /api/e2ee/devices/login-grant, and the wallet signs no
 * `MlsDeviceGrant`: one signature in total.
 */
async function expectEnrolledBySignIn(session: StagingE2eeSession) {
  const { page, wallet } = session;
  const registration = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/e2ee/devices/login-grant",
    { timeout: UI_TIMEOUT_MS }
  );
  registration.catch(() => undefined);
  await gotoStaging(page, ENCRYPTED_ROUTE);
  // The engine may have registered before this navigation; the device link
  // and the absent card are the contract, the response is extra evidence.
  await expect(
    page.getByRole("link", { name: "Devices for encrypted messages" }).first()
  ).toBeVisible({ timeout: FIRST_LOAD_TIMEOUT_MS });
  await expect(enrollmentHeading(page)).toHaveCount(0);
  const response = await registration.catch(() => null);
  if (response) {
    expect(
      response.ok(),
      `${session.label}: sign-in grant registration answered HTTP ${response.status()}`
    ).toBe(true);
  }
  expect(
    wallet.typedDataSignatures("MlsDeviceGrant"),
    `${session.label}: a combined sign-in must not ask for a second grant signature`
  ).toHaveLength(0);
  expect(wallet.count("personal_sign")).toBe(1);
}

/**
 * Turns on encrypted messages for this device. After a combined sign-in
 * (NC8) that already happened with the sign-in signature; otherwise the
 * enrollment button signs in once more with the combined grant (website).
 */
export async function enrollDevice(session: StagingE2eeSession) {
  if (enrolledByCombinedSignIn(session)) {
    await expectEnrolledBySignIn(session);
    return;
  }
  await enrollWithCombinedTurnOn(session);
}

const waitForPost = (page: Page, pathname: string) => {
  const response = page.waitForResponse(
    (candidate) =>
      candidate.request().method() === "POST" &&
      new URL(candidate.url()).pathname === pathname,
    { timeout: UI_TIMEOUT_MS }
  );
  // Awaited by the caller; keep an earlier failure from leaving it unhandled.
  response.catch(() => undefined);
  return response;
};

/**
 * NC8 on the website (owner decision: one grant per browser): the button's
 * combined sign-in grants the signing key and the encrypted-messages key
 * with one more personal_sign and no EIP-712 `MlsDeviceGrant`. The device
 * registers through POST /api/e2ee/devices/login-grant with that grant, and
 * the browser's earlier signing-only grant is revoked.
 */
async function enrollWithCombinedTurnOn(session: StagingE2eeSession) {
  const { page, wallet } = session;
  await gotoStaging(page, ENCRYPTED_ROUTE);
  await expectEnrollmentCard(session);
  const signaturesBefore = wallet.count("personal_sign");
  const typedGrantsBefore = wallet.typedDataSignatures("MlsDeviceGrant").length;
  const replacedGrantId = session.signInGrantId;
  const login = waitForPost(page, "/api/auth/session-login");
  const registration = waitForPost(page, "/api/e2ee/devices/login-grant");
  const revocation = replacedGrantId
    ? waitForPost(page, `/api/device-grants/${replacedGrantId}/revoke`)
    : null;
  await enrollmentButton(page).click();

  const loginResponse = await login;
  expect(
    loginResponse.ok(),
    `${session.label}: the turn-on sign-in answered HTTP ${loginResponse.status()}`
  ).toBe(true);
  const grantId = await storedGrantId(loginResponse);
  expect(
    grantId,
    `${session.label}: the turn-on sign-in stored no grant`
  ).not.toBeNull();
  const response = await registration;
  expect(
    response.ok(),
    `${session.label}: sign-in grant registration answered HTTP ${response.status()}`
  ).toBe(true);
  const body = response.request().postDataJSON() as { grant_id?: string };
  expect(body.grant_id?.toLowerCase()).toBe(grantId);
  if (revocation) {
    const revoked = await revocation;
    expect(
      revoked.ok(),
      `${session.label}: revoking the replaced signing-only grant answered HTTP ${revoked.status()}`
    ).toBe(true);
  }
  await expect(enrollmentHeading(page)).toHaveCount(0, {
    timeout: UI_TIMEOUT_MS,
  });
  await expect(
    page.getByRole("link", { name: "Devices for encrypted messages" }).first()
  ).toBeVisible({ timeout: UI_TIMEOUT_MS });

  expect(
    wallet.count("personal_sign"),
    `${session.label}: turning on takes exactly one more sign-in signature`
  ).toBe(signaturesBefore + 1);
  expect(
    wallet.typedDataSignatures("MlsDeviceGrant"),
    `${session.label}: the website turns on without a separate grant signature`
  ).toHaveLength(typedGrantsBefore);
  session.signInGrantId = grantId;
}

interface PrepareSessionOptions {
  /**
   * After creating a new user's profile, sign in again on a fresh device,
   * as a returning user does. That sign-in must carry the combined grant
   * (NC8), which enrolls the device with no second signature.
   */
  readonly signInAgainWithProfile?: boolean;
}

/** Signs in, creates the throwaway profile when needed, then enrolls. */
export async function prepareEnrolledSession(
  browser: Browser,
  testInfo: TestInfo,
  user: StagingE2eeUser,
  label: string,
  options: PrepareSessionOptions = {}
): Promise<StagingE2eeSession> {
  let session = await openStagingSession(browser, testInfo, user, label);
  try {
    await signInThroughWalletModal(session);
    if (!user.profileId) {
      await createThrowawayProfile(session);
      if (options.signInAgainWithProfile) {
        // The first device is closed here, so its guard evidence is checked
        // now; the run's hygiene checks see only the second device.
        expect(
          session.productionWrites,
          `${label}: writes aimed at production hosts before the second sign-in`
        ).toEqual([]);
        await session.close();
        session = await openStagingSession(browser, testInfo, user, label);
        await signInThroughWalletModal(session);
        expect(
          enrolledByCombinedSignIn(session),
          `${label}: a sign-in with a profile must carry the combined encrypted-messages grant`
        ).toBe(true);
      }
    }
    await enrollDevice(session);
    return session;
  } catch (error) {
    await attachSessionEvidence(testInfo, [session]);
    await session.close();
    throw error;
  }
}

const E2EE_CONSOLE_PATTERN =
  /\bE2EE\b|e2ee|WebAssembly|\.wasm\b|\bwasm\b|OpenMLS|\bMLS\b/u;
// HTTP failures are network evidence (kept in the diagnostics), not engine
// errors; functional assertions catch the ones that matter.
const RESOURCE_LOAD_ERROR = /^Failed to load resource: /u;

export interface DiagnosticsMark {
  readonly console: number;
  readonly pageErrors: number;
}

/**
 * Console errors and uncaught page errors that come from the engine or the
 * MLS WebAssembly module, and E2EE warnings, recorded before `until` (all
 * of them by default).
 */
export function e2eeConsoleProblems(
  session: StagingE2eeSession,
  until?: DiagnosticsMark
): string[] {
  const consoleProblems = session.console
    .slice(0, until?.console)
    .filter((entry) =>
      entry.type === "error"
        ? !RESOURCE_LOAD_ERROR.test(entry.text) &&
          (E2EE_CONSOLE_PATTERN.test(entry.text) ||
            E2EE_CONSOLE_PATTERN.test(entry.url))
        : entry.text.startsWith("E2EE")
    )
    .map((entry) => `console.${entry.type}: ${entry.text}`);
  const pageProblems = session.pageErrors
    .slice(0, until?.pageErrors)
    .filter((error) => E2EE_CONSOLE_PATTERN.test(error))
    .map((error) => `page error: ${error}`);
  return [...consoleProblems, ...pageProblems];
}

export function diagnosticsMark(session: StagingE2eeSession): DiagnosticsMark {
  return {
    console: session.console.length,
    pageErrors: session.pageErrors.length,
  };
}

function sessionReport(session: StagingE2eeSession): string {
  const e2eeNon2xx = session.evidence.e2eeResponses
    .filter((response) => response.status >= 400)
    .map(
      (response) => `${response.status} ${response.method} ${response.path}`
    );
  return [
    `== ${session.label} (${session.user.handle}, ${session.wallet.address}) ==`,
    `Page: ${sanitizeReadonlyRequestUrl(session.page.url())}`,
    `Wallet signatures: personal_sign=${session.wallet.count("personal_sign")}, eth_signTypedData_v4=${session.wallet.count("eth_signTypedData_v4")}`,
    `Combined sign-in grant (NC8): ${signedInWithCombinedGrant(session) ? "yes" : "no"}`,
    `MLS WebAssembly responses: ${JSON.stringify(session.evidence.wasmResponses)}`,
    `CSP violations: ${JSON.stringify(session.evidence.cspViolations)}`,
    "E2EE API responses >= 400:",
    ...e2eeNon2xx,
    "Writes to production hosts (must be none):",
    ...session.productionWrites,
    "Third-party writes dropped by the guard:",
    ...session.droppedWrites,
    "Page errors:",
    ...session.pageErrors,
    "Console errors and warnings:",
    ...session.console.map(
      (entry) =>
        `${entry.type}: ${entry.text} @ ${sanitizeReadonlyRequestUrl(entry.url)}`
    ),
  ].join("\n");
}

/** Redacted diagnostics and screenshots for each open session. */
export async function attachSessionEvidence(
  testInfo: TestInfo,
  sessions: readonly (StagingE2eeSession | undefined)[]
) {
  for (const session of sessions) {
    if (!session) {
      continue;
    }
    const name = session.label.replaceAll(/[^a-z0-9]+/giu, "-");
    try {
      await attachRedactedTextArtifact(
        testInfo,
        `e2ee-staging-${name}-diagnostics.txt`,
        sessionReport(session)
      );
    } catch (error) {
      console.warn(`Could not attach diagnostics for ${session.label}:`, error);
    }
    if (session.page.isClosed()) {
      continue;
    }
    // Never capture the access gate: its input may hold the access code.
    if (new URL(session.page.url()).pathname.startsWith("/access")) {
      continue;
    }
    const path = testInfo.outputPath(`e2ee-staging-${name}.png`);
    await session.page
      .screenshot({ path, fullPage: true, timeout: 15_000 })
      .then(() =>
        testInfo.attach(`e2ee-staging-${name}.png`, {
          path,
          contentType: "image/png",
        })
      )
      .catch(() => undefined);
  }
}

export async function closeSessions(
  sessions: readonly (StagingE2eeSession | undefined)[]
) {
  for (const session of sessions) {
    await session?.close().catch(() => undefined);
  }
}
