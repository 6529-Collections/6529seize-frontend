import type { Page } from "@playwright/test";
import type { StoredGroup, StoredMessage } from "@/lib/e2ee/records";

type IndexedMessage = StoredMessage & {
  profileId: string;
  historyOrder?: unknown;
  lastOrder?: unknown;
  importSource?: unknown;
  unreadSeq?: unknown;
  mentionSeq?: unknown;
};
type IndexedGroup = StoredGroup & { profileId: string };

/** A v1 saved-history fixture in a throwaway identity, retaining its real sealed MLS checkpoint and key. */
export async function seedProcessedHistory(
  page: Page,
  g: string,
  profileId: string
) {
  await page.goto("https://staging.6529.io/api/version");
  return page.evaluate(
    async ({ groupId, profile }) => {
      const names = ["devices", "wasm", "keys", "groups", "messages", "outbox"];
      const read = <T>(request: IDBRequest<T>) =>
        new Promise<T>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () =>
            reject(request.error ?? new Error("QA IndexedDB request failed"));
        });
      const finished = (tx: IDBTransaction) =>
        new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () =>
            reject(tx.error ?? new Error("QA IndexedDB transaction failed"));
          tx.onabort = () =>
            reject(tx.error ?? new Error("QA IndexedDB transaction failed"));
        });
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("6529-e2ee");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () =>
          reject(req.error ?? new Error("QA IndexedDB open failed"));
      });
      const source = db.transaction(names, "readonly");
      const [datasets] = await Promise.all([
        Promise.all(
          names.map((name) =>
            read<unknown[]>(source.objectStore(name).getAll())
          )
        ),
        finished(source),
      ]);
      if (
        datasets.some((rows) =>
          (rows as { profileId: string }[]).some(
            (row) => row.profileId !== profile
          )
        )
      )
        throw new Error(
          "Performance fixture requires an isolated QA profile database"
        );
      const saved = new Map(
        names.map((name, index) => [name, datasets[index]!] as const)
      );
      const messages = saved.get("messages") as IndexedMessage[];
      for (const row of messages) {
        delete row.historyOrder;
        delete row.lastOrder;
        delete row.importSource;
        delete row.unreadSeq;
        delete row.mentionSeq;
      }
      const groups = saved.get("groups") as IndexedGroup[];
      for (const row of groups) delete row.history;
      const group = groups.find((row) => row.g === groupId);
      const template = messages.find(
        (row) =>
          row.g === groupId &&
          row.kind === "message" &&
          !row.pending &&
          !row.deleted
      );
      const photo = messages.find(
        (row) => row.g === groupId && row.attachments.length > 0
      );
      if (!group || !template || !photo)
        throw new Error(
          "Performance fixture needs a delivered message and encrypted image"
        );
      const originalCursor = group.cursor;
      db.close();
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase("6529-e2ee");
        req.onsuccess = () => resolve();
        req.onerror = () =>
          reject(req.error ?? new Error("QA IndexedDB open failed"));
        req.onblocked = () =>
          reject(new Error("QA engine database did not close"));
      });
      const legacy = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("6529-e2ee", 1);
        req.onupgradeneeded = () => {
          for (const name of ["devices", "wasm", "keys"])
            req.result.createObjectStore(name, { keyPath: "profileId" });
          const legacyGroups = req.result.createObjectStore("groups", {
            keyPath: ["profileId", "g"],
          });
          legacyGroups.createIndex("profile", "profileId");
          const legacyMessages = req.result.createObjectStore("messages", {
            keyPath: ["profileId", "g", "id"],
          });
          legacyMessages.createIndex("group", ["profileId", "g"]);
          legacyMessages.createIndex("profile", "profileId");
          req.result
            .createObjectStore("outbox", { keyPath: ["profileId", "id"] })
            .createIndex("profile", "profileId");
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () =>
          reject(req.error ?? new Error("QA IndexedDB open failed"));
      });
      const restore = legacy.transaction(names, "readwrite");
      const restored = finished(restore);
      for (const [name, rows] of saved)
        for (const row of rows) restore.objectStore(name).put(row);
      await restored;
      const total = 100_000;
      const appendBatch = async (offset: number) => {
        const tx = legacy.transaction("messages", "readwrite");
        const complete = finished(tx);
        for (let index = offset; index < offset + 1000; index++) {
          const sourceMessage =
            index === 0 || (index > 10_000 && index % 10 === 0)
              ? photo
              : template;
          const row = {
            ...sourceMessage,
            id: `performance-${index}`,
            seq: index - total,
            text: `performance fixture ${index}`,
            body: null,
            sig: null,
            attachments: sourceMessage === photo ? photo.attachments : [],
            ts: template.ts - total + index,
            serverTs: template.serverTs - total + index,
            pending: false,
          };
          delete row.imported;
          tx.objectStore("messages").put(row);
        }
        await complete;
      };
      for (let offset = 0; offset < total; offset += 1000)
        await appendBatch(offset);
      const verification = legacy.transaction(
        ["devices", "wasm", "keys"],
        "readonly"
      );
      const verified = finished(verification);
      const [device, state, sealingKey] = await Promise.all([
        read<{ registered: boolean } | undefined>(
          verification.objectStore("devices").get(profile)
        ),
        read<{ iv: Uint8Array; ciphertext: ArrayBuffer } | undefined>(
          verification.objectStore("wasm").get(profile)
        ),
        read<{ key: CryptoKey } | undefined>(
          verification.objectStore("keys").get(profile)
        ),
      ]);
      await verified;
      if (
        !device?.registered ||
        !state?.iv ||
        !state.ciphertext ||
        !sealingKey?.key
      )
        throw new Error("QA device or sealed state was not preserved");
      const restoredState = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: new Uint8Array(state.iv),
          additionalData: new TextEncoder().encode(profile),
        },
        sealingKey.key,
        state.ciphertext
      );
      if (restoredState.byteLength === 0)
        throw new Error("QA sealed state is empty");
      legacy.close();
      return {
        total,
        originalCursor,
        photos: 9000,
        schemaVersion: 1,
        devicePreserved: true,
        sealedStateReadable: true,
      };
    },
    { groupId: g, profile: profileId }
  );
}

export function browserPerformanceSnapshot(page: Page) {
  return page.evaluate(() => {
    const memory = (
      performance as Performance & { memory?: { usedJSHeapSize: number } }
    ).memory;
    return {
      renderedRows: document.querySelectorAll("[data-e2ee-mounted]").length,
      placeholders: document.querySelectorAll("[data-e2ee-row]").length,
      heapUsedBytes: memory?.usedJSHeapSize ?? null,
      images: document.querySelectorAll('[data-e2ee-scroll] img[src^="blob:"]')
        .length,
    };
  });
}
