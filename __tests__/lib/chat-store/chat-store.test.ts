import {
  DropSize,
  getStableDropKey,
  type Drop,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import {
  isTerminalActionState,
  setIllegalTransitionReporter,
  type IllegalTransition,
} from "@/lib/action-lifecycle";
import { ChatStore } from "@/lib/chat-store";

import { legacyMergeDrops as mergeDrops } from "./legacyMergeDrops";

const WAVE = "wave-1";
const OTHER_WAVE = "wave-2";

interface DropInput {
  readonly id: string;
  readonly serial_no?: number;
  readonly created_at?: number | string | null;
  readonly updated_at?: number | null;
  readonly content?: string;
  readonly handle?: string;
  readonly authorId?: string;
  readonly anonymous?: boolean;
  readonly title?: string | null;
  readonly replyTo?: string;
  readonly extra?: Record<string, unknown>;
}

let serial = 0;

function full(input: DropInput): ExtendedDrop {
  serial += 1;
  return {
    id: input.id,
    serial_no: input.serial_no ?? serial,
    created_at: input.created_at ?? 1_000 * (input.serial_no ?? serial),
    updated_at: input.updated_at ?? null,
    wave: { id: WAVE },
    author: {
      id: input.authorId ?? `author-${input.handle ?? "alice"}`,
      handle: input.handle ?? "alice",
      is_anonymous: input.anonymous ?? false,
    },
    title: input.title ?? null,
    parts: [{ content: input.content ?? `text of ${input.id}` }],
    metadata: [],
    ...(input.replyTo === undefined
      ? {}
      : { reply_to: { drop_id: input.replyTo, drop_part_id: 1 } }),
    type: DropSize.FULL,
    stableKey: input.id,
    stableHash: input.id,
    ...input.extra,
  } as unknown as ExtendedDrop;
}

function light(id: string, serialNo: number): Drop {
  return {
    id,
    serial_no: serialNo,
    waveId: WAVE,
    type: DropSize.LIGHT,
    stableKey: id,
    stableHash: id,
  };
}

const ids = (store: ChatStore, waveId = WAVE): string[] =>
  store.getDrops(waveId).map((drop) => drop.id);

let reports: IllegalTransition[] = [];
let restoreReporter: () => void = () => undefined;

beforeEach(() => {
  serial = 0;
  reports = [];
  restoreReporter = setIllegalTransitionReporter((report) =>
    reports.push(report)
  );
});

afterEach(() => {
  // No store flow may drive a pending send through an illegal transition.
  expect(reports).toEqual([]);
  restoreReporter();
});

describe("order (today's mergeDrops vectors)", () => {
  it("prefers newer drops and keeps stable ordering", () => {
    const store = new ChatStore();
    store.merge(WAVE, [
      full({ id: "drop-1", serial_no: 4, created_at: "2023-12-31T23:59:59Z" }),
    ]);
    store.merge(WAVE, [
      full({ id: "drop-2", serial_no: 6, created_at: "2024-01-02T00:00:00Z" }),
    ]);
    expect(store.getDrops(WAVE)[0]).toMatchObject({
      id: "drop-2",
      serial_no: 6,
    });
  });

  it("orders temporary and canonical drops by created time consistently", () => {
    const store = new ChatStore();
    store.merge(WAVE, [
      full({ id: "temp-text", serial_no: 999_999_999, created_at: 1_000 }),
      full({ id: "older-file", serial_no: 10, created_at: 500 }),
    ]);
    store.merge(WAVE, [
      full({ id: "server-file", serial_no: 12, created_at: 2_000 }),
    ]);
    expect(ids(store)).toEqual(["server-file", "temp-text", "older-file"]);
  });

  it("falls back to serial number when created_at is null", () => {
    const store = new ChatStore();
    store.merge(WAVE, [
      full({ id: "null-created-at", serial_no: 20, created_at: null }),
    ]);
    store.merge(WAVE, [
      full({ id: "low-created-at", serial_no: 10, created_at: 5 }),
    ]);
    expect(ids(store)).toEqual(["null-created-at", "low-created-at"]);
  });

  it("breaks equal times by serial number", () => {
    const store = new ChatStore();
    store.merge(WAVE, [
      full({ id: "a", serial_no: 1, created_at: 7 }),
      full({ id: "c", serial_no: 3, created_at: 7 }),
      full({ id: "b", serial_no: 2, created_at: 7 }),
    ]);
    expect(ids(store)).toEqual(["c", "b", "a"]);
  });

  it("takes the later copy when one batch holds two copies of a drop", () => {
    const store = new ChatStore();
    store.merge(WAVE, [full({ id: "d1", serial_no: 1, content: "a!" })]);
    store.merge(WAVE, [
      full({ id: "d1", serial_no: 1, content: "a" }),
      full({ id: "d1", serial_no: 1, content: "a!" }),
    ]);
    expect(store.get(WAVE, "d1")).toMatchObject({
      parts: [{ content: "a!" }],
    });
  });

  it("gives the same order whether drops arrive one by one or in one batch", () => {
    const drops = Array.from({ length: 200 }, (_, index) =>
      full({ id: `d${index}`, serial_no: index + 1, created_at: index * 10 })
    );
    const shuffled = shuffle(drops, mulberry32(4));
    const oneByOne = new ChatStore();
    shuffled.forEach((drop) => oneByOne.merge(WAVE, [drop]));
    const batched = new ChatStore();
    batched.merge(WAVE, shuffled);
    expect(ids(batched)).toEqual(ids(oneByOne));
    expect(ids(batched)[0]).toBe("d199");
    expect(ids(batched).at(-1)).toBe("d0");
  });
});

describe("differential check against today's mergeDrops", () => {
  it("matches order and row identity on random merge, edit and delete sequences", () => {
    for (let run = 0; run < 25; run++) {
      const random = mulberry32(run + 1);
      const store = new ChatStore();
      let model: Drop[] = [];
      const deleted = new Set<string>();
      const universe: ExtendedDrop[] = [];
      let nextSerial = 1;
      let time = 1_000_000;

      for (let operation = 0; operation < 120; operation++) {
        const roll = random();
        if (roll < 0.15 && model.length > 0) {
          const victims = pickSome(model, random, 3).map((drop) => drop.id);
          victims.forEach((id) => deleted.add(id));
          model = model.filter((drop) => !victims.includes(drop.id));
          store.remove(WAVE, victims);
          continue;
        }
        const batch: ExtendedDrop[] = [];
        const size = 1 + Math.floor(random() * (random() < 0.2 ? 40 : 4));
        for (let index = 0; index < size; index++) {
          const known = universe[Math.floor(random() * universe.length)];
          // Two copies of one drop in one batch resolve by Map position in
          // mergeDrops, not by arrival; the store takes the later copy
          // (tested below). Keep one copy per batch here.
          if (
            known !== undefined &&
            random() < 0.35 &&
            !batch.some((drop) => drop.id === known.id)
          ) {
            // A known drop again: unchanged, re-reacted, or edited.
            const copy = {
              ...known,
              boosts: Math.floor(random() * 5),
            } as ExtendedDrop;
            if (random() < 0.3) {
              const edited = {
                ...copy,
                parts: [{ content: `${known.parts[0]!.content}!` }],
              } as ExtendedDrop;
              const { key, hash } = getStableDropKey(edited);
              batch.push({ ...edited, stableKey: key, stableHash: hash });
            } else {
              batch.push(copy);
            }
            continue;
          }
          // Equal times happen; serials stay unique and in time order.
          time += random() < 0.2 ? 0 : 1 + Math.floor(random() * 5_000);
          const created = full({
            id: `r${run}-${nextSerial}`,
            serial_no: nextSerial++,
            created_at: time,
          });
          // Seeds skip today's re-keying, so hand drops over already hashed.
          const { key, hash } = getStableDropKey(created);
          const drop = { ...created, stableKey: key, stableHash: hash };
          universe.push(drop);
          batch.push(drop);
        }
        const order = shuffle(batch, random);
        const policy = random() < 0.2 ? "preserve-existing" : "standard";
        const available = order.filter((drop) => !deleted.has(drop.id));
        model =
          policy === "preserve-existing"
            ? mergeDrops(available, model)
            : mergeDrops(model, available);
        store.merge(WAVE, order, policy);

        const actual = store
          .getDrops(WAVE)
          .map((drop) => [drop.id, drop.stableKey, drop.stableHash]);
        const expected = model.map((drop) => [
          drop.id,
          drop.stableKey,
          drop.stableHash,
        ]);
        expect(actual).toEqual(expected);
        const contents = (drops: readonly Drop[]) =>
          drops.map((drop) =>
            drop.type === DropSize.FULL ? drop.parts[0]!.content : null
          );
        expect(contents(store.getDrops(WAVE))).toEqual(contents(model));
      }
    }
  });
});

describe("stale revisions (from #4128)", () => {
  const edited = () =>
    full({ id: "d1", serial_no: 1, updated_at: 2_000, content: "edited" });

  it.each([
    ["an unedited snapshot", null],
    ["an older edit", 1_500],
  ])("rejects %s after an edit", (_name, updatedAt) => {
    const store = new ChatStore();
    store.merge(WAVE, [edited()]);
    const result = store.merge(WAVE, [
      full({ id: "d1", serial_no: 1, updated_at: updatedAt, content: "old" }),
    ]);
    expect(result).toEqual({ changed: false, stale: 1, reconciled: 0 });
    expect(store.get(WAVE, "d1")).toMatchObject({
      parts: [{ content: "edited" }],
    });
  });

  it("accepts equal revisions, which carry reactions and votes", () => {
    const store = new ChatStore();
    store.merge(WAVE, [edited()]);
    const result = store.merge(WAVE, [
      { ...edited(), boosts: 4 } as ExtendedDrop,
    ]);
    expect(result.changed).toBe(true);
    expect(store.get(WAVE, "d1")).toMatchObject({ boosts: 4 });
  });

  it("accepts a newer edit and unedited copies before any edit", () => {
    const store = new ChatStore();
    store.merge(WAVE, [full({ id: "d1", serial_no: 1, content: "a" })]);
    store.merge(WAVE, [full({ id: "d1", serial_no: 1, content: "b" })]);
    store.merge(WAVE, [edited()]);
    store.merge(WAVE, [
      full({ id: "d1", serial_no: 1, updated_at: 3_000, content: "newest" }),
    ]);
    expect(store.get(WAVE, "d1")).toMatchObject({
      parts: [{ content: "newest" }],
    });
  });
});

describe("deletions (#4639 invariants)", () => {
  it("does not resurrect a drop deleted before it enters the cache", () => {
    const store = new ChatStore();
    store.remove(WAVE, ["d1"]);
    expect(store.merge(WAVE, [full({ id: "d1" })]).changed).toBe(false);
    expect(store.getDrops(WAVE)).toEqual([]);
    expect(store.hasWave(WAVE)).toBe(false);
  });

  it("ignores a late in-flight copy after a burst and a deletion", () => {
    const store = new ChatStore();
    for (let index = 1; index <= 1_000; index++) {
      store.merge(WAVE, [full({ id: `burst-${index}`, serial_no: index })]);
    }
    store.remove(WAVE, ["burst-500"]);
    store.merge(WAVE, [full({ id: "burst-500", serial_no: 500 })]);
    expect(store.size(WAVE)).toBe(999);
    expect(ids(store)).not.toContain("burst-500");
  });

  it("removes 40,000 of 60,000 messages in one call and leaves other waves alone", () => {
    const store = new ChatStore();
    const drops = Array.from({ length: 60_000 }, (_, index) =>
      full({ id: `large-${index}`, serial_no: index + 1, created_at: index })
    );
    store.merge(WAVE, drops);
    store.merge(OTHER_WAVE, [full({ id: "other" })]);
    // One pass, not one splice per key: a quadratic removal would run for
    // many seconds and time the test out.
    expect(
      store.remove(
        WAVE,
        drops.slice(0, 40_000).map((drop) => drop.id)
      )
    ).toBe(true);
    expect(store.size(WAVE)).toBe(20_000);
    expect(ids(store)[0]).toBe("large-59999");
    expect(ids(store).at(-1)).toBe("large-40000");
    expect(ids(store, OTHER_WAVE)).toEqual(["other"]);
    expect(store.remove(WAVE, ["large-0"])).toBe(false);
  });

  it("keeps tombstones least recently touched first, across wave deletion", () => {
    const store = new ChatStore();
    store.merge(WAVE, [full({ id: "d1" })]);
    store.remove(WAVE, ["d1"]);
    store.remove(OTHER_WAVE, ["x"]);
    store.remove(WAVE, ["d2"]);
    expect(store.tombstonedWaveIds()).toEqual([OTHER_WAVE, WAVE]);
    expect(store.deleteWave(WAVE)).toBe(true);
    expect(store.isTombstoned(WAVE, "d1")).toBe(true);
    store.forgetTombstones(WAVE);
    expect(store.merge(WAVE, [full({ id: "d1" })]).changed).toBe(true);
    store.clear();
    expect(store.tombstonedWaveIds()).toEqual([]);
    expect(store.hasWave(WAVE)).toBe(false);
  });
});

describe("evictions (the windowed chat cap)", () => {
  it("releases records without tombstones, so a later page brings them back", () => {
    const store = new ChatStore();
    store.merge(WAVE, [
      full({ id: "e1", serial_no: 1 }),
      full({ id: "e2", serial_no: 2 }),
      full({ id: "e3", serial_no: 3 }),
    ]);
    const before = store.version(WAVE);

    expect(store.evict(WAVE, ["e1", "e2"])).toBe(true);
    expect(ids(store)).toEqual(["e3"]);
    expect(store.version(WAVE)).toBeGreaterThan(before);
    expect(store.isTombstoned(WAVE, "e1")).toBe(false);

    store.merge(WAVE, [full({ id: "e1", serial_no: 1 })]);
    expect(ids(store)).toEqual(["e3", "e1"]);
  });

  it("never evicts a pending send", () => {
    const store = new ChatStore();
    store.merge(WAVE, [
      full({ id: "e1", serial_no: 1 }),
      full({ id: "temp-x", serial_no: 2 }),
    ]);

    expect(store.evict(WAVE, ["temp-x"])).toBe(false);
    expect(ids(store)).toContain("temp-x");
    expect(store.getPendingSend("temp-x")).not.toBeUndefined();
  });

  it("does nothing for an unknown wave or no keys", () => {
    const store = new ChatStore();
    expect(store.evict(WAVE, ["e1"])).toBe(false);
    store.merge(WAVE, [full({ id: "e1", serial_no: 1 })]);
    expect(store.evict(WAVE, [])).toBe(false);
    expect(store.evict(OTHER_WAVE, ["e1"])).toBe(false);
    expect(ids(store)).toEqual(["e1"]);
  });
});

describe("snapshots", () => {
  it("returns the same array until the wave changes", () => {
    const store = new ChatStore();
    const empty = store.getDrops(WAVE);
    expect(store.getDrops(WAVE)).toBe(empty);
    store.merge(WAVE, [full({ id: "d1" })]);
    const first = store.getDrops(WAVE);
    const version = store.version(WAVE);
    expect(store.getDrops(WAVE)).toBe(first);

    // Nothing applies: no new version, no new array.
    store.merge(WAVE, [full({ id: "d1" })], "preserve-existing");
    store.remove(WAVE, ["unknown"]);
    expect(store.version(WAVE)).toBe(version);
    expect(store.getDrops(WAVE)).toBe(first);

    store.merge(WAVE, [full({ id: "d2" })]);
    expect(store.version(WAVE)).toBeGreaterThan(version);
    expect(store.getDrops(WAVE)).not.toBe(first);
  });

  it("never reuses a version after a wave is deleted and loaded again", () => {
    const store = new ChatStore();
    store.merge(WAVE, [full({ id: "d1" })]);
    const before = store.version(WAVE);
    store.deleteWave(WAVE);
    store.merge(WAVE, [full({ id: "d2" })]);
    expect(store.version(WAVE)).toBeGreaterThan(before);
  });

  it("keeps a stored record's identity when a copy arrives with another key", () => {
    const store = new ChatStore();
    store.merge(WAVE, [full({ id: "d1" })]);
    const stored = store.get(WAVE, "d1")!;
    // Pages and feeds hand records over with `stableKey: id`.
    store.merge(WAVE, [
      { ...full({ id: "d1", serial_no: 1 }), boosts: 3 } as ExtendedDrop,
    ]);
    expect(store.get(WAVE, "d1")).toMatchObject({
      stableKey: stored.stableKey,
      stableHash: stored.stableHash,
      boosts: 3,
    });
  });

  it("gives an edited record a new identity, as today", () => {
    const store = new ChatStore();
    store.merge(WAVE, [full({ id: "d1", serial_no: 1, content: "a" })]);
    const before = store.get(WAVE, "d1")!;
    store.merge(WAVE, [full({ id: "d1", serial_no: 1, content: "b" })]);
    const after = store.get(WAVE, "d1") as ExtendedDrop;
    expect(after.stableKey).not.toBe(before.stableKey);
    expect(after.stableHash).toBe(getStableDropKey(after).hash);
  });
});

describe("preserve-existing (server feed seeds)", () => {
  it("adds unknown keys and never overwrites stored copies", () => {
    const store = new ChatStore();
    store.merge(WAVE, [
      full({ id: "d1", serial_no: 1, extra: { optimisticMarker: true } }),
      full({ id: "cached-older", serial_no: 0, created_at: 1 }),
    ]);
    store.merge(
      WAVE,
      [
        full({ id: "d1", serial_no: 1, title: "older server title" }),
        full({ id: "server-new", serial_no: 2 }),
      ],
      "preserve-existing"
    );
    expect(ids(store)).toEqual(["server-new", "d1", "cached-older"]);
    expect(store.get(WAVE, "d1")).toMatchObject({ optimisticMarker: true });
  });
});

describe("placeholders (LIGHT records)", () => {
  it("places placeholders by serial among accepted records", () => {
    const store = new ChatStore();
    store.merge(WAVE, [
      full({ id: "f10", serial_no: 10 }),
      full({ id: "f30", serial_no: 30 }),
    ]);
    store.merge(WAVE, [light("l20", 20), light("l40", 40), light("l5", 5)]);
    expect(ids(store)).toEqual(["l40", "f30", "l20", "f10", "l5"]);
  });

  it("keeps a pending send above older placeholders", () => {
    const store = new ChatStore();
    store.merge(WAVE, [full({ id: "f10", serial_no: 10, created_at: 100 })]);
    store.merge(WAVE, [
      full({
        id: "temp-1",
        serial_no: Date.now(),
        created_at: 200,
        content: "mine",
      }),
    ]);
    store.merge(WAVE, [light("l5", 5)]);
    expect(ids(store)).toEqual(["temp-1", "f10", "l5"]);
  });

  it("hydrates a placeholder in place and never downgrades a full record", () => {
    const store = new ChatStore();
    store.merge(WAVE, [full({ id: "f30", serial_no: 30 }), light("d20", 20)]);
    store.merge(WAVE, [full({ id: "d20", serial_no: 20 })]);
    expect(store.get(WAVE, "d20")?.type).toBe(DropSize.FULL);
    expect(ids(store)).toEqual(["f30", "d20"]);
    expect(store.merge(WAVE, [light("d20", 20)]).changed).toBe(false);
    expect(store.get(WAVE, "d20")?.type).toBe(DropSize.FULL);
  });

  it("gives a serial to one record: a full record replaces a placeholder holding it", () => {
    const store = new ChatStore();
    store.merge(WAVE, [light("placeholder", 20)]);
    store.merge(WAVE, [full({ id: "real", serial_no: 20 })]);
    expect(ids(store)).toEqual(["real"]);
    expect(store.merge(WAVE, [light("late", 20)]).changed).toBe(false);
  });
});

describe("pending sends", () => {
  const PENDING_TIME = 5_000_000;

  function pendingDrop(id = "temp-a", content = "gm", offset = 0) {
    return full({
      id,
      serial_no: PENDING_TIME + offset,
      created_at: PENDING_TIME + offset,
      content,
    });
  }

  function echo(id: string, content = "gm", offset = 0, serialNo = 900) {
    return full({
      id,
      serial_no: serialNo,
      created_at: PENDING_TIME + 250 + offset,
      content,
    });
  }

  function storeWithHistory(): ChatStore {
    const store = new ChatStore();
    store.merge(WAVE, [
      full({ id: "old", serial_no: 800, created_at: PENDING_TIME - 60_000 }),
    ]);
    return store;
  }

  it("registers a temp- drop as a pending send in `sending`, hashed like today", () => {
    const store = storeWithHistory();
    const temp = pendingDrop();
    store.merge(WAVE, [temp]);
    expect(store.getPendingSend("temp-a")).toEqual({
      clientId: "temp-a",
      waveId: WAVE,
      state: { kind: "sending", mode: "server", attempt: 1, evidence: null },
      clientDropId: null,
      serverKey: null,
    });
    const { key, hash } = getStableDropKey(temp);
    expect(store.get(WAVE, "temp-a")).toMatchObject({
      stableKey: key,
      stableHash: hash,
    });
    expect(ids(store)).toEqual(["temp-a", "old"]);
  });

  it("replaces the pending row with its echo, keeping the row identity", () => {
    const store = storeWithHistory();
    store.merge(WAVE, [pendingDrop()]);
    const pending = store.get(WAVE, "temp-a")!;
    const result = store.merge(WAVE, [echo("server-a")]);
    expect(result.reconciled).toBe(1);
    expect(ids(store)).toEqual(["server-a", "old"]);
    expect(store.get(WAVE, "server-a")).toMatchObject({
      stableKey: pending.stableKey,
      stableHash: pending.stableHash,
    });
    expect(store.getPendingSend("temp-a")).toMatchObject({
      state: { kind: "submitted", mode: "server", chain: null },
      serverKey: "server-a",
    });

    // Later copies keep the identity: no remount.
    store.merge(WAVE, [{ ...echo("server-a"), boosts: 1 } as ExtendedDrop]);
    expect(store.get(WAVE, "server-a")?.stableKey).toBe(pending.stableKey);
    // A late copy of the optimistic drop cannot come back as a second row.
    store.merge(WAVE, [pendingDrop()]);
    expect(ids(store)).toEqual(["server-a", "old"]);
    // Today's success path removes the temp ID afterwards: a no-op now.
    expect(store.remove(WAVE, ["temp-a"])).toBe(false);
    expect(store.getPendingSend("temp-a")).toBeUndefined();
    expect(ids(store)).toEqual(["server-a", "old"]);
  });

  it("matches the hash a reply thread computes for the accepted copy", () => {
    const store = storeWithHistory();
    const temp = full({
      id: "temp-r",
      serial_no: PENDING_TIME,
      created_at: PENDING_TIME,
      content: "reply",
      replyTo: "parent",
    });
    store.merge(WAVE, [temp]);
    const canonical = full({
      id: "server-r",
      serial_no: 901,
      created_at: PENDING_TIME + 400,
      content: "reply",
      replyTo: "parent",
    });
    // pending-replies hashes query copies against the stream's temp rows.
    expect(getStableDropKey(canonical, [store.get(WAVE, "temp-r")!]).hash).toBe(
      store.get(WAVE, "temp-r")!.stableHash
    );
  });

  it("supports today's success order: remove the temp row, then insert", () => {
    const store = storeWithHistory();
    store.merge(WAVE, [pendingDrop()]);
    store.remove(WAVE, ["temp-a"]);
    expect(store.getPendingSend("temp-a")).toBeUndefined();
    store.merge(WAVE, [echo("server-a")]);
    expect(ids(store)).toEqual(["server-a", "old"]);
  });

  it("settles atomically before the echo and absorbs the echo after", () => {
    const store = storeWithHistory();
    store.merge(WAVE, [pendingDrop()]);
    const pending = store.get(WAVE, "temp-a")!;
    expect(store.settlePendingSend("temp-a", echo("server-a"))).toBe(true);
    expect(ids(store)).toEqual(["server-a", "old"]);
    expect(store.get(WAVE, "server-a")?.stableKey).toBe(pending.stableKey);
    store.merge(WAVE, [echo("server-a")]);
    expect(ids(store)).toEqual(["server-a", "old"]);
    expect(store.get(WAVE, "server-a")?.stableKey).toBe(pending.stableKey);
    expect(store.getPendingSend("temp-a")?.state.kind).toBe("submitted");
  });

  it("settles after the echo without a duplicate or an illegal transition", () => {
    const store = storeWithHistory();
    store.merge(WAVE, [pendingDrop()]);
    store.merge(WAVE, [echo("server-a")]);
    expect(store.settlePendingSend("temp-a", echo("server-a"))).toBe(true);
    expect(ids(store)).toEqual(["server-a", "old"]);
  });

  it("keeps a failed send as a pending row with a retry time, then retries", () => {
    const store = storeWithHistory();
    store.merge(WAVE, [pendingDrop()]);
    const version = store.version(WAVE);
    const failed = store.dispatchPendingSend("temp-a", {
      type: "SEND_ERROR",
      retryable: true,
      at: 10_000,
      error: "network",
    });
    expect(failed?.state).toEqual({
      kind: "send-failed",
      mode: "server",
      attempt: 1,
      evidence: null,
      retryable: true,
      nextRetryAt: 11_000,
      error: "network",
    });
    expect(store.version(WAVE)).toBeGreaterThan(version);
    expect(ids(store)).toEqual(["temp-a", "old"]);

    expect(
      store.dispatchPendingSend("temp-a", { type: "RETRY" })?.state
    ).toMatchObject({ kind: "sending", attempt: 2 });
    store.merge(WAVE, [echo("server-a")]);
    expect(store.getPendingSend("temp-a")?.state.kind).toBe("submitted");
  });

  it("reconciles two identical sends with their own echoes, closest first", () => {
    const store = storeWithHistory();
    store.merge(WAVE, [pendingDrop("temp-a", "gm", 0)]);
    store.merge(WAVE, [pendingDrop("temp-b", "gm", 3_000)]);
    const a = store.get(WAVE, "temp-a")!;
    const b = store.get(WAVE, "temp-b")!;
    store.merge(WAVE, [echo("server-b", "gm", 3_000, 902)]);
    store.merge(WAVE, [echo("server-a", "gm", 0, 901)]);
    expect(ids(store)).toEqual(["server-b", "server-a", "old"]);
    expect(store.get(WAVE, "server-a")?.stableKey).toBe(a.stableKey);
    expect(store.get(WAVE, "server-b")?.stableKey).toBe(b.stableKey);
  });

  it("keeps two identical messages from the server as two rows", () => {
    const store = storeWithHistory();
    store.merge(WAVE, [echo("server-a", "gm", 0, 901)]);
    store.merge(WAVE, [echo("server-b", "gm", 1_000, 902)]);
    expect(ids(store)).toEqual(["server-b", "server-a", "old"]);
  });

  it.each([
    ["different text", { content: "gn" }],
    ["another author", { handle: "bob" }],
    ["more than 10 s apart", { created_at: PENDING_TIME + 10_000 }],
  ])("does not reconcile a server drop with %s", (_name, overrides) => {
    const store = storeWithHistory();
    store.merge(WAVE, [pendingDrop()]);
    store.merge(WAVE, [
      full({
        id: "server-x",
        serial_no: 901,
        created_at: PENDING_TIME + 250,
        content: "gm",
        ...overrides,
      }),
    ]);
    expect(ids(store)).toEqual(
      expect.arrayContaining(["temp-a", "server-x", "old"])
    );
    expect(store.getPendingSend("temp-a")?.state.kind).toBe("sending");
  });

  it("does not reconcile anonymous entries of different authors", () => {
    const store = storeWithHistory();
    store.merge(WAVE, [
      full({
        id: "temp-anon",
        serial_no: PENDING_TIME,
        created_at: PENDING_TIME,
        content: "entry",
        handle: "Anonymous",
        authorId: "anon-1",
        anonymous: true,
      }),
    ]);
    store.merge(WAVE, [
      full({
        id: "server-anon",
        serial_no: 901,
        created_at: PENDING_TIME + 100,
        content: "entry",
        handle: "Anonymous",
        authorId: "anon-2",
        anonymous: true,
      }),
    ]);
    expect(store.size(WAVE)).toBe(3);
  });

  it("registers explicit client IDs without the temp- prefix", () => {
    const store = storeWithHistory();
    const send = store.addPendingSend(WAVE, pendingDrop("client-event-1"));
    expect(send?.state.kind).toBe("sending");
    store.merge(WAVE, [echo("server-a")]);
    expect(ids(store)).toEqual(["server-a", "old"]);
    expect(store.getPendingSend("client-event-1")?.serverKey).toBe("server-a");
  });

  it("releases pending sends with their wave and on clear", () => {
    const store = storeWithHistory();
    store.merge(WAVE, [pendingDrop()]);
    store.deleteWave(WAVE);
    expect(store.getPendingSend("temp-a")).toBeUndefined();
    store.merge(WAVE, [pendingDrop("temp-b")]);
    store.clear();
    expect(store.getPendingSend("temp-b")).toBeUndefined();
  });
});

describe("client_drop_id (exact reconciliation)", () => {
  const SENT_AT = 7_000_000;
  const CLIENT_DROP_ID = "0f8c3a52-7d1e-4b6a-9c2f-5e8d1a4b7c90";

  const optimistic = (content = "gm") =>
    full({
      id: "temp-c",
      serial_no: SENT_AT,
      created_at: SENT_AT,
      content,
    });

  const serverCopy = (
    id: string,
    content: string,
    clientDropId: string | null
  ) =>
    full({
      id,
      serial_no: 950,
      created_at: SENT_AT + 300,
      content,
      extra: clientDropId === null ? {} : { client_drop_id: clientDropId },
    });

  it("settles the send its client_drop_id names, even when the text differs", () => {
    const store = new ChatStore();
    const send = store.addPendingSend(WAVE, optimistic("gm "), {
      clientDropId: CLIENT_DROP_ID.toUpperCase(),
    });
    expect(send?.clientDropId).toBe(CLIENT_DROP_ID);
    const pending = store.get(WAVE, "temp-c")!;
    const result = store.merge(WAVE, [
      serverCopy("server-c", "gm", CLIENT_DROP_ID),
    ]);
    expect(result.reconciled).toBe(1);
    expect(ids(store)).toEqual(["server-c"]);
    expect(store.get(WAVE, "server-c")?.stableKey).toBe(pending.stableKey);
    expect(store.getPendingSend("temp-c")).toMatchObject({
      serverKey: "server-c",
      state: { kind: "submitted" },
    });
  });

  it("never matches by content when the server copy names another send", () => {
    const store = new ChatStore();
    store.addPendingSend(WAVE, optimistic(), { clientDropId: CLIENT_DROP_ID });
    store.merge(WAVE, [
      serverCopy("server-other", "gm", "11111111-2222-4333-8444-555555555555"),
    ]);
    expect(ids(store)).toEqual(["server-other", "temp-c"]);
    expect(store.getPendingSend("temp-c")?.state.kind).toBe("sending");
  });

  it("settles on a creation frame that follows a feed copy of the drop", () => {
    const store = new ChatStore();
    store.addPendingSend(WAVE, optimistic("gm "), {
      clientDropId: CLIENT_DROP_ID,
    });
    // Feeds omit client_drop_id, and this copy's text differs: no match yet.
    store.merge(WAVE, [serverCopy("server-c", "gm", null)]);
    expect(ids(store)).toEqual(["server-c", "temp-c"]);
    store.merge(WAVE, [serverCopy("server-c", "gm", CLIENT_DROP_ID)]);
    expect(ids(store)).toEqual(["server-c"]);
    expect(store.getPendingSend("temp-c")?.serverKey).toBe("server-c");
  });

  it("reads client_drop_id from an optimistic temp- drop", () => {
    const store = new ChatStore();
    store.merge(WAVE, [
      { ...optimistic(), client_drop_id: CLIENT_DROP_ID } as ExtendedDrop,
    ]);
    expect(store.getPendingSend("temp-c")?.clientDropId).toBe(CLIENT_DROP_ID);
    store.merge(WAVE, [serverCopy("server-c", "gm", CLIENT_DROP_ID)]);
    expect(ids(store)).toEqual(["server-c"]);
  });

  it("makes a 409 terminal for the pending send", () => {
    const store = new ChatStore();
    store.addPendingSend(WAVE, optimistic(), { clientDropId: CLIENT_DROP_ID });
    const rejected = store.dispatchPendingSend("temp-c", {
      type: "REJECTED",
      reason: "client_drop_id conflict",
    });
    expect(rejected?.state).toMatchObject({
      kind: "rejected",
      reason: "client_drop_id conflict",
    });
    expect(isTerminalActionState(rejected!.state)).toBe(true);
    store.remove(WAVE, ["temp-c"]);
    expect(store.getPendingSend("temp-c")).toBeUndefined();
    // The ID no longer points at a send.
    store.merge(WAVE, [serverCopy("server-c", "gm", CLIENT_DROP_ID)]);
    expect(ids(store)).toEqual(["server-c"]);
  });

  it("sends illegal pending-send transitions to the store's reporter", () => {
    const own: IllegalTransition[] = [];
    const store = new ChatStore({ lifecycleReporter: (r) => own.push(r) });
    store.addPendingSend(WAVE, optimistic());
    store.dispatchPendingSend("temp-c", { type: "RETRY" });
    expect(own).toEqual([{ from: "sending", mode: "server", event: "RETRY" }]);
    expect(reports).toEqual([]);
  });
});

describe("keys", () => {
  it("uses the key function for records, lookups and deletions", () => {
    const store = new ChatStore({ keyOf: (drop) => `event:${drop.id}` });
    store.merge(WAVE, [full({ id: "d1" }), full({ id: "d2" })]);
    expect(store.get(WAVE, "event:d1")?.id).toBe("d1");
    expect(store.get(WAVE, "d1")).toBeUndefined();
    store.remove(WAVE, ["event:d1"]);
    expect(ids(store)).toEqual(["d2"]);
  });
});

function pickSome<T>(values: readonly T[], random: () => number, max: number) {
  const count = 1 + Math.floor(random() * max);
  return shuffle(values, random).slice(0, count);
}

function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap] as T, copy[index] as T];
  }
  return copy;
}

function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

describe("malformed copies", () => {
  it("keeps a drop without an author instead of breaking the merge", () => {
    const store = new ChatStore();
    const malformed = {
      id: "no-author",
      serial_no: 3,
      created_at: 3_000,
      wave: { id: WAVE },
      type: DropSize.FULL,
      stableKey: "no-author",
      stableHash: "no-author",
    } as unknown as ExtendedDrop;
    store.merge(WAVE, [
      full({ id: "temp-x", serial_no: 9_000, created_at: 2_900 }),
    ]);
    expect(() => store.merge(WAVE, [malformed])).not.toThrow();
    expect(store.get(WAVE, "no-author")).toMatchObject({
      stableKey: "no-author",
      stableHash: "no-author",
    });
    expect(() =>
      store.merge(WAVE, [{ ...malformed, boosts: 1 } as ExtendedDrop])
    ).not.toThrow();
    expect(ids(store)).toEqual(["no-author", "temp-x"]);
  });
});

describe("identical copies", () => {
  it("keeps the stored object and version for a copy with nothing new", () => {
    const store = new ChatStore();
    store.merge(WAVE, [full({ id: "d1", serial_no: 1 })]);
    const stored = store.get(WAVE, "d1");
    const drops = store.getDrops(WAVE);
    const version = store.version(WAVE);
    // Feeds hand drops over with `stableKey: id`, and an absent field may
    // arrive as `undefined`; neither is news.
    const result = store.merge(WAVE, [
      full({ id: "d1", serial_no: 1, extra: { extra_field: undefined } }),
    ]);
    expect(result.changed).toBe(false);
    expect(store.get(WAVE, "d1")).toBe(stored);
    expect(store.getDrops(WAVE)).toBe(drops);
    expect(store.version(WAVE)).toBe(version);
  });

  it("replaces the object when any field changes, however deep", () => {
    const store = new ChatStore();
    store.merge(WAVE, [
      full({ id: "d1", serial_no: 1, extra: { reactions: [{ count: 1 }] } }),
    ]);
    const stored = store.get(WAVE, "d1");
    store.merge(WAVE, [
      full({ id: "d1", serial_no: 1, extra: { reactions: [{ count: 2 }] } }),
    ]);
    expect(store.get(WAVE, "d1")).not.toBe(stored);
    expect(store.get(WAVE, "d1")).toMatchObject({
      reactions: [{ count: 2 }],
      stableKey: stored?.stableKey,
    });
  });
});
