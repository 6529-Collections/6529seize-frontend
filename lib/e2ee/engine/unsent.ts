import { checkpoint, requireGroup, type EngineContext } from "./context";
import { E2eeError } from "./errors";
import { loadMessage } from "./history";
import { queueUnsentCopy } from "./send";
import type { GroupRuntime } from "./store";

/** The one operation in flight on an unsent message. */
type Operation =
  | {
      readonly kind: "resend";
      readonly run: Promise<{ g: string; id: string }>;
    }
  | { readonly kind: "discard"; readonly run: Promise<void> };

/**
 * Own messages left unsent by a ciphersuite move (D172, StoredMessage.unsent):
 * resent in the conversation that continues theirs, or deleted. Nothing is
 * sent automatically. One operation per message at a time, so exactly one
 * outcome happens: a second resend joins the first; a resend during a
 * discard is refused (E2EE_NO_MESSAGE); a discard during a resend waits and
 * then deletes only if the resend failed. The unsent copy is deleted only
 * after its replacement is queued, so a failed resend keeps it.
 */
export class UnsentMessages {
  private readonly inFlight = new Map<string, Operation>();

  constructor(
    private readonly ctx: EngineContext,
    private readonly hooks: {
      /** `restart(g)`: the successor of a superseded conversation. */
      readonly successorOf: (g: string) => Promise<string>;
      /** Starts sending `g`'s outbox now, in the background. */
      readonly requestFlush: (g: string) => void;
    }
  ) {}

  resend(g: string, id: string): Promise<{ g: string; id: string }> {
    const key = `${g.toLowerCase()}:${id}`;
    const current = this.inFlight.get(key);
    if (current?.kind === "resend") {
      return current.run;
    }
    if (current?.kind === "discard") {
      return Promise.reject(new E2eeError("E2EE_NO_MESSAGE"));
    }
    const run = this.resendOnce(g.toLowerCase(), id);
    this.track(key, { kind: "resend", run });
    return run;
  }

  discard(g: string, id: string): Promise<void> {
    const key = `${g.toLowerCase()}:${id}`;
    const current = this.inFlight.get(key);
    if (current?.kind === "discard") {
      return current.run;
    }
    if (current?.kind === "resend") {
      // The resend goes first: if it fails the message is still unsent.
      return current.run.then(
        () => undefined,
        () => this.discard(g, id)
      );
    }
    const run = this.discardOnce(g, id);
    this.track(key, { kind: "discard", run });
    return run;
  }

  private track(key: string, operation: Operation): void {
    this.inFlight.set(key, operation);
    const forget = () => {
      if (this.inFlight.get(key) === operation) {
        this.inFlight.delete(key);
      }
    };
    operation.run.then(forget, forget);
  }

  private async discardOnce(g: string, id: string): Promise<void> {
    const runtime = requireGroup(this.ctx, g);
    if (await this.unsentMessage(runtime, id)) {
      await this.remove(runtime, id);
    }
  }

  private async resendOnce(
    g: string,
    id: string
  ): Promise<{ g: string; id: string }> {
    const source = await this.unsentMessage(requireGroup(this.ctx, g), id);
    if (!source) {
      throw new E2eeError("E2EE_NO_MESSAGE");
    }
    const target = await this.hooks.successorOf(g);
    const copy = await queueUnsentCopy(this.ctx, target, source);
    await this.remove(requireGroup(this.ctx, g), id);
    this.hooks.requestFlush(target);
    return { g: target, id: copy };
  }

  private async unsentMessage(runtime: GroupRuntime, id: string) {
    const message = await this.ctx.queue.run(() =>
      loadMessage(this.ctx, runtime, id)
    );
    return message?.unsent ? message : null;
  }

  private async remove(runtime: GroupRuntime, id: string): Promise<void> {
    await this.ctx.queue.run(async () => {
      runtime.messages.delete(id);
      runtime.dirty.delete(id);
      runtime.deleted.add(id);
      await checkpoint(this.ctx, { groups: [runtime], skipWasm: true });
    });
    this.ctx.store.touch(runtime.record.g);
  }
}
