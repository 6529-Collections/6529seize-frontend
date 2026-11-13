import { getDmPeerId, isUsableDm } from "../dm-conversations";
import type { E2eeEngineExt } from "../types";
import { checkpoint, requireGroup, type EngineContext } from "./context";
import type { ConversationCreator } from "./conversation-creation";
import { E2eeError } from "./errors";
import { restartTargets } from "./membership";
import type { GroupRuntime } from "./store";

type ConversationInput = Parameters<E2eeEngineExt["createConversation"]>[0];

/** The fields the DM helpers read, picked from the stored group. */
const dmIdentity = ({ record }: GroupRuntime) => ({
  kind: record.metadata.kind,
  admins: record.metadata.admins,
  members: record.members,
  status: record.status,
  epoch: record.epoch,
});

/**
 * A stored successor continues a DM only while it is a usable DM with the
 * same peer, so "continue" and "resend unsent" never route anywhere else.
 */
function continuesDm(
  ctx: EngineContext,
  runtime: GroupRuntime,
  successor: GroupRuntime
): boolean {
  const peer = getDmPeerId(dmIdentity(runtime), ctx.profileId);
  const next = dmIdentity(successor);
  return (
    peer !== null &&
    getDmPeerId(next, ctx.profileId) === peer &&
    isUsableDm(next, ctx.profileId)
  );
}

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
    const kind = runtime.record.metadata.kind;
    // A self group is not a chat: read-state sync makes its own (P60).
    if (kind === "self") {
      return Promise.reject(new E2eeError("E2EE_NOT_ALLOWED"));
    }
    const input: ConversationInput = {
      profileIds: restartTargets(this.ctx, runtime),
      kind,
      name: runtime.record.metadata.name,
    };
    if (runtime.record.status !== "superseded") {
      return this.creator.create(input);
    }
    // Concurrent calls share one creation, checked first: the successor is
    // in the store before its members are added, and a failed creation
    // discards it. A failed one is forgotten so a retry can create, and it
    // never leaves its link behind. Otherwise a stored successor that was
    // fully set up and is still active (for a DM: still a usable DM with the
    // same peer) is returned; one that is gone, no longer active (left,
    // removed, invalid), not that DM, or never finished is replaced.
    const key = runtime.record.g;
    const pending = this.inFlight.get(key);
    if (pending) {
      return pending;
    }
    const known = this.readySuccessor(runtime);
    if (known) {
      return Promise.resolve(known);
    }
    const run = this.continueSuperseded(key, input).finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, run);
    return run;
  }

  private readySuccessor(runtime: GroupRuntime): string | null {
    const g = runtime.record.successor ?? null;
    if (g === null || runtime.record.successorPending === true) {
      return null;
    }
    const successor = this.ctx.store.groups.get(g);
    if (successor?.record.status !== "active") {
      return null;
    }
    return runtime.record.metadata.kind !== "dm" ||
      continuesDm(this.ctx, runtime, successor)
      ? g
      : null;
  }

  private async continueSuperseded(
    g: string,
    input: ConversationInput
  ): Promise<string> {
    const next = (await this.creator.create(input, g)).toLowerCase();
    // Confirms the link stored with the new group, or links an existing DM
    // with the peer that was returned instead.
    await this.linkSuccessor(requireGroup(this.ctx, g), next);
    return next;
  }

  private async linkSuccessor(
    runtime: GroupRuntime,
    successorG: string
  ): Promise<void> {
    const successor = this.ctx.store.groups.get(successorG);
    runtime.record.successor = successorG;
    delete runtime.record.successorPending;
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
