import { newRuntime } from "@/lib/e2ee/engine/groups";
import {
  displayText,
  fromImportedPayload,
  importedText,
  toImportedPayload,
} from "@/lib/e2ee/engine/imported";
import { applyPayload, type PayloadMeta } from "@/lib/e2ee/engine/messages";
import { toE2eeMessage } from "@/lib/e2ee/engine/store";
import {
  importedHeader,
  parseImported,
  type ImportedPayload,
} from "@/lib/e2ee/imported-payload";
import {
  decodePayload,
  encodePayload,
  type MsgPayload,
} from "@/lib/e2ee/payload";
import type { StoredGroup } from "@/lib/e2ee/records";
import type { E2eeImported } from "@/lib/e2ee/types";

const IMPORTED: E2eeImported = {
  waveId: "wave-1",
  dropId: "drop-1",
  part: 0,
  serialNo: 42,
  authorProfileId: "alice-id",
  authorHandle: "alice",
  createdAt: Date.UTC(2025, 2, 3, 14, 2),
  editedAt: null,
  replyToDropId: null,
  mediaNotImported: 1,
  reactions: [[":fire:", 3]],
};

const id = (n: number) => n.toString(16).padStart(32, "0");

function importedMsg(n: number, original = IMPORTED): MsgPayload {
  const { text, headerLength } = importedText(original, "hello there");
  return {
    v: 1,
    t: "msg",
    id: id(n),
    ts: 1_000 + n,
    text,
    mentions: [],
    imp: toImportedPayload(original, headerLength),
  };
}

const meta = (profile: string, seq: number): PayloadMeta => ({
  g: "g",
  seq,
  // Imports happen after the original was written (2026, not 1970).
  serverTs: Date.UTC(2026, 9, 1) + seq * 1000,
  senderProfileId: profile,
  senderDeviceKey: `${profile}-device`,
  sigOk: true,
  epoch: 1,
  body: null,
  sig: null,
  pending: false,
});

describe("imported payload (D146 extension of contract 6)", () => {
  it("writes a plain English UTC header for clients that predate imports", () => {
    expect(
      importedHeader({ authorHandle: "alice", createdAt: IMPORTED.createdAt })
    ).toBe(
      "[Imported from unencrypted DM, not verified] @alice, 2025-03-03 14:02 UTC:\n"
    );
    expect(
      importedHeader({ authorHandle: null, createdAt: 0 }).startsWith(
        "[Imported from unencrypted DM, not verified] unknown,"
      )
    ).toBe(true);
  });

  it("round-trips through encode and decode", () => {
    const payload = importedMsg(1);
    const decoded = decodePayload(encodePayload(payload)) as MsgPayload;
    expect(decoded.imp).toEqual(payload.imp);
    expect(
      fromImportedPayload(decoded.imp as ImportedPayload, Date.now())
    ).toEqual(IMPORTED);
  });

  it("never shows an original time later than the import itself", () => {
    const imp = importedMsg(1).imp as ImportedPayload;
    const importedAt = imp.at - 60_000;
    const shown = fromImportedPayload(
      { ...imp, e: imp.at + 5_000 },
      importedAt
    );
    expect(shown.createdAt).toBe(importedAt);
    expect(shown.editedAt).toBe(importedAt);
    expect(fromImportedPayload({ ...imp, e: null }, importedAt).editedAt).toBe(
      null
    );
  });

  it("drops a malformed imp but keeps the message", () => {
    const payload = importedMsg(1);
    const broken = {
      ...payload,
      imp: { ...payload.imp, hl: payload.text.length + 1 },
    };
    const decoded = decodePayload(
      new TextEncoder().encode(JSON.stringify(broken))
    ) as MsgPayload;
    expect(decoded.t).toBe("msg");
    expect(decoded.imp).toBeUndefined();
    expect(decoded.text).toBe(payload.text);
  });

  it.each([
    ["wrong source", { src: "elsewhere" }],
    ["empty drop id", { d: "" }],
    ["spaces in an id", { a: "a b" }],
    ["negative time", { at: -1 }],
    ["too many reactions", { rx: Array.from({ length: 51 }, () => ["x", 1]) }],
    ["bad reaction count", { rx: [["x", -1]] }],
  ])("rejects %s", (_label, change) => {
    const payload = importedMsg(1);
    expect(
      parseImported({ ...payload.imp, ...change }, payload.text)
    ).toBeNull();
  });
});

describe("imported messages in the timeline", () => {
  const runtime = () => newRuntime({ g: "g" } as StoredGroup);

  it("shows the original text, author and time, keeping the sender", () => {
    const rt = runtime();
    expect(applyPayload(rt, importedMsg(1), meta("bob-id", 1))).toBe(true);
    const stored = rt.messages.get(id(1));
    expect(stored && displayText(stored)).toBe("hello there");
    const message = toE2eeMessage(stored!);
    expect(message.text).toBe("hello there");
    expect(message.senderProfileId).toBe("bob-id");
    expect(message.imported?.authorHandle).toBe("alice");
    expect(message.imported?.createdAt).toBe(IMPORTED.createdAt);
  });

  it("keeps the first copy of an original and ignores later ones", () => {
    const rt = runtime();
    applyPayload(rt, importedMsg(1), meta("bob-id", 1));
    expect(applyPayload(rt, importedMsg(2), meta("alice-id", 2))).toBe(false);
    expect(rt.messages.has(id(2))).toBe(false);
    const otherPart = importedMsg(3, { ...IMPORTED, part: 1 });
    expect(applyPayload(rt, otherPart, meta("bob-id", 3))).toBe(true);
  });

  it("accepts a fresh copy once the earlier one was deleted", () => {
    const rt = runtime();
    applyPayload(rt, importedMsg(1), meta("bob-id", 1));
    applyPayload(
      rt,
      { v: 1, t: "del", id: id(9), ts: 9, target: id(1) },
      meta("bob-id", 2)
    );
    expect(applyPayload(rt, importedMsg(3), meta("bob-id", 3))).toBe(true);
  });

  it("leaves ordinary messages alone", () => {
    const rt = runtime();
    applyPayload(
      rt,
      { v: 1, t: "msg", id: id(1), ts: 1, text: "hi", mentions: [] },
      meta("bob-id", 1)
    );
    const message = toE2eeMessage(rt.messages.get(id(1))!);
    expect(message.text).toBe("hi");
    expect(message.imported).toBeUndefined();
  });
});
