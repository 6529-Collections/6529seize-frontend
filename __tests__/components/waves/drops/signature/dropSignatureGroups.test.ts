import { getDropSignatureGroups } from "@/components/waves/drops/signature/dropSignatureGroups";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { DropSize } from "@/helpers/waves/drop.helpers";

let mockEnabled = true;
jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => mockEnabled,
}));

const BASE_TIME = Date.UTC(2026, 9, 31, 8, 50);

const aDrop = (
  id: string,
  handle: string,
  offsetSeconds: number,
  overrides: Record<string, unknown> = {}
) =>
  ({
    type: DropSize.FULL,
    id,
    drop_type: ApiDropType.Chat,
    author: { handle, is_anonymous: false },
    created_at: BASE_TIME + offsetSeconds * 1000,
    parts: [{ content: id }],
    reply_to: null,
    is_author_signed: true,
    ...overrides,
  }) as any;

describe("getDropSignatureGroups", () => {
  beforeEach(() => {
    mockEnabled = true;
  });

  it("keys each run of consecutive posts by its header, using the chat grouping rule", () => {
    const drops = [
      aDrop("a1", "alice", 0),
      aDrop("a2", "alice", 10),
      aDrop("a3", "alice", 20),
      aDrop("b1", "bob", 30),
      aDrop("b2", "bob", 40),
      aDrop("a4", "alice", 50),
    ];

    const groups = getDropSignatureGroups(drops);

    expect([...groups.keys()]).toEqual(["a1", "b1"]);
    expect(groups.get("a1")!.map((drop) => drop.id)).toEqual([
      "a1",
      "a2",
      "a3",
    ]);
    // Posts by different authors never mix; a lone post has no group.
    expect(groups.get("b1")!.map((drop) => drop.id)).toEqual(["b1", "b2"]);
    expect(groups.has("a4")).toBe(false);
  });

  it("ends a run at a light (not yet loaded) drop, a participatory drop or a storm", () => {
    const groups = getDropSignatureGroups([
      aDrop("a1", "alice", 0),
      { type: DropSize.LIGHT, id: "light", serial_no: 2 } as any,
      aDrop("a2", "alice", 10),
      aDrop("a3", "alice", 20, { drop_type: ApiDropType.Participatory }),
      aDrop("a4", "alice", 30),
      aDrop("a5", "alice", 40, { parts: [{}, {}] }),
    ]);

    expect(groups.size).toBe(0);
  });

  it("keeps a group's identity until its own posts change", () => {
    const a1 = aDrop("a1", "alice", 0);
    const a2 = aDrop("a2", "alice", 10);
    const b1 = aDrop("b1", "bob", 20);
    const b2 = aDrop("b2", "bob", 30);
    const first = getDropSignatureGroups([a1, a2, b1, b2]);

    // A new post appended to bob's group.
    const b3 = aDrop("b3", "bob", 40);
    const second = getDropSignatureGroups([a1, a2, b1, b2, b3]);
    expect(second.get("a1")).toBe(first.get("a1"));
    expect(second.get("b1")).not.toBe(first.get("b1"));
    expect(second.get("b1")!.map((drop) => drop.id)).toEqual([
      "b1",
      "b2",
      "b3",
    ]);

    // An edit replaces a post, and with it its group.
    const edited = { ...a2, is_author_signed: false };
    const third = getDropSignatureGroups([a1, edited, b1, b2, b3]);
    expect(third.get("a1")).not.toBe(second.get("a1"));
    expect(third.get("a1")![1]!.is_author_signed).toBe(false);
  });

  it("returns no groups while signed messages are off", () => {
    mockEnabled = false;
    expect(
      getDropSignatureGroups([aDrop("a1", "alice", 0), aDrop("a2", "alice", 1)])
        .size
    ).toBe(0);
  });
});
