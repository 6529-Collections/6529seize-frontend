/**
 * @jest-environment node
 */
const mockValues = new Map<string, unknown>();
jest.mock("@/lib/storage/idb-keyval", () => ({
  createStore: () => "store",
  get: async (key: string) => mockValues.get(key),
  set: async (key: string, value: unknown) => {
    mockValues.set(key, value);
  },
}));

import {
  getOrCreateSenderKey,
  rotateSenderKey,
} from "@/lib/signed-records/sender-keys";

const DEVICE = `0x${"ab".repeat(32)}`;
const NOW_SECONDS = 1_795_694_700;

beforeEach(() => {
  mockValues.clear();
  jest.useFakeTimers({ now: NOW_SECONDS * 1000 });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("sender keys", () => {
  it("creates a key once, at the current second's generation, and keeps it", async () => {
    const first = await getOrCreateSenderKey(DEVICE.toUpperCase(), 1);
    expect(first).toMatchObject({
      deviceKey: DEVICE,
      cls: 1,
      gen: NOW_SECONDS,
    });
    expect(first.key).toHaveLength(32);
    await expect(getOrCreateSenderKey(DEVICE, 1)).resolves.toEqual(first);
    const own = await getOrCreateSenderKey(DEVICE, 2);
    expect(own.key).not.toEqual(first.key);
  });

  it("rotates to a new key and a later generation, even within one second", async () => {
    const first = await getOrCreateSenderKey(DEVICE, 1);
    const second = await rotateSenderKey(DEVICE, 1);
    expect(second.gen).toBe(first.gen + 1);
    expect(second.key).not.toEqual(first.key);
    await expect(getOrCreateSenderKey(DEVICE, 1)).resolves.toEqual(second);
  });

  it("never reuses a generation when this store is lost and the device key stays", async () => {
    const first = await getOrCreateSenderKey(DEVICE, 1);
    mockValues.clear();
    jest.setSystemTime((NOW_SECONDS + 60) * 1000);
    const again = await getOrCreateSenderKey(DEVICE, 1);
    expect(again.gen).toBeGreaterThan(first.gen);
  });
});
