import type { E2eeEngineExt } from "../types";
import { checkpoint, requireGroup, type EngineContext } from "./context";
import type { ConversationCreator } from "./conversation-creation";
import { restartTargets } from "./membership";
import type { GroupRuntime } from "./store";

type ConversationInput = Parameters<E2eeEngineExt["createConversation"]>[0];

/**
 * "Start again" for a conversation that cannot continue: a left or removed
 * one starts a new conversation with the same people; a superseded one
 * (D172, made under an earlier MLS suite) gets exactly one successor on this
 * device. Its link (`successor`/`predecessor`) is stored in the checkpoint
 * that first stores the new group, so it survives a crash.
 */
export class ConversationRestarter {
  /** In-flight continuations of superseded conversations, by g. */
  private readonly inFlight = new Map<string, Promise<string>>();

  constructor(
    private readonly ctx: EngineContext,
    private readonly creator: ConversationCreator
  ) {}

  restart(g: string): Promise<string> {
    const runtime = requireGroup(this.ctx, g);
    const input: ConversationInput = {
      profileIds: restartTargets(this.ctx, runtime),
      kind: runtime.record.metadata.kind,
      name: runtime.record.metadata.name,
    };
    if (runtime.record.status !== "superseded") {
      return this.creator.create(input);
    }
    // A stored successor that is still active is returned; one that is gone
    // or no longer active (left, removed, invalid) is replaced. Concurrent
    // calls share one creation; a failed one is forgotten so a retry can
    // create, and a failed creation never leaves its link behind.
    const known = this.activeSuccessor(runtime);
    if (known) {
      return Promise.resolve(known);
    }
    const key = runtime.record.g;
    const pending = this.inFlight.get(key);
    if (pending) {
      return pending;
    }
    const run = this.continueSuperseded(key, input).finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, run);
    return run;
  }

  private activeSuccessor(runtime: GroupRuntime): string | null {
    const g = runtime.record.successor ?? null;
    const successor = g === null ? undefined : this.ctx.store.groups.get(g);
    return successor?.record.status === "active" ? g : null;
  }

  private async continueSuperseded(
    g: string,
    input: ConversationInput
  ): Promise<string> {
    const next = (await this.creator.create(input, g)).toLowerCase();
    const runtime = requireGroup(this.ctx, g);
    if (runtime.record.successor !== next) {
      // An existing DM with the peer was returned: link it now.
      await this.linkSuccessor(runtime, next);
    }
    return next;
  }

  private async linkSuccessor(
    runtime: GroupRuntime,
    successorG: string
  ): Promise<void> {
    const successor = this.ctx.store.groups.get(successorG);
    runtime.record.successor = successorG;
    if (successor) {
      successor.record.predecessor = runtime.record.g;
    }
    await this.ctx.queue.run(() =>
      checkpoint(this.ctx, {
        groups: successor ? [runtime, successor] : [runtime],
        skipWasm: true,
      })
    );
    this.ctx.store.touch(runtime.record.g);
    this.ctx.store.touch(successorG);
  }
}
