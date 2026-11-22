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

beforeEach(() => {
  mockValues.clear();
});

describe("sender keys", () => {
  it("creates generation 1 once and keeps it", async () => {
    const first = await getOrCreateSenderKey(DEVICE.toUpperCase(), 1);
    expect(first).toMatchObject({ deviceKey: DEVICE, cls: 1, gen: 1 });
    expect(first.key).toHaveLength(32);
    await expect(getOrCreateSenderKey(DEVICE, 1)).resolves.toEqual(first);
    const own = await getOrCreateSenderKey(DEVICE, 2);
    expect(own.key).not.toEqual(first.key);
  });

  it("rotates to a new key and the next generation", async () => {
    const first = await getOrCreateSenderKey(DEVICE, 1);
    const second = await rotateSenderKey(DEVICE, 1);
    expect(second.gen).toBe(2);
    expect(second.key).not.toEqual(first.key);
    await expect(getOrCreateSenderKey(DEVICE, 1)).resolves.toEqual(second);
  });
});
