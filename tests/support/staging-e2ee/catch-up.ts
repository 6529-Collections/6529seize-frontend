import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";
import type { E2eeEngineExt, E2eeEngineOptions } from "@/lib/e2ee/types";
import { loadNodeEngine } from "./load-node-engine";
import { buildStagingQaApi } from "./api-transport";
import type { StagingE2eeSession } from "./session";

/** Authorization comes only from this run's throwaway browser, never an existing user session. */
async function qaTransport(
  session: StagingE2eeSession,
  runtime: typeof import("./node-engine")
) {
  const next = session.page.waitForRequest(
    (request) =>
      new URL(request.url()).hostname === "api.staging.6529.io" &&
      Boolean(request.headers()["authorization"]) &&
      Boolean(request.headers()["x-6529-auth"])
  );
  await session.page.reload({ waitUntil: "domcontentloaded" });
  const captured = (await next).headers();
  return buildStagingQaApi(
    session.context.request,
    {
      authorization: captured["authorization"]!,
      "x-6529-auth": captured["x-6529-auth"]!,
    },
    runtime
  );
}

export async function measureStagingCatchUp(
  a: StagingE2eeSession,
  b: StagingE2eeSession
) {
  if (!a.user.profileId || !b.user.profileId)
    throw new Error("Missing QA profiles");
  // The framework-independent engine still uses the grant environment check.
  // Use production signature rules and staging-only transport endpoints.
  process.env["PUBLIC_RUNTIME"] = JSON.stringify({
    NODE_ENV: "production",
    API_ENDPOINT: "https://api.staging.6529.io",
    BASE_ENDPOINT: "https://staging.6529.io",
    ALLOWLIST_API_ENDPOINT: "https://unused.example.test",
    IPFS_API_ENDPOINT: "https://unused.example.test",
    IPFS_GATEWAY_ENDPOINT: "https://unused.example.test",
  });
  const runtime = await loadNodeEngine();
  const {
    createE2eeEngine,
    createMemoryE2eeStorage,
    loadMlsWasm,
    MLS_WASM_MANIFEST,
  } = runtime;
  const wasm = await loadMlsWasm({
    bytes: new Uint8Array(
      readFileSync(join(process.cwd(), "public", MLS_WASM_MANIFEST.file))
    ),
  });
  const storageA = createMemoryE2eeStorage();
  const storageB = createMemoryE2eeStorage();
  const [apiA, apiB] = await Promise.all([
    qaTransport(a, runtime),
    qaTransport(b, runtime),
  ]);
  const options = (
    session: StagingE2eeSession,
    api: typeof apiA,
    storage: typeof storageA
  ) => ({
    profileId: session.user.profileId!,
    wallet: session.user.key.address,
    origin: "staging.6529.io",
    platform: "web" as const,
    deviceLabel: "Encrypted performance QA",
    api,
    storage,
    polling: false,
    loadWasm: () => Promise.resolve(wasm),
    resolveProfiles: () => Promise.resolve({}),
    signTypedData: async (
      data: Parameters<E2eeEngineOptions["signTypedData"]>[0]
    ) =>
      session.user.key.signTypedData(
        data.domain as Record<string, unknown>,
        data.types as Record<string, { name: string; type: string }[]>,
        data.message as Record<string, unknown>
      ),
  });
  let sender: E2eeEngineExt | null = null;
  let receiver: E2eeEngineExt | null = null;
  try {
    sender = await createE2eeEngine(options(a, apiA, storageA));
    await sender.enroll();
    receiver = await createE2eeEngine(options(b, apiB, storageB));
    await receiver.enroll();
    const g = await sender.createConversation({
      profileIds: [b.user.profileId],
      kind: "group",
      name: "Encrypted performance QA",
    });
    await receiver.sync();
    await receiver.idle();
    expect(receiver.getConversation(g)?.status).toBe("active");
    receiver.dispose();
    await receiver.idle();
    receiver = null;
    const count = 250;
    // Match the browser importer and stay below 120 messages/minute/device.
    const pacingMs = 700;
    const importing = performance.now();
    for (let index = 0; index < count; index++) {
      if (index > 0) await delay(pacingMs);
      await sender.sendImported(g, {
        text: `catch-up fixture ${index}`,
        imported: {
          waveId: "staging-performance-qa",
          dropId: `fixture-${index}`,
          part: 0,
          serialNo: index,
          authorProfileId: a.user.profileId,
          authorHandle: a.user.handle,
          createdAt: Date.now() - 1000,
          editedAt: null,
          replyToDropId: null,
          mediaNotImported: 0,
          reactions: [],
        },
      });
    }
    const importerMs = performance.now() - importing;
    const catchingUp = performance.now();
    receiver = await createE2eeEngine(options(b, apiB, storageB));
    await receiver.sync();
    await receiver.idle();
    const receiverMs = performance.now() - catchingUp;
    const history = await receiver.backupHistory();
    expect(
      history.messages.filter((message) => message.g === g && message.imported)
        .length
    ).toBe(count);
    expect(receiver.getMessages(g).length).toBeLessThanOrEqual(200);
    return {
      count,
      pacingMs,
      importerMs,
      receiverMs,
      savedImported: count,
      activeRecords: receiver.getMessages(g).length,
    };
  } finally {
    sender?.dispose();
    receiver?.dispose();
    await Promise.all([sender?.idle(), receiver?.idle()]);
  }
}
