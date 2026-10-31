/**
 * @jest-environment node
 */
import type { DeviceDirectory } from "@/lib/e2ee/engine/directory";
import { newRuntime } from "@/lib/e2ee/engine/groups";
import { EngineStore } from "@/lib/e2ee/engine/store";
import type { StoredGroup } from "@/lib/e2ee/records";

const GHOST = `0x${"Ab".repeat(32)}`;
const WALLET = `0x${"Cd".repeat(20)}`;

const directory = {
  version: 0,
  cached: () => null,
  isVerified: () => false,
} as unknown as DeviceDirectory;

const group = (g: string, profiles: string[]): StoredGroup =>
  ({
    g,
    status: "active",
    metadata: {
      v: 1,
      g,
      kind: "group",
      name: null,
      admins: [],
      created_by: profiles[0],
      history: "from_join",
    },
    epoch: 1,
    epochFp: "0".repeat(16),
    members: profiles.map((profileId, leaf) => ({
      deviceKey: `0x${leaf}${g}`,
      profileId,
      leaf,
      identity: "",
    })),
    leaving: [],
    splitView: false,
    delayed: false,
    readSeq: 0,
    updatedAt: 0,
  }) as unknown as StoredGroup;

describe("EngineStore untrusted devices", () => {
  it("normalizes keys and clears a device from every chat at once", () => {
    const store = new EngineStore("alice", directory);
    store.groups.set("g1", newRuntime(group("g1", ["alice", "bob"])));
    store.groups.set("g2", newRuntime(group("g2", ["alice", "bob", "carol"])));
    store.setUntrusted("bob", [
      {
        profileId: "bob",
        deviceKey: GHOST,
        wallet: WALLET,
        reason: "new-wallet",
      },
    ]);
    const expected = {
      profileId: "bob",
      deviceKey: GHOST.toLowerCase(),
      wallet: WALLET.toLowerCase(),
      reason: "new-wallet",
    };
    expect(store.getConversation("g1")?.untrustedDevices).toEqual([expected]);
    expect(store.getConversation("g2")?.untrustedDevices).toEqual([expected]);
    expect(
      store.findUntrusted(GHOST.toUpperCase().replace("0X", "0x"))
    ).toEqual(expected);

    store.dropUntrusted(GHOST);
    expect(store.findUntrusted(GHOST)).toBeNull();
    expect(store.getConversation("g1")?.untrustedDevices).toEqual([]);
    expect(store.getConversation("g2")?.untrustedDevices).toEqual([]);
  });
});
