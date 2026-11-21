import { isValidPollBallot, type PollDefinition } from "../payload";
import { ownDeviceKey, requireGroup, type EngineContext } from "./context";
import { E2eeError } from "./errors";
import { requireSavedMessage } from "./history-read";
import { pollRoster, pollRosterHash } from "./poll-roster";
import { queueTargeted } from "./send";
import type { EngineController } from "./controller";

async function queuePoll(
  ctx: EngineContext,
  g: string,
  poll: PollDefinition
): Promise<void> {
  const group = g.toLowerCase();
  const { record } = requireGroup(ctx, group);
  // The sender sets the exact, ordered MLS roster when encrypting the event.
  await queueTargeted(ctx, group, (base) => ({
    ...base,
    t: "poll",
    poll,
    rosterHash: pollRosterHash(pollRoster(record)),
  }));
}

async function queuePollUpdate(
  ctx: EngineContext,
  g: string,
  id: string,
  options: number[] | null
): Promise<void> {
  const group = g.toLowerCase();
  const message = await ctx.queue.run(() =>
    requireSavedMessage(ctx, group, id)
  );
  if (!message.poll || message.deleted || message.poll.closed) {
    throw new E2eeError("E2EE_INVALID_INPUT");
  }
  if (options === null && message.senderProfileId !== ctx.profileId) {
    throw new E2eeError("E2EE_NOT_SENDER");
  }
  if (
    options !== null &&
    (!message.poll.eligibleDeviceKeys.includes(
      ownDeviceKey(ctx).toLowerCase()
    ) ||
      !isValidPollBallot(message.poll, options))
  ) {
    throw new E2eeError("E2EE_INVALID_INPUT");
  }
  await queueTargeted(ctx, group, (base) =>
    options === null
      ? { ...base, t: "poll-close", target: id }
      : { ...base, t: "poll-vote", target: id, options }
  );
}

export class PollActions {
  constructor(
    private readonly ctx: EngineContext,
    private readonly controller: EngineController,
    private readonly requireReady: () => void,
    private readonly background: (task: () => Promise<void>) => void
  ) {}

  create(g: string, poll: PollDefinition) {
    return this.queue(g, () => queuePoll(this.ctx, g, poll));
  }

  async update(g: string, id: string, options: number[] | null) {
    await this.queue(
      g,
      () => queuePollUpdate(this.ctx, g, id, options),
      options === null
    );
    if (options === null) {
      const message = await this.ctx.queue.run(() =>
        requireSavedMessage(this.ctx, g, id)
      );
      if (!message.poll?.closed) throw new E2eeError("E2EE_SEND_FAILED");
    }
  }

  private async queue(
    g: string,
    enqueue: () => Promise<void>,
    waitForDelivery = false
  ) {
    this.requireReady();
    await enqueue();
    if (waitForDelivery) {
      await this.controller.flush(g.toLowerCase());
    } else {
      this.background(() => this.controller.flush(g.toLowerCase()));
    }
  }
}
