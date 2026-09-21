import {
  documentationFixture,
  titleOperation,
} from "@/__tests__/fixtures/artwork-documentation";
import {
  activateDocumentationDraftRecovery,
  clearDocumentationDraftRecovery,
  readDocumentationDraftRecovery,
  saveDocumentationDraftRecovery,
} from "@/lib/artwork-documentation/draft-recovery";
import type { DraftSnapshot } from "@/lib/artwork-documentation/draft-controller";

const actor = "artist:direct:0x1111111111111111111111111111111111111111";
function snapshot(value = "Unfinished writing"): DraftSnapshot {
  return {
    context: documentationFixture(),
    edits: [
      { moduleId: "artwork", operation: titleOperation(value), sequence: 1 },
    ],
    state: "dirty",
    latest: null,
    dirty: true,
    contentEdits: [],
  };
}
function recordKey(): string {
  const names = Array.from({ length: sessionStorage.length }, (_, index) =>
    sessionStorage.key(index)
  );
  return names.find((name) => name?.includes(encodeURIComponent(actor)))!;
}
function modifyStored(change: (record: Record<string, unknown>) => void) {
  const key = recordKey();
  const record = JSON.parse(sessionStorage.getItem(key)!) as Record<
    string,
    unknown
  >;
  change(record);
  sessionStorage.setItem(key, JSON.stringify(record));
}
beforeEach(() => {
  sessionStorage.clear();
  activateDocumentationDraftRecovery(actor);
});
afterEach(() => jest.restoreAllMocks());

it.each(["", "x".repeat(256)])(
  "preserves incomplete or invalid field text instead of dropping it",
  (value) => {
    const draft = snapshot(value);
    expect(saveDocumentationDraftRecovery(actor, draft)).toBe(true);
    expect(readDocumentationDraftRecovery(actor, draft.context)).toEqual({
      edits: [{ moduleId: "artwork", operation: titleOperation(value) }],
      requireReview: false,
    });
  }
);

it("stores only pending operation data and version stamps", () => {
  const draft = snapshot();
  saveDocumentationDraftRecovery(actor, {
    ...draft,
    contentEdits: [{ id: "interview", value: "Not a module operation" }],
  });
  const raw = sessionStorage.getItem(recordKey())!;
  expect(raw).not.toContain("Not a module operation");
  expect(raw).not.toContain("mutation_capabilities");
  expect(raw).not.toContain("assets");
  expect(raw).not.toContain("confirmation_copy");
});

it.each(["profile", "profileVersion", "artist", "draft"])(
  "requires review after a changed %s version stamp",
  (changed) => {
    const draft = snapshot();
    saveDocumentationDraftRecovery(actor, draft);
    const current = documentationFixture();
    if (changed === "profile") current.profile.profile_id = "other_profile";
    if (changed === "profileVersion") current.profile.version++;
    if (changed === "artist") current.artist_record_version++;
    if (changed === "draft") current.draft_version++;
    expect(readDocumentationDraftRecovery(actor, current)?.requireReview).toBe(
      true
    );
  }
);

it.each(["archived", "revoked", "read_only", "redacted"])(
  "does not restore %s fields as editable local answers",
  (reason) => {
    const draft = snapshot();
    saveDocumentationDraftRecovery(actor, draft);
    const current = documentationFixture();
    if (reason === "archived")
      current.lifecycle = "archived" as typeof current.lifecycle;
    if (reason === "revoked") current.mutation_capabilities.edit_modules = [];
    if (reason === "read_only")
      current.profile.modules.find(
        (module) => module.id === "artwork"
      )!.fields[0]!.read_only = true;
    if (reason === "redacted") {
      current.mutation_capabilities.confirm_as_artist = false;
      current.modules["artwork"]!.answers["title"] = { redacted: true };
    }
    expect(readDocumentationDraftRecovery(actor, current)).toBeNull();
  }
);

it("does not cross actor or context boundaries", () => {
  const draft = snapshot();
  saveDocumentationDraftRecovery(actor, draft);
  expect(
    readDocumentationDraftRecovery("other-actor", draft.context)
  ).toBeNull();
  expect(
    readDocumentationDraftRecovery(actor, {
      ...draft.context,
      id: "other-context",
    })
  ).toBeNull();
  activateDocumentationDraftRecovery("other-actor");
  expect(readDocumentationDraftRecovery(actor, draft.context)).toBeNull();
});

it("retains the explicit review requirement across repeated reloads", () => {
  const draft = snapshot();
  saveDocumentationDraftRecovery(actor, { ...draft, state: "conflict" });
  expect(
    readDocumentationDraftRecovery(actor, draft.context)?.requireReview
  ).toBe(true);
});

it.each([
  "extra property",
  "bad operation",
  "redacted answer",
  "stale",
  "future",
  "wrong actor",
  "wrong context",
])("rejects a malformed recovery envelope: %s", (corruption) => {
  const draft = snapshot();
  saveDocumentationDraftRecovery(actor, draft);
  modifyStored((record) => {
    if (corruption === "extra property")
      record["credentials"] = "never accepted";
    if (corruption === "bad operation")
      record["edits"] = [
        { moduleId: "artwork", operation: { op: "delete", field: "title" } },
      ];
    if (corruption === "redacted answer")
      record["edits"] = [
        {
          moduleId: "artwork",
          operation: { op: "set", field: "title", answer: { redacted: true } },
        },
      ];
    if (corruption === "stale")
      record["savedAt"] = Date.now() - 25 * 60 * 60_000;
    if (corruption === "future") record["savedAt"] = Date.now() + 60_000;
    if (corruption === "wrong actor") record["actorKey"] = "other";
    if (corruption === "wrong context") record["contextId"] = "other";
  });
  expect(readDocumentationDraftRecovery(actor, draft.context)).toBeNull();
  expect(sessionStorage.length).toBe(1);
});

it("bounds serialized size, rejects malformed JSON, and removes failed old copies", () => {
  const draft = snapshot();
  saveDocumentationDraftRecovery(actor, draft);
  const key = recordKey();
  sessionStorage.setItem(key, "{");
  expect(readDocumentationDraftRecovery(actor, draft.context)).toBeNull();
  expect(
    saveDocumentationDraftRecovery(actor, snapshot("x".repeat(1_048_577)))
  ).toBe(false);
  expect(readDocumentationDraftRecovery(actor, draft.context)).toBeNull();
});

it("does not serialize file data or cyclic objects as answers", () => {
  const draft = snapshot();
  draft.edits[0]!.operation.answer!.value = new File(
    ["file bytes"],
    "master.tif"
  );
  expect(saveDocumentationDraftRecovery(actor, draft)).toBe(false);
  const cycle: Record<string, unknown> = {};
  cycle["self"] = cycle;
  draft.edits[0]!.operation.answer!.value = cycle;
  expect(saveDocumentationDraftRecovery(actor, draft)).toBe(false);
});

it("keeps unrelated tab storage when clearing recovery", () => {
  sessionStorage.setItem("other-feature", "keep");
  saveDocumentationDraftRecovery(actor, snapshot());
  clearDocumentationDraftRecovery();
  expect(sessionStorage.getItem("other-feature")).toBe("keep");
  expect(sessionStorage.length).toBe(1);
});

it("removes an older local copy if quota prevents storing the latest edits", () => {
  const draft = snapshot();
  saveDocumentationDraftRecovery(actor, draft);
  const set = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("quota");
    });
  expect(saveDocumentationDraftRecovery(actor, snapshot("Newer edits"))).toBe(
    false
  );
  set.mockRestore();
  expect(readDocumentationDraftRecovery(actor, draft.context)).toBeNull();
});
