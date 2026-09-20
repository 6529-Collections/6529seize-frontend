import { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import {
  documentationFixture,
  titleOperation,
} from "@/__tests__/fixtures/artwork-documentation";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";

jest.mock("@/services/api/artwork-documentation-api", () => ({
  documentationErrorStatus: (error: { status?: number }) => error.status,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe("documentation draft controller", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    let keySequence = 0;
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      configurable: true,
      value: jest.fn(
        () =>
          `aaaaaaaa-aaaa-4aaa-8aaa-${String(++keySequence).padStart(12, "0")}`
      ),
    });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("retains typing during a slow save and uses the acknowledged version for the next write", async () => {
    const first = deferred<ApiArtworkDocumentationContext>();
    const second = deferred<ApiArtworkDocumentationContext>();
    const save = jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const context = documentationFixture();
    const controller = new DocumentationDraftController(
      context,
      { save, read: jest.fn() },
      jest.fn()
    );
    controller.edit("artwork", titleOperation("first"));
    const flushing = controller.flush();
    controller.edit("artwork", titleOperation("second"));
    first.resolve({ ...context, draft_version: 2 });
    await jest.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][0].draft_version).toBe(2);
    expect(save.mock.calls[1][2][0].answer.value).toBe("second");
    expect(controller.snapshot().state).toBe("saving");
    second.resolve({ ...context, draft_version: 3 });
    expect(await flushing).toBe(true);
    expect(controller.snapshot().edits).toEqual([]);
    expect(controller.snapshot().state).toBe("clean");
    controller.dispose();
  });

  it("keeps local answers on conflict until the artist explicitly chooses a fresh-version write", async () => {
    const context = documentationFixture();
    const latest = { ...context, draft_version: 4 };
    const save = jest
      .fn()
      .mockRejectedValueOnce({ status: 409 })
      .mockResolvedValue({ ...context, draft_version: 5 });
    const read = jest.fn().mockResolvedValue(latest);
    const controller = new DocumentationDraftController(
      context,
      { save, read },
      jest.fn()
    );
    controller.edit("artwork", titleOperation("my answer"));
    expect(await controller.flush()).toBe(false);
    expect(controller.snapshot().state).toBe("conflict");
    expect(controller.snapshot().edits[0]?.operation.answer?.value).toBe(
      "my answer"
    );
    expect(await controller.resolveConflict(true)).toBe(true);
    expect(save.mock.calls[1][0].draft_version).toBe(4);
    controller.dispose();
  });

  it("retries response loss using the identical idempotency key and original batch", async () => {
    const context = documentationFixture();
    const save = jest
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue({ ...context, draft_version: 2 });
    const controller = new DocumentationDraftController(
      context,
      { save, read: jest.fn() },
      jest.fn()
    );
    controller.edit("artwork", titleOperation("saved once"));
    await controller.flush();
    await controller.retry();
    expect(save.mock.calls[1][3]).toBe(save.mock.calls[0][3]);
    expect(save.mock.calls[1][2]).toEqual(save.mock.calls[0][2]);
    controller.dispose();
  });

  it("aborts the old actor's queue and ignores late results after a profile switch", async () => {
    const pending = deferred<ApiArtworkDocumentationContext>();
    const changed = jest.fn();
    const context = documentationFixture();
    const save = jest.fn().mockReturnValue(pending.promise);
    const controller = new DocumentationDraftController(
      context,
      { save, read: jest.fn() },
      changed
    );
    controller.edit("artwork", titleOperation("private"));
    const request = controller.flush();
    controller.dispose();
    const calls = changed.mock.calls.length;
    pending.resolve({ ...context, draft_version: 2 });
    expect(await request).toBe(false);
    expect(changed).toHaveBeenCalledTimes(calls);
    expect(save.mock.calls[0][4].aborted).toBe(true);
    expect(controller.snapshot().edits).toEqual([]);
  });

  it("does not send an invalid buffered value or report it saved", async () => {
    const save = jest.fn();
    const controller = new DocumentationDraftController(
      documentationFixture(),
      { save, read: jest.fn() },
      jest.fn()
    );
    controller.edit("artwork", titleOperation("x".repeat(256)));
    expect(await controller.flush()).toBe(false);
    expect(save).not.toHaveBeenCalled();
    expect(controller.snapshot().state).toBe("invalid");
    controller.dispose();
  });

  it("rejects an old response even if the controller is reactivated by StrictMode", async () => {
    const old = deferred<ApiArtworkDocumentationContext>();
    const fresh = deferred<ApiArtworkDocumentationContext>();
    const context = documentationFixture();
    const save = jest
      .fn()
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(fresh.promise);
    const controller = new DocumentationDraftController(
      context,
      { save, read: jest.fn() },
      jest.fn()
    );
    controller.edit("artwork", titleOperation("old actor text"));
    const oldRequest = controller.flush();
    controller.dispose();
    controller.activate();
    controller.edit("artwork", titleOperation("fresh text"));
    const newRequest = controller.flush();
    old.resolve({ ...context, draft_version: 99 });
    expect(await oldRequest).toBe(false);
    expect(controller.snapshot().context.draft_version).toBe(1);
    expect(controller.snapshot().edits[0]?.operation.answer?.value).toBe(
      "fresh text"
    );
    fresh.resolve({ ...context, draft_version: 2 });
    expect(await newRequest).toBe(true);
    expect(controller.snapshot().context.draft_version).toBe(2);
    controller.dispose();
  });

  it("serializes a source association after all pending draft edits", async () => {
    const context = documentationFixture();
    const save = jest.fn().mockResolvedValue({ ...context, draft_version: 2 });
    const associate = jest
      .fn()
      .mockResolvedValue({ ...context, draft_version: 3 });
    const controller = new DocumentationDraftController(
      context,
      { save, read: jest.fn() },
      jest.fn()
    );
    controller.edit("artwork", titleOperation("before drop"));
    expect(await controller.mutate(associate)).toBe(true);
    expect(associate.mock.calls[0][0].draft_version).toBe(2);
    expect(controller.snapshot().context.draft_version).toBe(3);
    controller.dispose();
  });

  it("serializes file metadata with module edits and keeps newer file typing", async () => {
    const first = deferred<ApiArtworkDocumentationContext>();
    const second = deferred<ApiArtworkDocumentationContext>();
    const context = documentationFixture();
    const controller = new DocumentationDraftController(
      context,
      {
        save: jest.fn().mockResolvedValue({ ...context, draft_version: 2 }),
        read: jest.fn(),
      },
      jest.fn()
    );
    const saveFirst = jest.fn().mockReturnValue(first.promise);
    const saveSecond = jest.fn().mockReturnValue(second.promise);
    controller.edit("artwork", titleOperation("title"));
    controller.queueContent("file:a", { label: "first" }, saveFirst);
    const flush = controller.flush();
    await jest.advanceTimersByTimeAsync(0);
    expect(saveFirst.mock.calls[0][0].draft_version).toBe(2);
    controller.queueContent("file:a", { label: "newer" }, saveSecond);
    first.resolve({ ...context, draft_version: 3 });
    await jest.advanceTimersByTimeAsync(0);
    expect(controller.snapshot().dirty).toBe(true);
    expect(saveSecond.mock.calls[0][0].draft_version).toBe(3);
    second.resolve({ ...context, draft_version: 4 });
    expect(await flush).toBe(true);
    expect(controller.snapshot().contentEdits).toEqual([]);
    controller.dispose();
  });
  it.each([
    [403, "auth_expired"],
    [503, "offline"],
  ])(
    "classifies a failed conflict refresh (%s) without discarding local text",
    async (status, expected) => {
      const context = documentationFixture();
      const read = jest
        .fn()
        .mockResolvedValueOnce(context)
        .mockRejectedValueOnce({ status });
      const controller = new DocumentationDraftController(
        context,
        { read, save: jest.fn().mockRejectedValue({ status: 409 }) },
        jest.fn()
      );
      controller.edit("artwork", titleOperation("unsaved"));
      await controller.flush();
      expect(await controller.resolveConflict(true)).toBe(false);
      expect(controller.snapshot().state).toBe(expected);
      expect(controller.snapshot().edits[0]?.operation.answer?.value).toBe(
        "unsaved"
      );
      controller.dispose();
    }
  );

  it.each([422, 403, 503])(
    "reads saved state before recovering a no-edit failed mutation (%s)",
    async (status) => {
      const context = documentationFixture();
      const recorded = {
        ...context,
        latest_revision_id: "recorded",
        confirmation_status: "current",
      } as ApiArtworkDocumentationContext;
      const read = jest.fn().mockResolvedValue(recorded);
      const action = jest.fn().mockRejectedValue({ status });
      const controller = new DocumentationDraftController(
        context,
        { read, save: jest.fn() },
        jest.fn()
      );
      expect(await controller.mutate(action)).toBe(false);
      expect(await controller.retry()).toBe(true);
      expect(read).toHaveBeenCalledWith(context.id, expect.any(AbortSignal));
      expect(controller.snapshot().context).toBe(recorded);
      expect(controller.snapshot().state).toBe("clean");
      expect(action).toHaveBeenCalledTimes(1);
      controller.dispose();
    }
  );

  it("keeps a failed no-edit recovery blocked when its readback also fails", async () => {
    const context = documentationFixture();
    const read = jest.fn().mockRejectedValue({ status: 503 });
    const action = jest.fn().mockRejectedValue({ status: 422 });
    const controller = new DocumentationDraftController(
      context,
      { read, save: jest.fn() },
      jest.fn()
    );
    await controller.mutate(action);
    expect(await controller.retry()).toBe(false);
    expect(controller.snapshot().state).toBe("offline");
    expect(controller.snapshot().context).toBe(context);
    expect(action).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it("serializes recovery readback and saves typing received during it against the fresh version", async () => {
    const context = documentationFixture();
    const pending = deferred<ApiArtworkDocumentationContext>();
    const read = jest.fn().mockReturnValue(pending.promise);
    const save = jest.fn().mockResolvedValue({ ...context, draft_version: 3 });
    const changed = jest.fn();
    const controller = new DocumentationDraftController(
      context,
      { read, save },
      changed
    );
    await controller.mutate(async () => {
      throw { status: 503 };
    });
    changed.mockClear();
    const recovery = controller.retry();
    expect(controller.retry()).toBe(recovery);
    expect(read).toHaveBeenCalledTimes(1);
    expect(
      changed.mock.calls.some(([snapshot]) => snapshot.state === "clean")
    ).toBe(false);
    controller.edit("artwork", titleOperation("Written while checking"));
    expect(save).not.toHaveBeenCalled();
    pending.resolve({ ...context, draft_version: 2 });
    expect(await recovery).toBe(true);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ draft_version: 2 }),
      "artwork",
      [titleOperation("Written while checking")],
      expect.any(String),
      expect.any(AbortSignal)
    );
    expect(controller.snapshot().dirty).toBe(false);
    expect(controller.snapshot().context.draft_version).toBe(3);
    controller.dispose();
  });

  it("ignores a recovery readback after its actor's controller is disposed", async () => {
    const context = documentationFixture();
    const pending = deferred<ApiArtworkDocumentationContext>();
    const read = jest.fn().mockReturnValue(pending.promise);
    const changed = jest.fn();
    const controller = new DocumentationDraftController(
      context,
      { read, save: jest.fn() },
      changed
    );
    await controller.mutate(async () => {
      throw { status: 422 };
    });
    const recovery = controller.retry();
    controller.dispose();
    const calls = changed.mock.calls.length;
    pending.resolve({ ...context, draft_version: 99 });
    expect(await recovery).toBe(false);
    expect(changed).toHaveBeenCalledTimes(calls);
    expect(controller.snapshot().context).toBe(context);
  });
  it("saves valid siblings and later modules while an incomplete answer remains buffered", async () => {
    const context = documentationFixture();
    const artistModule = context.profile.modules.find(
      (module) => module.id === "identity"
    )!;
    artistModule.fields = [
      {
        ...context.profile.modules.find((module) => module.id === "artwork")!
          .fields[0]!,
        id: "preferred_name",
      },
    ];
    let version = context.draft_version;
    const save = jest.fn(async () => ({
      ...context,
      draft_version: ++version,
    }));
    const controller = new DocumentationDraftController(
      context,
      { save, read: jest.fn() },
      jest.fn()
    );
    controller.edit("artwork", titleOperation(""));
    controller.edit("artwork", {
      ...titleOperation("Milos"),
      field: "location",
    });
    controller.edit("identity", {
      ...titleOperation("Artist credit"),
      field: "preferred_name",
    });
    expect(await controller.flush()).toBe(false);
    expect(save.mock.calls).toHaveLength(2);
    expect(
      controller.snapshot().edits.map((edit) => edit.operation.field)
    ).toEqual(["title"]);
    expect(controller.snapshot().state).toBe("invalid");
    controller.edit("artwork", titleOperation("Finished title"));
    expect(await controller.flush()).toBe(true);
    expect(controller.snapshot().dirty).toBe(false);
    controller.dispose();
  });

  it("isolates a server-rejected answer without repeatedly blocking valid siblings", async () => {
    const context = documentationFixture();
    let version = context.draft_version;
    const save = jest.fn(async (_context, _moduleId, operations) => {
      if (
        operations.some(
          (operation: { field: string }) => operation.field === "location"
        )
      )
        throw {
          status: 422,
          response: { body: { code: "INVALID_FIELD_VALUE" } },
        };
      return { ...context, draft_version: ++version };
    });
    const controller = new DocumentationDraftController(
      context,
      { save, read: jest.fn() },
      jest.fn()
    );
    controller.edit("artwork", titleOperation("A valid title"));
    controller.edit("artwork", {
      ...titleOperation("Rejected only by server"),
      field: "location",
    });
    expect(await controller.flush()).toBe(false);
    expect(save).toHaveBeenCalledTimes(3);
    expect(
      controller.snapshot().edits.map((edit) => edit.operation.field)
    ).toEqual(["location"]);
    expect(controller.snapshot().rejectedEdits).toEqual([
      expect.objectContaining({
        field: "location",
        errorCode: "INVALID_FIELD_VALUE",
      }),
    ]);
    expect(await controller.flush()).toBe(false);
    expect(save).toHaveBeenCalledTimes(3);
    controller.edit("artwork", titleOperation("Another valid edit"));
    expect(await controller.flush()).toBe(false);
    expect(save).toHaveBeenCalledTimes(4);
    controller.dispose();
  });

  it("links a checked file against the saved version while incomplete writing stays buffered", async () => {
    const context = documentationFixture();
    const linked = { ...context, draft_version: 3 };
    const save = jest.fn().mockResolvedValue({ ...context, draft_version: 2 });
    const link = jest.fn().mockResolvedValue(linked);
    const confirm = jest.fn();
    const controller = new DocumentationDraftController(
      context,
      { save, read: jest.fn() },
      jest.fn()
    );
    controller.edit("artwork", titleOperation(""));
    controller.edit("artwork", {
      ...titleOperation("Milos"),
      field: "location",
    });
    expect(await controller.mutateContent(link)).toBe(true);
    expect(link).toHaveBeenCalledWith(
      expect.objectContaining({ draft_version: 2 }),
      expect.any(AbortSignal)
    );
    expect(controller.snapshot().context).toBe(linked);
    expect(
      controller.snapshot().edits.map((edit) => edit.operation.field)
    ).toEqual(["title"]);
    expect(await controller.mutate(confirm)).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    controller.dispose();
  });

  it("does not attach files while a save response is uncertain", async () => {
    const context = documentationFixture();
    const save = jest.fn().mockRejectedValue(new Error("offline"));
    const link = jest.fn();
    const controller = new DocumentationDraftController(
      context,
      { save, read: jest.fn() },
      jest.fn()
    );
    controller.edit("artwork", titleOperation("Keep this"));
    expect(await controller.mutateContent(link)).toBe(false);
    expect(link).not.toHaveBeenCalled();
    expect(controller.snapshot().state).toBe("offline");
    expect(controller.snapshot().dirty).toBe(true);
    controller.dispose();
  });
});

it("restores stale tab-local answers for review without sending them or overwriting newer saved data", async () => {
  const context = documentationFixture();
  context.draft_version = 9;
  const save = jest.fn().mockResolvedValue({ ...context, draft_version: 10 });
  const controller = new DocumentationDraftController(
    context,
    { save, read: jest.fn().mockResolvedValue(context) },
    jest.fn()
  );
  controller.restore(
    [
      {
        moduleId: "artwork",
        operation: titleOperation("Recovered synthetic answer"),
      },
    ],
    true
  );
  expect(controller.snapshot()).toMatchObject({
    state: "conflict",
    dirty: true,
    latest: context,
  });
  expect(await controller.flush()).toBe(false);
  expect(save).not.toHaveBeenCalled();
  expect(await controller.resolveConflict(true)).toBe(true);
  expect(save.mock.calls[0][0].draft_version).toBe(9);
  expect(save.mock.calls[0][2][0].answer.value).toBe(
    "Recovered synthetic answer"
  );
  controller.dispose();
});
