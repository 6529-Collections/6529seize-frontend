import {
  getDmPeerId,
  groupConversationThreads,
  isUsableDm,
} from "@/lib/e2ee/dm-conversations";
import {
  ALICE_ID,
  BOB_ID,
  conversation,
  member,
  SELF_ID,
} from "../../components/e2ee/fakeE2eeEngine";

const dm = (g: string, overrides: Parameters<typeof conversation>[0] = {}) =>
  conversation({
    g,
    kind: "dm",
    name: null,
    admins: [SELF_ID, ALICE_ID],
    members: [member(SELF_ID, "me"), member(ALICE_ID, "alice")],
    ...overrides,
  });

it("groups ended/imported/restored histories with their current DM, leaving groups and other peers separate", () => {
  const old = dm("old", { status: "left", members: [], updatedAt: 900 });
  const current = dm("current", { updatedAt: 200 });
  const restored = dm("restored", { status: "restored", members: [] });
  const bob = dm("bob", {
    admins: [SELF_ID, BOB_ID],
    members: [member(SELF_ID, "me"), member(BOB_ID, "bob")],
  });
  const group = conversation();
  const threads = groupConversationThreads(
    [old, current, restored, bob, group],
    SELF_ID
  );
  expect(threads).toHaveLength(3);
  const alice = threads.find((thread) => thread.key === `dm:${ALICE_ID}`);
  expect(alice?.current.g).toBe("current");
  expect(alice?.sessions.map((session) => session.g).sort()).toEqual([
    "current",
    "old",
    "restored",
  ]);
  expect(
    threads.find((thread) => thread.current.g === group.g)?.sessions
  ).toHaveLength(1);
});

it("chooses the same active chat regardless of insertion order or incoming traffic", () => {
  const first = dm("a", { updatedAt: 1 });
  const second = dm("b", { updatedAt: 999 });
  for (const sessions of [
    [first, second],
    [second, first],
  ]) {
    expect(groupConversationThreads(sessions, SELF_ID)[0]?.current.g).toBe("a");
  }
});

it("does not reuse a chat after the peer left, but retains the original pair for history", () => {
  const alone = dm("alone", { members: [member(SELF_ID, "me")] });
  expect(getDmPeerId(alone, SELF_ID)).toBe(ALICE_ID);
  expect(isUsableDm(alone, SELF_ID)).toBe(false);
  expect(
    isUsableDm(dm("creating", { epoch: 0, members: alone.members }), SELF_ID)
  ).toBe(true);
  expect(
    groupConversationThreads([alone, dm("replacement")], SELF_ID)[0]?.current.g
  ).toBe("replacement");
});

it("keeps a DM holding a third person out of the peer's thread and DM lookups", () => {
  const crowded = dm("a-crowded", {
    members: [
      member(SELF_ID, "me"),
      member(ALICE_ID, "alice"),
      member(BOB_ID, "bob"),
    ],
  });
  expect(getDmPeerId(crowded, SELF_ID)).toBeNull();
  expect(isUsableDm(crowded, SELF_ID)).toBe(false);
  // Even with the lower g, it never becomes the current chat with alice.
  const threads = groupConversationThreads([crowded, dm("b-real")], SELF_ID);
  expect(threads.map((thread) => thread.key).sort()).toEqual([
    `dm:${ALICE_ID}`,
    "group:a-crowded",
  ]);
  expect(
    threads.find((thread) => thread.key === `dm:${ALICE_ID}`)?.current.g
  ).toBe("b-real");
});

it("needs a pair that includes you, and ignores members not identified yet", () => {
  const identity = (
    admins: string[],
    members: (string | null)[]
  ): Parameters<typeof getDmPeerId>[0] => ({
    kind: "dm",
    admins,
    members: members.map((profileId) => ({ profileId })),
  });
  expect(
    getDmPeerId(identity([ALICE_ID, BOB_ID], [SELF_ID, ALICE_ID]), SELF_ID)
  ).toBeNull();
  expect(
    getDmPeerId(identity([SELF_ID, SELF_ID], [SELF_ID, BOB_ID]), SELF_ID)
  ).toBe(BOB_ID);
  expect(
    getDmPeerId(identity([SELF_ID, ALICE_ID], [SELF_ID, null]), SELF_ID)
  ).toBe(ALICE_ID);
});

it("still resolves a real two-person chat whose admins are not a pair", () => {
  const legacy = dm("legacy", { admins: [SELF_ID] });
  expect(getDmPeerId(legacy, SELF_ID)).toBe(ALICE_ID);
  expect(isUsableDm(legacy, SELF_ID)).toBe(true);
  expect(groupConversationThreads([legacy], SELF_ID)[0]?.key).toBe(
    `dm:${ALICE_ID}`
  );
  expect(
    getDmPeerId(
      dm("legacy-three", {
        admins: [SELF_ID],
        members: [
          member(SELF_ID, "me"),
          member(ALICE_ID, "alice"),
          member(BOB_ID, "bob"),
        ],
      }),
      SELF_ID
    )
  ).toBeNull();
});

it("does not collapse chats whose peer or signed-in profile cannot be identified", () => {
  expect(
    getDmPeerId(
      dm("foreign", { admins: [ALICE_ID, BOB_ID], members: [] }),
      SELF_ID
    )
  ).toBeNull();
  expect(groupConversationThreads([dm("a"), dm("b")], null)).toHaveLength(2);
  expect(
    groupConversationThreads(
      [
        dm("a", { admins: [], members: [] }),
        dm("b", { admins: [], members: [] }),
      ],
      SELF_ID
    )
  ).toHaveLength(2);
});
