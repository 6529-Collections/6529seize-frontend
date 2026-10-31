/**
 * @jest-environment node
 */
import {
  acquireE2eeEngineLock,
  type AcquireE2eeEngineLockInput,
  getE2eeEngineLockName,
} from "@/lib/e2ee/engine-lock";
import { createFakeChannels, createFakeLocks } from "./support/fakeLocks";

const PROFILE = "profile-1";

const flush = async (rounds = 5) => {
  for (let i = 0; i < rounds; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

function tab(
  locks: LockManager | null,
  createChannel: (name: string) => BroadcastChannel,
  overrides: Partial<AcquireE2eeEngineLockInput> = {}
) {
  const controller = new AbortController();
  const onBusy = jest.fn();
  const onLost = jest.fn();
  const input: AcquireE2eeEngineLockInput = {
    profileId: PROFILE,
    takeOver: false,
    signal: controller.signal,
    onBusy,
    onLost,
    locks,
    createChannel,
    handoverTimeoutMs: 50,
    ...overrides,
  };
  return { controller, onBusy, onLost, lease: acquireE2eeEngineLock(input) };
}

describe("acquireE2eeEngineLock", () => {
  it("names the lock per profile", () => {
    expect(getE2eeEngineLockName("abc")).toBe("6529-e2ee-engine:abc");
  });

  it("blocks a second engine while the first holds the lock", async () => {
    const locks = createFakeLocks();
    const channels = createFakeChannels();
    const first = tab(locks, channels);
    const firstLease = await first.lease;
    expect(firstLease.unguarded).toBe(false);
    expect(locks.isHeld(getE2eeEngineLockName(PROFILE))).toBe(true);

    const second = tab(locks, channels);
    const settled = jest.fn();
    void second.lease.then(settled);
    await flush();
    expect(second.onBusy).toHaveBeenCalledTimes(1);
    expect(settled).not.toHaveBeenCalled();

    // The waiting tab gets the lock once the owner closes.
    firstLease.release();
    await flush();
    expect(settled).toHaveBeenCalledTimes(1);
    expect(first.onLost).not.toHaveBeenCalled();
  });

  it("other profiles are independent", async () => {
    const locks = createFakeLocks();
    const channels = createFakeChannels();
    await tab(locks, channels).lease;
    const other = tab(locks, channels, { profileId: "profile-2" });
    await expect(other.lease).resolves.toMatchObject({ unguarded: false });
    expect(other.onBusy).not.toHaveBeenCalled();
  });

  it("hands over on 'Use here': the owner is asked, releases, and the requester takes the lock", async () => {
    const locks = createFakeLocks();
    const channels = createFakeChannels();
    const owner = tab(locks, channels);
    const ownerLease = await owner.lease;
    owner.onLost.mockImplementation(() => {
      // The owner stops its engine, then gives the lock back.
      ownerLease.release();
    });

    const requester = tab(locks, channels, {
      takeOver: true,
      handoverTimeoutMs: 5_000,
    });
    const lease = await requester.lease;
    expect(owner.onLost).toHaveBeenCalledTimes(1);
    expect(lease.unguarded).toBe(false);
    expect(locks.isHeld(getE2eeEngineLockName(PROFILE))).toBe(true);
    expect(requester.onBusy).not.toHaveBeenCalled();
  });

  it("takes the lock from an owner that never answers, which then learns it lost it", async () => {
    const locks = createFakeLocks();
    const channels = createFakeChannels();
    const owner = tab(locks, channels, { createChannel: () => null as never });
    await owner.lease;

    const requester = tab(locks, channels, { takeOver: true });
    await expect(requester.lease).resolves.toMatchObject({ unguarded: false });
    await flush();
    expect(owner.onLost).toHaveBeenCalledTimes(1);
  });

  it("stops waiting when aborted", async () => {
    const locks = createFakeLocks();
    const channels = createFakeChannels();
    await tab(locks, channels).lease;
    const waiting = tab(locks, channels);
    await flush();
    waiting.controller.abort();
    await expect(waiting.lease).rejects.toMatchObject({ name: "AbortError" });
  });

  it("falls back to the old behaviour with a warning when Web Locks are missing", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const channels = createFakeChannels();
    const first = await tab(null, channels).lease;
    const second = await tab(null, channels).lease;
    expect(first.unguarded).toBe(true);
    expect(second.unguarded).toBe(true);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Web Locks are unavailable")
    );
    warn.mockRestore();
  });
});
