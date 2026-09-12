interface DossierRequestRecovery {
  readonly key: string;
  readonly sourceHash: string;
  readonly draftVersion: number;
}
interface DossierRecovery {
  readonly jobId: string | null;
  readonly request: DossierRequestRecovery | null;
}

function boundedString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

/** Session recovery stores identifiers only. Every restored job is read through the authorized API. */
function readDossierRecovery(key: string): DossierRecovery | null {
  try {
    const raw = globalThis.sessionStorage.getItem(key);
    if (!raw || raw.length > 2048) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const jobId: unknown = Reflect.get(value, "jobId");
    if (boundedString(jobId, 128)) return { jobId, request: null };
    const request: unknown = Reflect.get(value, "request");
    if (typeof request !== "object" || request === null) return null;
    const requestKey: unknown = Reflect.get(request, "key");
    const sourceHash: unknown = Reflect.get(request, "sourceHash");
    const draftVersion: unknown = Reflect.get(request, "draftVersion");
    if (
      !boundedString(requestKey, 128) ||
      !boundedString(sourceHash, 128) ||
      typeof draftVersion !== "number" ||
      !Number.isSafeInteger(draftVersion) ||
      draftVersion < 0
    )
      return null;
    return {
      jobId: null,
      request: { key: requestKey, sourceHash, draftVersion },
    };
  } catch {
    return null;
  }
}

function writeDossierRecovery(
  key: string,
  recovery: DossierRecovery | null
): void {
  try {
    if (recovery)
      globalThis.sessionStorage.setItem(key, JSON.stringify(recovery));
    else globalThis.sessionStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in a browser session; the current request still works.
  }
}

/** A component-scoped external store gives hydration a null server snapshot and keeps storage failures recoverable in memory. */
export function createDossierRecoveryStore(key: string) {
  let initialized = false;
  let snapshot: DossierRecovery | null = null;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => {
      if (!initialized) {
        snapshot = readDossierRecovery(key);
        initialized = true;
      }
      return snapshot;
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update: (value: DossierRecovery | null) => {
      snapshot = value;
      initialized = true;
      writeDossierRecovery(key, value);
      listeners.forEach((listener) => listener());
    },
  };
}
