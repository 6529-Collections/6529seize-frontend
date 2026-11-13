import { newRuntime } from "@/lib/e2ee/engine/groups";
import {
  applyPayload,
  placeholderMessage,
  searchMessages,
  type PayloadMeta,
} from "@/lib/e2ee/engine/messages";
import { compareMessages, toE2eeMessage } from "@/lib/e2ee/engine/store";
import type { StoredGroup } from "@/lib/e2ee/records";

const ID = "00112233445566778899aabbccddeeff";
const runtime = () => newRuntime({ g: "g" } as StoredGroup);
const meta = (profile: string, seq: number, sigOk = true): PayloadMeta => ({
  g: "g",
  seq,
  serverTs: seq * 1000,
  senderProfileId: profile,
  senderDeviceKey: `${profile}-device`,
  sigOk,
  epoch: 1,
  body: "Ym9keQ==",
  sig: "0xsig",
  pending: false,
});

const id = (n: number) => n.toString(16).padStart(32, "0");

describe("message rules (contract 6)", () => {
  it("keeps the latest edit's own signed copy for reports", () => {
    const rt = runtime();
    applyPayload(
      rt,
      { v: 1, t: "msg", id: ID, ts: 1, text: "hello", mentions: [] },
      meta("alice", 1)
    );
    expect(rt.messages.get(ID)?.latestEdit).toBeUndefined();
    const edit = (n: number, text: string) =>
      ({
        v: 1,
        t: "edit",
        id: id(n),
        ts: n,
        target: ID,
        text,
        mentions: [] as string[],
      }) as const;
    applyPayload(rt, edit(2, "first edit"), {
      ...meta("alice", 2),
      epoch: 2,
      body: "ZWRpdDE=",
      sig: "0xedit1",
      senderDeviceKey: "alice-phone",
    });
    expect(rt.messages.get(ID)).toMatchObject({
      text: "first edit",
      body: "Ym9keQ==",
      sig: "0xsig",
      latestEdit: {
        epoch: 2,
        body: "ZWRpdDE=",
        sig: "0xedit1",
        senderDeviceKey: "alice-phone",
      },
    });
    // An edit without a signed copy (this device's own) leaves none to send.
    applyPayload(rt, edit(3, "own edit"), {
      ...meta("alice", 0),
      body: null,
      sig: null,
      epoch: null,
      pending: true,
    });
    expect(rt.messages.get(ID)?.latestEdit).toBeNull();
  });

  it("applies msg once; edit and del only by the same profile", () => {
    const rt = runtime();
    expect(
      applyPayload(
        rt,
        { v: 1, t: "msg", id: ID, ts: 1, text: "hello", mentions: ["bob"] },
        meta("alice", 1)
      )
    ).toBe(true);
    expect(
      applyPayload(
        rt,
        { v: 1, t: "msg", id: ID, ts: 1, text: "dup", mentions: [] },
        meta("alice", 2)
      )
    ).toBe(false);
    expect(
      applyPayload(
        rt,
        {
          v: 1,
          t: "edit",
          id: id(2),
          ts: 5,
          target: ID,
          text: "hijack",
          mentions: [],
        },
        meta("bob", 3)
      )
    ).toBe(false);
    expect(
      applyPayload(
        rt,
        {
          v: 1,
          t: "edit",
          id: id(3),
          ts: 6,
          target: ID,
          text: "edited",
          mentions: [],
        },
        meta("alice", 4)
      )
    ).toBe(true);
    expect(rt.messages.get(ID)).toMatchObject({
      text: "edited",
      editedAt: 6,
      mentions: [],
    });
    expect(
      applyPayload(
        rt,
        { v: 1, t: "del", id: id(4), ts: 7, target: ID },
        meta("bob", 5)
      )
    ).toBe(false);
    expect(
      applyPayload(
        rt,
        { v: 1, t: "del", id: id(5), ts: 8, target: ID },
        meta("alice", 6)
      )
    ).toBe(true);
    const snapshot = toE2eeMessage(rt.messages.get(ID)!);
    expect(snapshot).toMatchObject({
      deleted: true,
      text: "",
      attachments: [],
    });
    expect(
      applyPayload(
        rt,
        {
          v: 1,
          t: "edit",
          id: id(6),
          ts: 9,
          target: ID,
          text: "x",
          mentions: [],
        },
        meta("alice", 7)
      )
    ).toBe(false);
  });

  it("reactions are one per (profile, reaction, target)", () => {
    const rt = runtime();
    applyPayload(
      rt,
      { v: 1, t: "msg", id: ID, ts: 1, text: "hi", mentions: [] },
      meta("alice", 1)
    );
    const react = (profile: string, on: boolean, seq: number) =>
      applyPayload(
        rt,
        {
          v: 1,
          t: on ? "react" : "unreact",
          id: id(seq),
          ts: seq,
          target: ID,
          r: ":fire:",
        },
        meta(profile, seq)
      );
    expect(react("bob", true, 2)).toBe(true);
    expect(react("bob", true, 3)).toBe(false);
    expect(react("carol", true, 4)).toBe(true);
    expect(rt.messages.get(ID)!.reactions).toEqual({
      ":fire:": ["bob", "carol"],
    });
    expect(react("bob", false, 5)).toBe(true);
    expect(react("bob", false, 6)).toBe(false);
    expect(react("carol", false, 7)).toBe(true);
    expect(rt.messages.get(ID)!.reactions).toEqual({});
  });

  it("payloads failing sig64 only render (flagged), never mutate", () => {
    const rt = runtime();
    applyPayload(
      rt,
      { v: 1, t: "msg", id: ID, ts: 1, text: "hi", mentions: [] },
      meta("alice", 1)
    );
    expect(
      applyPayload(
        rt,
        { v: 1, t: "del", id: id(2), ts: 2, target: ID },
        meta("alice", 2, false)
      )
    ).toBe(false);
    applyPayload(
      rt,
      { v: 1, t: "msg", id: id(3), ts: 3, text: "forged?", mentions: [] },
      meta("bob", 3, false)
    );
    expect(rt.messages.get(id(3))!.sigOk).toBe(false);
  });

  it("orders by seq with pending messages last and builds placeholders", () => {
    const rt = runtime();
    applyPayload(
      rt,
      { v: 1, t: "msg", id: id(9), ts: 50, text: "pending", mentions: [] },
      { ...meta("me", 0), pending: true }
    );
    applyPayload(
      rt,
      { v: 1, t: "msg", id: id(8), ts: 1, text: "second", mentions: [] },
      meta("alice", 2)
    );
    rt.messages.set(
      "undecryptable-1",
      placeholderMessage({ g: "g", seq: 1, serverTs: 10, epoch: 0 })
    );
    const ordered = [...rt.messages.values()]
      .sort(compareMessages)
      .map((m) => m.id);
    expect(ordered).toEqual(["undecryptable-1", id(8), id(9)]);
    expect(rt.messages.get("undecryptable-1")).toMatchObject({
      undecryptable: true,
      sigOk: false,
    });
  });

  it("searches decrypted text locally, case-insensitively", () => {
    const rt = runtime();
    applyPayload(
      rt,
      { v: 1, t: "msg", id: id(1), ts: 1, text: "Hello World", mentions: [] },
      meta("alice", 1)
    );
    applyPayload(
      rt,
      { v: 1, t: "msg", id: id(2), ts: 2, text: "other", mentions: [] },
      meta("alice", 2)
    );
    applyPayload(
      rt,
      { v: 1, t: "msg", id: id(3), ts: 3, text: "hello again", mentions: [] },
      meta("alice", 3)
    );
    applyPayload(
      rt,
      { v: 1, t: "del", id: id(4), ts: 4, target: id(3) },
      meta("alice", 4)
    );
    expect(searchMessages([rt], "WORLD").map((m) => m.id)).toEqual([id(1)]);
    expect(searchMessages([rt], "hello").map((m) => m.id)).toEqual([id(1)]);
    expect(searchMessages([rt], "  ")).toEqual([]);
  });
});
