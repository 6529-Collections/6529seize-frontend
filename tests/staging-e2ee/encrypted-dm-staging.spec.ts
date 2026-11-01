import type { Browser, TestInfo } from "@playwright/test";

import { expect, test } from "../testHelpers";
import {
  plaintextEncodings,
  type RecordedCspViolation,
} from "../support/staging-e2ee/evidence";
import {
  createQaImage,
  newRunId,
  qaMessage,
} from "../support/staging-e2ee/fixtures";
import {
  attachSessionEvidence,
  closeSessions,
  createThrowawayUser,
  DEVICE_ADD_TIMEOUT_MS,
  diagnosticsMark,
  type DiagnosticsMark,
  e2eeConsoleProblems,
  ENCRYPTED_ROUTE,
  expectEnrollmentCard,
  hasStagingAccessCode,
  prepareEnrolledSession,
  probeEncryptedRoute,
  stagingE2eeOptInProblem,
  type StagingE2eeSession,
  type StagingE2eeUser,
  SYNC_TIMEOUT_MS,
  UI_TIMEOUT_MS,
} from "../support/staging-e2ee/session";
import {
  attachFile,
  expectDecrypted,
  expectNothingUndecryptable,
  imagePixels,
  messageRow,
  openChat,
  openChatFromList,
  revokeOtherDevice,
  sendEncrypted,
  startEncryptedChat,
  timelineNotice,
} from "../support/staging-e2ee/ui";

/**
 * Encrypted DMs (E2EE, design D109) between real users on staging.6529.io.
 *
 * Every user is a throwaway wallet generated for this run. It signs in
 * through the real wallet modal (a scripted EIP-1193 wallet answers in the
 * test process), gets a test-only `e2eeqa_*` profile and turns on encrypted
 * messages with its own combined sign-in grant (NC8: one grant per browser
 * for signed and encrypted messages). Each browser context is a separate
 * device. The run writes throwaway data to staging, so it is an
 * opt-in pack (`e2ee-staging`) and never part of PR or post-deploy lanes.
 *
 * Engine rules are covered in Jest and the local sandbox packs; this proves
 * the deployed stack: OpenMLS WebAssembly under the staging CSP, IndexedDB,
 * the delivery service, blobs, and that the server only ever sees ciphertext.
 */

const OPT_IN_PROBLEM = stagingE2eeOptInProblem(
  process.env["PLAYWRIGHT_BASE_URL"]
);
const SETUP_TIMEOUT_MS = 15 * 60_000;
const TEST_TIMEOUT_MS = 15 * 60_000;
/** How long a revoked device keeps polling while we check it gets nothing. */
const REVOKED_DEVICE_GRACE_MS = 20_000;
const DESKTOP_PROJECT = "web-desktop-chromium";

interface World {
  readonly runId: string;
  readonly a: StagingE2eeSession;
  readonly b: StagingE2eeSession;
  /** Created on demand: user C, B's second device. */
  readonly extra: StagingE2eeSession[];
  dm: string | null;
}

let world: World | null = null;

function requireWorld(): World {
  if (!world) {
    throw new Error("Staging E2EE users were not set up.");
  }
  return world;
}

function needles(values: Readonly<Record<string, string | Buffer>>) {
  return new Map(
    Object.entries(values).map(([name, value]) => [
      name,
      plaintextEncodings(value),
    ])
  );
}

/**
 * Invariant 1 and the run's hygiene, for every session: no needle in any URL,
 * request body or sent WebSocket frame, no unscannable body, no write aimed
 * at production and no engine or WASM console error (for a session in
 * `consoleUntil`, only errors recorded before its mark). Transient HTTP
 * errors are diagnostics only; the functional assertions catch any that
 * matter.
 */
function expectPrivateAndClean(
  sessions: readonly StagingE2eeSession[],
  secrets: ReadonlyMap<string, readonly string[]>,
  consoleUntil: ReadonlyMap<StagingE2eeSession, DiagnosticsMark> = new Map()
) {
  for (const session of sessions) {
    expect(
      session.evidence.findLeaks(secrets),
      `${session.label}: plaintext left the browser`
    ).toEqual([]);
    expect(
      session.evidence.unscannedRequests(),
      `${session.label}: request bodies too large to scan`
    ).toEqual([]);
    expect(
      session.productionWrites,
      `${session.label}: writes aimed at production hosts`
    ).toEqual([]);
    expect(
      e2eeConsoleProblems(session, consoleUntil.get(session)),
      `${session.label}: engine or WebAssembly console errors`
    ).toEqual([]);
  }
}

function isWasmViolation(violation: RecordedCspViolation): boolean {
  return (
    violation.blockedURI === "wasm-eval" ||
    violation.blockedURI.includes("/e2ee/")
  );
}

function scriptSrcTokens(csp: string): string[] {
  const directive = csp
    .split(";")
    .map((part) => part.trim().split(/\s+/u))
    .find(([name]) => name === "script-src");
  return directive?.slice(1) ?? [];
}

/** The DM between A and B, created once per worker. */
async function ensureDm(current: World): Promise<string> {
  if (current.dm) {
    return current.dm;
  }
  const dm = await startEncryptedChat(current.a, [current.b.user.handle]);
  await openChatFromList(current.b, dm, current.a.user.handle);
  current.dm = dm;
  return dm;
}

/** One more enrolled device (a new user, or another device of a user). */
async function addSession(
  browser: Browser,
  testInfo: TestInfo,
  user: StagingE2eeUser,
  label: string
): Promise<StagingE2eeSession> {
  const session = await prepareEnrolledSession(browser, testInfo, user, label);
  requireWorld().extra.push(session);
  return session;
}

test.describe("Encrypted DMs between real users on staging @large @e2ee", () => {
  // In order in one worker (the config is fullyParallel): tests share the
  // users set up once. A failed test restarts the worker with fresh users;
  // nothing is retried, since a retry would only add more staging data.
  test.describe.configure({
    mode: "default",
    retries: 0,
    timeout: TEST_TIMEOUT_MS,
  });
  test.skip(OPT_IN_PROBLEM !== null, OPT_IN_PROBLEM ?? "");

  test.beforeAll(async ({ browser }, testInfo) => {
    test.setTimeout(SETUP_TIMEOUT_MS);
    test.skip(
      testInfo.project.name !== DESKTOP_PROJECT,
      `The staging E2EE journey runs on ${DESKTOP_PROJECT} only.`
    );
    if (!hasStagingAccessCode()) {
      throw new Error(
        "The staging E2EE pack needs PLAYWRIGHT_STAGING_ACCESS_CODE or STAGING_AUTH."
      );
    }
    const probe = await probeEncryptedRoute(browser, testInfo);
    test.skip(
      !probe.available,
      `${ENCRYPTED_ROUTE} is not the encrypted messages page on this staging build (${probe.detail}): it was built without NEXT_PUBLIC_E2EE_DM_ENABLED or without the encrypted messages frontend (PR #4274).`
    );

    const runId = newRunId();
    // A signs in again once the profile exists, as returning users do, and
    // enrolls with that one sign-in signature. B signs in before having a
    // profile (a signing-only grant), then turns encrypted messages on from
    // the enrollment button: one more combined sign-in signature, which
    // replaces and revokes that grant.
    const a = await prepareEnrolledSession(
      browser,
      testInfo,
      createThrowawayUser("A"),
      "A",
      { signInAgainWithProfile: true }
    );
    try {
      const b = await prepareEnrolledSession(
        browser,
        testInfo,
        createThrowawayUser("B"),
        "B"
      );
      world = { runId, a, b, extra: [], dm: null };
    } catch (error) {
      await a.close();
      throw error;
    }
  });

  test.afterEach(async () => {
    const testInfo = test.info();
    if (world && testInfo.status !== testInfo.expectedStatus) {
      await attachSessionEvidence(testInfo, [world.a, world.b, ...world.extra]);
    }
  });

  test.afterAll(async () => {
    if (world) {
      await closeSessions([world.a, world.b, ...world.extra]);
      world = null;
    }
  });

  test("each device signs one grant and loads OpenMLS WebAssembly under the staging CSP", () => {
    const { a, b } = requireWorld();
    for (const session of [a, b]) {
      // NC8 on the website: the device's one grant is a combined sign-in
      // grant, from A's sign-in or from B's enrollment button (one more
      // sign-in signature, checked at enrollment). No device signs an
      // EIP-712 MlsDeviceGrant.
      expect(
        session.wallet.typedDataSignatures("MlsDeviceGrant"),
        `${session.label}: device grant signatures`
      ).toHaveLength(0);
      expect(
        session.evidence.wasmResponses.length,
        `${session.label} never fetched the MLS WebAssembly module`
      ).toBeGreaterThan(0);
      for (const response of session.evidence.wasmResponses) {
        expect(
          [200, 304],
          `${session.label}: ${response.path} answered ${response.status}`
        ).toContain(response.status);
      }
      expect(
        session.evidence.cspViolations.filter(isWasmViolation),
        `${session.label}: CSP blocked WebAssembly`
      ).toEqual([]);
      const csp = session.evidence.documentCsp.find(
        (document) => document.path === ENCRYPTED_ROUTE
      )?.csp;
      expect(csp, `staging served no CSP for ${ENCRYPTED_ROUTE}`).toBeTruthy();
      const scriptSrc = scriptSrcTokens(csp ?? "");
      // WebAssembly compilation is allowed without allowing JavaScript eval.
      expect(scriptSrc).toContain("'wasm-unsafe-eval'");
      expect(scriptSrc).not.toContain("'unsafe-eval'");
      expect(
        e2eeConsoleProblems(session),
        `${session.label}: engine or WebAssembly console errors`
      ).toEqual([]);
    }
  });

  test("A and B exchange encrypted DM text and the server only sees ciphertext", async () => {
    const current = requireWorld();
    const { a, b, runId } = current;
    const hello = qaMessage(runId, "A to B");
    const reply = qaMessage(runId, "B to A");

    const dm = await startEncryptedChat(a, [b.user.handle]);
    current.dm = dm;
    const sent = await sendEncrypted(a, hello);
    const body = sent.postDataJSON() as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(
      expect.arrayContaining(["epoch", "data", "epoch_fp", "sender_device_key"])
    );
    expect(typeof body["data"]).toBe("string");
    expect(sent.postData() ?? "").not.toContain(hello);

    await openChatFromList(b, dm, a.user.handle);
    await expectDecrypted(b, hello);

    await sendEncrypted(b, reply);
    await expectDecrypted(a, reply);
    await expect(messageRow(b.page, hello)).toHaveCount(1);
    await expectNothingUndecryptable(a);
    await expectNothingUndecryptable(b);

    expect(
      a.evidence.requestsMatching(
        "POST",
        /^\/api\/e2ee\/groups\/0x[0-9a-f]{64}\/messages$/u
      ).length,
      "A's sends were not observed, so the plaintext check would be vacuous"
    ).toBeGreaterThan(0);
    expectPrivateAndClean([a, b], needles({ hello, reply }));
  });

  test("an encrypted image round-trips through the blob store", async () => {
    const current = requireWorld();
    const { a, b, runId } = current;
    const dm = await ensureDm(current);
    const image = createQaImage(runId);
    const caption = qaMessage(runId, "image caption");

    await openChat(a, dm);
    await attachFile(a, image);
    await sendEncrypted(a, caption);
    const altText = `Image: ${image.name}`;
    await expect(
      messageRow(a.page, caption).getByRole("img", { name: altText })
    ).toBeVisible({ timeout: UI_TIMEOUT_MS });
    expect(
      a.evidence.requestsMatching(
        "PUT",
        /^\/api\/e2ee\/blobs\/[^/]+\/chunks\/\d+$/u
      ).length,
      "the attachment was not uploaded through the E2EE blob store"
    ).toBeGreaterThan(0);

    await openChat(b, dm);
    await expectDecrypted(b, caption);
    const received = messageRow(b.page, caption).getByRole("img", {
      name: altText,
    });
    await expect(received).toBeVisible({ timeout: SYNC_TIMEOUT_MS });
    const pixels = await imagePixels(received);
    expect(pixels).toHaveLength(image.rgba.length);
    pixels.forEach((value, index) => {
      expect(
        Math.abs(value - (image.rgba[index] ?? -1)),
        `decrypted pixel byte ${index} differs`
      ).toBeLessThanOrEqual(2);
    });
    await expectNothingUndecryptable(b);

    expectPrivateAndClean(
      [a, b],
      needles({
        caption,
        fileName: image.name,
        imageMarker: image.marker,
        imageBytes: image.buffer,
      })
    );
  });

  test("a group of A, B and a third user exchanges encrypted messages", async ({
    browser,
  }, testInfo) => {
    const current = requireWorld();
    const { a, b, runId } = current;
    const c = await addSession(
      browser,
      testInfo,
      createThrowawayUser("C"),
      "C"
    );
    const groupName = `QA group ${runId}`;
    const fromA = qaMessage(runId, "A to group");
    const fromC = qaMessage(runId, "C to group");

    const group = await startEncryptedChat(a, [b.user.handle, c.user.handle], {
      group: { name: groupName },
    });
    await expect(a.page.getByRole("heading", { level: 1 })).toHaveText(
      groupName,
      { timeout: UI_TIMEOUT_MS }
    );
    await expect(a.page.getByText("3 members").first()).toBeVisible({
      timeout: UI_TIMEOUT_MS,
    });
    await sendEncrypted(a, fromA);

    await openChatFromList(b, group, groupName);
    await expectDecrypted(b, fromA);
    await openChatFromList(c, group, groupName);
    await expectDecrypted(c, fromA);

    await sendEncrypted(c, fromC);
    await expectDecrypted(a, fromC);
    await expectDecrypted(b, fromC);
    for (const session of [a, b, c]) {
      await expectNothingUndecryptable(session);
    }

    expectPrivateAndClean([a, b, c], needles({ groupName, fromA, fromC }));
  });

  test("a revoked device can no longer read new messages", async ({
    browser,
  }, testInfo) => {
    const current = requireWorld();
    const { a, b, runId } = current;
    const dm = await ensureDm(current);
    const beforeRevoke = qaMessage(runId, "before revoke");
    const afterRevoke = qaMessage(runId, "after revoke");

    // A second browser for B is a new device: one more grant signature.
    const b2 = await addSession(browser, testInfo, b.user, "B (second device)");
    await openChat(a, dm);
    await openChat(b, dm);
    await expect(
      timelineNotice(a.page, `${b.user.handle} added a device`),
      "B's new device was never added to the DM"
    ).toBeVisible({ timeout: DEVICE_ADD_TIMEOUT_MS });
    await openChatFromList(b2, dm, a.user.handle, DEVICE_ADD_TIMEOUT_MS);

    await sendEncrypted(a, beforeRevoke);
    await expectDecrypted(b, beforeRevoke);
    await expectDecrypted(b2, beforeRevoke);
    // B2's own errors count until it is revoked; afterwards they are expected.
    expect(
      e2eeConsoleProblems(b2),
      "B (second device): engine or WebAssembly console errors"
    ).toEqual([]);
    const b2Mark = diagnosticsMark(b2);

    await revokeOtherDevice(b);
    await openChat(b, dm);
    await expect(
      timelineNotice(a.page, `${b.user.handle} removed a device`),
      "A never saw B's revoked device leave the DM"
    ).toBeVisible({ timeout: SYNC_TIMEOUT_MS });

    await sendEncrypted(a, afterRevoke);
    await expectDecrypted(b, afterRevoke);
    // The revoked device still shows the chat; give it time to poll.
    await b2.page.waitForTimeout(REVOKED_DEVICE_GRACE_MS);
    await expect(
      b2.page.getByText(afterRevoke),
      "the revoked device decrypted a message sent after its revocation"
    ).toHaveCount(0);
    await b2.page.reload({ waitUntil: "domcontentloaded" });
    await expectEnrollmentCard(b2);
    await expect(b2.page.getByText(afterRevoke)).toHaveCount(0);
    await expectNothingUndecryptable(a);
    await expectNothingUndecryptable(b);

    expectPrivateAndClean(
      [a, b, b2],
      needles({ beforeRevoke, afterRevoke }),
      new Map([[b2, b2Mark]])
    );
  });
});
