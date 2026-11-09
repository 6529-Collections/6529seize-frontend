import type { E2eeEngineExt } from "../types";
import type { EngineContext } from "./context";
import { createConversation, findDm } from "./membership";
import { resolveProfiles } from "./setup";

type ConversationInput = Parameters<E2eeEngineExt["createConversation"]>[0];

/** Coalesces DM starts for this engine; MLS groups remain independently keyed. */
export class ConversationCreator {
  private readonly pending = new Map<string, Promise<string>>();

  constructor(
    private readonly ctx: EngineContext,
    private readonly sync: () => Promise<void>,
    private readonly requireReady: () => void,
    private readonly onDelayed: (g: string) => void
  ) {}

  /**
   * `predecessor`: the superseded conversation a new one continues (D172);
   * an existing DM with the peer is returned as is (the caller links it).
   */
  async create(
    input: ConversationInput,
    predecessor?: string
  ): Promise<string> {
    this.requireReady();
    const targets = [...new Set(input.profileIds)].filter(
      (id) => id !== this.ctx.profileId
    );
    const peer =
      input.kind === "dm" && targets.length === 1 ? targets[0] : undefined;
    if (peer === undefined) return this.createNew(input, predecessor);
    const pending = this.pending.get(peer);
    if (pending) return pending;
    const existing = findDm(this.ctx, peer);
    if (existing) return existing;
    const creation = this.createAfterSync(input, predecessor);
    this.pending.set(peer, creation);
    try {
      return await creation;
    } finally {
      // A rejected shared creation fails all callers and permits a fresh retry.
      this.pending.delete(peer);
    }
  }

  private async createAfterSync(
    input: ConversationInput,
    predecessor?: string
  ): Promise<string> {
    // Discover invitations before creation. This is not a server pair lock.
    await this.sync();
    this.requireReady();
    return this.createNew(input, predecessor);
  }

  private async createNew(
    input: ConversationInput,
    predecessor?: string
  ): Promise<string> {
    const g = await createConversation(
      this.ctx,
      input,
      this.onDelayed,
      predecessor
    );
    await resolveProfiles(this.ctx, input.profileIds);
    return g;
  }
}
