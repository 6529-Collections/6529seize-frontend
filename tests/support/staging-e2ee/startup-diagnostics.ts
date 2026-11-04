import type { Page, TestInfo } from "@playwright/test";

const METRICS_KEY = "__6529QaHistoryStartup";

interface OpenTiming {
  at: number;
  version: number | null;
  upgradeAt?: number;
  oldVersion?: number;
  transactionCompleteAt?: number;
  openedAt?: number;
  error?: string;
}

/** Observe native requests without recording keys, records, or plaintext. */
export async function installHistoryStartupDiagnostics(page: Page) {
  await page.addInitScript((key) => {
    const state = {
      opens: [] as OpenTiming[],
      messageReads: 0,
      messageRowsRead: 0,
      lastReadAt: 0,
      messageWrites: 0,
      lastWriteAt: 0,
      indexes: [] as { name: string; at: number }[],
    };
    Reflect.set(globalThis, key, state);
    const open = IDBFactory.prototype.open;
    Object.defineProperty(IDBFactory.prototype, "open", {
      value: function (
        this: IDBFactory,
        ...args: Parameters<IDBFactory["open"]>
      ) {
        const request: IDBOpenDBRequest = Reflect.apply(open, this, args);
        if (args[0] !== "6529-e2ee") return request;
        const timing: OpenTiming = {
          at: performance.now(),
          version: args[1] ?? null,
        };
        state.opens.push(timing);
        request.addEventListener("upgradeneeded", (event) => {
          timing.upgradeAt = performance.now();
          timing.oldVersion = event.oldVersion;
          request.transaction?.addEventListener("complete", () => {
            timing.transactionCompleteAt = performance.now();
          });
        });
        request.addEventListener("success", () => {
          timing.openedAt = performance.now();
        });
        request.addEventListener("error", () => {
          timing.error = request.error?.name ?? "unknown";
        });
        return request;
      },
    });
    const getAll = IDBObjectStore.prototype.getAll;
    Object.defineProperty(IDBObjectStore.prototype, "getAll", {
      value: function (
        this: IDBObjectStore,
        ...args: Parameters<IDBObjectStore["getAll"]>
      ) {
        const request: IDBRequest<unknown[]> = Reflect.apply(
          getAll,
          this,
          args
        );
        if (
          this.name === "messages" &&
          this.transaction.db.name === "6529-e2ee"
        ) {
          state.messageReads++;
          request.addEventListener("success", () => {
            state.messageRowsRead += request.result.length;
            state.lastReadAt = performance.now();
          });
        }
        return request;
      },
    });
    const put = IDBObjectStore.prototype.put;
    Object.defineProperty(IDBObjectStore.prototype, "put", {
      value: function (
        this: IDBObjectStore,
        ...args: Parameters<IDBObjectStore["put"]>
      ) {
        if (
          this.name === "messages" &&
          this.transaction.db.name === "6529-e2ee"
        ) {
          state.messageWrites++;
          state.lastWriteAt = performance.now();
        }
        return Reflect.apply(put, this, args);
      },
    });
    const createIndex = IDBObjectStore.prototype.createIndex;
    Object.defineProperty(IDBObjectStore.prototype, "createIndex", {
      value: function (
        this: IDBObjectStore,
        ...args: Parameters<IDBObjectStore["createIndex"]>
      ) {
        if (
          this.name === "messages" &&
          this.transaction.db.name === "6529-e2ee"
        )
          state.indexes.push({ name: args[0], at: performance.now() });
        return Reflect.apply(createIndex, this, args);
      },
    });
  }, METRICS_KEY);
}

export async function attachHistoryStartupDiagnostics(
  page: Page,
  testInfo: TestInfo
) {
  const metrics = await page.evaluate(
    (key) => ({
      timing: Reflect.get(globalThis, key),
      capturedAt: performance.now(),
      visibility: document.visibilityState,
    }),
    METRICS_KEY
  );
  await testInfo.attach("long-history-startup-timings.json", {
    body: Buffer.from(JSON.stringify(metrics)),
    contentType: "application/json",
  });
}
