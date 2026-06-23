import type { ApiDropPoll } from "@/generated/models/ApiDropPoll";

type DropPollCarrier = {
  readonly poll?: ApiDropPoll | null;
};

interface PollVoteReconciliationOptions {
  readonly preferExistingVote?: boolean;
}

const getVotedOptionNos = (
  poll: ApiDropPoll | null | undefined
): readonly number[] => {
  const voted = poll?.voted;
  return Array.isArray(voted) ? voted : [];
};

export function preserveAuthenticatedPollVote(
  incomingPoll: ApiDropPoll | null | undefined,
  existingPoll: ApiDropPoll | null | undefined,
  options: PollVoteReconciliationOptions = {}
): ApiDropPoll | null | undefined {
  if (!incomingPoll || incomingPoll.id !== existingPoll?.id) {
    return incomingPoll;
  }

  const incomingVoted = getVotedOptionNos(incomingPoll);
  const existingVoted = getVotedOptionNos(existingPoll);

  if (options.preferExistingVote) {
    return {
      ...incomingPoll,
      voted: [...existingVoted],
    };
  }

  if (incomingVoted.length > 0 || existingVoted.length === 0) {
    return incomingPoll;
  }

  return {
    ...incomingPoll,
    voted: [...existingVoted],
  };
}

export function reconcileDropAuthenticatedPollVote<T extends DropPollCarrier>(
  incomingDrop: T,
  existingDrop: DropPollCarrier | null | undefined,
  options: PollVoteReconciliationOptions = {}
): T {
  const poll = preserveAuthenticatedPollVote(
    incomingDrop.poll,
    existingDrop?.poll,
    options
  );

  return poll === incomingDrop.poll
    ? incomingDrop
    : {
        ...incomingDrop,
        poll,
      };
}
