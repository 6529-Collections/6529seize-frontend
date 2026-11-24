/**
 * @jest-environment node
 */
import { utf8Decode, utf8Encode } from "@/lib/e2ee/bytes";
import {
  decodeReadSync,
  encodeReadSync,
  newReadSyncId,
  pagePositions,
  type ReadPosition,
} from "@/lib/e2ee/read-sync-payload";

/** P60 §3: every payload is 3,072 bytes and carries at most 32 positions. */
const READ_SYNC_BODY_BYTES = 3072;
const READ_SYNC_MAX_POSITIONS = 32;

const handle = (n: number): string => `0x${n.toString(16).padStart(64, "0")}`;

const full = (seq: number): ReadPosition[] =>
  Array.from({ length: READ_SYNC_MAX_POSITIONS }, (_, i) => [handle(i), seq]);

describe("read-sync payload (D175, P60 §3)", () => {
  it("pads every payload to the same length, whatever it carries", () => {
    const lengths = [
      encodeReadSync({ v: 1, t: "hello", id: newReadSyncId(), ts: 0, r: [] }),
      encodeReadSync({
        v: 1,
        t: "read",
        id: newReadSyncId(),
        ts: 1_762_790_400_000,
        r: [[handle(1), 7]],
      }),
      encodeReadSync({
        v: 1,
        t: "snap",
        id: newReadSyncId(),
        ts: Number.MAX_SAFE_INTEGER,
        r: full(Number.MAX_SAFE_INTEGER),
        s: [newReadSyncId(), 63, 63],
      }),
    ].map((bytes) => bytes.length);
    expect(lengths).toEqual([
      READ_SYNC_BODY_BYTES,
      READ_SYNC_BODY_BYTES,
      READ_SYNC_BODY_BYTES,
    ]);
  });

  it("round-trips and refuses more positions than one page holds", () => {
    const payload = {
      v: 1 as const,
      t: "snap" as const,
      id: newReadSyncId(),
      ts: 5,
      r: full(42),
      s: [newReadSyncId(), 2, 3] as const,
    };
    expect(decodeReadSync(encodeReadSync(payload))).toEqual(payload);
    expect(() =>
      encodeReadSync({ ...payload, r: [...full(1), [handle(99), 1]] })
    ).toThrow("E2EE_READ_SYNC_TOO_MANY");
  });

  it("ignores what this version does not understand", () => {
    const base = { v: 1, t: "read", id: newReadSyncId(), ts: 0, r: [] };
    const decode = (value: unknown) =>
      decodeReadSync(utf8Encode(JSON.stringify(value)));
    expect(decode(base)).not.toBeNull();
    expect(decode({ ...base, v: 2 })).toBeNull();
    expect(decode({ ...base, t: "unread" })).toBeNull();
    expect(decode({ ...base, id: "nope" })).toBeNull();
    expect(decode({ ...base, r: "x" })).toBeNull();
    expect(decode({ ...base, t: "snap" })).toBeNull();
    expect(decode({ ...base, t: "snap", s: ["x", 1, 1] })).toBeNull();
    expect(
      decode({ ...base, t: "snap", s: [newReadSyncId(), 2, 1] })
    ).toBeNull();
    expect(decode([base])).toBeNull();
    expect(decodeReadSync(utf8Encode("{"))).toBeNull();
    // Unknown fields are allowed for later versions of the same type.
    expect(decode({ ...base, extra: true })?.t).toBe("read");
  });

  it("drops malformed positions one by one and lowercases handles", () => {
    const upper = `0x${handle(0xabc).slice(2).toUpperCase()}`;
    const decoded = decodeReadSync(
      utf8Encode(
        JSON.stringify({
          v: 1,
          t: "read",
          id: newReadSyncId(),
          ts: "late",
          r: [
            [handle(1), 4],
            [handle(2), -1],
            [handle(2), 1.5],
            ["0x12", 3],
            [upper, 9],
            [handle(4)],
            "x",
          ],
        })
      )
    );
    expect(decoded?.r).toEqual([
      [handle(1), 4],
      [handle(0xabc), 9],
    ]);
    expect(decoded?.ts).toBe(0);
  });

  it("splits long position lists into pages", () => {
    const positions: ReadPosition[] = Array.from({ length: 70 }, (_, i) => [
      handle(i),
      i,
    ]);
    const pages = pagePositions(positions);
    expect(pages.map((page) => page.length)).toEqual([32, 32, 6]);
    expect(pages.flat()).toEqual(positions);
    expect(pagePositions([])).toEqual([]);
    expect(
      utf8Decode(
        encodeReadSync({
          v: 1,
          t: "read",
          id: newReadSyncId(),
          ts: 0,
          r: pages[0] ?? [],
        })
      ).startsWith('{"v":1,"t":"read"')
    ).toBe(true);
  });
});
