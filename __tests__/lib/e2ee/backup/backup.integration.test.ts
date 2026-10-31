/**
 * @jest-environment node
 *
 * Integration: real OpenMLS WASM engines + fake delivery service + fake
 * backup server. Turn on, incremental append, restore onto a fresh device,
 * rejoin through a normal MLS device add, new code, quota, turn off.
 */
import { base64ToBytes, utf8Encode } from "@/lib/e2ee/bytes";
import { E2eeBackupManager } from "@/lib/e2ee/backup/manager";
import { createMemoryBackupStateStore } from "@/lib/e2ee/backup/state";
import { generateRecoveryCode } from "@/lib/e2ee/backup/recovery-code";
import {
  createFakeBackupServer,
  type FakeBackupServer,
} from "../support/fakeBackupServer";
import {
  addDevice,
  addUser,
  createWorld,
  settle,
  startDevice,
  stopDevice,
  texts,
  type TestDevice,
  type World,
} from "../support/harness";

jest.setTimeout(180_000);

const idleScheduler = {
  setTimeout: () => 0,
  clearTimeout: () => undefined,
};

function managerFor(
  world: World,
  server: FakeBackupServer,
  device: TestDevice
): E2eeBackupManager {
  return new E2eeBackupManager({
    profileId: device.profileId,
    engine: device.engine,
    api: server.clientFor(device.profileId),
    state: createMemoryBackupStateStore(),
    now: world.clock.now,
    scheduler: idleScheduler,
  });
}

const errorCode = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return (error as { code?: string }).code ?? "unknown";
  }
  return null;
};

/** Every string in a request body, plus base64 fields decoded to text. */
function requestText(server: FakeBackupServer): string {
  const parts: string[] = [];
  const visit = (value: unknown) => {
    if (typeof value === "string") {
      parts.push(value);
      try {
        parts.push(Buffer.from(base64ToBytes(value)).toString("latin1"));
      } catch {
        // not base64
      }
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(visit);
    }
  };
  server.requests.forEach((request) => visit(request.body));
  return parts.join("\n");
}

describe("E2EE encrypted history backup", () => {
  it("backs up incrementally, restores onto a fresh device and rejoins through MLS", async () => {
    const world = await createWorld();
    const server = createFakeBackupServer(world.clock.now);
    const alice = await addUser(world, "alice");
    const bob = await addUser(world, "bobbackuppeer");
    const a = alice.primary.engine;
    const g = await a.createConversation({
      profileIds: ["bobbackuppeer"],
      kind: "dm",
    });
    await settle(world);
    await a.send(g, { text: "secret alpha" });
    await bob.primary.engine.send(g, { text: "secret bravo" });
    await settle(world);
    const edited = a.getMessages(g).find((m) => m.text === "secret alpha")!;
    await a.edit(g, edited.id, "secret alpha edited");
    await settle(world);

    // Turn on: the code is generated locally and nothing is sent until confirmed.
    const backupA = managerFor(world, server, alice.primary);
    await backupA.start();
    expect(backupA.getSnapshot().phase).toBe("off");
    const prepared = await backupA.prepareBackup();
    expect(server.requests.filter((r) => r.method !== "GET")).toHaveLength(0);
    await backupA.confirmBackup(prepared);
    expect(backupA.getSnapshot()).toMatchObject({
      phase: "on",
      uploading: false,
      lastError: null,
    });
    const [generation] = server.generations("alice");
    expect(generation).toMatchObject({ active: true });
    const firstChunks = generation!.chunk_count;
    expect(firstChunks).toBeGreaterThanOrEqual(1);

    // Incremental: only what changed is appended; an idle run appends nothing.
    await a.send(g, { text: "secret charlie" });
    await settle(world);
    await backupA.backupNow();
    expect(server.generations("alice")[0]!.chunk_count).toBe(firstChunks + 1);
    await backupA.backupNow();
    expect(server.generations("alice")[0]!.chunk_count).toBe(firstChunks + 1);

    // No plaintext ever leaves the client.
    const sent = requestText(server);
    for (const secret of [
      "secret",
      "alpha",
      "bravo",
      "charlie",
      "bobbackuppeer",
    ]) {
      expect(sent).not.toContain(secret);
    }
    expect(sent).not.toContain(prepared.code);
    for (const request of server.requests) {
      const data = (request.body as { data?: string } | null)?.data;
      if (data) {
        expect([4096, 16_384, 65_536, 262_144, 1_048_576]).toContain(
          base64ToBytes(data).length
        );
        expect(
          Buffer.from(base64ToBytes(data)).includes(utf8Encode("secret"))
        ).toBe(false);
      }
    }

    // Lose every device; a fresh device enrolls with empty storage. Bob is
    // offline meanwhile, so the restore happens before any MLS re-add.
    stopDevice(world, alice.primary);
    stopDevice(world, bob.primary);
    const fresh = await addDevice(world, alice);
    expect(fresh.engine.getConversation(g)).toBeNull();
    const backupB = managerFor(world, server, fresh);
    await backupB.start();
    expect(backupB.getSnapshot().phase).toBe("available");

    // Malformed and wrong codes fail cleanly and import nothing.
    await expect(errorCode(backupB.restore("ABCD-EFGH"))).resolves.toBe(
      "E2EE_BACKUP_CODE_FORMAT"
    );
    const wrong = await generateRecoveryCode();
    await expect(errorCode(backupB.restore(wrong.code))).resolves.toBe(
      "E2EE_BACKUP_WRONG_CODE"
    );
    expect(fresh.engine.getConversation(g)).toBeNull();
    expect(backupB.getSnapshot().phase).toBe("available");

    // The right code restores past history (read-only until re-added).
    const result = await backupB.restore(prepared.code.toLowerCase());
    expect(result.conversations).toBe(1);
    expect(result.messages).toBeGreaterThanOrEqual(3);
    expect(fresh.engine.getConversation(g)).toMatchObject({
      status: "restored",
      kind: "dm",
    });
    expect(texts(fresh.engine.getMessages(g))).toEqual(
      expect.arrayContaining([
        "secret alpha edited",
        "secret bravo",
        "secret charlie",
      ])
    );
    expect(backupB.getSnapshot().phase).toBe("on");

    // Bob comes back; his device adds the new device through a normal MLS
    // device add. The restored history stays and new messages arrive.
    const bobAgain = await startDevice(world, "bobbackuppeer", bob.account, {
      storage: bob.primary.storage,
    });
    bob.devices.push(bobAgain);
    bob.primary = bobAgain;
    bobAgain.engine.setOpenConversation(g);
    await settle(world);
    expect(fresh.engine.getConversation(g)?.status).toBe("active");
    await bobAgain.engine.send(g, { text: "secret delta" });
    await settle(world);
    expect(texts(fresh.engine.getMessages(g))).toEqual(
      expect.arrayContaining([
        "secret alpha edited",
        "secret bravo",
        "secret charlie",
        "secret delta",
      ])
    );

    // The restored device keeps the same backup going (incremental).
    const before = server.generations("alice")[0]!.chunk_count;
    await backupB.backupNow();
    expect(server.generations("alice")[0]!.chunk_count).toBeGreaterThan(before);

    // New recovery code: a new generation replaces the old one; the old code
    // no longer opens anything.
    const rotated = await backupB.prepareBackup();
    await backupB.confirmBackup(rotated);
    const generations = server.generations("alice");
    expect(generations).toHaveLength(1);
    expect(generations[0]!.backup_id).not.toBe(generation!.backup_id);
    const third = await addDevice(world, alice);
    const backupC = managerFor(world, server, third);
    await backupC.start();
    await expect(errorCode(backupC.restore(prepared.code))).resolves.toBe(
      "E2EE_BACKUP_WRONG_CODE"
    );
    // Restored either as a read-only chat or merged into one it already joined.
    await expect(backupC.restore(rotated.code)).resolves.toMatchObject({
      messages: expect.any(Number),
    });
    expect(texts(third.engine.getMessages(g))).toEqual(
      expect.arrayContaining(["secret delta"])
    );

    // Quota: the server refuses and the error is surfaced, nothing breaks.
    server.quotaBytes = server.generations("alice")[0]!.size;
    await bob.primary.engine.send(g, { text: "secret echo" });
    await settle(world);
    await expect(errorCode(backupB.backupNow())).resolves.toBe(
      "E2EE_BACKUP_QUOTA"
    );
    expect(backupB.getSnapshot().lastError).toBe("E2EE_BACKUP_QUOTA");
    server.quotaBytes = 256 * 1024 * 1024;
    await backupB.backupNow();
    expect(backupB.getSnapshot().lastError).toBeNull();

    // Turn off (revoke the code): everything is deleted on the server; the
    // other connected device notices on its next run.
    await backupB.turnOff();
    expect(server.generations("alice")).toHaveLength(0);
    expect(backupB.getSnapshot().phase).toBe("off");
    await expect(errorCode(backupC.backupNow())).resolves.toBe(
      "E2EE_BACKUP_REPLACED"
    );
    expect(backupC.getSnapshot().phase).toBe("off");
    await expect(errorCode(backupC.restore(rotated.code))).resolves.toBe(
      "E2EE_BACKUP_NONE"
    );
  });
});
