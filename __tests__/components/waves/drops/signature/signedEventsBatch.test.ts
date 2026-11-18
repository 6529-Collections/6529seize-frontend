import { splitSignedEventsBatch } from "@/components/waves/drops/signature/signedEventsBatch";

const grant = (id: string) => ({ id, wallet: "0xabc", message: "m" });
const event = (id: string, authRef: string) => ({
  id,
  kind: 1,
  auth_ref: authRef,
});
const dropEntry = (
  dropId: string,
  events: readonly object[],
  overrides: Record<string, unknown> = {}
) => ({
  drop_id: dropId,
  current_event_id: events.length ? "0xe1" : null,
  events,
  grants: [],
  ...overrides,
});
const batch = (overrides: Record<string, unknown> = {}) => ({
  drops: [],
  grants: [],
  unavailable: [],
  truncated_drop_ids: [],
  ...overrides,
});

describe("splitting a signed-events batch read by drop", () => {
  it("gives each drop its events and only the grants they reference, as the single route does", () => {
    const result = splitSignedEventsBatch(
      batch({
        drops: [
          dropEntry("drop-a", [event("0xe1", "0xG1")]),
          dropEntry("drop-b", [event("0xe2", "0xg2"), event("0xe3", "0xg1")]),
          dropEntry("drop-c", []),
        ],
        grants: [grant("0xg1"), grant("0xg2"), grant("0xg3")],
      }),
      ["drop-a", "drop-b", "drop-c"]
    );

    expect(result.get("drop-a")).toEqual({
      kind: "events",
      signedEvents: {
        drop_id: "drop-a",
        current_event_id: "0xe1",
        events: [event("0xe1", "0xG1")],
        grants: [grant("0xg1")],
      },
    });
    expect(result.get("drop-b")).toEqual({
      kind: "events",
      signedEvents: expect.objectContaining({
        grants: [grant("0xg1"), grant("0xg2")],
      }),
    });
    expect(result.get("drop-c")).toEqual({
      kind: "events",
      signedEvents: {
        drop_id: "drop-c",
        current_event_id: null,
        events: [],
        grants: [],
      },
    });
  });

  it("keeps grants a drop lists itself", () => {
    const result = splitSignedEventsBatch(
      batch({
        drops: [
          dropEntry("drop-a", [event("0xe1", "0xg9")], {
            grants: [grant("0xg9")],
          }),
        ],
      }),
      ["drop-a"]
    );
    expect(result.get("drop-a")).toMatchObject({
      signedEvents: { grants: [grant("0xg9")] },
    });
  });

  it("sends a truncated drop to the single route, even when its partial events are listed", () => {
    const result = splitSignedEventsBatch(
      batch({
        drops: [dropEntry("drop-a", [event("0xe1", "0xg1")])],
        grants: [grant("0xg1")],
        truncated_drop_ids: ["drop-a"],
      }),
      ["drop-a"]
    );
    expect(result.get("drop-a")).toEqual({ kind: "single" });
  });

  it("names drops the caller cannot read and drops the response leaves out", () => {
    const result = splitSignedEventsBatch(batch({ unavailable: ["drop-a"] }), [
      "drop-a",
      "drop-b",
    ]);
    expect(result.get("drop-a")).toEqual({ kind: "unavailable" });
    expect(result.get("drop-b")).toEqual({ kind: "missing" });
  });

  it("ignores drops it did not ask for and takes the first answer for a drop", () => {
    const first = dropEntry("drop-a", [event("0xe1", "0xg1")]);
    const result = splitSignedEventsBatch(
      batch({
        drops: [dropEntry("drop-x", []), first, dropEntry("drop-a", [])],
        unavailable: ["drop-a", "drop-y"],
      }),
      ["drop-a"]
    );
    expect([...result.keys()]).toEqual(["drop-a"]);
    expect(result.get("drop-a")).toMatchObject({
      kind: "events",
      signedEvents: { events: first.events },
    });
  });

  it("matches drop ids in any letter case, keeping the requested id as the key", () => {
    const result = splitSignedEventsBatch(
      batch({ drops: [dropEntry("DROP-A", [])] }),
      ["drop-a"]
    );
    expect(result.get("drop-a")).toMatchObject({ kind: "events" });
  });

  it.each([
    ["not an object", "gm"],
    ["null", null],
    ["without drops", { grants: [], unavailable: [], truncated_drop_ids: [] }],
    ["with drops that are not a list", batch({ drops: {} })],
    ["without grants", { drops: [], unavailable: [], truncated_drop_ids: [] }],
    ["with unavailable ids that are not strings", batch({ unavailable: [1] })],
    ["without truncated ids", { drops: [], grants: [], unavailable: [] }],
  ])("treats a response %s as a failed read", (_name, response) => {
    expect(() => splitSignedEventsBatch(response, ["drop-a"])).toThrow(
      TypeError
    );
  });

  it("passes a drop entry it cannot read on as missing", () => {
    const result = splitSignedEventsBatch(
      batch({ drops: ["drop-a", { drop_id: 7 }] }),
      ["drop-a"]
    );
    expect(result.get("drop-a")).toEqual({ kind: "missing" });
  });
});
