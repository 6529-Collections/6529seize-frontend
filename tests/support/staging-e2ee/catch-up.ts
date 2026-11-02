import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { join } from "node:path";
import { expect } from "@playwright/test";
import { buildE2eeApiClient } from "@/lib/e2ee/api-client";
import { E2eeApiError } from "@/lib/e2ee/api-errors";
import { createMemoryE2eeStorage } from "@/lib/e2ee/storage";
import type { E2eeEngineExt, E2eeEngineOptions } from "@/lib/e2ee/types";
import { loadMlsWasm, MLS_WASM_MANIFEST } from "@/lib/e2ee/wasm";
import type { StagingE2eeSession } from "./session";

/** Authorization comes only from this run's throwaway browser, never an existing user session. */
async function qaTransport(session: StagingE2eeSession) {
  const next = session.page.waitForRequest(
    (request) =>
      new URL(request.url()).hostname === "api.staging.6529.io" &&
      Boolean(request.headers()["authorization"])
  );
  await session.page.reload({ waitUntil: "domcontentloaded" });
  const authorization = (await next).headers()["authorization"]!;
  const send = async <T>(
    method: string,
    endpoint: string,
    params?: Record<string, string>,
    body?: object
  ): Promise<T> => {
    const url = new URL(`/api/${endpoint}`, "https://api.staging.6529.io");
    for (const [key, value] of Object.entries(params ?? {}))
      url.searchParams.set(key, value);
    const response = await session.context.request.fetch(url.toString(), {
      method,
      headers: { authorization },
      ...(body ? { data: body } : {}),
    });
    const result = await response.json();
    if (!response.ok())
      throw new E2eeApiError({
        message: "Staging QA API request failed",
        status: response.status(),
        code: typeof result.code === "string" ? result.code : null,
      });
    return result as T;
  };
  return buildE2eeApiClient({
    get: <T>(endpoint: string, params?: Record<string, string>) =>
      send<T>("GET", endpoint, params),
    post: <T>(endpoint: string, body: object) =>
      send<T>("POST", endpoint, undefined, body),
    put: <T>(endpoint: string, body: object) =>
      send<T>("PUT", endpoint, undefined, body),
  });
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
  const { createE2eeEngine } = await import("@/lib/e2ee/engine");
  const wasm = await loadMlsWasm({
    bytes: new Uint8Array(
      readFileSync(join(process.cwd(), "public", MLS_WASM_MANIFEST.file))
    ),
  });
  const storageA = createMemoryE2eeStorage();
  const storageB = createMemoryE2eeStorage();
  const [apiA, apiB] = await Promise.all([qaTransport(a), qaTransport(b)]);
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
    loadWasm: async () => wasm,
    resolveProfiles: async () => ({}),
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
    const importing = performance.now();
    for (let index = 0; index < count; index++) {
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
