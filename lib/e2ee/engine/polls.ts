import { isValidPollBallot, type PollDefinition } from "../payload";
import { ownDeviceKey, requireGroup, type EngineContext } from "./context";
import { E2eeError } from "./errors";
import { requireSavedMessage } from "./history-read";
import { pollRoster, pollRosterHash } from "./poll-roster";
import { queueTargeted } from "./send";

export async function queuePoll(
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

export async function queuePollUpdate(
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
