import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationOperation } from "@/generated/models/ApiArtworkDocumentationOperation";
import { documentationErrorStatus } from "@/services/api/artwork-documentation-api";
import { validDocumentationOperation } from "./validation";

export type SaveState =
  | "clean"
  | "dirty"
  | "saving"
  | "retrying"
  | "invalid"
  | "conflict"
  | "auth_expired"
  | "offline";
export interface PendingEdit {
  readonly moduleId: string;
  readonly operation: ApiArtworkDocumentationOperation;
  readonly sequence: number;
}
interface Batch {
  readonly context: ApiArtworkDocumentationContext;
  readonly moduleId: string;
  readonly edits: PendingEdit[];
  readonly key: string;
}
interface QueuedContent {
  readonly id: string;
  readonly sequence: number;
  readonly value: unknown;
  readonly action: (
    context: ApiArtworkDocumentationContext,
    key: string,
    signal: AbortSignal
  ) => Promise<ApiArtworkDocumentationContext>;
}
export interface DraftSnapshot {
  readonly context: ApiArtworkDocumentationContext;
  readonly state: SaveState;
  readonly edits: readonly PendingEdit[];
  readonly latest: ApiArtworkDocumentationContext | null;
  readonly dirty: boolean;
  readonly contentEdits: ReadonlyArray<{ id: string; value: unknown }>;
}
interface Transport {
  save(
    context: ApiArtworkDocumentationContext,
    moduleId: string,
    operations: ApiArtworkDocumentationOperation[],
    key: string,
    signal: AbortSignal
  ): Promise<ApiArtworkDocumentationContext>;
  read(
    id: string,
    signal: AbortSignal
  ): Promise<ApiArtworkDocumentationContext>;
}

/** One queue owns every content version, including edits made while a save is in flight. */
export class DocumentationDraftController {
  private context: ApiArtworkDocumentationContext;
  private latest: ApiArtworkDocumentationContext | null = null;
  private state: SaveState = "clean";
  private readonly edits = new Map<string, PendingEdit>();
  private readonly queuedContent = new Map<string, QueuedContent>();
  private pendingContent: {
    edit: QueuedContent;
    context: ApiArtworkDocumentationContext;
    key: string;
  } | null = null;
  private sequence = 0;
  private pendingBatch: Batch | null = null;
  private running: Promise<boolean> | null = null;
  private abort = new AbortController();
  private debounce: ReturnType<typeof setTimeout> | undefined;
  private maximum: ReturnType<typeof setTimeout> | undefined;
  private mutationRunning = false;
  private generation = 0;

  constructor(
    context: ApiArtworkDocumentationContext,
    private readonly transport: Transport,
    private readonly changed: (snapshot: DraftSnapshot) => void
  ) {
    this.context = context;
  }
  snapshot(): DraftSnapshot {
    return {
      context: this.context,
      state: this.state,
      edits: [...this.edits.values()],
      latest: this.latest,
      dirty: this.edits.size > 0 || this.queuedContent.size > 0,
      contentEdits: [...this.queuedContent.values()].map(({ id, value }) => ({
        id,
        value,
      })),
    };
  }
  activate() {
    if (this.abort.signal.aborted) this.abort = new AbortController();
  }
  private emit() {
    if (!this.abort.signal.aborted) this.changed(this.snapshot());
  }
  private clearTimers() {
    clearTimeout(this.debounce);
    clearTimeout(this.maximum);
    this.debounce = undefined;
    this.maximum = undefined;
  }
  edit(moduleId: string, operation: ApiArtworkDocumentationOperation) {
    if (this.abort.signal.aborted) return;
    this.edits.set(`${moduleId}.${operation.field}`, {
      moduleId,
      operation,
      sequence: ++this.sequence,
    });
    this.scheduleSave();
  }
  queueContent(id: string, value: unknown, action: QueuedContent["action"]) {
    if (this.abort.signal.aborted) return;
    this.queuedContent.set(id, {
      id,
      value,
      action,
      sequence: ++this.sequence,
    });
    this.scheduleSave();
  }
  private scheduleSave() {
    if (!["conflict", "auth_expired"].includes(this.state))
      this.state = this.running ? "saving" : "dirty";
    this.emit();
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      void this.flush();
    }, 800);
    this.maximum ??= setTimeout(() => {
      void this.flush();
    }, 5000);
  }
  flush(): Promise<boolean> {
    this.clearTimers();
    if (
      this.abort.signal.aborted ||
      ["conflict", "auth_expired", "invalid"].includes(this.state)
    )
      return Promise.resolve(false);
    if (this.running) return this.running;
    if (this.mutationRunning) return Promise.resolve(false);
    const generation = this.generation;
    this.running = this.runSaves(generation, this.abort.signal).finally(() => {
      if (generation === this.generation) this.running = null;
    });
    return this.running;
  }
  private async runSaves(
    generation: number,
    signal: AbortSignal
  ): Promise<boolean> {
    while (this.hasQueuedEdits()) {
      if (!this.edits.size && !this.pendingBatch) {
        if (!(await this.saveQueuedContent(generation, signal))) return false;
        continue;
      }
      const batch = this.nextBatch();
      if (!batch) break;
      if (!this.validateBatch(batch)) return false;
      this.state = "saving";
      this.emit();
      try {
        const result = await this.transport.save(
          batch.context,
          batch.moduleId,
          batch.edits.map((edit) => edit.operation),
          batch.key,
          signal
        );
        if (!this.isCurrentSave(generation, signal)) return false;
        this.acknowledgeBatch(batch, result);
      } catch (error) {
        return this.failSave(error, generation);
      }
    }
    this.state = "clean";
    this.emit();
    return true;
  }
  private hasQueuedEdits(): boolean {
    return (
      this.edits.size > 0 ||
      this.pendingBatch !== null ||
      this.queuedContent.size > 0 ||
      this.pendingContent !== null
    );
  }
  private nextBatch(): Batch | null {
    if (this.pendingBatch) return this.pendingBatch;
    const first = this.edits.values().next().value;
    if (!first) return null;
    this.pendingBatch = {
      context: this.context,
      moduleId: first.moduleId,
      edits: [...this.edits.values()].filter(
        (edit) => edit.moduleId === first.moduleId
      ),
      key: crypto.randomUUID(),
    };
    return this.pendingBatch;
  }
  private validateBatch(batch: Batch): boolean {
    if (
      !batch.edits.every((edit) =>
        validDocumentationOperation(
          batch.context,
          batch.moduleId,
          edit.operation
        )
      )
    ) {
      this.pendingBatch = null;
      this.state = "invalid";
      this.emit();
      return false;
    }
    return true;
  }
  private isCurrentSave(generation: number, signal: AbortSignal): boolean {
    return !signal.aborted && generation === this.generation;
  }
  private acknowledgeBatch(
    batch: Batch,
    result: ApiArtworkDocumentationContext
  ): void {
    this.context = result;
    for (const edit of batch.edits) {
      const key = `${edit.moduleId}.${edit.operation.field}`;
      if (this.edits.get(key)?.sequence === edit.sequence)
        this.edits.delete(key);
    }
    this.pendingBatch = null;
  }
  private async failSave(error: unknown, generation: number): Promise<false> {
    if (generation === this.generation) await this.handleFailure(error);
    return false;
  }
  private async saveQueuedContent(
    generation: number,
    signal: AbortSignal
  ): Promise<boolean> {
    const edit = this.queuedContent.values().next().value;
    if (!this.pendingContent && edit)
      this.pendingContent = {
        edit,
        context: this.context,
        key: crypto.randomUUID(),
      };
    const batch = this.pendingContent;
    if (!batch) return true;
    this.state = "saving";
    this.emit();
    try {
      const result = await batch.edit.action(batch.context, batch.key, signal);
      if (signal.aborted || generation !== this.generation) return false;
      this.context = result;
      if (
        this.queuedContent.get(batch.edit.id)?.sequence === batch.edit.sequence
      )
        this.queuedContent.delete(batch.edit.id);
      this.pendingContent = null;
      return true;
    } catch (error) {
      if (generation === this.generation) await this.handleFailure(error);
      return false;
    }
  }
  private async handleFailure(error: unknown) {
    if (this.abort.signal.aborted) return;
    const generation = this.generation;
    const signal = this.abort.signal;
    const status = documentationErrorStatus(error);
    if (status === 409) {
      this.state = "conflict";
      try {
        const latest = await this.transport.read(this.context.id, signal);
        if (signal.aborted || generation !== this.generation) return;
        this.latest = latest;
      } catch {
        if (generation !== this.generation) return;
        this.latest = null;
      }
    } else if (status === 401 || status === 403 || status === 404) {
      this.state = "auth_expired";
    } else if (status === 422 || status === 413 || status === 428) {
      this.state = "invalid";
      this.pendingBatch = null;
      this.pendingContent = null;
    } else this.state = "offline";
    this.emit();
  }
  retry() {
    if (this.state === "conflict") return Promise.resolve(false);
    this.state = "retrying";
    this.emit();
    return this.flush();
  }
  async resolveConflict(keepChanges: boolean) {
    const generation = this.generation;
    const signal = this.abort.signal;
    let latest: ApiArtworkDocumentationContext;
    try {
      latest = await this.transport.read(this.context.id, signal);
    } catch (error) {
      if (generation === this.generation) await this.handleFailure(error);
      return false;
    }
    if (signal.aborted || generation !== this.generation) return false;
    this.context = latest;
    this.latest = null;
    this.pendingBatch = null;
    this.pendingContent = null;
    if (!keepChanges) this.edits.clear();
    if (!keepChanges) this.queuedContent.clear();
    this.state = this.snapshot().dirty ? "dirty" : "clean";
    this.emit();
    return this.flush();
  }
  async mutate(
    action: (
      context: ApiArtworkDocumentationContext,
      signal: AbortSignal
    ) => Promise<ApiArtworkDocumentationContext>
  ): Promise<boolean> {
    if (!(await this.flush()) || this.mutationRunning) return false;
    this.mutationRunning = true;
    const generation = this.generation;
    const signal = this.abort.signal;
    this.state = "saving";
    this.emit();
    try {
      const result = await action(this.context, signal);
      if (signal.aborted || generation !== this.generation) return false;
      this.context = result;
      this.state = this.snapshot().dirty ? "dirty" : "clean";
      this.emit();
      return true;
    } catch (error) {
      if (generation === this.generation) await this.handleFailure(error);
      return false;
    } finally {
      if (generation === this.generation) {
        this.mutationRunning = false;
        if (this.snapshot().dirty && this.state === "dirty") void this.flush();
      }
    }
  }
  dispose() {
    this.generation++;
    this.clearTimers();
    this.abort.abort();
    this.edits.clear();
    this.queuedContent.clear();
    this.pendingContent = null;
    this.pendingBatch = null;
    this.latest = null;
    this.running = null;
    this.mutationRunning = false;
    this.state = "clean";
  }
}
