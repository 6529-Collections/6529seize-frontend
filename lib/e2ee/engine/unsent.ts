import { checkpoint, requireGroup, type EngineContext } from "./context";
import { E2eeError } from "./errors";
import { loadMessage } from "./history";
import { queueUnsentCopy } from "./send";
import type { GroupRuntime } from "./store";

/**
 * Own messages left unsent by a ciphersuite move (D172, StoredMessage.unsent):
 * resent in the conversation that continues theirs, or deleted. Nothing is
 * sent automatically. One resend per message at a time; the unsent copy is
 * deleted only after its replacement is queued, so a failure keeps it.
 */
export class UnsentMessages {
  private readonly inFlight = new Map<
    string,
    Promise<{ g: string; id: string }>
  >();

  constructor(
    private readonly ctx: EngineContext,
    /** `restart(g)`: the successor of a superseded conversation. */
    private readonly successorOf: (g: string) => Promise<string>
  ) {}

  resend(g: string, id: string): Promise<{ g: string; id: string }> {
    const key = `${g.toLowerCase()}:${id}`;
    const pending = this.inFlight.get(key);
    if (pending) {
      return pending;
    }
    const run = this.resendOnce(g.toLowerCase(), id).finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, run);
    return run;
  }

  async discard(g: string, id: string): Promise<void> {
    const key = `${g.toLowerCase()}:${id}`;
    await this.inFlight.get(key)?.catch(() => undefined);
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
    const target = await this.successorOf(g);
    const copy = await queueUnsentCopy(this.ctx, target, source);
    await this.remove(requireGroup(this.ctx, g), id);
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
