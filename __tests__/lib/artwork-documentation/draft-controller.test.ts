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
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      configurable: true,
      value: jest.fn(() => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
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
    await Promise.resolve();
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
    await Promise.resolve();
    expect(saveFirst.mock.calls[0][0].draft_version).toBe(2);
    controller.queueContent("file:a", { label: "newer" }, saveSecond);
    first.resolve({ ...context, draft_version: 3 });
    await Promise.resolve();
    await Promise.resolve();
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
});
