"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { updateDropInCachedDrops } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropPoll } from "@/generated/models/ApiDropPoll";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { preserveAuthenticatedPollVote } from "@/helpers/waves/poll-vote-reconciliation";
import { voteDropPollV2 } from "@/services/api/wave-drops-v2-api";
import { CheckIcon } from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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

const getEffectivePollView = ({
  canRespond,
  isOpen,
  scopedView,
}: {
  readonly canRespond: boolean;
  readonly isOpen: boolean;
  readonly scopedView: PollView;
}): PollView => {
  if (!canRespond || !isOpen || scopedView === "results") {
    return "results";
  }

  return "vote";
};

const getCanRespondToPoll = ({
  isViewerChatEligible,
  poll,
}: {
  readonly isViewerChatEligible: boolean;
  readonly poll: ApiDropPoll | null;
}): boolean =>
  poll?.only_droppers_can_respond === true ? isViewerChatEligible : true;

const stopPollEventPropagation = (event: SyntheticEvent) => {
  event.stopPropagation();
};

const getLocalPoll = (
  localPollOverride: LocalPollOverride | null,
  sourcePoll: ApiDropPoll | undefined
): ApiDropPoll | null => {
  if (!localPollOverride) {
    return null;
  }

  if (localPollOverride.sourcePoll === sourcePoll) {
    return localPollOverride.poll;
  }

  return (
    preserveAuthenticatedPollVote(sourcePoll, localPollOverride.poll, {
      preferExistingVote: true,
    }) ?? null
  );
};

const UPDATED_VOTE_STATUS_DURATION_MS = 2500;

const useUpdatedVoteStatus = () => {
  const showUpdatedTimeoutRef = useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null);
  const [showUpdated, setShowUpdated] = useState(false);

  const flashUpdatedVoteStatus = useCallback(() => {
    setShowUpdated(true);

    if (showUpdatedTimeoutRef.current) {
      globalThis.clearTimeout(showUpdatedTimeoutRef.current);
    }

    showUpdatedTimeoutRef.current = globalThis.setTimeout(() => {
      setShowUpdated(false);
      showUpdatedTimeoutRef.current = null;
    }, UPDATED_VOTE_STATUS_DURATION_MS);
  }, []);

  const clearUpdatedVoteStatus = useCallback(() => {
    if (showUpdatedTimeoutRef.current) {
      globalThis.clearTimeout(showUpdatedTimeoutRef.current);
      showUpdatedTimeoutRef.current = null;
    }

    setShowUpdated(false);
  }, []);

  useEffect(() => {
    return () => {
      if (showUpdatedTimeoutRef.current) {
        globalThis.clearTimeout(showUpdatedTimeoutRef.current);
      }
    };
  }, []);

  return {
    clearUpdatedVoteStatus,
    flashUpdatedVoteStatus,
    showUpdated,
  };
};

export default function WaveDropPoll({ drop }: WaveDropPollProps) {
  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useAuth();
  const { getEligibility } = useWaveEligibility();
  const myStream = useMyStreamOptional();
  const { clearUpdatedVoteStatus, flashUpdatedVoteStatus, showUpdated } =
    useUpdatedVoteStatus();
  const [localPollOverride, setLocalPollOverride] =
    useState<LocalPollOverride | null>(null);
  const localPoll = getLocalPoll(localPollOverride, drop.poll);
  const poll = localPoll ?? drop.poll;
  const [interactionState, setInteractionState] =
    useState<PollInteractionState | null>(null);

  const waveEligibility = getEligibility(drop.wave.id);
  const isViewerChatEligible =
    waveEligibility?.authenticated_user_eligible_to_chat ??
    drop.wave.authenticated_user_eligible_to_chat;
  const canRespondToPoll = getCanRespondToPoll({
    isViewerChatEligible,
    poll,
  });

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
      void myStream?.processIncomingDrop(
        updatedDrop,
        ProcessIncomingDropType.DROP_INSERT
      );
      queryClient
        .invalidateQueries({
          queryKey: [QueryKey.DROP_POLL_VOTERS],
        })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({
          queryKey: [QueryKey.WAVE_POLLS],
        })
        .catch(() => undefined);
    },
    onError: (error) => {
      clearUpdatedVoteStatus();
      setToast({
        type: "error",
        title: "Couldn't submit your poll vote.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    },
  });

  const submitPollVote = useCallback(
    async (
      selectedOptionNos: readonly number[],
      {
        showUpdatedStatus = false,
      }: {
        readonly showUpdatedStatus?: boolean;
      } = {}
    ): Promise<boolean> => {
      if (
        !poll?.is_open ||
        !canRespondToPoll ||
        selectedOptionNos.length === 0
      ) {
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
        onSuccess: () => {
          if (showUpdatedStatus) {
            flashUpdatedVoteStatus();
          }
        },
        onError: () => {
          setLocalPollOverride(previousLocalPollOverride);
          setInteractionState(previousInteractionState);
        },
      });

      return true;
    },
    [
      drop.poll,
      flashUpdatedVoteStatus,
      interactionState,
      localPollOverride,
      poll,
      canRespondToPoll,
      requestAuth,
      voteMutation,
    ]
  );

  const handleVoteOptionChange = useCallback(
    (optionNo: number) => {
      if (!poll || !canRespondToPoll) {
        return;
      }

      if (!poll.multichoice) {
        const showUpdatedStatus = poll.voted.length > 0;
        setInteractionState((current) => {
          const scopedState = getScopedPollInteractionState(current, poll);
          return {
            ...scopedState,
            selectedOptionNos: [optionNo],
          };
        });
        submitPollVote([optionNo], { showUpdatedStatus })
          .then((submitted) => {
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
          })
          .catch(() => undefined);
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
    [canRespondToPoll, poll, submitPollVote]
  );

  const handleSubmitVote = useCallback(async () => {
    if (!poll?.is_open || !canRespondToPoll) {
      return;
    }

    const scopedState = getScopedPollInteractionState(interactionState, poll);
    if (scopedState.selectedOptionNos.length === 0) {
      return;
    }

    await submitPollVote(scopedState.selectedOptionNos, {
      showUpdatedStatus: poll.voted.length > 0,
    });
  }, [canRespondToPoll, interactionState, poll, submitPollVote]);

  const showVoteView = useCallback(() => {
    if (!poll?.is_open || !canRespondToPoll) {
      return;
    }

    setInteractionState((current) => {
      const scopedState = getScopedPollInteractionState(current, poll);
      return {
        ...scopedState,
        view: "vote",
        selectedOptionNos:
          poll.voted.length > 0
            ? [...poll.voted]
            : scopedState.selectedOptionNos,
        expandedOptionNo: null,
      };
    });
  }, [canRespondToPoll, poll]);

  const showResultsView = useCallback(() => {
    if (!poll) {
      return;
    }

    setInteractionState((current) => {
      const scopedState = getScopedPollInteractionState(current, poll);
      return {
        ...scopedState,
        view: "results",
        expandedOptionNo: null,
      };
    });
  }, [poll]);

  const cancelVoteChange = useCallback(() => {
    if (!poll) {
      return;
    }

    setInteractionState((current) => {
      const scopedState = getScopedPollInteractionState(current, poll);
      return {
        ...scopedState,
        view: "results",
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
  const effectiveView = getEffectivePollView({
    canRespond: canRespondToPoll,
    isOpen: poll.is_open,
    scopedView: scopedState.view,
  });
  const expandedOptionNo = scopedState.expandedOptionNo;
  const voteOptionGroupName = `drop-poll-${poll.id}`;
  const submitButtonLabel = getPollSubmitLabel({
    isPending: voteMutation.isPending,
    hasVoted,
  });
  const showResultsFooterAction =
    effectiveView === "results" && poll.is_open && canRespondToPoll;
  const showVoteResultsFooterAction =
    effectiveView === "vote" && poll.is_open && canRespondToPoll && !hasVoted;
  const isChangingVote = effectiveView === "vote" && hasVoted;
  const showVoteEditFooterAction =
    effectiveView === "vote" && poll.is_open && isChangingVote;
  const showMultichoiceActions =
    poll.multichoice && (selectedOptions.size > 0 || isChangingVote);
  const multichoiceSubmitDisabled =
    selectedOptions.size === 0 || voteMutation.isPending;

  return (
    <div
      role="presentation"
      className="tw-mb-2 tw-mt-3 tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 tw-shadow-lg tw-backdrop-blur md:tw-max-w-2xl"
      onClick={stopPollEventPropagation}
      onKeyDown={stopPollEventPropagation}
    >
      <div className="tw-mb-3.5 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        <div className="tw-text-[15px] tw-font-bold tw-text-white">Poll</div>
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-400">
          <span
            className={`tw-size-1.5 tw-flex-shrink-0 tw-rounded-full ${
              poll.is_open ? "tw-bg-emerald-500" : "tw-bg-iron-600"
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
              disabled={voteMutation.isPending || !canRespondToPoll}
              onChange={handleVoteOptionChange}
            />
          ))}
          {poll.multichoice && !isChangingVote && (
            <div
              className={`tw-grid tw-transition-all tw-duration-300 tw-ease-out ${
                showMultichoiceActions
                  ? "tw-mt-3.5 tw-grid-rows-[1fr] tw-opacity-100"
                  : "tw-mt-0 tw-grid-rows-[0fr] tw-opacity-0"
              }`}
            >
              <div
                aria-hidden={!showMultichoiceActions}
                inert={!showMultichoiceActions}
                className="tw-overflow-hidden"
              >
                <div className="tw-flex tw-gap-2">
                  <button
                    type="button"
                    disabled={multichoiceSubmitDisabled}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSubmitVote().catch(() => undefined);
                    }}
                    className="tw-flex tw-flex-1 tw-transform-gpu tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-4 tw-py-2 tw-text-[13.5px] tw-font-bold tw-text-black tw-transition-all tw-duration-300 disabled:tw-cursor-not-allowed disabled:tw-border-white/[0.06] disabled:tw-bg-white/[0.025] disabled:tw-text-iron-500 desktop-hover:hover:tw-bg-iron-100"
                  >
                    {submitButtonLabel}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-2">
          {poll.options.map((option) => {
            const canShowOptionVoters = !poll.anonymous && option.votes > 0;
            const isExpanded =
              canShowOptionVoters && expandedOptionNo === option.option_no;

            return (
              <div key={option.option_no}>
                <PollResultOption
                  option={option}
                  totalVotes={totalVotes}
                  canShowVoters={canShowOptionVoters}
                  isSelected={votedOptionNos.has(option.option_no)}
                  isDimmed={hasVoted && !votedOptionNos.has(option.option_no)}
                  isExpanded={isExpanded}
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
                {canShowOptionVoters && (
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {showVoteResultsFooterAction && (
        <div className="tw-mt-3.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-3.5">
          <div className="tw-flex tw-justify-start">
            <button
              type="button"
              disabled={voteMutation.isPending}
              onClick={(event) => {
                event.stopPropagation();
                showResultsView();
              }}
              className="tw-flex tw-flex-shrink-0 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-[13px] tw-font-medium tw-text-iron-300 tw-transition-all focus-visible:tw-ring-2 focus-visible:tw-ring-white/30 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-white/25 desktop-hover:hover:tw-text-white"
            >
              View results
            </button>
          </div>
        </div>
      )}

      {showVoteEditFooterAction && (
        <div className="tw-mt-3.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-3.5">
          {poll.multichoice ? (
            <div className="tw-flex tw-gap-2">
              <button
                type="button"
                disabled={voteMutation.isPending}
                onClick={(event) => {
                  event.stopPropagation();
                  cancelVoteChange();
                }}
                className="tw-flex tw-flex-1 tw-transform-gpu tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-4 tw-py-2 tw-text-[13.5px] tw-font-medium tw-text-iron-300 tw-transition-all disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-white/25 desktop-hover:hover:tw-text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={multichoiceSubmitDisabled}
                onClick={(event) => {
                  event.stopPropagation();
                  handleSubmitVote().catch(() => undefined);
                }}
                className="tw-flex tw-flex-1 tw-transform-gpu tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-4 tw-py-2 tw-text-[13.5px] tw-font-bold tw-text-black tw-transition-all tw-duration-300 disabled:tw-cursor-not-allowed disabled:tw-border-white/[0.06] disabled:tw-bg-white/[0.025] disabled:tw-text-iron-500 desktop-hover:hover:tw-bg-iron-100"
              >
                {submitButtonLabel}
              </button>
            </div>
          ) : (
            <div className="tw-flex tw-justify-start">
              <button
                type="button"
                disabled={voteMutation.isPending}
                onClick={(event) => {
                  event.stopPropagation();
                  cancelVoteChange();
                }}
                className="tw-flex tw-flex-shrink-0 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-[13px] tw-font-medium tw-text-iron-300 tw-transition-all disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-white/25 desktop-hover:hover:tw-text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {showResultsFooterAction && (
        <div className="tw-mt-3.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-3.5">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
            <button
              type="button"
              disabled={voteMutation.isPending}
              onClick={(event) => {
                event.stopPropagation();
                showVoteView();
              }}
              className="tw-flex tw-flex-shrink-0 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-[13px] tw-font-medium tw-text-iron-300 tw-transition-all focus-visible:tw-ring-2 focus-visible:tw-ring-white/30 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-white/25 desktop-hover:hover:tw-text-white"
            >
              {hasVoted ? "Change vote" : "Vote"}
            </button>
            {hasVoted && (
              <span className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1.5 tw-transition-all tw-duration-300">
                <span
                  className="tw-flex tw-size-4 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-emerald-500/30 tw-bg-emerald-500/15"
                  aria-hidden="true"
                >
                  <CheckIcon
                    className="tw-size-2.5 tw-text-emerald-400"
                    strokeWidth={3}
                  />
                </span>
                <span
                  className={`tw-text-[12px] tw-font-medium tw-transition-colors tw-duration-300 ${
                    showUpdated ? "tw-text-emerald-400" : "tw-text-iron-300"
                  }`}
                >
                  {showUpdated ? "Updated" : "Voted"}
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
