import type { StoredMessage } from "@/lib/e2ee/records";
import {
  collapsibleSafetyNotice,
  deriveCommitNotices,
  noticeMessage,
  type CommitChange,
} from "@/lib/e2ee/engine/notices";
import type { GroupMetadata } from "@/lib/e2ee/wasm-types";

const meta = (overrides: Partial<GroupMetadata> = {}): GroupMetadata => ({
  v: 1,
  g: `0x${"aa".repeat(32)}`,
  kind: "group",
  name: "Team",
  admins: ["alice"],
  created_by: "alice",
  history: "from_join",
  ...overrides,
});

const change = (overrides: Partial<CommitChange> = {}): CommitChange => ({
  committerProfileId: "alice",
  membersBefore: [
    { deviceKey: "a1", profileId: "alice" },
    { deviceKey: "b1", profileId: "bob" },
  ],
  added: [],
  removed: [],
  metadataBefore: meta(),
  metadataAfter: meta(),
  leaving: new Set(),
  creation: false,
  ...overrides,
});

describe("notices (contract 8.6)", () => {
  it("creation commit -> created", () => {
    expect(
      deriveCommitNotices(
        change({
          creation: true,
          membersBefore: [{ deviceKey: "a1", profileId: "alice" }],
          added: [
            { deviceKey: "b1", profileId: "bob" },
            { deviceKey: "a2", profileId: "alice" },
          ],
        })
      )
    ).toEqual([
      { type: "created", actorProfileId: "alice", targetProfileIds: ["bob"] },
      {
        type: "device_added",
        actorProfileId: "alice",
        targetProfileIds: ["alice"],
      },
    ]);
  });

  it("new principals -> joined", () => {
    expect(
      deriveCommitNotices(
        change({ added: [{ deviceKey: "c1", profileId: "carol" }] })
      )
    ).toEqual([
      { type: "joined", actorProfileId: "alice", targetProfileIds: ["carol"] },
    ]);
  });

  it("removal by an admin -> removed, voluntary -> left", () => {
    expect(
      deriveCommitNotices(
        change({ removed: [{ deviceKey: "b1", profileId: "bob" }] })
      )
    ).toEqual([
      { type: "removed", actorProfileId: "alice", targetProfileIds: ["bob"] },
    ]);
    expect(
      deriveCommitNotices(
        change({
          removed: [{ deviceKey: "b1", profileId: "bob" }],
          leaving: new Set(["b1"]),
        })
      )
    ).toEqual([
      { type: "left", actorProfileId: "bob", targetProfileIds: ["bob"] },
    ]);
  });

  it("device changes of remaining principals", () => {
    expect(
      deriveCommitNotices(
        change({
          membersBefore: [
            { deviceKey: "a1", profileId: "alice" },
            { deviceKey: "b1", profileId: "bob" },
            { deviceKey: "b2", profileId: "bob" },
          ],
          added: [{ deviceKey: "b3", profileId: "bob" }],
          removed: [{ deviceKey: "b2", profileId: "bob" }],
        })
      )
    ).toEqual([
      {
        type: "device_added",
        actorProfileId: "alice",
        targetProfileIds: ["bob"],
      },
      {
        type: "device_removed",
        actorProfileId: "alice",
        targetProfileIds: ["bob"],
      },
    ]);
  });

  it("rename and admin changes", () => {
    expect(
      deriveCommitNotices(
        change({
          metadataAfter: meta({ name: "New", admins: ["alice", "bob"] }),
        })
      )
    ).toEqual([
      {
        type: "renamed",
        actorProfileId: "alice",
        targetProfileIds: [],
        detail: "New",
      },
      {
        type: "admins_changed",
        actorProfileId: "alice",
        targetProfileIds: ["bob"],
        detail: "added",
      },
    ]);
    expect(
      deriveCommitNotices(
        change({ metadataBefore: meta({ admins: ["alice", "bob"] }) })
      )
    ).toEqual([
      {
        type: "admins_changed",
        actorProfileId: "alice",
        targetProfileIds: ["bob"],
        detail: "removed",
      },
    ]);
  });

  it("key-only commit -> safety code changed", () => {
    expect(deriveCommitNotices(change())).toEqual([
      {
        type: "safety_code_changed",
        actorProfileId: "alice",
        targetProfileIds: [],
      },
    ]);
  });

  it("builds notice messages and finds a collapsible safety notice", () => {
    const notice = noticeMessage({
      g: "g",
      seq: 7,
      index: 0,
      serverTs: 100,
      notice: {
        type: "safety_code_changed",
        actorProfileId: "alice",
        targetProfileIds: [],
      },
    });
    expect(notice).toMatchObject({
      id: "notice-7-0",
      kind: "notice",
      seq: 7,
      text: "",
    });
    expect(collapsibleSafetyNotice([notice])).toBe("notice-7-0");
    const other = { ...notice, kind: "message" } as StoredMessage;
    expect(collapsibleSafetyNotice([notice, other])).toBeNull();
    expect(collapsibleSafetyNotice([])).toBeNull();
  });
});
