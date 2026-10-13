/**
 * @jest-environment node
 */
import { utf8Encode } from "@/lib/e2ee/bytes";
import {
  decodePayload,
  encodePayload,
  MAX_BODY_BYTES,
  newMessageId,
  parsePayload,
  PayloadError,
  type Payload,
} from "@/lib/e2ee/payload";

const ID = "00112233445566778899aabbccddeeff";
const ID2 = "ffeeddccbbaa99887766554433221100";
const attachment = {
  blob: "0x0123456789abcdef0123456789abcdef",
  k: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  n: "AAAAAAAAAAAAAAAA",
  chunks: 1,
  mime: "image/png",
  size: 10,
  name: "a.png",
  w: 4,
  h: 3,
};

describe("payload codec (contract 6)", () => {
  it("round-trips every payload type", () => {
    const payloads: Payload[] = [
      {
        v: 1,
        t: "msg",
        id: ID,
        ts: 1,
        text: "hi",
        mentions: ["p2"],
        reply: ID2,
        att: [attachment],
      },
      {
        v: 1,
        t: "edit",
        id: ID,
        ts: 2,
        target: ID2,
        text: "edited",
        mentions: [],
      },
      { v: 1, t: "del", id: ID, ts: 3, target: ID2 },
      { v: 1, t: "react", id: ID, ts: 4, target: ID2, r: ":fire:" },
      { v: 1, t: "unreact", id: ID, ts: 5, target: ID2, r: "🔥" },
    ];
    for (const payload of payloads) {
      expect(decodePayload(encodePayload(payload))).toEqual(payload);
    }
  });

  it("ignores unknown fields and defaults optional ones", () => {
    const parsed = parsePayload({
      v: 1,
      t: "msg",
      id: ID,
      ts: 1,
      text: "x",
      extra: true,
    });
    expect(parsed).toEqual({
      v: 1,
      t: "msg",
      id: ID,
      ts: 1,
      text: "x",
      mentions: [],
    });
  });

  it("rejects bad versions, ids, types and limits", () => {
    const bad: unknown[] = [
      null,
      [],
      { v: 2, t: "msg", id: ID, ts: 1, text: "" },
      { v: 1, t: "msg", id: "XYZ", ts: 1, text: "" },
      { v: 1, t: "msg", id: ID, ts: -1, text: "" },
      { v: 1, t: "nope", id: ID, ts: 1, target: ID2 },
      { v: 1, t: "msg", id: ID, ts: 1, text: "x".repeat(10_001) },
      { v: 1, t: "msg", id: ID, ts: 1, text: "", reply: "short" },
      {
        v: 1,
        t: "msg",
        id: ID,
        ts: 1,
        text: "",
        att: new Array(11).fill(attachment),
      },
      {
        v: 1,
        t: "msg",
        id: ID,
        ts: 1,
        text: "",
        att: [{ ...attachment, blob: "0x12" }],
      },
      {
        v: 1,
        t: "msg",
        id: ID,
        ts: 1,
        text: "",
        att: [{ ...attachment, w: -1 }],
      },
      { v: 1, t: "edit", id: ID, ts: 1, target: ID2 },
      { v: 1, t: "del", id: ID, ts: 1 },
      { v: 1, t: "react", id: ID, ts: 1, target: ID2, r: "" },
      { v: 1, t: "react", id: ID, ts: 1, target: ID2, r: "x".repeat(65) },
      { v: 1, t: "msg", id: ID, ts: 1, text: "", mentions: [1] },
    ];
    for (const value of bad) {
      expect(parsePayload(value)).toBeNull();
    }
  });

  it("counts text and reactions in characters, not UTF-16 units", () => {
    const emoji = "😀".repeat(10_000);
    expect(
      parsePayload({ v: 1, t: "msg", id: ID, ts: 1, text: emoji })
    ).not.toBeNull();
    expect(
      parsePayload({
        v: 1,
        t: "react",
        id: ID,
        ts: 1,
        target: ID2,
        r: "😀".repeat(64),
      })
    ).not.toBeNull();
  });

  it("decodes only valid UTF-8 JSON within the size limit", () => {
    expect(decodePayload(new Uint8Array([0xff, 0xfe]))).toBeNull();
    expect(decodePayload(utf8Encode("not json"))).toBeNull();
    expect(decodePayload(new Uint8Array(MAX_BODY_BYTES + 1))).toBeNull();
  });

  it("refuses to encode invalid or oversized payloads", () => {
    expect(() =>
      encodePayload({ v: 1, t: "del", id: "x", ts: 1, target: ID2 })
    ).toThrow(PayloadError);
    const big: Payload = {
      v: 1,
      t: "msg",
      id: ID,
      ts: 1,
      text: "\u0001".repeat(10_000),
      mentions: [],
    };
    expect(() => encodePayload(big)).toThrow("E2EE_PAYLOAD_TOO_LARGE");
  });

  it("generates 32-hex ids", () => {
    expect(newMessageId()).toMatch(/^[0-9a-f]{32}$/);
    expect(newMessageId()).not.toBe(newMessageId());
  });
});
