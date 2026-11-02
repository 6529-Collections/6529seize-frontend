import type { Page } from "@playwright/test";

/** Synthetic processed records in a throwaway staging identity. No MLS state is fabricated. */
export async function seedProcessedHistory(
  page: Page,
  g: string,
  profileId: string
) {
  // Leave the app first so a live engine cannot overwrite the fixture's summaries.
  await page.goto("https://staging.6529.io/api/version");
  return page.evaluate(
    async ({ groupId, profile }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("6529-e2ee");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const read = <T>(request: IDBRequest<T>) =>
        new Promise<T>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      const tx = db.transaction(["messages", "groups"], "readonly");
      const rows = await read(
        tx
          .objectStore("messages")
          .index("group")
          .getAll(IDBKeyRange.only([profile, groupId]))
      );
      const group = await read(
        db
          .transaction("groups", "readonly")
          .objectStore("groups")
          .get([profile, groupId])
      );
      const template = rows.find(
        (row) => row.kind === "message" && !row.pending && !row.deleted
      );
      const photo = rows.find((row) => row.attachments?.length > 0);
      if (!template || !group || !photo)
        throw new Error(
          "Performance fixture needs a delivered message and encrypted image"
        );
      const total = 100_000;
      const originalCursor: number = group.cursor;
      for (let offset = 0; offset < total; offset += 1000) {
        await new Promise<void>((resolve, reject) => {
          const write = db.transaction("messages", "readwrite");
          write.oncomplete = () => resolve();
          write.onerror = () => reject(write.error);
          const store = write.objectStore("messages");
          for (let index = offset; index < offset + 1000; index++) {
            const id = `performance-${index}`;
            const seq = index - total; // Older than real traffic; the real saved MLS cursor is unchanged.
            const source =
              index < 90_000 && index % 10 === 0 ? photo : template;
            const row = {
              ...source,
              id,
              seq,
              text: `performance fixture ${index}`,
              body: null,
              sig: null,
              attachments: source === photo ? photo.attachments : [],
              ts: template.ts - total + index,
              serverTs: template.serverTs - total + index,
              historyOrder: [0, seq, 1, id],
              lastOrder: [0, seq, 1, id],
              pending: false,
            };
            delete row.unreadSeq;
            delete row.mentionSeq;
            delete row.importSource;
            delete row.imported;
            store.put(row);
          }
        });
      }
      // Force the same incremental summary used by ordinary processed histories.
      group.history = { ...group.history, count: rows.length + total };
      await new Promise<void>((resolve, reject) => {
        const write = db.transaction("groups", "readwrite");
        write.oncomplete = () => resolve();
        write.onerror = () => reject(write.error);
        write.objectStore("groups").put(group);
      });
      db.close();
      return { total, originalCursor, photos: 9000 };
    },
    { groupId: g, profile: profileId }
  );
}

export async function browserPerformanceSnapshot(page: Page) {
  return page.evaluate(() => {
    const memory = (
      performance as Performance & { memory?: { usedJSHeapSize: number } }
    ).memory;
    return {
      renderedRows: document.querySelectorAll(
        '[role="listitem"][id^="e2ee-message"]'
      ).length,
      placeholders: document.querySelectorAll("[data-e2ee-row]").length,
      heapUsedBytes: memory?.usedJSHeapSize ?? null,
      images: document.querySelectorAll('[data-e2ee-scroll] img[src^="blob:"]')
        .length,
    };
  });
}
