import {
  buildCmsPackageCandidate,
  createDefaultCmsBuilderState,
} from "./package";
import {
  cmsPackageSchema,
  type CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";

type CmsDraftRecovery = {
  readonly cmsPackage: CmsPackageV1;
  readonly draftId?: string | undefined;
  readonly jsonDraft?: string | undefined;
};
type CmsRecoverySnapshot = {
  readonly recovery: CmsDraftRecovery | null;
  readonly failed: boolean;
};
export const EMPTY_CMS_RECOVERY: CmsRecoverySnapshot = {
  recovery: null,
  failed: false,
};

export class CmsDraftRecoveryController {
  private snapshot: CmsRecoverySnapshot = EMPTY_CMS_RECOVERY;
  private loaded = false;
  private readonly listeners = new Set<() => void>();
  constructor(
    private readonly key: string,
    private readonly handle: string
  ) {}
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  readonly getSnapshot = (): CmsRecoverySnapshot => this.snapshot;
  load(): void {
    try {
      const raw = globalThis.localStorage.getItem(this.key);
      this.update({
        recovery: raw ? parseRecovery(raw, this.handle) : null,
        failed: false,
      });
      this.loaded = true;
    } catch {
      this.loaded = true;
      this.update({ recovery: null, failed: true });
    }
  }
  save(value: CmsDraftRecovery | null): void {
    if (!this.loaded || this.snapshot.recovery) return;
    try {
      if (value)
        globalThis.localStorage.setItem(this.key, JSON.stringify(value));
      else globalThis.localStorage.removeItem(this.key);
      if (this.snapshot.failed) this.update({ recovery: null, failed: false });
    } catch {
      if (!this.snapshot.failed) this.update({ recovery: null, failed: true });
    }
  }
  dismiss(): void {
    this.loaded = true;
    this.update({ recovery: null, failed: false });
  }
  private update(snapshot: CmsRecoverySnapshot): void {
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }
}

function parseRecovery(raw: string, handle: string): CmsDraftRecovery | null {
  const entry: unknown = JSON.parse(raw);
  if (typeof entry !== "object" || entry === null || !("cmsPackage" in entry))
    return null;
  if (!matchesRecoveryHandle(entry.cmsPackage, handle)) return null;
  const parsed = cmsPackageSchema.safeParse(entry.cmsPackage);
  const cmsPackage = parsed.success
    ? parsed.data
    : buildCmsPackageCandidate(createDefaultCmsBuilderState(handle));
  const fallbackJson = parsed.success
    ? undefined
    : JSON.stringify(entry.cmsPackage, null, 2);
  return {
    cmsPackage,
    draftId:
      "draftId" in entry && typeof entry.draftId === "string"
        ? entry.draftId
        : undefined,
    jsonDraft:
      "jsonDraft" in entry && typeof entry.jsonDraft === "string"
        ? entry.jsonDraft
        : fallbackJson,
  };
}

function matchesRecoveryHandle(value: unknown, handle: string): boolean {
  if (typeof value !== "object" || value === null || !("profile" in value))
    return false;
  const profile = value.profile;
  return (
    typeof profile === "object" &&
    profile !== null &&
    "handle" in profile &&
    typeof profile.handle === "string" &&
    profile.handle.toLowerCase() === handle
  );
}
