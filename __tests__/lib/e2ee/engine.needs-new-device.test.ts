/** @jest-environment node */
import type { EngineContext } from "@/lib/e2ee/engine/context";
import { needsNewDevice } from "@/lib/e2ee/engine/enroll";
import { E2EE_CIPHERSUITE } from "@/lib/e2ee/grant";
import type { StoredDevice } from "@/lib/e2ee/records";
import { createMemoryE2eeStorage } from "@/lib/e2ee/storage";

const NOW = 1_800_000_000_000;
const DAY_S = 86_400;
const WALLET = "0x1111111111111111111111111111111111111111";
const ORIGIN = "6529.io";

const device = (change: Partial<StoredDevice> = {}): StoredDevice => {
  const base: StoredDevice = {
    profileId: "alice",
    deviceKey: `0x${"3d".repeat(32)}`,
    wallet: WALLET,
    grant: {
      wallet: WALLET,
      device_key: `0x${"3d".repeat(32)}`,
      ciphersuite: E2EE_CIPHERSUITE,
      issued_at: NOW / 1000,
      expires_at: NOW / 1000 + 180 * DAY_S,
      origin: ORIGIN,
    },
    grantId: `0x${"7".repeat(64)}`,
    walletSignature: "0x",
    registered: false,
    provisioned: false,
    label: "Device",
    platform: "web",
    createdAt: NOW,
    lastResortAt: null,
  };
  return { ...base, ...change, grant: { ...base.grant, ...change.grant } };
};

async function subject(stored: StoredDevice | null): Promise<boolean> {
  const storage = createMemoryE2eeStorage();
  if (stored) {
    await storage.writeBatch("alice", { device: stored });
  }
  const ctx = {
    storage,
    profileId: "alice",
    now: () => NOW,
    options: { wallet: WALLET, origin: ORIGIN },
  } as unknown as EngineContext;
  return needsNewDevice(ctx);
}

describe("needsNewDevice (NC8 turn-on)", () => {
  it("needs a new key when this browser holds no device", async () => {
    await expect(subject(null)).resolves.toBe(true);
  });

  it("resumes a registered device instead (renewal, provisioning)", async () => {
    await expect(subject(device({ registered: true }))).resolves.toBe(false);
  });

  it("leaves a registered device from another suite to enroll()", async () => {
    await expect(
      subject(
        device({
          registered: true,
          grant: { ...device().grant, ciphersuite: 0x0001 },
        })
      )
    ).resolves.toBe(false);
  });

  it("registers a pending grant that is still reusable without a prompt", async () => {
    await expect(subject(device())).resolves.toBe(false);
    await expect(
      subject(device({ loginGrantId: `0x${"7".repeat(64)}` }))
    ).resolves.toBe(false);
  });

  it.each([
    ["it is about to expire", { expires_at: NOW / 1000 + 6 * DAY_S }],
    ["another wallet signed it", { wallet: `0x${"2".repeat(40)}` }],
    ["another origin was granted", { origin: "staging.6529.io" }],
    ["it is on another suite", { ciphersuite: 0x0001 }],
  ])(
    "needs a new key when a pending grant cannot be reused (%s)",
    async (_label, grant) => {
      const stored = device({ grant: { ...device().grant, ...grant } });
      await expect(
        subject(
          "wallet" in grant ? { ...stored, wallet: grant.wallet } : stored
        )
      ).resolves.toBe(true);
    }
  );
});
