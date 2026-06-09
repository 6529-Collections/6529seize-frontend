"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { updateDropInCachedDrops } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropPoll } from "@/generated/models/ApiDropPoll";
import { voteDropPollV2 } from "@/services/api/wave-drops-v2-api";
import { CheckIcon } from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { PollOptionVoters } from "./PollOptionVoters";
import { PollResultOption } from "./PollResultOption";
import { PollVoteOption } from "./PollVoteOption";
import {
  getOptimisticPoll,
  getPollClosingLabel,
  getPollSubmitLabel,
} from "./WaveDropPoll.helpers";

type PollView = "vote" | "results";

interface WaveDropPollProps {
  readonly drop: ApiDrop;
}

interface LocalPollOverride {
  readonly sourcePoll: ApiDropPoll | undefined;
  readonly poll: ApiDropPoll | null;
}

interface PollInteractionState {
  readonly pollKey: string;
  readonly view: PollView;
  readonly selectedOptionNos: readonly number[];
  readonly expandedOptionNo: number | null;
}

const getDefaultPollView = (poll: ApiDropPoll): PollView =>
  poll.is_open && poll.voted.length === 0 ? "vote" : "results";

const getVotedKey = (poll: ApiDropPoll): string =>
  [...poll.voted].sort((a, b) => a - b).join(",");

const getPollInteractionKey = (poll: ApiDropPoll): string =>
  `${poll.id}:${poll.is_open ? "open" : "closed"}:${getVotedKey(poll)}`;

const getDefaultPollInteractionState = (
  poll: ApiDropPoll
): PollInteractionState => ({
  pollKey: getPollInteractionKey(poll),
  view: getDefaultPollView(poll),
  selectedOptionNos: [...poll.voted],
  expandedOptionNo: null,
});

const getScopedPollInteractionState = (
  current: PollInteractionState | null,
  poll: ApiDropPoll
): PollInteractionState => {
  const pollKey = getPollInteractionKey(poll);
  return current?.pollKey === pollKey
    ? current
    : getDefaultPollInteractionState(poll);
};

export default function WaveDropPoll({ drop }: WaveDropPollProps) {
  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useAuth();
  const myStream = useMyStreamOptional();
  const [localPollOverride, setLocalPollOverride] =
    useState<LocalPollOverride | null>(null);
  const localPoll =
    localPollOverride && localPollOverride.sourcePoll === drop.poll
      ? localPollOverride.poll
      : null;
  const poll = localPoll ?? drop.poll;
  const [interactionState, setInteractionState] =
    useState<PollInteractionState | null>(null);

  const voteMutation = useMutation({
    mutationFn: async (options: readonly number[]) =>
      await voteDropPollV2({
        drop,
        options,
      }),
    onSuccess: (updatedDrop) => {
      if (updatedDrop.poll) {
        setLocalPollOverride({
          sourcePoll: drop.poll,
          poll: updatedDrop.poll,
        });
        setInteractionState({
          ...getDefaultPollInteractionState(updatedDrop.poll),
          view: "results",
        });
      }
      updateDropInCachedDrops(queryClient, updatedDrop);
      myStream?.processIncomingDrop(
        updatedDrop,
        ProcessIncomingDropType.DROP_INSERT
      );
      void queryClient.invalidateQueries({
        queryKey: [QueryKey.DROP_POLL_VOTERS],
      });
    },
    onError: (error) => {
      setToast({
        message: error instanceof Error ? error.message : String(error),
        type: "error",
      });
    },
  });

  const submitPollVote = useCallback(
    async (selectedOptionNos: readonly number[]): Promise<boolean> => {
      if (!poll?.is_open || selectedOptionNos.length === 0) {
        return false;
      }

      const { success } = await requestAuth();
      if (!success) {
        return false;
      }

      const previousLocalPollOverride = localPollOverride;
      const previousInteractionState = interactionState;
      const optimisticPoll = getOptimisticPoll(poll, selectedOptionNos);

      setLocalPollOverride({
        sourcePoll: drop.poll,
        poll: optimisticPoll,
      });
      setInteractionState({
        ...getDefaultPollInteractionState(optimisticPoll),
        view: "results",
      });

      voteMutation.mutate(selectedOptionNos, {
        onError: () => {
          setLocalPollOverride(previousLocalPollOverride);
          setInteractionState(previousInteractionState);
        },
      });

      return true;
    },
    [
      drop.poll,
      interactionState,
      localPollOverride,
      poll,
      requestAuth,
      voteMutation,
    ]
  );

  const handleVoteOptionChange = useCallback(
    (optionNo: number) => {
      if (!poll) {
        return;
      }

      if (!poll.multichoice) {
        setInteractionState((current) => {
          const scopedState = getScopedPollInteractionState(current, poll);
          return {
            ...scopedState,
            selectedOptionNos: [optionNo],
          };
        });
        void submitPollVote([optionNo]).then((submitted) => {
          if (submitted) {
            return;
          }

          setInteractionState((current) => {
            const scopedState = getScopedPollInteractionState(current, poll);
            if (
              scopedState.selectedOptionNos.length !== 1 ||
              scopedState.selectedOptionNos[0] !== optionNo
            ) {
              return scopedState;
            }

            return {
              ...scopedState,
              selectedOptionNos: [...poll.voted],
            };
          });
        });
        return;
      }

      setInteractionState((current) => {
        const scopedState = getScopedPollInteractionState(current, poll);
        const next = new Set(scopedState.selectedOptionNos);
        if (next.has(optionNo)) {
          next.delete(optionNo);
        } else {
          next.add(optionNo);
        }
        return {
          ...scopedState,
          selectedOptionNos: [...next].sort((a, b) => a - b),
        };
      });
    },
    [poll, submitPollVote]
  );

  const handleSubmitVote = useCallback(async () => {
    if (!poll?.is_open) {
      return;
    }

    const scopedState = getScopedPollInteractionState(interactionState, poll);
    if (scopedState.selectedOptionNos.length === 0) {
      return;
    }

    await submitPollVote(scopedState.selectedOptionNos);
  }, [interactionState, poll, submitPollVote]);

  const showVoteView = useCallback(() => {
    if (!poll?.is_open) {
      return;
    }

    setInteractionState((current) => {
      const scopedState = getScopedPollInteractionState(current, poll);
      return {
        ...scopedState,
        view: "vote",
        selectedOptionNos: [...poll.voted],
        expandedOptionNo: null,
      };
    });
  }, [poll]);

  if (!poll) {
    return null;
  }

  const hasVoted = poll.voted.length > 0;
  const scopedState = getScopedPollInteractionState(interactionState, poll);
  const selectedOptions = new Set(scopedState.selectedOptionNos);
  const totalVotes = poll.options.reduce((total, option) => {
    return total + option.votes;
  }, 0);
  const votedOptionNos = new Set(poll.voted);
  const showSelectionIndicator = votedOptionNos.size > 0;
  const canShowResults = !poll.is_open || hasVoted;
  const effectiveView =
    canShowResults && (!poll.is_open || scopedState.view === "results")
      ? "results"
      : "vote";
  const expandedOptionNo = scopedState.expandedOptionNo;
  const voteOptionGroupName = `drop-poll-${poll.id}`;
  const submitButtonLabel = getPollSubmitLabel({
    isPending: voteMutation.isPending,
    hasVoted,
  });
  const showResultsFooterActions = effectiveView === "results" && hasVoted;
  const showFooterAction = poll.is_open && showResultsFooterActions;
  const showMultichoiceSubmit = poll.multichoice && selectedOptions.size > 0;

  return (
    <div
      className="tw-mb-2 tw-mt-3 tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 tw-shadow-lg tw-backdrop-blur md:tw-max-w-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="tw-mb-3.5 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <div className="tw-text-[15px] tw-font-bold tw-text-white">Poll</div>
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-400">
          <span
            className={`tw-size-1.5 tw-flex-shrink-0 tw-rounded-full ${
              poll.is_open ? "tw-bg-green" : "tw-bg-iron-600"
            }`}
            aria-hidden="true"
          />
          <span className="tw-truncate">{getPollClosingLabel(poll)}</span>
        </div>
      </div>

      {effectiveView === "vote" && poll.is_open ? (
        <div className="tw-flex tw-flex-col tw-gap-2">
          {poll.options.map((option) => (
            <PollVoteOption
              key={option.option_no}
              option={option}
              checked={selectedOptions.has(option.option_no)}
              multichoice={poll.multichoice}
              groupName={voteOptionGroupName}
              disabled={voteMutation.isPending}
              onChange={handleVoteOptionChange}
            />
          ))}
          {poll.multichoice && (
            <div
              className={`tw-grid tw-transition-all tw-duration-300 tw-ease-out ${
                showMultichoiceSubmit
                  ? "tw-mt-3.5 tw-grid-rows-[1fr] tw-opacity-100"
                  : "tw-mt-0 tw-grid-rows-[0fr] tw-opacity-0"
              }`}
            >
              <div
                aria-hidden={!showMultichoiceSubmit}
                inert={!showMultichoiceSubmit}
                className="tw-overflow-hidden"
              >
                <button
                  type="button"
                  disabled={!showMultichoiceSubmit || voteMutation.isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleSubmitVote();
                  }}
                  className="tw-flex tw-w-full tw-transform-gpu tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-4 tw-py-2 tw-text-[13.5px] tw-font-bold tw-text-black tw-transition-all tw-duration-300 disabled:tw-cursor-not-allowed disabled:tw-border-white/[0.06] disabled:tw-bg-white/[0.025] disabled:tw-text-iron-500 desktop-hover:hover:tw-bg-iron-100"
                >
                  {submitButtonLabel}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-2">
          {poll.options.map((option) => {
            const isExpanded = expandedOptionNo === option.option_no;

            return (
              <div key={option.option_no}>
                <PollResultOption
                  dropId={drop.id}
                  option={option}
                  totalVotes={totalVotes}
                  isSelected={votedOptionNos.has(option.option_no)}
                  isDimmed={hasVoted && !votedOptionNos.has(option.option_no)}
                  isExpanded={isExpanded}
                  multichoice={poll.multichoice}
                  showSelectionIndicator={showSelectionIndicator}
                  onToggle={(optionNo) =>
                    setInteractionState((current) => {
                      const currentState = getScopedPollInteractionState(
                        current,
                        poll
                      );
                      return {
                        ...currentState,
                        expandedOptionNo:
                          currentState.expandedOptionNo === optionNo
                            ? null
                            : optionNo,
                      };
                    })
                  }
                />
                <div
                  className={`tw-grid tw-transition-all tw-duration-300 tw-ease-out ${
                    isExpanded
                      ? "tw-mb-1 tw-mt-1 tw-grid-rows-[1fr] tw-opacity-100"
                      : "tw-mb-0 tw-mt-0 tw-grid-rows-[0fr] tw-opacity-0"
                  }`}
                >
                  <div
                    aria-hidden={!isExpanded}
                    inert={!isExpanded}
                    className="tw-overflow-hidden"
                  >
                    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-3 tw-py-2.5">
                      <PollOptionVoters
                        dropId={drop.id}
                        option={option}
                        enabled={isExpanded}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showFooterAction && (
        <div className="tw-mt-3.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-3.5">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
            <button
              type="button"
              disabled={voteMutation.isPending}
              onClick={(event) => {
                event.stopPropagation();
                showVoteView();
              }}
              className="tw-flex tw-flex-shrink-0 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-[13px] tw-font-medium tw-text-iron-300 tw-transition-all disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-white/25 desktop-hover:hover:tw-text-white"
            >
              Change vote
            </button>
            <span
              className={`tw-flex tw-h-8 tw-flex-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-lg tw-bg-white/[0.06] tw-px-3.5 tw-text-[13px] tw-font-bold tw-text-white tw-transition-opacity tw-duration-500 ${
                showResultsFooterActions
                  ? "tw-opacity-100"
                  : "tw-pointer-events-none tw-opacity-0"
              }`}
              aria-hidden={!showResultsFooterActions}
            >
              <span>Voted</span>
              <CheckIcon
                className="tw-size-3.5 tw-text-green"
                strokeWidth={3}
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
