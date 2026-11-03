/** @jest-environment node */
import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import { createIndexedDbE2eeStorage } from "@/lib/e2ee/storage";
import type { StoredMessage } from "@/lib/e2ee/records";
import {
  addUser,
  createWorld,
  settle,
  startDevice,
  stopDevice,
} from "./support/harness";
import type { E2eeEngineExt } from "@/lib/e2ee/types";

const enabled = process.env["E2EE_PERFORMANCE_BENCHMARK"] === "1";
const benchmark = enabled ? it : it.skip;
jest.setTimeout(600_000);
const measurements: Record<string, number | string> = {};
afterAll(() => {
  if (!enabled) return;
  mkdirSync("test-results", { recursive: true });
  writeFileSync(
    "test-results/e2ee-history-benchmark.json",
    JSON.stringify(measurements, null, 2)
  );
});

type PagedEngine = E2eeEngineExt & {
  loadHistory?: (g: string) => Promise<void>;
};
benchmark(
  "reopens 100,000 processed records without replaying their MLS ciphertext",
  async () => {
    globalThis.IDBKeyRange = IDBKeyRange;
    const storage = createIndexedDbE2eeStorage(new IDBFactory());
    const world = await createWorld();
    const alice = await addUser(world, "alice", { storage });
    const bob = await addUser(world, "bob");
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    await alice.primary.engine.send(g, { text: "synthetic history template" });
    await settle(world);
    const stored = (await storage.listMessages("alice", g)).find(
      (message) => message.kind === "message"
    )!;
    const record = (await storage.listGroups("alice"))[0]!;
    // Saved plaintext fixture only. The real MLS checkpoint and server cursor stay unchanged.
    const rows: StoredMessage[] = Array.from(
      { length: 100_000 },
      (_, index) => ({
        ...stored,
        id: `fixture-${index}`,
        seq: index + 100,
        text: `history fixture ${index}`,
        body: null,
        sig: null,
      })
    );
    const last = rows.at(-1)!;
    const fixtureGroup = {
      ...record,
      history: {
        last,
        unread: 0,
        mentions: 0,
        count: 100_002,
        maxSeq: last.seq,
      },
    };
    await storage.writeBatch("alice", {
      messages: rows,
      groups: [fixtureGroup],
    });
    stopDevice(world, alice.primary);
    await alice.primary.engine.idle();
    const started = performance.now();
    const restored = await startDevice(world, "alice", alice.account, {
      storage,
    });
    const engine = restored.engine as PagedEngine;
    measurements["syncedInitMs"] = performance.now() - started;
    const opened = performance.now();
    if (engine.loadHistory) await engine.loadHistory(g);
    const messages = engine.getMessages(g);
    measurements["syncedOpenMs"] = performance.now() - opened;
    measurements["activeRecords"] = messages.length;
    measurements["heapUsedBytes"] = process.memoryUsage().heapUsed;
    expect(
      messages.some((message) => message.text === "history fixture 99999")
    ).toBe(true);
    const before = world.ds.state.requests.length;
    if (engine.loadHistory) await engine.loadHistory(g);
    const logRequests = world.ds.state.requests
      .slice(before)
      .filter((request) => request.path.includes("/log"));
    expect(logRequests).toHaveLength(0);
    measurements["browseLogRequests"] = logRequests.length;
    for (const device of [...world.devices]) {
      stopDevice(world, device);
      await device.engine.idle();
    }
    // Silence unused fixture identity: it remains a normal real-MLS peer.
    expect(bob.profileId).toBe("bob");
  }
);

benchmark(
  "measures importer and receiver catch-up with real MLS and distinct imported originals",
  async () => {
    const world = await createWorld();
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bob");
    const g = await alice.primary.engine.createConversation({
      profileIds: ["bob"],
      kind: "dm",
    });
    await settle(world);
    stopDevice(world, bob.primary);
    await bob.primary.engine.idle();
    const n = 1000;
    const started = performance.now();
    for (let index = 0; index < n; index++) {
      await alice.primary.engine.sendImported(g, {
        text: `import fixture ${index}`,
        imported: {
          waveId: "qa-wave",
          dropId: `drop-${index}`,
          part: 0,
          serialNo: index,
          authorProfileId: "alice",
          authorHandle: "alice",
          createdAt: world.clock.now() - 1000,
          editedAt: null,
          replyToDropId: null,
          mediaNotImported: 0,
          reactions: [],
        },
      });
    }
    measurements["importer1000Ms"] = performance.now() - started;
    const receiving = performance.now();
    const receiver = await startDevice(world, "bob", bob.account, {
      storage: bob.primary.storage,
    });
    await receiver.engine.sync();
    await receiver.engine.idle();
    measurements["receiver1000Ms"] = performance.now() - receiving;
    const backup = await receiver.engine.backupHistory();
    expect(backup.messages.filter((message) => message.imported).length).toBe(
      n
    );
    measurements["receiverSavedImported"] = n;
    measurements["receiverActiveRecords"] =
      receiver.engine.getMessages(g).length;
    for (const device of [...world.devices]) {
      stopDevice(world, device);
      await device.engine.idle();
    }
  }
);
