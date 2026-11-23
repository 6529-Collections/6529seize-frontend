import {
  readKeysRecord,
  storeKeysRecord,
} from "@/lib/personal-records/keys-record-cache";
import type { SignedRecordEvent } from "@/lib/signed-records/record-event";

const DEVICE_KEY = `0x${"0a".repeat(32)}`;
const GRANT = `0x${"0b".repeat(32)}`;
const WAVE = `pv/0x${"0c".repeat(32)}`;

const event = {
  id: `0x${"0d".repeat(32)}`,
  anchor: 1000,
  device_key: DEVICE_KEY,
  auth_ref: GRANT,
  wave: WAVE,
  refs: ["keys"],
} as unknown as SignedRecordEvent;

const scope = (ids: readonly string[]) => ({
  deviceKey: DEVICE_KEY,
  gen: 1,
  grantId: GRANT,
  wave: WAVE,
  providerKeys: ids.map((id) => ({ id, publicKey: `0x${"0E".repeat(32)}` })),
});

describe("keys record cache", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it("serves the record whatever order the provider keys come in", () => {
    storeKeysRecord(scope(["b", "B", "a"]), event);
    expect(readKeysRecord(scope(["a", "b", "B"]))).toEqual(event);
    expect(readKeysRecord(scope(["a", "b"]))).toBeNull();
  });

  it("keeps the provider keys in code-unit order, as records written before", () => {
    storeKeysRecord(scope(["b", "a", "B"]), event);
    const stored = JSON.parse(
      globalThis.localStorage.getItem(
        `6529-personal-records-keys:${DEVICE_KEY}`
      ) ?? "null"
    );
    const key = `0x${"0e".repeat(32)}`;
    expect(stored.providers).toBe(`B=${key},a=${key},b=${key}`);
  });
});
