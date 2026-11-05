/** @jest-environment node */
import { createMemoryE2eeStorage } from "@/lib/e2ee/storage";
import { searchHistory } from "@/lib/e2ee/engine/history-search";
import { newRuntime } from "@/lib/e2ee/engine/groups";
import type { EngineContext } from "@/lib/e2ee/engine/context";
import type { StoredGroup, StoredMessage } from "@/lib/e2ee/records";

it("overlays unsaved new, edited and deleted records without duplicate search hits", async () => {
  const storage = createMemoryE2eeStorage();
  const row = (id: string, text: string) =>
    ({
      id,
      g: "g",
      text,
      kind: "message",
      pending: false,
      deleted: false,
      undecryptable: false,
      seq: 1,
      ts: 1,
      serverTs: 1,
    }) as StoredMessage;
  await storage.writeBatch("p", {
    messages: [
      row("edit", "old match"),
      row("delete", "match deleted"),
      row("physical", "match removed"),
      row("saved", "match saved"),
    ],
  });
  const runtime = newRuntime({ g: "g" } as StoredGroup);
  runtime.messages.set("edit", row("edit", "match edited"));
  runtime.messages.set("new", row("new", "match new"));
  runtime.messages.set("delete", {
    ...row("delete", "match deleted"),
    deleted: true,
  });
  for (const id of ["edit", "new", "delete"]) runtime.dirty.add(id);
  runtime.deleted.add("physical");
  const ctx = {
    profileId: "p",
    storage,
    store: { groups: new Map([["g", runtime]]) },
  } as unknown as EngineContext;
  const results = await searchHistory(ctx, "match", ["g"]);
  expect(results.map((message) => message.text).sort()).toEqual([
    "match edited",
    "match new",
    "match saved",
  ]);
  expect(await searchHistory(ctx, "old match", ["g"])).toEqual([]);
  const controller = new AbortController();
  controller.abort();
  await expect(
    searchHistory(ctx, "match", ["g"], controller.signal)
  ).rejects.toThrow();
  await expect(
    searchHistory(ctx, "match", [], controller.signal)
  ).rejects.toThrow();
});
