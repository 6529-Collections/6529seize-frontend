import {
  isValidMetadata,
  validateCommit,
  type CommitValidationInput,
} from "@/lib/e2ee/engine/validate";
import type { GroupMetadata } from "@/lib/e2ee/wasm-types";

const G = `0x${"aa".repeat(32)}`;
const meta = (overrides: Partial<GroupMetadata> = {}): GroupMetadata => ({
  v: 1,
  g: G,
  kind: "group",
  name: null,
  admins: ["alice"],
  created_by: "alice",
  history: "from_join",
  ...overrides,
});

const input = (
  overrides: Partial<CommitValidationInput> = {}
): CommitValidationInput => ({
  entryEpoch: 3,
  committer: { deviceKey: "a1", profileId: "alice" },
  membersBefore: [
    { deviceKey: "a1", profileId: "alice" },
    { deviceKey: "b1", profileId: "bob" },
  ],
  added: [],
  removed: [],
  metadataBefore: meta(),
  metadataAfter: meta(),
  declaredOk: true,
  isRequiredRemoval: () => false,
  ...overrides,
});

const bob = { deviceKey: "b1", profileId: "bob" };

describe("commit validation (contract 8.1)", () => {
  it("accepts a plain self-update", () => {
    expect(validateCommit(input())).toEqual({ ok: true });
  });

  it("declared value mismatch is invalid and a split-view alarm", () => {
    expect(validateCommit(input({ declaredOk: false }))).toEqual({
      ok: false,
      reason: "declared-mismatch",
      splitView: true,
    });
  });

  it("unknown committer is invalid", () => {
    expect(
      validateCommit(input({ committer: { deviceKey: "x", profileId: null } }))
    ).toMatchObject({
      ok: false,
      reason: "unknown-committer",
    });
  });

  it("adding a new principal needs an admin and a group", () => {
    const carol = { deviceKey: "c1", profileId: "carol", ok: true };
    expect(validateCommit(input({ added: [carol] }))).toEqual({ ok: true });
    expect(
      validateCommit(
        input({
          committer: { deviceKey: "b1", profileId: "bob" },
          added: [carol],
        })
      )
    ).toMatchObject({ ok: false, reason: "add-not-admin" });
    expect(
      validateCommit(
        input({
          metadataBefore: meta({ kind: "dm" }),
          metadataAfter: meta({ kind: "dm" }),
          added: [carol],
        })
      )
    ).toMatchObject({ ok: false, reason: "dm-new-principal" });
  });

  it("allows the creation commit, including a DM's second principal", () => {
    const dm = meta({ kind: "dm", admins: ["alice", "bob"] });
    expect(
      validateCommit(
        input({
          entryEpoch: 0,
          membersBefore: [{ deviceKey: "a1", profileId: "alice" }],
          added: [{ ...bob, ok: true }],
          metadataBefore: dm,
          metadataAfter: dm,
        })
      )
    ).toEqual({ ok: true });
    expect(
      validateCommit(
        input({
          entryEpoch: 0,
          membersBefore: [{ deviceKey: "a1", profileId: "alice" }],
          added: [
            { ...bob, ok: true },
            { deviceKey: "c1", profileId: "carol", ok: true },
          ],
          metadataBefore: dm,
          metadataAfter: dm,
        })
      )
    ).toMatchObject({ ok: false, reason: "dm-new-principal" });
  });

  it("anyone may add devices of existing principals; bad leaves are refused", () => {
    const bobAdds = input({
      committer: { deviceKey: "b1", profileId: "bob" },
      added: [{ deviceKey: "a2", profileId: "alice", ok: true }],
    });
    expect(validateCommit(bobAdds)).toEqual({ ok: true });
    expect(
      validateCommit(
        input({ added: [{ deviceKey: "a2", profileId: "alice", ok: false }] })
      )
    ).toMatchObject({
      ok: false,
      reason: "bad-leaf",
    });
  });

  it("removing another principal needs an admin unless required", () => {
    const byBob = { committer: { deviceKey: "b1", profileId: "bob" } };
    const removeAlice = { removed: [{ deviceKey: "a1", profileId: "alice" }] };
    expect(validateCommit(input({ removed: [bob] }))).toEqual({ ok: true });
    expect(validateCommit(input({ ...byBob, ...removeAlice }))).toMatchObject({
      ok: false,
      reason: "remove-not-admin",
    });
    expect(
      validateCommit(
        input({
          ...byBob,
          ...removeAlice,
          isRequiredRemoval: (key) => key === "a1",
        })
      )
    ).toEqual({ ok: true });
    expect(
      validateCommit(
        input({
          ...byBob,
          membersBefore: [
            ...input().membersBefore,
            { deviceKey: "b2", profileId: "bob" },
          ],
          removed: [{ deviceKey: "b2", profileId: "bob" }],
        })
      )
    ).toEqual({ ok: true });
  });

  it("metadata changes need an admin and keep g, kind and an admin", () => {
    expect(
      validateCommit(input({ metadataAfter: meta({ name: "x" }) }))
    ).toEqual({ ok: true });
    expect(
      validateCommit(
        input({
          committer: { deviceKey: "b1", profileId: "bob" },
          metadataAfter: meta({ name: "x" }),
        })
      )
    ).toMatchObject({ ok: false, reason: "metadata-not-admin" });
    expect(
      validateCommit(input({ metadataAfter: meta({ kind: "dm" }) }))
    ).toMatchObject({
      ok: false,
      reason: "metadata-identity",
    });
    expect(
      validateCommit(input({ metadataAfter: meta({ admins: [] }) }))
    ).toMatchObject({
      ok: false,
      reason: "metadata-no-admin",
    });
    expect(
      validateCommit(input({ metadataAfter: meta({ name: "n".repeat(101) }) }))
    ).toMatchObject({
      ok: false,
      reason: "metadata-shape",
    });
  });

  it("checks the metadata shape", () => {
    expect(isValidMetadata(meta())).toBe(true);
    expect(isValidMetadata({ ...meta(), v: 2 })).toBe(false);
    expect(isValidMetadata({ ...meta(), history: "all" })).toBe(false);
    expect(isValidMetadata(null)).toBe(false);
  });
});
