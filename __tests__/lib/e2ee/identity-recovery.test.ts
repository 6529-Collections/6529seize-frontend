/** @jest-environment node */
import { E2eeApiError } from "@/lib/e2ee/api-errors";
import { createContext, loadGroups } from "@/lib/e2ee/engine/setup";
import { loadSavedHistory } from "@/lib/e2ee/engine/history-read";
import { recoverLoadedIdentities } from "@/lib/e2ee/engine/identity-recovery";
import {
  profileOfLeaf,
  rememberDeviceProfile,
} from "@/lib/e2ee/engine/member-identity";
import { addUser, createWorld, settle, type World } from "./support/harness";

jest.setTimeout(120_000);
let world: World;
afterEach(() => {
  for (const device of world?.devices ?? []) device.engine.dispose();
});

async function savedConversation() {
  world = await createWorld();
  const alice = await addUser(world, "alice", undefined, { noWake: true });
  const bob = await addUser(world, "bob", undefined, { noWake: true });
  const g = await alice.primary.engine.createConversation({
    kind: "dm",
    profileIds: ["bob"],
  });
  await settle(world);
  await alice.primary.engine.send(g, { text: "keep this history" });
  await settle(world);
  for (const device of world.devices) {
    await device.engine.idle();
    device.engine.dispose();
  }
  const ctx = createContext(bob.primary.options);
  ctx.stateVersion = await ctx.storage.getStateVersion("bob");
  return { alice, bob, ctx, g };
}

describe("encrypted author identity recovery", () => {
  it("reuses a saved device owner after restart without another directory read", async () => {
    const { alice, ctx } = await savedConversation();
    await loadGroups(ctx);
    const get = jest
      .spyOn(ctx.api, "getDevice")
      .mockRejectedValue(new E2eeApiError({ status: 429, message: "limited" }));
    await expect(
      profileOfLeaf(ctx, alice.primary.engine.getThisDevice()!.deviceKey)
    ).resolves.toBe("alice");
    expect(get).not.toHaveBeenCalled();
  });

  it("repairs stored null authors after a transient device lookup failure and keeps AES-256 history", async () => {
    const { alice, bob, ctx, g } = await savedConversation();
    const original = (await ctx.storage.listMessages("bob", g)).find(
      (m) => m.text === "keep this history"
    )!;
    const record = (await ctx.storage.listGroups("bob")).find(
      (group) => group.g === g
    )!;
    const key = alice.primary.engine.getThisDevice()!.deviceKey;
    original.senderProfileId = null;
    for (const member of record.members)
      if (member.deviceKey === key) member.profileId = null;
    await ctx.storage.writeBatch("bob", {
      expectedVersion: ctx.stateVersion,
      groups: [record],
      messages: [original],
    });
    ctx.stateVersion += 1;
    const wasmBefore = await ctx.storage.getWasmState("bob");
    const originalGet = ctx.api.getDevice.bind(ctx.api);
    const lookup = jest.spyOn(ctx.api, "getDevice").mockRejectedValue(
      new E2eeApiError({
        status: 429,
        message: "limited",
        retryAfterMs: 60_000,
      })
    );
    await loadGroups(ctx);
    await loadSavedHistory(ctx, g);
    expect(
      (await ctx.storage.getMessage("bob", g, original.id))?.senderProfileId
    ).toBeNull();
    const calls = lookup.mock.calls.length;
    for (let n = 0; n < 10; n += 1)
      await ctx.queue.run(() => recoverLoadedIdentities(ctx));
    expect(lookup).toHaveBeenCalledTimes(calls);
    world.clock.advance(60_000);
    lookup.mockImplementation(originalGet);
    await ctx.queue.run(() => recoverLoadedIdentities(ctx));
    expect(
      (await ctx.storage.getMessage("bob", g, original.id))?.senderProfileId
    ).toBe("alice");
    expect((await ctx.storage.getMessage("bob", g, original.id))?.text).toBe(
      "keep this history"
    );
    expect(await ctx.storage.getWasmState("bob")).toEqual(wasmBefore);
    expect(ctx.store.groups.get(g)?.record.ciphersuite).toBe(
      record.ciphersuite
    );
    expect(ctx.store.groups.get(g)?.record.history?.unread).toBe(
      record.history?.unread
    );
    const restarted = createContext(bob.primary.options);
    restarted.stateVersion = await restarted.storage.getStateVersion("bob");
    await loadGroups(restarted);
    await loadSavedHistory(restarted, g);
    expect(
      restarted.store.getMessages(g).find((m) => m.id === original.id)
        ?.senderProfileId
    ).toBe("alice");
  });

  it("retains an unresolved sender without repeating a failed device lookup on every sync", async () => {
    const { alice, ctx } = await savedConversation();
    const key = alice.primary.engine.getThisDevice()!.deviceKey;
    const get = jest
      .spyOn(ctx.api, "getDevice")
      .mockRejectedValue(new E2eeApiError({ status: 429, message: "limited" }));
    for (let n = 0; n < 100; n += 1)
      await expect(profileOfLeaf(ctx, key)).resolves.toBeNull();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("never chooses an owner when saved associations conflict", async () => {
    const { ctx } = await savedConversation();
    rememberDeviceProfile(ctx, "device", "alice");
    rememberDeviceProfile(ctx, "device", "bob");
    const get = jest.spyOn(ctx.api, "getDevice");
    await expect(profileOfLeaf(ctx, "device")).resolves.toBeNull();
    expect(get).not.toHaveBeenCalled();
  });
});
